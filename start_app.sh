#!/bin/bash

# ESG Climate Claim Verification - Complete Application Startup
# This script starts both the Flask backend and React Native frontend

set -e

echo "============================================================"
echo "ESG CLIMATE CLAIM VERIFICATION - COMPLETE APP STARTUP"
echo "============================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please copy .env.example to .env and configure your API keys:"
    echo "  cp .env.example .env"
    echo "  # Edit .env with your Hugging Face model name and API token"
    exit 1
fi

# Check if required environment variables are set
source .env
if [ -z "$HF_MODEL_NAME" ] || [ "$HF_MODEL_NAME" = "your-username/your-model-name" ]; then
    echo -e "${RED}Error: HF_MODEL_NAME not configured in .env${NC}"
    echo "Please set your Hugging Face model name in .env file"
    exit 1
fi

if [ -z "$HF_API_TOKEN" ] || [ "$HF_API_TOKEN" = "your-huggingface-api-token" ]; then
    echo -e "${RED}Error: HF_API_TOKEN not configured in .env${NC}"
    echo "Please set your Hugging Face API token in .env file"
    exit 1
fi

echo -e "${GREEN}✓${NC} Environment configuration validated"
echo ""

# Check dependencies
echo -e "${BLUE}Checking dependencies...${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command -v expo &> /dev/null; then
    echo -e "${YELLOW}Warning: Expo CLI not found. Installing...${NC}"
    npm install -g @expo/cli
fi

echo -e "${GREEN}✓${NC} All dependencies available"
echo ""

# Install Python dependencies
echo -e "${BLUE}Installing Python dependencies...${NC}"
pip3 install -r requirements.txt > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Python dependencies installed"

# Install React Native dependencies
echo -e "${BLUE}Installing React Native dependencies...${NC}"
cd ClimateApp
npm install > /dev/null 2>&1
cd ..
echo -e "${GREEN}✓${NC} React Native dependencies installed"
echo ""

# Get network IP for mobile device access
NETWORK_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")

echo -e "${BLUE}Starting Flask API Server...${NC}"
echo "The Flask server will be available at:"
echo "• Local: http://localhost:8000"
echo "• Network: http://$NETWORK_IP:8000 (for mobile devices)"
echo ""

# Start Flask server in background
./start_api_server.sh --preload &
FLASK_PID=$!

# Wait for Flask server to start
echo -e "${YELLOW}Waiting for Flask server to start...${NC}"
sleep 5

# Check if Flask server is running
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${YELLOW}Flask server still starting up, waiting a bit more...${NC}"
    sleep 10
fi

if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Flask server is running"
else
    echo -e "${RED}✗${NC} Flask server failed to start"
    kill $FLASK_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${BLUE}Starting React Native App...${NC}"
echo "The React Native app will open in Expo Developer Tools"
echo ""
echo -e "${GREEN}🚀 Both services are starting up!${NC}"
echo ""
echo "Next steps:"
echo "1. Expo Developer Tools will open in your browser"
echo "2. Press 'i' for iOS simulator or 'a' for Android emulator"
echo "3. Or scan the QR code with Expo Go app on your phone"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"
echo ""

# Start React Native app
cd ClimateApp
expo start

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $FLASK_PID 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait