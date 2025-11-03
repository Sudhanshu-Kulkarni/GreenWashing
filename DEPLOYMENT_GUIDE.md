# ESG Climate Claim Verification - Deployment Guide

## Architecture Overview

This application uses a **local deployment** architecture:

1. **ML Model**: Deployed on Hugging Face Hub (Inference API)
2. **Backend**: Local Flask server that calls Hugging Face API
3. **Frontend**: React Native app (Expo) that calls local Flask server

## Prerequisites

1. **Python 3.8+** installed
2. **Node.js 16+** and **npm** installed
3. **Expo CLI** installed: `npm install -g @expo/cli`
4. **Hugging Face account** and API token
5. **Your trained model** uploaded to Hugging Face Hub

## Step 1: Deploy Your Model to Hugging Face

1. **Upload your model to Hugging Face Hub:**
   ```bash
   # Install huggingface_hub
   pip install huggingface_hub
   
   # Login to Hugging Face
   huggingface-cli login
   
   # Upload your model (from trained_llm_for_claim_classification/best_finetuned_model/)
   huggingface-cli upload your-username/esg-claim-classifier ./trained_llm_for_claim_classification/best_finetuned_model/
   ```

2. **Get your API token:**
   - Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
   - Create a new token with "Read" permissions
   - Copy the token

## Step 2: Configure Environment Variables

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file:**
   ```bash
   # Replace with your actual values
   HF_MODEL_NAME=your-username/esg-claim-classifier
   HF_API_TOKEN=hf_your_actual_token_here
   GEMINI_API_KEY=your_gemini_key_here  # Optional
   ```

## Step 3: Install Dependencies

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install React Native dependencies:**
   ```bash
   cd ClimateApp
   npm install
   cd ..
   ```

## Step 4: Start the Flask Server

```bash
# Make the script executable
chmod +x start_api_server.sh

# Start the Flask server
./start_api_server.sh --preload

# Or run directly:
cd python_backend
python api_server.py --host 0.0.0.0 --port 8000 --preload
```

The server will be available at:
- **Local**: http://localhost:8000
- **Network**: http://your-ip:8000 (for mobile devices)

## Step 5: Start the React Native App

```bash
cd ClimateApp
expo start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Step 6: Test the Application

1. **Test Flask API:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Upload a PDF** through the React Native app
3. **Verify processing** works end-to-end

## Configuration Notes

### For Physical Devices

If testing on a physical device, update the IP address in:
- `ClimateApp/services/nlpService.js`
- `ClimateApp/services/pythonBridge.js`

Replace `localhost` with your computer's IP address (e.g., `192.168.1.5`).

### Hugging Face Model Requirements

Your model should:
- Be a **text classification model**
- Return labels like `LABEL_0` (Non-Claim) and `LABEL_1` (Claim)
- Accept text input via Inference API

### Performance Considerations

- **First API call** may take 20-60 seconds (model loading)
- **Subsequent calls** are much faster
- **Batch processing** uses concurrent requests for efficiency
- **Free tier** has rate limits - consider upgrading for production

## Troubleshooting

### Common Issues

1. **"Model not found"**: Check your `HF_MODEL_NAME` in `.env`
2. **"API token invalid"**: Verify your `HF_API_TOKEN`
3. **"Connection refused"**: Ensure Flask server is running
4. **"Model loading"**: Wait 30-60 seconds for first request

### Logs

- **Flask logs**: Check terminal where you started the server
- **React Native logs**: Check Expo developer tools
- **API logs**: Enable debug mode with `--debug` flag

## Production Deployment

For production deployment, consider:

1. **Paid Hugging Face plan** for better performance
2. **Dedicated server** for Flask API
3. **Load balancer** for multiple Flask instances
4. **Database** for storing processing results
5. **Authentication** for API access

## File Structure

```
├── python_backend/           # Flask API server
│   ├── api_server.py        # Main Flask application
│   ├── huggingface_classifier.py  # HF API integration
│   └── ...
├── ClimateApp/              # React Native frontend
│   ├── services/            # API communication
│   └── ...
├── .env                     # Environment variables
└── requirements.txt         # Python dependencies
```

## Support

For issues:
1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Test each component individually (HF API, Flask server, React Native app)