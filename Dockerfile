FROM debian:sid

WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates golang wget make perl curl build-essential sbcl

COPY go.mod ./
COPY go.sum ./
RUN go mod download
COPY main.go ./
RUN CGO_ENABLED=0 go build -o /acl2

RUN wget https://github.com/acl2-devel/acl2-devel/releases/download/8.5/acl2-8.5.tar.gz &&\
    tar xfz acl2-8.5.tar.gz &&\
    rm acl2-8.5.tar.gz &&\
    cd acl2-8.5 &&\
    make LISP=sbcl &&\
    cd books &&\
    make ACL2=/app/acl2-8.5/saved_acl2 basic &&\
    cd ../..

COPY dracula dracula
ENV PORT 8080

CMD ["/acl2"]