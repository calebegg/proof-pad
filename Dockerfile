FROM golang:latest
ADD . /go/src/acl2
RUN go get github.com/gorilla/websocket
RUN go get cloud.google.com/go/logging
RUN CGO_ENABLED=0 go install acl2

#FROM alpine:latest
#RUN apk --no-cache add bash
#COPY --from=0 /go/bin/acl2 .
#COPY --from=0 /go/bin/acl2 .
COPY acl2_image acl2_image
COPY dracula dracula
ENV PORT 8080
CMD ["/go/bin/acl2"]