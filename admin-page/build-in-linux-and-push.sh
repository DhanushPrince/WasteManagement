#!/bin/bash
# Build the image inside a Linux Docker daemon (Docker-in-Docker), then push to ECR.
# Run from ecoroute_2_v1/. Requires: Docker, AWS CLI configured (e.g. aws sso login).
# See BUILD-ON-LINUX.md for the full guide.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

REGION="${AWS_REGION:-us-east-1}"
REGISTRY="${ECR_REGISTRY:-760711372231.dkr.ecr.us-east-1.amazonaws.com}"
REPO="${ECR_REPO:-ecoroute-waste-map}"
TAG="${IMAGE_TAG:-latest}"
NETWORK="ecr-build-net"
DIND_NAME="ecr-dind"

# Ensure AWS credentials are available (for ECR login inside the container)
if ! aws sts get-caller-identity &>/dev/null; then
  echo "Error: AWS CLI not configured or not logged in. Run: aws sso login (or aws configure)"
  exit 1
fi

echo "=== Build on Linux (DinD) and push to ECR ==="
echo "  ECR: $REGISTRY/$REPO:$TAG"
echo ""

# Create network
docker network create "$NETWORK" 2>/dev/null || true

# Start Docker-in-Docker (Linux daemon) if not already running
if ! docker inspect "$DIND_NAME" &>/dev/null; then
  echo "Starting Linux Docker daemon (DinD)..."
  docker run -d --privileged \
    --network "$NETWORK" \
    --name "$DIND_NAME" \
    -e DOCKER_TLS_CERTDIR= \
    docker:24-dind
  echo "Waiting for Docker daemon to be ready..."
  sleep 8
else
  echo "Using existing DinD container: $DIND_NAME"
fi

# Wait until the daemon accepts commands
for i in 1 2 3 4 5 6 7 8 9 10; do
  if docker run --rm --network "$NETWORK" -e DOCKER_HOST=tcp://"$DIND_NAME":2375 docker:24 docker info &>/dev/null; then
    break
  fi
  if [ "$i" -eq 10 ]; then
    echo "Error: DinD daemon did not become ready. Try: docker stop $DIND_NAME && docker rm $DIND_NAME && run this script again."
    exit 1
  fi
  sleep 2
done

echo "Building image inside Linux and pushing to ECR..."
docker run --rm \
  --network "$NETWORK" \
  -e DOCKER_HOST=tcp://"$DIND_NAME":2375 \
  -e AWS_REGION="$REGION" \
  -e ECR_REGISTRY="$REGISTRY" \
  -e ECR_REPO="$REPO" \
  -e IMAGE_TAG="$TAG" \
  -v "$(pwd):/workspace" \
  -v "$HOME/.aws:/root/.aws:ro" \
  -w /workspace \
  docker:24 sh -c '
    apk add --no-cache aws-cli >/dev/null 2>&1
    echo "Building image on Linux..."
    docker build -t ecoroute-waste-map:latest .
    echo "Logging in to ECR..."
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
    echo "Tagging and pushing..."
    docker tag ecoroute-waste-map:latest "$ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG"
    docker push "$ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG"
    echo "Done. Image: $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG"
  '

echo ""
echo "=== Success. Image pushed: $REGISTRY/$REPO:$TAG ==="
echo "To stop the Linux build daemon: docker stop $DIND_NAME && docker rm $DIND_NAME"
