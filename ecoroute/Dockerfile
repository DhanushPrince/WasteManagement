# EcoRoute Waste Map — ECR/ECS-ready image (linux/amd64)
# Build: docker buildx build --platform linux/amd64 -t <ecr-uri>:<tag> .
# Run on ECS: expose port 80, health check path / (or /index.html)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (use package-lock.json for reproducible builds)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and static assets (public/dataset.json is used at runtime)
COPY . .

# Build the Vite app (output in dist/)
RUN npm run build

# Production stage: serve with nginx (minimal for ECS Fargate)
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing and static caching
COPY nginx.conf.template /etc/nginx/conf.d/default.conf

# ECS: container listens on 80; ALB/target group should use port 80, path /
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
