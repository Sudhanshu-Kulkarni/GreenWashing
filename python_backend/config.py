"""
Configuration management for ESG Claim Verification system.
Contains paths to models, datasets, and processing parameters.
"""

import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent
MODEL_PATH = BASE_DIR / "trained_llm_for_claim_classification" / "best_finetuned_model"
ESG_CSV_PATH = BASE_DIR / "esg_lookup_2020_2025.csv"

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
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model path not found: {MODEL_PATH}")
    
    if not ESG_CSV_PATH.exists():
        raise FileNotFoundError(f"ESG CSV file not found: {ESG_CSV_PATH}")
    
    return True