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
	"net/http"
	"os"
	"os/exec"
	"sort"
	"strings"
	"syscall"
	"time"

	"cloud.google.com/go/logging"
	"github.com/gorilla/websocket"
)

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

var ilog func(string, ...interface{})
var elog func(string, ...interface{})
var logger *logging.Logger

const prompt = "\nanUnlikelyStringThatWillNotOccurInUserCodeA39FC0EFB5F42A9EA6B93AC9951A4F838531FEAE79A073DE55E6777A9C864F01\n"

func killAndCleanUp(cmd *exec.Cmd) {
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

	cmd := exec.Command("./acl2-8.5/saved_acl2")
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
	stderr, err := cmd.StderrPipe()
	if err != nil {
		elog("Failed to open stderr pipe: %s", err)
		return
	}
	if err := cmd.Start(); err != nil {
		elog("Failed to run ACL2 command: %s", err)
		return
	}
	io.WriteString(stdin, fmt.Sprintf(`
		(add-include-book-dir :teachpacks "dracula")
        (set-verify-guards-eagerness 0)
		:set-state-ok t
		(defttag :ld-prompt)
		(defun pp-prompt (channel state) (let ((state (princ$ "%s" channel state))) (mv %d state)))
		(set-ld-verbose nil state)
		(set-ld-redefinition-action '(:doit . :erase) state)
		(set-ld-prompt 'pp-prompt state)
		(defttag nil)
	`, prompt, len(prompt)))
	defer killAndCleanUp(cmd)
	reader := bufio.NewReader(stdout)
	line := ""
	promptCount := 0
	for {
		line, err = reader.ReadString('\n')
		if err != nil {
			elog("Partial read from ACL2 stdout: %s\nCause: %s", line, err)
			reader := bufio.NewReader(stderr)
			line, err = reader.ReadString('\n')
			if err != nil {
				elog("Partial read from ACL2 stderr: %s\nCause: %s", line, err)
				return
			}
			elog("Error from ACL2: %s", line)
			return
		}
		ilog("stdout: %s", line)
		if strings.Contains(line, strings.Trim(prompt, "\n")) {
			ilog("Saw prompt")
			promptCount++
			if promptCount == 2 {
				break
			}
		}
	}

	go sendLoop(wc, reader)
	go receiveLoop(wc, stdin)
}

func sendLoop(wc *websocket.Conn, reader *bufio.Reader) {
	for {
		body := ""
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				elog("Partial read from ACL2 stdout: %s\nCause: %s", line, err)
				return
			}
			ilog("stdout: %s", line)
			if strings.Contains(line, strings.Trim(prompt, "\n")) {
				ilog("Saw prompt")
				break
			}
			body += line
		}
		body = strings.Trim(body, "\n")

		wc.WriteMessage(websocket.TextMessage, []byte(body))
	}
}

func receiveLoop(wc *websocket.Conn, stdin io.WriteCloser) {
	for {
		mt, codeBuf, err := wc.ReadMessage()
		if err != nil {
			elog("Failed to read from socket: %s", err)
			break
		}
		if mt != websocket.TextMessage {
			elog("Unexpected message type: %d", mt)
			return
		}
		code := string(codeBuf)
		ilog("stdin: %s", code)
		io.WriteString(stdin, code+"\n")
	}
}

func health(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, `ok
Started:        %s
Up for:         %s
Total sessions: %d`,
		started.Format("Jan 2 2006 / 15:04:05 MST"),
		time.Since(started).String(),
		len(instanceStates),
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
}
