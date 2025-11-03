"""
Hugging Face API-based Claim Classification Module for ESG Claim Verification System.

This module uses Hugging Face Inference API to classify sentences
as containing environmental claims or not, replacing the local model approach.
"""

import logging
import requests
import os
from typing import List, Dict, Union, Optional
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from .exceptions import ModelLoadError, ESGProcessingError
except ImportError:
    from exceptions import ModelLoadError, ESGProcessingError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HuggingFaceClaimClassifier:
    """
    Hugging Face API-based classifier for ESG claims.
    
    This class handles API calls to your deployed model on Hugging Face
    for both single sentences and batch processing.
    """
    
    def __init__(self, model_name: str = None, api_token: str = None):
        """
        Initialize the Hugging Face claim classifier.
        
        Args:
            model_name: Your Hugging Face model name (e.g., "username/model-name")
            api_token: Hugging Face API token
            
        Raises:
            ModelLoadError: If configuration is invalid
        """
        self.model_name = model_name or os.getenv('HF_MODEL_NAME')
        self.api_token = api_token or os.getenv('HF_API_TOKEN')
        self.confidence_threshold = 0.7
        
        if not self.model_name:
            raise ModelLoadError("Hugging Face model name not provided. Set HF_MODEL_NAME environment variable.")
        
        if not self.api_token:
            raise ModelLoadError("Hugging Face API token not provided. Set HF_API_TOKEN environment variable.")
        
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_name}"
        self.headers = {"Authorization": f"Bearer {self.api_token}"}
        
        logger.info(f"Initialized HuggingFace classifier for model: {self.model_name}")
        
        # Test the API connection
        self._test_connection()
    
    def _test_connection(self):
        """Test the API connection with a simple request."""
        try:
            response = self._make_api_request("Test connection", max_retries=1)
            logger.info("Successfully connected to Hugging Face API")
        except Exception as e:
            logger.warning(f"API connection test failed: {e}")
            logger.info("API might need warm-up time. Will retry on actual requests.")
    
    def _make_api_request(self, text: str, max_retries: int = 3) -> Dict:
        """
        Make a request to the Hugging Face API with retry logic.
        
        Args:
            text: Input text to classify
            max_retries: Maximum number of retry attempts
            
        Returns:
            API response as dictionary
            
        Raises:
            ESGProcessingError: If API request fails after retries
        """
        payload = {"inputs": text}
        
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=30
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 503:
                    # Model is loading, wait and retry
                    wait_time = min(20 * (attempt + 1), 60)  # Progressive backoff
                    logger.info(f"Model loading, waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue
                else:
                    response.raise_for_status()
                    
            except requests.exceptions.Timeout:
                logger.warning(f"API request timeout (attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    time.sleep(5)
                    continue
                raise ESGProcessingError("API request timed out after multiple attempts")
                
            except requests.exceptions.RequestException as e:
                logger.error(f"API request failed (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(5)
                    continue
                raise ESGProcessingError(f"API request failed: {e}")
        
        raise ESGProcessingError("API request failed after all retry attempts")
    
    def _parse_api_response(self, response: Union[List, Dict], original_text: str) -> Dict[str, Union[str, float, bool]]:
        """
        Parse the API response into our standard format.
        
        Args:
            response: Raw API response
            original_text: Original input text
            
        Returns:
            Standardized classification result
        """
        try:
            # Handle different response formats
            if isinstance(response, list) and len(response) > 0:
                # Standard classification response
                results = response[0] if isinstance(response[0], list) else response
                
                # Find claim and non-claim scores
                claim_score = 0.0
                non_claim_score = 0.0
                
                for item in results:
                    label = item.get('label', '').upper()
                    score = item.get('score', 0.0)
                    
                    if 'CLAIM' in label or label == 'LABEL_1':
                        claim_score = score
                    elif 'NON' in label or label == 'LABEL_0':
                        non_claim_score = score
                
                # Determine prediction
                is_claim = claim_score > non_claim_score
                confidence = claim_score if is_claim else non_claim_score
                prediction = 'Claim' if is_claim else 'Non-Claim'
                
                return {
                    'text': original_text,
                    'prediction': prediction,
                    'confidence': confidence,
                    'is_claim': is_claim,
                    'raw_scores': [non_claim_score, claim_score]
                }
                
            else:
                # Fallback for unexpected response format
                logger.warning(f"Unexpected API response format: {response}")
                return {
                    'text': original_text,
                    'prediction': 'Non-Claim',
                    'confidence': 0.0,
                    'is_claim': False,
                    'raw_scores': [1.0, 0.0]
                }
                
        except Exception as e:
            logger.error(f"Error parsing API response: {e}")
            return {
                'text': original_text,
                'prediction': 'Non-Claim',
                'confidence': 0.0,
                'is_claim': False,
                'raw_scores': [1.0, 0.0]
            }
    
    def classify_sentence(self, sentence: str) -> Dict[str, Union[str, float, bool]]:
        """
        Classify a single sentence as claim or non-claim using Hugging Face API.
        
        Args:
            sentence: Input sentence to classify
            
        Returns:
            Dictionary containing classification results
        """
        if not sentence or not sentence.strip():
            return {
                'text': sentence,
                'prediction': 'Non-Claim',
                'confidence': 0.0,
                'is_claim': False,
                'raw_scores': [1.0, 0.0]
            }
        
        try:
            # Clean the sentence
            cleaned_sentence = sentence.strip()
            
            # Make API request
            response = self._make_api_request(cleaned_sentence)
            
            # Parse and return result
            return self._parse_api_response(response, sentence)
            
        except Exception as e:
            logger.error(f"Error classifying sentence: {str(e)}")
            # Return safe default instead of raising exception
            return {
                'text': sentence,
                'prediction': 'Non-Claim',
                'confidence': 0.0,
                'is_claim': False,
                'raw_scores': [1.0, 0.0],
                'error': str(e)
            }
    
    def batch_classify(self, sentences: List[str], progress_callback=None, max_workers: int = 5) -> List[Dict[str, Union[str, float, bool]]]:
        """
        Classify multiple sentences using concurrent API requests.
        
        Args:
            sentences: List of sentences to classify
            progress_callback: Optional callback for progress updates
            max_workers: Maximum number of concurrent API requests
            
        Returns:
            List of classification results
        """
        if not sentences:
            return []
        
        results = [None] * len(sentences)
        total_sentences = len(sentences)
        completed = 0
        
        logger.info(f"Starting batch classification of {total_sentences} sentences with {max_workers} workers")
        
        try:
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all tasks
                future_to_index = {
                    executor.submit(self.classify_sentence, sentence): idx
                    for idx, sentence in enumerate(sentences)
                }
                
                # Process completed tasks
                for future in as_completed(future_to_index):
                    idx = future_to_index[future]
                    try:
                        result = future.result()
                        results[idx] = result
                        completed += 1
                        
                        # Progress callback
                        if progress_callback:
                            progress = completed / total_sentences
                            progress_callback(progress)
                        
                        # Log progress periodically
                        if completed % 10 == 0 or completed == total_sentences:
                            logger.info(f"Processed {completed}/{total_sentences} sentences")
                            
                    except Exception as e:
                        logger.error(f"Error processing sentence {idx}: {e}")
                        # Provide safe default
                        results[idx] = {
                            'text': sentences[idx],
                            'prediction': 'Non-Claim',
                            'confidence': 0.0,
                            'is_claim': False,
                            'raw_scores': [1.0, 0.0],
                            'error': str(e)
                        }
                        completed += 1
            
            logger.info(f"Batch classification completed. {len(results)} results generated.")
            return results
            
        except Exception as e:
            logger.error(f"Error in batch classification: {str(e)}")
            # Return safe defaults for all sentences
            return [
                {
                    'text': sentence,
                    'prediction': 'Non-Claim',
                    'confidence': 0.0,
                    'is_claim': False,
                    'raw_scores': [1.0, 0.0],
                    'error': str(e)
                }
                for sentence in sentences
            ]
    
    def filter_claims(self, classification_results: List[Dict], min_confidence: Optional[float] = None) -> List[Dict]:
        """
        Filter classification results to return only sentences classified as claims.
        
        Args:
            classification_results: List of classification results
            min_confidence: Minimum confidence threshold
            
        Returns:
            List of results classified as claims above threshold
        """
        threshold = min_confidence if min_confidence is not None else self.confidence_threshold
        
        claims = [
            result for result in classification_results
            if result['is_claim'] and result['confidence'] >= threshold
        ]
        
        logger.info(f"Filtered {len(claims)} claims from {len(classification_results)} sentences "
                   f"(threshold: {threshold})")
        
        return claims
    
    def get_model_info(self) -> Dict[str, Union[str, float]]:
        """
        Get information about the model configuration.
        
        Returns:
            Dictionary with model information
        """
        return {
            'model_name': self.model_name,
            'api_url': self.api_url,
            'confidence_threshold': self.confidence_threshold,
            'model_type': 'HuggingFace API',
            'api_provider': 'Hugging Face Inference API'
        }


def create_hf_classifier(model_name: str = None, api_token: str = None) -> HuggingFaceClaimClassifier:
    """
    Factory function to create a HuggingFaceClaimClassifier instance.
    
    Args:
        model_name: Hugging Face model name
        api_token: Hugging Face API token
        
    Returns:
        Initialized HuggingFaceClaimClassifier instance
    """
    return HuggingFaceClaimClassifier(model_name, api_token)