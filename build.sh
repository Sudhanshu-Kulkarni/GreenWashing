#!/bin/bash

# Build script for Render deployment
set -o errexit

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Setting up NLTK data..."
python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True)"

echo "Build completed successfully!"