#!/bin/bash
set -e

DOCKER_IMAGE=$1
APP_NAME="ripple-app"

# Find docker command (try docker, then /usr/bin/docker, then sudo docker)
DOCKER_CMD="docker"
if ! command -v docker &> /dev/null; then
  if [ -f /usr/bin/docker ] || [ -x /usr/bin/docker ]; then
    DOCKER_CMD="/usr/bin/docker"
  else
    DOCKER_CMD="sudo docker"
  fi
fi

# Test if the command works
if ! $DOCKER_CMD --version &> /dev/null; then
  # Try sudo docker as fallback
  if sudo docker --version &> /dev/null; then
    DOCKER_CMD="sudo docker"
  else
    echo "❌ Docker is not available. Please install Docker first."
    exit 1
  fi
fi

echo "🐳 Using Docker command: $DOCKER_CMD"

if [ -z "$DOCKER_IMAGE" ]; then
  echo "❌ Error: Docker image not provided"
  exit 1
fi

echo "🚀 Starting deployment..."
echo "📦 Docker image: $DOCKER_IMAGE"

# Login to Docker Hub (if not already logged in)
if ! $DOCKER_CMD info 2>/dev/null | grep -q "Username"; then
  echo "⚠️  Docker Hub not logged in. Please configure Docker Hub credentials."
fi

# Pull the latest image
echo "📥 Pulling latest image..."
$DOCKER_CMD pull "$DOCKER_IMAGE" || {
  echo "❌ Failed to pull image. Make sure the image exists and Docker Hub credentials are set."
  exit 1
}

# Stop and remove existing container if it exists
if $DOCKER_CMD ps -a --format '{{.Names}}' | grep -q "^${APP_NAME}$"; then
  echo "🛑 Stopping existing container..."
  $DOCKER_CMD stop "$APP_NAME" || true
  echo "🗑️  Removing existing container..."
  $DOCKER_CMD rm "$APP_NAME" || true
fi

# Remove old images (keep only current and previous)
echo "🧹 Cleaning up old images..."
$DOCKER_CMD image prune -f

# Run new container
echo "🎯 Starting new container..."
$DOCKER_CMD run -d \
  --name "$APP_NAME" \
  --restart unless-stopped \
  -p 4000:4000 \
  --env-file .env.production \
  "$DOCKER_IMAGE"

# Wait a moment for container to start
sleep 2

# Check if container is running
if $DOCKER_CMD ps --format '{{.Names}}' | grep -q "^${APP_NAME}$"; then
  echo "✅ Container started successfully!"
  echo "📊 Container status:"
  $DOCKER_CMD ps --filter "name=$APP_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
  echo "❌ Container failed to start!"
  echo "📋 Logs:"
  $DOCKER_CMD logs "$APP_NAME" --tail 50
  exit 1
fi

# Show container logs
echo "📋 Recent logs:"
$DOCKER_CMD logs "$APP_NAME" --tail 20

echo "✨ Deployment completed successfully!"

