"""
Claim Classification Module for ESG Claim Verification System.

This module loads and uses the fine-tuned BERT model to classify sentences
as containing environmental claims or not. It provides both single sentence
and batch processing capabilities with confidence scoring.
"""

import logging
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import List, Dict, Union, Optional
import numpy as np
from pathlib import Path

try:
    from .config import MODEL_PATH, CONFIDENCE_THRESHOLD, MAX_SENTENCE_LENGTH, BATCH_SIZE
    from .exceptions import ModelLoadError, ESGProcessingError
except ImportError:
    from config import MODEL_PATH, CONFIDENCE_THRESHOLD, MAX_SENTENCE_LENGTH, BATCH_SIZE
    from exceptions import ModelLoadError, ESGProcessingError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ClaimClassifier:
    """
    Fine-tuned BERT model for classifying sentences as claims or non-claims.
    
    This class handles loading the pre-trained model, tokenization, and inference
    for both single sentences and batch processing.
    """
    
    def __init__(self, model_path: Optional[Union[str, Path]] = None):
        """
        Initialize the claim classifier with the fine-tuned BERT model.
        
        Args:
            model_path: Path to the fine-tuned model directory. If None, uses config default.
            
        Raises:
            ModelLoadError: If the model cannot be loaded
        """
        self.model_path = Path(model_path) if model_path else MODEL_PATH
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = None
        self.model = None
        self.confidence_threshold = CONFIDENCE_THRESHOLD
        
        logger.info(f"Initializing ClaimClassifier with device: {self.device}")
        self._load_model()
    
    def _load_model(self):
        """
        Load the tokenizer and model from the specified path.
        
        Raises:
            ModelLoadError: If model loading fails
        """
        try:
            logger.info(f"Loading model from: {self.model_path}")
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                str(self.model_path),
                local_files_only=True
            )
            
            # Load model
            self.model = AutoModelForSequenceClassification.from_pretrained(
                str(self.model_path),
                local_files_only=True
            )
            
            # Move model to appropriate device
            self.model.to(self.device)
            self.model.eval()  # Set to evaluation mode
            
            logger.info("Model loaded successfully")
            
        except Exception as e:
            error_msg = f"Failed to load model from {self.model_path}: {str(e)}"
            logger.error(error_msg)
            raise ModelLoadError(error_msg)
    
    def _preprocess_sentence(self, sentence: str) -> str:
        """
        Clean and preprocess a sentence for classification.
        
        Args:
            sentence: Raw sentence text
            
        Returns:
            Cleaned sentence text
        """
        if not sentence or not sentence.strip():
            return ""
        
        # Basic cleaning
        sentence = sentence.strip()
        
        # Remove excessive whitespace
        sentence = ' '.join(sentence.split())
        
        # Truncate if too long (tokenizer will handle this too, but good to pre-filter)
        if len(sentence) > MAX_SENTENCE_LENGTH * 4:  # Rough character estimate
            sentence = sentence[:MAX_SENTENCE_LENGTH * 4]
        
        return sentence
    
    def classify_sentence(self, sentence: str) -> Dict[str, Union[str, float, bool]]:
        """
        Classify a single sentence as claim or non-claim.
        
        Args:
            sentence: Input sentence to classify
            
        Returns:
            Dictionary containing:
                - text: Original sentence
                - prediction: 'Claim' or 'Non-Claim'
                - confidence: Confidence score (0-1)
                - is_claim: Boolean indicating if sentence is classified as claim
                - raw_scores: Raw model output scores
        """
        if not sentence or not sentence.strip():
            return {
                'text': sentence,
                'prediction': 'Non-Claim',
                'confidence': 0.0,
                'is_claim': False,
                'raw_scores': [0.0, 0.0]
            }
        
        try:
            # Preprocess sentence
            cleaned_sentence = self._preprocess_sentence(sentence)
            
            # Tokenize
            inputs = self.tokenizer(
                cleaned_sentence,
                return_tensors="pt",
                truncation=True,
                padding=True,
                max_length=MAX_SENTENCE_LENGTH
            )
            
            # Move inputs to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Get model predictions
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                
                # Apply softmax to get probabilities
                probabilities = torch.softmax(logits, dim=-1)
                
                # Get prediction and confidence
                predicted_class = torch.argmax(probabilities, dim=-1).item()
                confidence = probabilities[0][predicted_class].item()
                
                # Convert to human-readable format
                # Assuming class 0 = Non-Claim, class 1 = Claim
                prediction = 'Claim' if predicted_class == 1 else 'Non-Claim'
                is_claim = predicted_class == 1
                
                # Get raw scores for both classes
                raw_scores = probabilities[0].cpu().numpy().tolist()
                
                return {
                    'text': sentence,
                    'prediction': prediction,
                    'confidence': confidence,
                    'is_claim': is_claim,
                    'raw_scores': raw_scores
                }
                
        except Exception as e:
            logger.error(f"Error classifying sentence: {str(e)}")
            raise ESGProcessingError(f"Classification failed: {str(e)}")
    
    def batch_classify(self, sentences: List[str], progress_callback=None) -> List[Dict[str, Union[str, float, bool]]]:
        """
        Classify multiple sentences efficiently using batch processing.
        
        Args:
            sentences: List of sentences to classify
            progress_callback: Optional callback function for progress updates
            
        Returns:
            List of classification results, one per input sentence
        """
        if not sentences:
            return []
        
        results = []
        total_sentences = len(sentences)
        
        logger.info(f"Starting batch classification of {total_sentences} sentences")
        
        try:
            # Process in batches
            for i in range(0, total_sentences, BATCH_SIZE):
                batch_sentences = sentences[i:i + BATCH_SIZE]
                batch_results = self._process_batch(batch_sentences)
                results.extend(batch_results)
                
                # Progress callback
                if progress_callback:
                    progress = min((i + BATCH_SIZE) / total_sentences, 1.0)
                    progress_callback(progress)
                
                # Log progress
                processed = min(i + BATCH_SIZE, total_sentences)
                logger.info(f"Processed {processed}/{total_sentences} sentences")
            
            logger.info(f"Batch classification completed. {len(results)} results generated.")
            return results
            
        except Exception as e:
            logger.error(f"Error in batch classification: {str(e)}")
            raise ESGProcessingError(f"Batch classification failed: {str(e)}")
    
    def _process_batch(self, batch_sentences: List[str]) -> List[Dict[str, Union[str, float, bool]]]:
        """
        Process a single batch of sentences.
        
        Args:
            batch_sentences: List of sentences in the current batch
            
        Returns:
            List of classification results for the batch
        """
        # Preprocess all sentences in batch
        cleaned_sentences = [self._preprocess_sentence(s) for s in batch_sentences]
        
        # Filter out empty sentences but keep track of original indices
        valid_sentences = []
        valid_indices = []
        
        for idx, sentence in enumerate(cleaned_sentences):
            if sentence:
                valid_sentences.append(sentence)
                valid_indices.append(idx)
        
        # Initialize results with default values
        batch_results = []
        for sentence in batch_sentences:
            batch_results.append({
                'text': sentence,
                'prediction': 'Non-Claim',
                'confidence': 0.0,
                'is_claim': False,
                'raw_scores': [1.0, 0.0]  # High confidence for Non-Claim
            })
        
        # Process valid sentences if any
        if valid_sentences:
            # Tokenize batch
            inputs = self.tokenizer(
                valid_sentences,
                return_tensors="pt",
                truncation=True,
                padding=True,
                max_length=MAX_SENTENCE_LENGTH
            )
            
            # Move to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Get predictions
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probabilities = torch.softmax(logits, dim=-1)
                
                # Process each result
                for i, valid_idx in enumerate(valid_indices):
                    predicted_class = torch.argmax(probabilities[i]).item()
                    confidence = probabilities[i][predicted_class].item()
                    
                    prediction = 'Claim' if predicted_class == 1 else 'Non-Claim'
                    is_claim = predicted_class == 1
                    raw_scores = probabilities[i].cpu().numpy().tolist()
                    
                    # Update the result at the original index
                    batch_results[valid_idx] = {
                        'text': batch_sentences[valid_idx],
                        'prediction': prediction,
                        'confidence': confidence,
                        'is_claim': is_claim,
                        'raw_scores': raw_scores
                    }
        
        return batch_results
    
    def filter_claims(self, classification_results: List[Dict], min_confidence: Optional[float] = None) -> List[Dict]:
        """
        Filter classification results to return only sentences classified as claims.
        
        Args:
            classification_results: List of classification results from classify methods
            min_confidence: Minimum confidence threshold. If None, uses class default.
            
        Returns:
            List of results where prediction is 'Claim' and confidence >= threshold
        """
        threshold = min_confidence if min_confidence is not None else self.confidence_threshold
        
        claims = [
            result for result in classification_results
            if result['is_claim'] and result['confidence'] >= threshold
        ]
        
        logger.info(f"Filtered {len(claims)} claims from {len(classification_results)} sentences "
                   f"(threshold: {threshold})")
        
        return claims
    
    def get_model_info(self) -> Dict[str, Union[str, int, float]]:
        """
        Get information about the loaded model.
        
        Returns:
            Dictionary with model information
        """
        return {
            'model_path': str(self.model_path),
            'device': str(self.device),
            'confidence_threshold': self.confidence_threshold,
            'max_sentence_length': MAX_SENTENCE_LENGTH,
            'batch_size': BATCH_SIZE,
            'model_type': 'DistilBertForSequenceClassification',
            'vocab_size': self.tokenizer.vocab_size if self.tokenizer else None
        }


def create_classifier(model_path: Optional[Union[str, Path]] = None) -> ClaimClassifier:
    """
    Factory function to create a ClaimClassifier instance.
    
    Args:
        model_path: Optional path to model directory
        
    Returns:
        Initialized ClaimClassifier instance
    """
    return ClaimClassifier(model_path)