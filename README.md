# astro-spa (Astro + Nginx on AWS with GitHub Actions)

A single-page Astro site, served by **Nginx** on its own **EC2** instance.  
Local dev runs via **Docker Compose**. CI/CD uses **GitHub Actions → S3 → SSM** with **OIDC** (no static AWS keys).

**Region:** `us-east-2` (Ohio)  
**Root served:** `/` (SPA with client-side routing)

---

## What’s inside

- **Terraform** (`terraform/`)  
  Defines a small **EC2** (Amazon Linux 2), opens **HTTP :80** to the world and **SSH :22** only to your current IP, installs Docker.
  > We’re **not running it yet** — you created the SSH key locally and staged the files. We’ll apply when you’re ready.

- **Nginx (Docker / EC2)**
  - `nginx/default.conf` → SPA-friendly routing (serves `/index.html` for client routes; long-cache for assets).
  - `nginx/99-no-cache.conf` → optional “no-cache” overlay (handy for local dev).

- **GitHub Actions**
  - `.github/workflows/deploy-site-ssm.yml` → builds Astro from `app/astro`, tars the output, uploads to S3, and deploys to EC2 via **SSM** (using the runner’s short-lived OIDC creds).

- **Helper script**
  - `deploy-site-now` → commit/push to trigger the workflow and open the Actions page.

---

## Repository layout

astro-spa/
├─ app/
│ └─ astro/ # your Astro project (npm install && npx astro build)
├─ nginx/
│ ├─ default.conf # SPA routing + caching
│ └─ 99-no-cache.conf # (optional) dev-only no-cache headers
├─ terraform/
│ ├─ main.tf # provider, key pair import, SG, EC2
│ ├─ variables.tf # dockerhub_username, docker_image
│ └─ terraform.tfvars # per-project values (no secrets in git)
├─ .github/
│ └─ workflows/
│ └─ deploy-site-ssm.yml
├─ docker-compose.yml
├─ Dockerfile
└─ deploy-site-now


---

## Prerequisites

- **SSH key (local):** `~/.ssh/aws-ssh-key` + `~/.ssh/aws-ssh-key.pub`  
  Created with:
  ```bash
  ssh-keygen -t rsa -b 4096 -C "chip@astro-spa" -f ~/.ssh/aws-ssh-key


Node 20+ (for building Astro locally if you want)
Docker (for local Nginx)

Local develop & preview (no AWS)
Build the Astro site:

cd app/astro
npm install
npx astro build

2. Serve via Nginx:

cd ../../
docker compose up -d
# open http://localhost:8080

docker-compose.yml mounts app/astro/dist to /usr/share/nginx/html, and mounts both nginx/*.conf.

CI/CD (GitHub Actions → S3 → SSM)
You’ll need these configured (either as Secrets or Variables):
AWS_ROLE_TO_ASSUME → the IAM role ARN for GitHub OIDC (e.g., arn:aws:iam::ACCOUNT_ID:role/GitHubActions-astro-spa-ssh)
AWS_REGION → us-east-2 (or your region)
ARTIFACT_S3_BUCKET → an S3 bucket for deploy artifacts (e.g., astro-spa-artifacts-ACCOUNT_ID-us-east-2)
(Optional) EC2_INSTANCE_ID → if you prefer explicit targeting; otherwise the workflow finds a running instance with tag:Name=astro-spa.
Trigger a deploy:

./deploy-site-now "site: update"
# or push to main normally; or run the workflow manually in the Actions tab

The workflow:
Builds Astro from app/astro
Uploads site.tgz to your artifact bucket
Uses SSM to connect to the instance and rsync files into Nginx’s docroot
Reloads Nginx and prints a short diagnostic summary

Terraform (when you’re ready)
From terraform/:

terraform fmt -check
terraform validate
# when ready:
terraform init
terraform apply


Outputs will show public_ip / public_dns.
SSH:

ssh -i ~/.ssh/aws-ssh-key ec2-user@<PUBLIC_DNS_OR_IP>

