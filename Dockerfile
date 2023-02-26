FROM golang:latest
WORKDIR /app
COPY go.mod ./
COPY go.sum ./
RUN go mod download
COPY main.go ./
RUN CGO_ENABLED=0 go build -o /acl2
COPY acl2_image acl2_image
COPY dracula dracula
ENV PORT 8080
CMD ["/acl2"]