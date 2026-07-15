# Kubernetes reference manifests

These YAML files are **optional samples** for an AWS EKS + ALB Ingress style deploy.

They are **not** the project's active deployment path. Day-to-day run and CI use:

1. `docker-compose.yml` (local / containerized stack)
2. Root `Dockerfile` + `backend/Dockerfile`
3. `.github/workflows/ci.yml`

Before applying anything here, replace placeholders (for example ECR image URIs and secrets) and treat this folder as a starting point — not a maintained production cluster config.
