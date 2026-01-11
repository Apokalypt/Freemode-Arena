#!/bin/bash

set -e  # Exit on any error

# Configuration
REMOTE_HOST="rpi-prod"
REMOTE_PATH='$HOME/Projects/discord-bot_freemode-arena'
REMOTE_PM2_ID="discord-bot_freemode-arena"
LOCAL_DIST_DIR="./dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment to ${REMOTE_HOST}...${NC}"

# Build the project first
echo -e "${YELLOW}Building project...${NC}"
rm -r "$LOCAL_DIST_DIR" || true
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed. Deployment aborted.${NC}"
    exit 1
fi

# Check if dist directory exists
if [ ! -d "$LOCAL_DIST_DIR" ]; then
    echo -e "${RED}Error: dist directory not found. Please run 'npm run build' first.${NC}"
    exit 1
fi

# Create remote directory if it doesn't exist
echo -e "${YELLOW}Ensuring remote directory exists...${NC}"
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_PATH"

# Sync the dist directory to the remote server
echo -e "${YELLOW}Syncing files to ${REMOTE_HOST}:${REMOTE_PATH}...${NC}"
rsync -avz --delete \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    "$LOCAL_DIST_DIR/" "$REMOTE_HOST:$REMOTE_PATH/"

# Install production dependencies on remote server
echo -e "${YELLOW}Installing production dependencies on remote server...${NC}"
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && npm install --production --silent"

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Files deployed to: ${REMOTE_HOST}:${REMOTE_PATH}${NC}"

# Restart the application using PM2 on the remote server
echo -e "${YELLOW}Restarting application with PM2...${NC}"
ssh "$REMOTE_HOST" "pm2 restart $REMOTE_PM2_ID"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to restart application with PM2.${NC}"
    exit 1
fi
echo -e "${GREEN}Application restarted successfully!${NC}"
