# Astro SPA

A small Astro deployment project showing a browser application served through **Nginx** on **AWS EC2**, with local Docker development and a GitHub Actions delivery path using **S3**, **SSM**, and **OIDC**.

## What this demonstrates

- Astro application build and static output
- Nginx configuration for SPA-style client routing
- Docker-based local preview
- Terraform-managed AWS infrastructure
- GitHub Actions using short-lived AWS OIDC credentials
- artifact delivery through S3
- remote deployment through AWS Systems Manager rather than long-lived AWS keys

## Architecture

```text
Astro source
   ↓
GitHub Actions
   ↓
Astro build
   ↓
artifact archive
   ↓
S3
   ↓
AWS SSM
   ↓
EC2 / Nginx
```

The repository separates application code, web-server configuration, infrastructure definition, and deployment automation so each layer can be inspected independently.

## Repository layout

```text
astro-spa/
├── app/
│   └── astro/
├── nginx/
│   ├── default.conf
│   └── 99-no-cache.conf
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── terraform.tfvars
├── .github/
│   └── workflows/
│       └── deploy-site-ssm.yml
├── docker-compose.yml
├── Dockerfile
└── deploy-site-now
```

## Local development

Build the Astro application:

```bash
cd app/astro
npm install
npx astro build
```

Then serve the generated output through the local Nginx container:

```bash
cd ../..
docker compose up -d
```

The local preview is available at `http://localhost:8080`.

## AWS deployment path

The deployment workflow expects AWS-side resources and repository configuration such as:

- an OIDC role that GitHub Actions may assume
- an artifact S3 bucket
- the target AWS region
- an EC2 instance reachable through SSM

The workflow builds the Astro site, packages the output, uploads the artifact to S3, and uses SSM to update the Nginx document root on the target instance.

## Terraform

Infrastructure definitions live in `terraform/`.

Useful validation before an apply:

```bash
cd terraform
terraform fmt -check
terraform validate
```

Provisioning is intentionally separate from local development; an AWS apply should only be run when the required account resources and values are configured.

## Security note

The CI/CD design uses GitHub OIDC for AWS authentication instead of storing static AWS access keys in the repository.
