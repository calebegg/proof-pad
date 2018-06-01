FROM golang:latest
ADD . /go/src/acl2
RUN go get github.com/gorilla/websocket
RUN CGO_ENABLED=0 go install acl2

#FROM alpine:latest
#RUN apk --no-cache add bash
#COPY --from=0 /go/bin/acl2 .
#COPY --from=0 /go/bin/acl2 .
COPY acl2_image acl2_image
ENV PORT 8080
CMD ["/go/bin/acl2"]