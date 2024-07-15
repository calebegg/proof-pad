# Proof Pad

Proof Pad is a web based IDE for
[ACL2](https://www.cs.utexas.edu/users/moore/acl2/), using Google Kubernetes
Engine to run ACL2 itself on the backend. Users can write and verify functions
and theorems using a modern editor or a REPL interface. It's the evolution of
the [original Proof Pad project](https://github.com/calebegg/proof-pad-classic).

This is not an official Google product.

## Deploying the frontend

1. Run `rm -r dist grammar && ./grammar.sh && npx parcel build index.html`
1. Copy the contents of dist
   [to Google Cloud Storage](https://console.cloud.google.com/storage/browser/new.proofpad.org?project=proof-pad)

## Deploying the backend

1. Update the ACL2 version in the Dockerfile if necessary.
1. Run:
   ```shell
   $ gcloud builds submit --project=proof-pad --tag=us-central1-docker.pkg.dev/proof-pad/acl2/acl2 --timeout=86400s --machine-type=N1_HIGHCPU_8 .
   ```
   This takes about 30 minutes. If your terminal disconnects, check https://console.cloud.google.com/cloud-build/builds?project=proof-pad for the status
1. Go to [this page](https://console.cloud.google.com/run/deploy/us-central1/acl2?project=proof-pad) and deploy a new revision with the build.
