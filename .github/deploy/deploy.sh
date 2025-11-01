#!/bin/bash
set -e

DOCKER_IMAGE=$1
APP_NAME="ripple-app"

if [ -z "$DOCKER_IMAGE" ]; then
  echo "❌ Error: Docker image not provided"
  exit 1
fi

echo "🚀 Starting deployment..."
echo "📦 Docker image: $DOCKER_IMAGE"

# Login to Docker Hub (if not already logged in)
if ! docker info | grep -q "Username"; then
  echo "⚠️  Docker Hub not logged in. Please configure Docker Hub credentials."
fi

# Pull the latest image
echo "📥 Pulling latest image..."
docker pull "$DOCKER_IMAGE" || {
  echo "❌ Failed to pull image. Make sure the image exists and Docker Hub credentials are set."
  exit 1
}

# Stop and remove existing container if it exists
if docker ps -a --format '{{.Names}}' | grep -q "^${APP_NAME}$"; then
  echo "🛑 Stopping existing container..."
  docker stop "$APP_NAME" || true
  echo "🗑️  Removing existing container..."
  docker rm "$APP_NAME" || true
fi

# Remove old images (keep only current and previous)
echo "🧹 Cleaning up old images..."
docker image prune -f

# Run new container
echo "🎯 Starting new container..."
docker run -d \
  --name "$APP_NAME" \
  --restart unless-stopped \
  -p 4000:4000 \
  --env-file .env.production \
  "$DOCKER_IMAGE"

# Wait a moment for container to start
sleep 2

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q "^${APP_NAME}$"; then
  echo "✅ Container started successfully!"
  echo "📊 Container status:"
  docker ps --filter "name=$APP_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
  echo "❌ Container failed to start!"
  echo "📋 Logs:"
  docker logs "$APP_NAME" --tail 50
  exit 1
fi

# Show container logs
echo "📋 Recent logs:"
docker logs "$APP_NAME" --tail 20

echo "✨ Deployment completed successfully!"

