#!/bin/bash
# Build (linux/amd64 for ECS) and push ecoroute-waste-map to ECR.
# Prereqs: AWS CLI, Docker (with buildx for --platform). Run from ecoroute_2_v1/
# 1. AWS auth: aws sso login  (or export AWS credentials)
# 2. ECR repo must exist: aws ecr create-repository --repository-name <REPO> --region <REGION>

set -e
REGION="${AWS_REGION:-us-east-1}"
REGISTRY="${ECR_REGISTRY:-760711372231.dkr.ecr.us-east-1.amazonaws.com}"
REPO="${ECR_REPO:-ecoroute-waste-map}"
TAG="${IMAGE_TAG:-latest}"
LOCAL_IMAGE="ecoroute-waste-map:latest"
ECR_URI="$REGISTRY/$REPO:$TAG"

echo "Building for linux/amd64 (ECS)..."
docker buildx build \
  --platform linux/amd64 \
  --load \
  -t "$LOCAL_IMAGE" \
  .

echo "Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"

echo "Tagging for ECR..."
docker tag "$LOCAL_IMAGE" "$ECR_URI"

echo "Pushing to ECR..."
docker push "$ECR_URI"

echo "Done. Image: $ECR_URI"
