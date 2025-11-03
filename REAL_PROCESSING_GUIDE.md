# ESG Claim Verification - Real Processing Setup Guide

This guide shows you how to run the ESG Claim Verification app with **REAL Python backend processing** using actual PDF documents and the trained LLM model.

## 🎯 What You'll Get

- ✅ **Real PDF Processing**: Upload actual sustainability reports
- ✅ **Real LLM Model**: Uses trained BERT model for claim classification
- ✅ **Real ESG Verification**: Matches claims against actual ESG database
- ✅ **Real Results**: Get actual verification results, not mock data
- ✅ **Expo App Interface**: Beautiful React Native UI for interaction

## 🏗️ Architecture Overview

```
┌─────────────────┐    HTTP API    ┌──────────────────┐
│   Expo App      │◄──────────────►│  Python Server  │
│  (React Native) │                │   (Flask API)    │
└─────────────────┘                └──────────────────┘
                                            │
                                            ▼
                                   ┌──────────────────┐
                                   │  NLP Processing  │
                                   │ • PDF Extraction │
                                   │ • BERT Model     │
                                   │ • ESG Verification│
                                   └──────────────────┘
```

## 📋 Prerequisites

### 1. **Python Environment**
```bash
# Check Python version (3.8+ required)
python3 --version

# Install required packages
pip3 install -r python_backend/requirements_api.txt
```

### 2. **Required Files** (Already Present)
- ✅ `trained_llm_for_claim_classification/best_finetuned_model/` - Trained BERT model
- ✅ `esg_lookup_2020_2025.csv` - ESG verification database
- ✅ `python_backend/` - NLP processing modules

### 3. **Node.js & Expo** (For the app)
```bash
# Check Node.js version
node --version

# Install Expo CLI if not already installed
npm install -g @expo/cli
```

## 🚀 Step-by-Step Setup

### Step 1: Start the Python API Server

Open a terminal and run:

```bash
# Make the script executable (already done)
chmod +x start_api_server.sh

# Start the API server
./start_api_server.sh
```

**What this does:**
- Starts Flask HTTP server on `http://localhost:8000`
- Loads the trained BERT model
- Loads ESG verification database
- Provides REST API endpoints for the Expo app

**Expected Output:**
```
============================================================
ESG CLAIM VERIFICATION - API SERVER STARTUP
============================================================

✓ Python backend files found
✓ Trained LLM model found
✓ ESG lookup data found

🚀 ESG Claim Verification API Server Starting...

API Endpoints:
• Health Check: http://0.0.0.0:8000/health
• Process Document: http://0.0.0.0:8000/api/process-document

 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:8000
 * Running on http://192.168.1.xxx:8000
```

### Step 2: Test the API Server

In a new terminal, test the server:

```bash
# Test health check
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-11-01T20:30:00",
  "components": {
    "nlp_processor": "available",
    "model_path": "/path/to/trained_llm_for_claim_classification/best_finetuned_model",
    "esg_data_path": "/path/to/esg_lookup_2020_2025.csv"
  }
}
```

### Step 3: Start the Expo App

In a new terminal:

```bash
# Navigate to the app directory
cd ClimateApp

# Install dependencies (if not already done)
npm install

# Start the Expo development server
npm start
```

**What this does:**
- Starts Expo development server
- Shows QR code for mobile devices
- Enables hot reloading for development

### Step 4: Run the App

Choose your preferred method:

#### **Option A: Web Browser (Easiest)**
```bash
# In the ClimateApp directory
npm run web
```
Then open `http://localhost:19006` in your browser.

#### **Option B: Mobile Device**
1. Install **Expo Go** app on your phone
2. Scan the QR code from the terminal
3. App loads on your device

#### **Option C: iOS Simulator (Mac only)**
```bash
npm run ios
```

#### **Option D: Android Emulator**
```bash
npm run android
```

## 📱 Using the App with Real Processing

### 1. **Upload a PDF Document**
- Tap "Upload Document" or "+" button
- Select a PDF sustainability report
- The app will extract the company name automatically

### 2. **Real Processing Happens**
- PDF is uploaded to Python server via HTTP
- Server extracts text using PyPDF2
- BERT model classifies sentences as claims
- ESG verifier matches claims against database
- Real results are returned to the app

### 3. **View Real Results**
- See actual claims extracted from your PDF
- View verification status (verified/questionable/unverified)
- Browse detailed reasoning for each claim
- Check overall statistics

## 🔧 Configuration Options

### API Server Options

```bash
# Start with custom host/port
./start_api_server.sh --host 0.0.0.0 --port 8080

# Enable debug mode
./start_api_server.sh --debug

# Preload models on startup (faster first request)
./start_api_server.sh --preload

# Combine options
./start_api_server.sh --port 8080 --debug --preload
```

### Network Configuration

#### **For iOS Simulator:**
- Uses `http://localhost:8000` (default)

#### **For Android Emulator:**
- Uses `http://10.0.2.2:8000` (Android emulator maps this to host localhost)

#### **For Physical Devices:**
- Server runs on `0.0.0.0:8000` (accessible from network)
- Find your computer's IP address: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
- App will connect to `http://YOUR_IP:8000`

## 🧪 Testing with Sample PDFs

### Sample Test Cases

1. **Apple Sustainability Report**: Should extract emissions and renewable energy claims
2. **Microsoft ESG Report**: Should find carbon negative and renewable energy claims
3. **Tesla Impact Report**: Should identify vehicle emissions and energy claims

### Expected Processing Flow

1. **PDF Upload** (2-3 seconds)
2. **Text Extraction** (5-10 seconds)
3. **Claim Classification** (10-20 seconds) - BERT model processing
4. **ESG Verification** (5-10 seconds) - Database matching
5. **Results Formatting** (1-2 seconds)

**Total Time**: 25-45 seconds for typical sustainability report

## 🐛 Troubleshooting

### Common Issues

#### **1. API Server Won't Start**
```bash
# Check if port is already in use
lsof -i :8000

# Kill existing process if needed
kill -9 <PID>

# Try different port
./start_api_server.sh --port 8080
```

#### **2. Model Loading Errors**
```bash
# Check if model files exist
ls -la trained_llm_for_claim_classification/best_finetuned_model/

# Check Python dependencies
pip3 install transformers torch
```

#### **3. Expo App Can't Connect**
- **iOS Simulator**: Use `http://localhost:8000`
- **Android Emulator**: Use `http://10.0.2.2:8000`
- **Physical Device**: Use your computer's IP address

#### **4. File Upload Fails**
- Check file size (max 50MB)
- Ensure file is a PDF
- Check server logs for detailed errors

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Start server in debug mode
./start_api_server.sh --debug

# Check server logs in terminal
# All requests and errors will be logged
```

## 📊 Performance Expectations

### Processing Times (Typical)
- **Small PDF** (10-20 pages): 15-30 seconds
- **Medium PDF** (50-100 pages): 30-60 seconds
- **Large PDF** (100+ pages): 60-120 seconds

### Resource Usage
- **RAM**: 2-4GB (for BERT model)
- **CPU**: High during processing
- **Disk**: Temporary files created and cleaned up

## 🔒 Security Notes

### Development Mode
- Server accepts connections from any IP (`0.0.0.0`)
- CORS enabled for all origins
- No authentication required

### Production Considerations
- Use HTTPS in production
- Implement authentication
- Restrict CORS origins
- Add rate limiting
- Use production WSGI server (gunicorn)

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ **API Server**: Health check returns "healthy"
2. ✅ **Model Loading**: No errors in server logs
3. ✅ **Expo App**: Connects without network errors
4. ✅ **PDF Upload**: Files upload successfully
5. ✅ **Real Processing**: Takes 30+ seconds (not instant like mock)
6. ✅ **Real Results**: Claims vary based on actual PDF content
7. ✅ **Verification**: Shows actual ESG database matches

## 🚀 You're Ready!

With both servers running:
- **Python API Server**: `http://localhost:8000`
- **Expo App**: Available on your device/browser

You now have a fully functional ESG Claim Verification system with real AI-powered processing!

Upload any sustainability report PDF and watch the magic happen! 🎯