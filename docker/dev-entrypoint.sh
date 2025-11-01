#!/bin/sh
set -e

cd /app/backend
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  npm install
fi

cd /app/frontend
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  npm install
fi

FRONTEND_PORT=${FRONTEND_PORT:-5173}

cd /app

trap 'kill 0' INT TERM

npm run dev --prefix backend &
npm run dev --prefix frontend -- --host 0.0.0.0 --port "$FRONTEND_PORT" --strictPort false &

wait
