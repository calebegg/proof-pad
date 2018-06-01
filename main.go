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
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
)

var postface = regexp.MustCompile(`NIL$`)

var id = 0

func acl2(w http.ResponseWriter, r *http.Request) {
	log.Println("Got new request")
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	wc, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WARNING: Failed to initialize web socket: %s\n", err)
		return
	}
	defer wc.Close()
	cmd := exec.Command("./acl2_image/run_acl2")
	stdin, err := cmd.StdinPipe()
	if err != nil {
		log.Print(err)
		return
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Print(err)
		return
	}
	if err := cmd.Start(); err != nil {
		log.Print(err)
		return
	}
	socketName := fmt.Sprintf("./bridge-%d-%d", os.Getpid(), id)
	id++
	io.WriteString(stdin, fmt.Sprintf(`(include-book "centaur/bridge/top" :dir :system) (bridge::start "%s")\n`, socketName))
	defer func() {
		if err := cmd.Process.Signal(syscall.SIGINT); err != nil {
			log.Printf("Failed to kill: %s\n", err)
			return
		}
		log.Println("Killed acl2")
		if err := os.Remove(socketName); err != nil {
			log.Printf("Error removing socket: %s\n", err)
		}
	}()
	reader := bufio.NewReader(stdout)
	line := ""
	for {
		line, err = reader.ReadString('\n')
		if err != nil {
			log.Printf("Error: %s\n", err)
			return
		}
		log.Println(line)
		if strings.Contains(line, "ACL2 Bridge: Listener thread starting") {
			log.Println("Bridge ready!")
			break
		}
	}
	var c net.Conn
	for i := 0; i < 10; i++ {
		c, err = net.Dial("unix", socketName)
		if err != nil {
			log.Printf("Error: %s\n", err)
			if i == 9 {
				log.Println("Tried 10 times, giving up")
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
		"(set-ld-prompt nil state))\n"
	out.WriteString(fmt.Sprintf("LISP %d\n", len(setup)-1))
	out.WriteString(setup)
	out.Flush()
	first := true
	eat := true
	for {
		time.Sleep(time.Second / 10)
		body := ""
		for {
			header, err := in.ReadString('\n')
			if err != nil {
				log.Print(err)
				return
			}
			parts := strings.Fields(header)
			if len(parts) != 2 {
				log.Printf("Expected header, got '%s'\n", header)
				return
			}
			command, lengthStr := parts[0], parts[1]
			length, err := strconv.ParseInt(lengthStr, 10, 64)
			if err != nil {
				log.Printf("Couldn't parse length of body: %s\n", err)
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
		body = postface.ReplaceAllLiteralString(body, "")
		body = strings.Trim(body, " \n")
		log.Printf("< %s\n", body)

		if eat {
			eat = false
		} else {
			wc.WriteMessage(websocket.TextMessage, []byte(body))
		}

		mt, codeBuf, err := wc.ReadMessage()
		if err != nil {
			log.Printf("Failed to read from socket: %s\n", err)
			break
		}
		if mt != websocket.TextMessage {
			log.Printf("Unexpected message type: %d\n", mt)
			return
		}
		code := string(codeBuf)
		log.Printf("> %s\n", code)
		if err != nil {
			log.Print(err)
			return
		}
		toRun := fmt.Sprintf("(bridge::in-main-thread (ld '(%s)))\n", code)
		out.WriteString(fmt.Sprintf("LISP %d\n", len(toRun)-1))
		out.WriteString(toRun)
		out.Flush()
	}
}

func health(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "ok")
}

func main() {
	log.Printf("Starting up at %s...\n", "0.0.0.0:"+os.Getenv("PORT"))
	http.HandleFunc("/acl2", acl2)
	http.HandleFunc("/health", health)
	log.Print(http.ListenAndServe("0.0.0.0:"+os.Getenv("PORT"), nil))
	return
}
