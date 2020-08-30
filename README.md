# Proof Pad

Proof Pad is a web based IDE for
[ACL2](https://www.cs.utexas.edu/users/moore/acl2/), using Google Kubernetes
Engine to run ACL2 itself on the backend. Users can write and verify functions
and theorems using a modern editor or a REPL interface. It's the evolution of
the [original Proof Pad project](https://github.com/calebegg/proof-pad-classic).

This is not an official Google product.

## Deploying the frontend

1. Run `rm -r dist && npx parcel build index.html`
1. Copy the contents of dist
   [to Google Cloud Storage](https://console.cloud.google.com/storage/browser/new.proofpad.org?project=proof-pad)

## Deploying the backend

1. [Download ACL2](http://acl2s.ccs.neu.edu/acl2s/src/acl2/)
1. Unzip to ./acl2_image
1. Run:

```shell
$ docker build -t gcr.io/proof-pad/acl2:v3 .
$ gcloud docker -- push gcr.io/proof-pad/acl2:v3
```
