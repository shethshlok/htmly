#!/bin/bash

# Configuration
CONTAINER_NAME="htmly-engine"
PROCESS_NAME="bun run index.ts"

echo "🚀 Starting Htmly Docker Deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull

# 2. Cleanup local process if running (from previous setup)
echo "🧹 Checking for legacy local processes..."
PID=$(pgrep -f "$PROCESS_NAME")
if [ -n "$PID" ]; then
    echo "Stopping local process $PID..."
    kill $PID
    sleep 2
fi

# 3. Build and Start Container
echo "🐳 Deploying via Docker..."
docker compose up -d --build

# 4. Verify
echo "🔍 Verifying deployment..."
sleep 5
if [ "$(docker inspect -f '{{.State.Running}}' $CONTAINER_NAME)" == "true" ]; then
    echo "✅ Htmly is running in Docker!"
    echo "🔗 URL: https://html.shloksheth.tech"
    docker ps | grep $CONTAINER_NAME
else
    echo "❌ Docker container failed to start. Check logs with: docker logs $CONTAINER_NAME"
    exit 1
fi
