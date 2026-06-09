#!/bin/bash
set -e

SERVER="ubuntu@43.157.241.12"
APP_DIR="~/cranberry-juice"

echo "→ Syncing source..."
rsync -az --progress \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env*' \
  --exclude='*.tar.gz' \
  . $SERVER:$APP_DIR/

echo "→ Building image on server..."
TURNSTILE_KEY=$(ssh $SERVER "grep NEXT_PUBLIC_TURNSTILE_SITE_KEY $APP_DIR/.env.production | cut -d'=' -f2- | tr -d '\"'")
ssh $SERVER "cd $APP_DIR && docker build --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=$TURNSTILE_KEY -t cranberry-juice:latest ."

echo "→ Running migrations..."
ssh $SERVER "cd $APP_DIR && docker run --rm \
  -e DATABASE_URL=\$(grep DATABASE_URL .env.production | cut -d'=' -f2- | tr -d '\"') \
  --network cranberry-juice_cranberry \
  cranberry-juice:latest \
  node_modules/.bin/prisma migrate deploy"

echo "→ Restarting app..."
ssh $SERVER "cd $APP_DIR && docker compose up -d app"

echo "✓ Deploy complete"
