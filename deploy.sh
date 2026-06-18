#!/bin/bash

# Configuration
PORT=6342
BASE_URL="https://html.shloksheth.tech"
PROCESS_NAME="bun run index.ts"

echo "🚀 Starting Htmly Deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull

# 2. Install dependencies
echo "📦 Installing dependencies..."
bun install

# 3. Stop existing process
echo "🛑 Stopping existing Htmly process..."
# Find the PID of the process running the server
PID=$(pgrep -f "$PROCESS_NAME")
if [ -z "$PID" ]; then
    echo "ℹ️ No running process found."
else
    echo "kiliing process $PID"
    kill $PID
    # Wait for it to actually stop
    sleep 2
fi

# 4. Start the server in the background
echo "⚡ Starting server on port $PORT..."
nohup env PORT=$PORT BASE_URL=$BASE_URL bun run index.ts > server.log 2>&1 &

# 5. Verify
sleep 2
NEW_PID=$(pgrep -f "$PROCESS_NAME")
if [ -n "$NEW_PID" ]; then
    echo "✅ Htmly is running! (PID: $NEW_PID)"
    echo "🔗 URL: $BASE_URL"
else
    echo "❌ Failed to start server. Check server.log for details."
    exit 1
fi
