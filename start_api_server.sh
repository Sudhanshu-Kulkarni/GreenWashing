#!/bin/bash

# ESG Claim Verification API Server Startup Script
# This script starts the Python HTTP API server for processing PDF documents

set -e  # Exit on any error

echo "============================================================"
echo "ESG CLAIM VERIFICATION - API SERVER STARTUP"
echo "============================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed or not in PATH${NC}"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo -e "${BLUE}Python version:${NC}"
python3 --version
echo ""

# Check if we're in the right directory
if [ ! -f "python_backend/api_server.py" ]; then
    echo -e "${RED}Error: api_server.py not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if required files exist
echo -e "${BLUE}Checking system requirements...${NC}"

if [ -f "python_backend/nlp_processor.py" ]; then
    echo -e "${GREEN}✓${NC} Python backend files found"
else
    echo -e "${RED}✗${NC} Python backend files missing"
    exit 1
fi

if [ -d "trained_llm_for_claim_classification/best_finetuned_model" ]; then
    echo -e "${GREEN}✓${NC} Trained LLM model found"
else
    echo -e "${YELLOW}⚠${NC} Trained LLM model missing - server may not work properly"
fi

if [ -f "esg_lookup_2020_2025.csv" ]; then
    echo -e "${GREEN}✓${NC} ESG lookup data found"
else
    echo -e "${YELLOW}⚠${NC} ESG lookup data missing - server may not work properly"
fi

echo ""

# Install Python dependencies
echo -e "${BLUE}Installing Python dependencies...${NC}"
if [ -f "python_backend/requirements_api.txt" ]; then
    pip3 install -r python_backend/requirements_api.txt
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} requirements_api.txt not found, installing basic dependencies"
    pip3 install flask flask-cors
fi

echo ""

# Get network information
echo -e "${BLUE}Network Information:${NC}"
echo "The API server will be accessible at:"
echo "• Local: http://localhost:8000"
echo "• Network: http://$(hostname -I | awk '{print $1}'):8000 (for physical devices)"
echo ""

# Parse command line arguments
HOST="0.0.0.0"
PORT="8000"
DEBUG=""
PRELOAD=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            HOST="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --debug)
            DEBUG="--debug"
            shift
            ;;
        --preload)
            PRELOAD="--preload"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --host HOST     Host to bind to (default: 0.0.0.0)"
            echo "  --port PORT     Port to bind to (default: 8000)"
            echo "  --debug         Enable debug mode"
            echo "  --preload       Preload NLP processor on startup"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}Starting API server...${NC}"
echo "Host: $HOST"
echo "Port: $PORT"
if [ -n "$DEBUG" ]; then
    echo "Debug mode: enabled"
fi
if [ -n "$PRELOAD" ]; then
    echo "Preload models: enabled"
fi
echo ""

echo -e "${GREEN}🚀 ESG Claim Verification API Server Starting...${NC}"
echo ""
echo "API Endpoints:"
echo "• Health Check: http://$HOST:$PORT/health"
echo "• Process Document: http://$HOST:$PORT/api/process-document"
echo "• Extract Company Name: http://$HOST:$PORT/api/extract-company-name"
echo "• Model Info: http://$HOST:$PORT/api/models/info"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Start the server
cd python_backend
python3 api_server.py --host "$HOST" --port "$PORT" $DEBUG $PRELOAD