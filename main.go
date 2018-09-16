// Copyright 2018 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"syscall"
	"time"

	"cloud.google.com/go/logging"
	"github.com/gorilla/websocket"
)

var postface = regexp.MustCompile(
	`\(NIL (.*) ACL2_INVISIBLE::\|The Live State Itself\|\)$`)
var cruft = regexp.MustCompile(strings.Join([]string{
	`^ACL2 Error in TOP-LEVEL:  `,
	`See :DOC ASSIGN and :DOC @\.$`,
	`^Error during read-command:\n`,
}, "|"))
var id = 0 // Incrementing ID for sockets

// Stats for /health
var started = time.Now()

type runState string

const (
	running runState = "RUNNING"
	stopped runState = "STOPPED"
	killed  runState = "KILLED"
)

type stats struct {
	started time.Time
	stopped time.Time
	running runState
}

func (i *stats) duration() time.Duration {
	if (i.stopped != time.Time{}) {
		return i.stopped.Sub(i.started)
	}
	return time.Since(i.started)
}

var instanceStates = make(map[*exec.Cmd]*stats)
var totalRuntime time.Duration
var commandCount int

var ilog func(string, ...interface{})
var elog func(string, ...interface{})
var logger *logging.Logger

type response struct {
	Kind string
	Body string
}

const timeout = 15 // Kill ACL2 if it takes longer than timeout seconds

func killAndCleanUp(cmd *exec.Cmd, socketName string) {
	defer os.Remove(socketName)
	if cmd.ProcessState != nil && cmd.ProcessState.Exited() {
		instanceStates[cmd].running = stopped
		return
	}
	if err := cmd.Process.Signal(syscall.SIGTERM); err != nil {
		ilog("Failed to send sigterm to ACL2: %s", err)
		return
	}
	done := make(chan error)
	go func() { done <- cmd.Wait() }()
	select {
	case <-done:
		ilog("ACL2 terminated")
		instanceStates[cmd].running = stopped
		instanceStates[cmd].stopped = time.Now()
	case <-time.After(5 * time.Second):
		elog("ACL2 had to be killed after 5 seconds of hanging")
		cmd.Process.Kill()
		instanceStates[cmd].running = killed
		instanceStates[cmd].stopped = time.Now()
	}
}

func acl2(w http.ResponseWriter, r *http.Request) {
	logger.Log(logging.Entry{
		Severity:    logging.Info,
		HTTPRequest: &logging.HTTPRequest{Request: r, RemoteIP: r.RemoteAddr},
	})

	ilog("Starting new request")
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	wc, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		elog("Failed to initialize socket: %s", err)
		return
	}
	defer wc.Close()

	cmd := exec.Command("./acl2_image/run_acl2")
	instanceStates[cmd] = &stats{started: time.Now(), running: running}
	stdin, err := cmd.StdinPipe()
	if err != nil {
		elog("Failed to open stdin pipe: %s", err)
		return
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		elog("Failed to open stdout pipe: %s", err)
		return
	}
	if err := cmd.Start(); err != nil {
		elog("Failed to run ACL2 command: %s", err)
		return
	}
	socketName := fmt.Sprintf("./bridge-%d-%d", os.Getpid(), id)
	id++
	io.WriteString(stdin, fmt.Sprintf(`(add-include-book-dir :teachpacks "dracula") (include-book "centaur/bridge/top" :dir :system) (bridge::start "%s")\n`, socketName))
	defer killAndCleanUp(cmd, socketName)
	reader := bufio.NewReader(stdout)
	line := ""
	for {
		line, err = reader.ReadString('\n')
		if err != nil {
			elog("Failed to read string from ACL2: %s", err)
			return
		}
		if strings.Contains(line, "ACL2 Bridge: Listener thread starting") {
			ilog("Started bridge, now listening")
			break
		}
	}
	var c net.Conn
	for i := 0; i < 10; i++ {
		c, err = net.Dial("unix", socketName)
		if err != nil {
			if i == 9 {
				elog("Failed to dial socket '%s': %s", socketName, err)
				wc.WriteJSON(
					response{Kind: "ERROR", Body: "Failed to start ACL2; try again later."})
				return
			}
			time.Sleep(time.Second / 5)
			continue
		}
		break
	}
	defer c.Close()

	in := bufio.NewReader(c)
	out := bufio.NewWriter(c)

	setup := "(progn (set-ld-verbose nil state) " +
		"(set-ld-redefinition-action '(:doit . :erase) state) " +
		"(add-include-book-dir :teachpacks \"dracula\") " +
		"(set-ld-prompt nil state))\n"
	out.WriteString(fmt.Sprintf("LISP %d\n", len(setup)-1))
	out.WriteString(setup)
	out.Flush()

	first := true
	eat := true

	var code string

	for {
		start := time.Now()

		timer := time.AfterFunc(timeout*time.Second, func() {
			elog("Timed out after %ds while executing: '%s'", timeout, code)
			wc.WriteJSON(
				response{Kind: "ERROR", Body: fmt.Sprintf("ACL2 timed out after %d seconds. This could be "+
					"because of a problem with the Proof Pad backend, or it could mean "+
					"that code you wrote took too long to complete. Try again later.", timeout)})
			killAndCleanUp(cmd, socketName)
		})

		body := ""
		for {
			header, err := in.ReadString('\n')
			if err != nil {
				elog("Failed to read from ACL2: %s", err)
				return
			}
			parts := strings.Fields(header)
			if len(parts) != 2 {
				elog("Expected header from bridge, got '%s'", header)
				return
			}
			command, lengthStr := parts[0], parts[1]
			length, err := strconv.ParseInt(lengthStr, 10, 64)
			if err != nil {
				elog("Couldn't parse body length from header: %s", err)
				return
			}
			buf := make([]byte, length)
			io.ReadFull(in, buf)
			in.Discard(1) // Newline
			body += string(buf)
			if command == "READY" {
				if first {
					first = false
					continue
				}
				break
			}
		}

		if eat {
			eat = false
		} else {
			postfaceContent := postface.FindStringSubmatch(body)
			responseType := ""
			if len(postfaceContent) > 0 {
				responseType = postfaceContent[1]
			}
			body = postface.ReplaceAllString(body, "")
			body = strings.Trim(body, " \n")
			body = cruft.ReplaceAllString(body, "")

			kind := "ERROR"
			if responseType == ":EOF" {
				kind = "SUCCESS"
			}
			wc.WriteJSON(
				response{Kind: kind, Body: body},
			)
		}

		timer.Stop()
		totalRuntime += time.Since(start)
		commandCount++

		mt, codeBuf, err := wc.ReadMessage()
		if err != nil {
			elog("Failed to read from socket: %s", err)
			break
		}
		if mt != websocket.TextMessage {
			elog("Unexpected message type: %d", mt)
			return
		}
		code = string(codeBuf)
		toRun := fmt.Sprintf("(bridge::in-main-thread (ld '(%s)))\n", code)
		// toRun := fmt.Sprintf("(bridge::in-main-thread %s)\n", code)
		out.WriteString(fmt.Sprintf("LISP_MV %d\n", len(toRun)-1))
		out.WriteString(toRun)
		out.Flush()
	}
}

func health(w http.ResponseWriter, r *http.Request) {
	var avgTime float64
	if commandCount != 0 {
		avgTime = float64(totalRuntime) / float64(time.Duration(commandCount)*time.Second)
	} else {
		avgTime = 0
	}
	fmt.Fprintf(w, `ok
Started:        %s
Up for:         %s
Total sessions: %d
Avg runtime:    %f out of %d commands`,
		started.Format("Jan 2 2006 / 15:04:05 MST"),
		time.Since(started).String(),
		len(instanceStates),
		avgTime,
		commandCount,
	)
	sortedStates := make([]*stats, len(instanceStates))
	i := 0
	for _, instance := range instanceStates {
		sortedStates[i] = instance
		i++
	}
	sort.Slice(sortedStates, func(i int, j int) bool {
		return sortedStates[i].duration() > sortedStates[j].duration()
	})
	for _, instance := range sortedStates {
		fmt.Fprintf(w, `
  %s for %s`,
			instance.running,
			instance.duration().String(),
		)
	}
}

func main() {
	client, err := logging.NewClient(context.Background(), "proof-pad")
	if err != nil {
		log.Fatalf("Can't create logging client: %v", err)
	}
	defer client.Close()
	logger = client.Logger("acl2-service")
	ilog = func(l string, args ...interface{}) {
		payload := fmt.Sprintf(l, args...)
		logger.Log(logging.Entry{Payload: payload, Severity: logging.Info})
		log.Println(payload)
	}
	elog = func(l string, args ...interface{}) {
		payload := fmt.Sprintf(l, args...)
		logger.Log(logging.Entry{Payload: payload, Severity: logging.Error})
		log.Println(payload)
	}

	log.Printf("Starting up at %s...\n", "0.0.0.0:"+os.Getenv("PORT"))
	http.HandleFunc("/acl2", acl2)
	http.HandleFunc("/health", health)
	log.Print(http.ListenAndServe("0.0.0.0:"+os.Getenv("PORT"), nil))
	return
}
