"""
Configuration management for ESG Claim Verification system.
Contains paths to models, datasets, and processing parameters.
"""

import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent
ESG_CSV_PATH = BASE_DIR / "esg_lookup_2020_2025.csv"

# Hugging Face Configuration
HF_MODEL_NAME = os.getenv('HF_MODEL_NAME', 'your-username/your-model-name')
HF_API_TOKEN = os.getenv('HF_API_TOKEN')

# Processing parameters
CONFIDENCE_THRESHOLD = 0.7
VERIFICATION_TOLERANCE = 0.1
MAX_SENTENCE_LENGTH = 512
BATCH_SIZE = 16

# File paths for communication with React Native
SHARED_DIR = BASE_DIR / "shared"
UPLOADS_DIR = SHARED_DIR / "uploads"
PROCESSING_DIR = SHARED_DIR / "processing"
RESULTS_DIR = SHARED_DIR / "results"

# Ensure shared directories exist
for directory in [SHARED_DIR, UPLOADS_DIR, PROCESSING_DIR, RESULTS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Validation
def validate_config():
    """Validate that required files and directories exist."""
    if not ESG_CSV_PATH.exists():
        raise FileNotFoundError(f"ESG CSV file not found: {ESG_CSV_PATH}")
    
    if not HF_MODEL_NAME or HF_MODEL_NAME == 'your-username/your-model-name':
        raise ValueError("HF_MODEL_NAME environment variable must be set to your Hugging Face model name")
    
    if not HF_API_TOKEN:
        raise ValueError("HF_API_TOKEN environment variable must be set")
    
    return True