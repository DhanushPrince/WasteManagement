# Build image on Linux and push to ECR

If building on a Mac (or Windows) gives errors, build the image **inside a Linux environment** so the image is built natively for **linux/amd64**, then push to ECR. Two ways to get that Linux environment:

- **Method 1:** Use Docker-in-Docker (DinD) — a Linux Docker daemon runs in a container; you build and push from a helper container. No need for a separate Linux machine.
- **Method 2:** Use a real Linux host (e.g. EC2) — copy the project there and run `docker build` and `docker push` on that host.

---

## Method 1: Build inside Linux (Docker-in-Docker)

Your host can be Mac/Windows/Linux. A **Linux** Docker daemon runs in a container; the image is built inside that daemon (native linux/amd64), then pushed to ECR.

### Prerequisites

- Docker installed on your machine
- AWS CLI configured (e.g. `aws sso login` or `~/.aws/credentials`)
- ECR repository created (see below)

### One-shot script (recommended)

From the **ecoroute_2_v1** directory:

```bash
chmod +x build-in-linux-and-push.sh
./build-in-linux-and-push.sh
```

The script will:

1. Start a Linux Docker daemon in a container (Docker-in-Docker).
2. Run a second container that uses that daemon to build your app image (on Linux).
3. Log in to ECR and push the image from that container.
4. Stop the DinD container.

### Manual steps (Method 1)

If you prefer to run the steps yourself:

**1. Create a network and start Docker-in-Docker (Linux daemon):**

```bash
docker network create ecr-build-net 2>/dev/null || true
docker run -d --privileged \
  --network ecr-build-net \
  --name ecr-dind \
  -e DOCKER_TLS_CERTDIR= \
  docker:24-dind
```

Wait a few seconds for the daemon to be ready.

**2. Build and push from a Linux container (uses the DinD daemon):**

Set your ECR details and run (from **ecoroute_2_v1**):

```bash
export AWS_REGION=us-east-1
export ECR_REGISTRY=760711372231.dkr.ecr.us-east-1.amazonaws.com
export ECR_REPO=ecoroute-waste-map
export IMAGE_TAG=latest

docker run --rm \
  --network ecr-build-net \
  -e DOCKER_HOST=tcp://ecr-dind:2375 \
  -e AWS_REGION \
  -e ECR_REGISTRY \
  -e ECR_REPO \
  -e IMAGE_TAG \
  -v "$(pwd):/workspace" \
  -v "$HOME/.aws:/root/.aws:ro" \
  -w /workspace \
  docker:24 sh -c '
    apk add --no-cache aws-cli
    echo "Building image on Linux..."
    docker build -t ecoroute-waste-map:latest .
    echo "Logging in to ECR..."
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
    echo "Tagging and pushing..."
    docker tag ecoroute-waste-map:latest "$ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG"
    docker push "$ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG"
    echo "Done. Image: $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG"
  '
```

**3. Stop the DinD container when finished:**

```bash
docker stop ecr-dind
docker rm ecr-dind
```

---

## Method 2: Build on a Linux host (e.g. EC2)

Use any **Linux** machine (EC2, your own server, or a Linux VM). The build runs natively on Linux, so there are no platform or emulation issues.

### 2a. Using Amazon EC2

**1. Launch an EC2 instance**

- AMI: **Amazon Linux 2023** or **Ubuntu 22.04**
- Instance type: e.g. **t3.small**
- IAM role (optional but useful): attach a role with `AmazonEC2ContainerRegistryPowerUser` (or at least `ecr:GetAuthorizationToken` and `ecr:*` on your repo) so the instance can push to ECR without storing credentials.

**2. Install Docker and AWS CLI (Amazon Linux 2023):**

```bash
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo usermod -aG docker $USER
# Log out and back in so the group takes effect, or run the next commands with sudo docker

# AWS CLI (if not using an IAM role)
sudo yum install -y awscli
# Configure: aws configure   or   aws sso login
```

**Ubuntu 22.04:**

```bash
sudo apt update && sudo apt install -y docker.io awscli
sudo systemctl start docker
sudo usermod -aG docker $USER
# Log out and back in, or use sudo docker
```

**3. Copy the project to the instance**

From your **Mac/laptop** (in the repo root):

```bash
cd /Users/logeshwarant/Downloads/Emos_chatbot
scp -i your-key.pem -r ecoroute_2_v1 ec2-user@<EC2-PUBLIC-IP>:~/
# For Ubuntu use: ubuntu@<EC2-PUBLIC-IP>
```

Or use `rsync`:

```bash
rsync -avz -e "ssh -i your-key.pem" ecoroute_2_v1 ec2-user@<EC2-PUBLIC-IP>:~/
```

**4. On the EC2 instance (SSH in), build and push**

```bash
cd ~/ecoroute_2_v1

# Create ECR repo if it does not exist
aws ecr create-repository --repository-name ecoroute-waste-map --region us-east-1 2>/dev/null || true

# Build (native linux/amd64 on this machine)
docker build -t ecoroute-waste-map:latest .

# Login to ECR (replace registry if different)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 760711372231.dkr.ecr.us-east-1.amazonaws.com

# Tag and push (replace with your registry/repo/tag)
export ECR_URI="760711372231.dkr.ecr.us-east-1.amazonaws.com/ecoroute-waste-map:latest"
docker tag ecoroute-waste-map:latest "$ECR_URI"
docker push "$ECR_URI"

echo "Done. Image: $ECR_URI"
```

### 2b. Using a local Linux VM or WSL2 (Linux)

Same as above: install Docker and AWS CLI on the Linux side, copy `ecoroute_2_v1` into that environment, then run the same `docker build`, `docker login`, `docker tag`, and `docker push` commands from the **ecoroute_2_v1** directory.

---

## Create the ECR repository (once)

If the repository does not exist yet:

```bash
aws ecr create-repository --repository-name ecoroute-waste-map --region us-east-1
```

Use your preferred region and repository name.

---

## Summary

| Goal                         | What to do |
|-----------------------------|------------|
| Build on Linux without EC2  | Use **Method 1** (script or manual DinD steps). |
| Build on a real Linux box   | Use **Method 2** (EC2 or any Linux host). |
| ECS                        | Use container port **80** and health check path **/** or **/index.html**. |

After push, use the image URI in ECS (e.g. `760711372231.dkr.ecr.us-east-1.amazonaws.com/ecoroute-waste-map:latest`) in your task definition.
