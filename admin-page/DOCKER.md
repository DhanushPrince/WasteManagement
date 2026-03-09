# Docker – EcoRoute Waste Map

## Required files (already in repo)

| File | Purpose |
|------|--------|
| `Dockerfile` | Multi-stage build: Node for Vite build, nginx for serving (ECR/ECS-ready) |
| `nginx.conf.template` | SPA routing and static asset caching |
| `.dockerignore` | Excludes `node_modules`, `.env`, etc. from build context |

---

## ECR + ECS (linux/amd64)

Image is built for **linux/amd64** so it runs on ECS Fargate. Container exposes **port 80**; in ECS set the task port to 80 and use health check path `/` or `/index.html`.

### One-shot: build and push to ECR

From **ecoroute_2_v1**:

```bash
./push-to-ecr.sh
```

Override defaults with env vars:

```bash
AWS_REGION=us-east-1 ECR_REGISTRY=123456789.dkr.ecr.us-east-1.amazonaws.com ECR_REPO=ecoroute-waste-map IMAGE_TAG=latest ./push-to-ecr.sh
```

### Optimal manual build and push

```bash
# 1. Build for ECS (linux/amd64)
docker buildx build --platform linux/amd64 --load -t ecoroute-waste-map:latest .

# 2. Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 760711372231.dkr.ecr.us-east-1.amazonaws.com

# 3. Tag and push (replace REGISTRY/REPO/TAG with yours)
export ECR_URI="760711372231.dkr.ecr.us-east-1.amazonaws.com/ecoroute-waste-map:latest"
docker tag ecoroute-waste-map:latest "$ECR_URI"
docker push "$ECR_URI"
```

Create the ECR repository if needed:

```bash
aws ecr create-repository --repository-name ecoroute-waste-map --region us-east-1
```

---

## Local build and run

From the **ecoroute_2_v1** directory:

```bash
docker build -t ecoroute-waste-map:latest .
# or for explicit platform (same as ECR build):
docker buildx build --platform linux/amd64 --load -t ecoroute-waste-map:latest .
```

```bash
docker run --rm -p 8080:80 ecoroute-waste-map:latest
```

Then open **http://localhost:8080** in your browser.

## Optional: run in background and stop

```bash
# Run in background
docker run --rm -d -p 8080:80 --name ecoroute ecoroute-waste-map:latest

# Stop
docker stop ecoroute
```

## Data in the image

The app uses `public/dataset.json` at build time; Vite copies it into the image as `/dataset.json`. The UI will load that after trying S3 and cache. To use a different dataset, replace `public/dataset.json` before building, or mount a file when running (e.g. `-v $(pwd)/my-dataset.json:/usr/share/nginx/html/dataset.json:ro`).
