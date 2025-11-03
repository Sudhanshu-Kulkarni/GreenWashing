"""
Advanced Batch Processing Module for ESG Claim Classification.

This module provides enhanced batch processing capabilities with memory management,
progress tracking, and efficient handling of large documents.
"""

import logging
import gc
import psutil
import time
from typing import List, Dict, Callable, Optional, Union, Iterator
from dataclasses import dataclass
from pathlib import Path
import json

from .claim_classifier import ClaimClassifier
from .exceptions import ESGProcessingError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ProcessingStats:
    """Statistics for batch processing operations."""
    total_sentences: int = 0
    processed_sentences: int = 0
    claims_detected: int = 0
    processing_time: float = 0.0
    memory_usage_mb: float = 0.0
    batch_count: int = 0
    average_confidence: float = 0.0


class ProgressTracker:
    """Progress tracking utility for long-running batch operations."""
    
    def __init__(self, total_items: int, update_interval: int = 100):
        """
        Initialize progress tracker.
        
        Args:
            total_items: Total number of items to process
            update_interval: How often to log progress updates
        """
        self.total_items = total_items
        self.processed_items = 0
        self.start_time = time.time()
        self.update_interval = update_interval
        self.last_update = 0
    
    def update(self, processed_count: int = 1):
        """Update progress counter."""
        self.processed_items += processed_count
        
        # Log progress at intervals
        if (self.processed_items - self.last_update) >= self.update_interval:
            self._log_progress()
            self.last_update = self.processed_items
    
    def _log_progress(self):
        """Log current progress."""
        elapsed = time.time() - self.start_time
        progress_pct = (self.processed_items / self.total_items) * 100
        
        if self.processed_items > 0:
            rate = self.processed_items / elapsed
            eta = (self.total_items - self.processed_items) / rate if rate > 0 else 0
            
            logger.info(
                f"Progress: {self.processed_items}/{self.total_items} "
                f"({progress_pct:.1f}%) - Rate: {rate:.1f} items/sec - ETA: {eta:.1f}s"
            )
    
    def get_progress(self) -> Dict[str, Union[int, float]]:
        """Get current progress information."""
        elapsed = time.time() - self.start_time
        progress_pct = (self.processed_items / self.total_items) * 100
        rate = self.processed_items / elapsed if elapsed > 0 else 0
        
        return {
            'processed': self.processed_items,
            'total': self.total_items,
            'percentage': progress_pct,
            'elapsed_time': elapsed,
            'processing_rate': rate
        }


class MemoryManager:
    """Memory management utilities for batch processing."""
    
    def __init__(self, max_memory_mb: int = 2048):
        """
        Initialize memory manager.
        
        Args:
            max_memory_mb: Maximum memory usage in MB before triggering cleanup
        """
        self.max_memory_mb = max_memory_mb
        self.initial_memory = self._get_memory_usage()
    
    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB."""
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024
    
    def check_memory(self) -> bool:
        """
        Check if memory usage is within limits.
        
        Returns:
            True if memory usage is acceptable, False if cleanup needed
        """
        current_memory = self._get_memory_usage()
        return current_memory < self.max_memory_mb
    
    def cleanup(self):
        """Force garbage collection and memory cleanup."""
        gc.collect()
        logger.info(f"Memory cleanup performed. Current usage: {self._get_memory_usage():.1f} MB")
    
    def get_memory_stats(self) -> Dict[str, float]:
        """Get memory usage statistics."""
        current = self._get_memory_usage()
        return {
            'current_mb': current,
            'initial_mb': self.initial_memory,
            'increase_mb': current - self.initial_memory,
            'max_allowed_mb': self.max_memory_mb
        }


class BatchProcessor:
    """
    Advanced batch processor for claim classification with memory management
    and progress tracking.
    """
    
    def __init__(
        self,
        classifier: ClaimClassifier,
        batch_size: Optional[int] = None,
        max_memory_mb: int = 2048,
        progress_callback: Optional[Callable[[Dict], None]] = None
    ):
        """
        Initialize batch processor.
        
        Args:
            classifier: ClaimClassifier instance
            batch_size: Batch size for processing. If None, uses classifier default
            max_memory_mb: Maximum memory usage before cleanup
            progress_callback: Optional callback for progress updates
        """
        self.classifier = classifier
        self.batch_size = batch_size or 16
        self.memory_manager = MemoryManager(max_memory_mb)
        self.progress_callback = progress_callback
        
        logger.info(f"BatchProcessor initialized with batch_size={self.batch_size}")
    
    def process_sentences(
        self,
        sentences: List[str],
        save_intermediate: bool = False,
        intermediate_path: Optional[Path] = None
    ) -> Dict[str, Union[List[Dict], ProcessingStats]]:
        """
        Process a list of sentences with advanced batch processing.
        
        Args:
            sentences: List of sentences to classify
            save_intermediate: Whether to save intermediate results
            intermediate_path: Path to save intermediate results
            
        Returns:
            Dictionary containing results and processing statistics
        """
        if not sentences:
            return {'results': [], 'stats': ProcessingStats()}
        
        # Initialize tracking
        total_sentences = len(sentences)
        progress_tracker = ProgressTracker(total_sentences)
        stats = ProcessingStats(total_sentences=total_sentences)
        
        results = []
        start_time = time.time()
        
        logger.info(f"Starting batch processing of {total_sentences} sentences")
        
        try:
            # Process in batches
            for batch_start in range(0, total_sentences, self.batch_size):
                batch_end = min(batch_start + self.batch_size, total_sentences)
                batch_sentences = sentences[batch_start:batch_end]
                
                # Process current batch
                batch_results = self._process_single_batch(
                    batch_sentences, 
                    batch_start, 
                    stats
                )
                results.extend(batch_results)
                
                # Update progress
                progress_tracker.update(len(batch_sentences))
                
                # Memory management
                if not self.memory_manager.check_memory():
                    logger.warning("Memory usage high, performing cleanup")
                    self.memory_manager.cleanup()
                
                # Save intermediate results if requested
                if save_intermediate and intermediate_path:
                    self._save_intermediate_results(
                        results, 
                        intermediate_path, 
                        batch_start + len(batch_sentences)
                    )
                
                # Progress callback
                if self.progress_callback:
                    progress_info = progress_tracker.get_progress()
                    progress_info['memory'] = self.memory_manager.get_memory_stats()
                    self.progress_callback(progress_info)
            
            # Finalize statistics
            stats.processing_time = time.time() - start_time
            stats.processed_sentences = len(results)
            stats.claims_detected = sum(1 for r in results if r['is_claim'])
            stats.memory_usage_mb = self.memory_manager.get_memory_stats()['current_mb']
            
            if results:
                stats.average_confidence = sum(r['confidence'] for r in results) / len(results)
            
            logger.info(f"Batch processing completed in {stats.processing_time:.2f}s")
            logger.info(f"Claims detected: {stats.claims_detected}/{stats.total_sentences}")
            
            return {
                'results': results,
                'stats': stats
            }
            
        except Exception as e:
            logger.error(f"Error in batch processing: {str(e)}")
            raise ESGProcessingError(f"Batch processing failed: {str(e)}")
    
    def _process_single_batch(
        self, 
        batch_sentences: List[str], 
        batch_start: int, 
        stats: ProcessingStats
    ) -> List[Dict]:
        """
        Process a single batch of sentences.
        
        Args:
            batch_sentences: Sentences in current batch
            batch_start: Starting index of batch
            stats: Processing statistics to update
            
        Returns:
            List of classification results
        """
        try:
            batch_results = self.classifier._process_batch(batch_sentences)
            stats.batch_count += 1
            
            logger.debug(f"Processed batch {stats.batch_count} "
                        f"(sentences {batch_start}-{batch_start + len(batch_sentences)})")
            
            return batch_results
            
        except Exception as e:
            logger.error(f"Error processing batch starting at {batch_start}: {str(e)}")
            # Return default results for failed batch
            return [
                {
                    'text': sentence,
                    'prediction': 'Non-Claim',
                    'confidence': 0.0,
                    'is_claim': False,
                    'raw_scores': [1.0, 0.0],
                    'error': str(e)
                }
                for sentence in batch_sentences
            ]
    
    def _save_intermediate_results(
        self, 
        results: List[Dict], 
        path: Path, 
        processed_count: int
    ):
        """Save intermediate processing results."""
        try:
            intermediate_data = {
                'processed_count': processed_count,
                'total_results': len(results),
                'timestamp': time.time(),
                'results': results
            }
            
            with open(path, 'w') as f:
                json.dump(intermediate_data, f, indent=2)
                
            logger.debug(f"Saved intermediate results to {path}")
            
        except Exception as e:
            logger.warning(f"Failed to save intermediate results: {str(e)}")
    
    def process_large_document(
        self,
        sentences: List[str],
        chunk_size: int = 1000,
        save_progress: bool = True,
        progress_dir: Optional[Path] = None
    ) -> Dict[str, Union[List[Dict], ProcessingStats]]:
        """
        Process very large documents by breaking them into chunks.
        
        Args:
            sentences: List of sentences to process
            chunk_size: Number of sentences per chunk
            save_progress: Whether to save progress between chunks
            progress_dir: Directory to save progress files
            
        Returns:
            Combined results from all chunks
        """
        if len(sentences) <= chunk_size:
            return self.process_sentences(sentences)
        
        logger.info(f"Processing large document with {len(sentences)} sentences in chunks of {chunk_size}")
        
        all_results = []
        combined_stats = ProcessingStats(total_sentences=len(sentences))
        
        # Process in chunks
        for chunk_idx, chunk_start in enumerate(range(0, len(sentences), chunk_size)):
            chunk_end = min(chunk_start + chunk_size, len(sentences))
            chunk_sentences = sentences[chunk_start:chunk_end]
            
            logger.info(f"Processing chunk {chunk_idx + 1} "
                       f"(sentences {chunk_start}-{chunk_end})")
            
            # Process chunk
            chunk_result = self.process_sentences(
                chunk_sentences,
                save_intermediate=save_progress,
                intermediate_path=progress_dir / f"chunk_{chunk_idx}.json" if progress_dir else None
            )
            
            # Combine results
            all_results.extend(chunk_result['results'])
            chunk_stats = chunk_result['stats']
            
            # Update combined stats
            combined_stats.processed_sentences += chunk_stats.processed_sentences
            combined_stats.claims_detected += chunk_stats.claims_detected
            combined_stats.processing_time += chunk_stats.processing_time
            combined_stats.batch_count += chunk_stats.batch_count
            
            # Memory cleanup between chunks
            self.memory_manager.cleanup()
        
        # Calculate final averages
        if all_results:
            combined_stats.average_confidence = sum(r['confidence'] for r in all_results) / len(all_results)
        
        combined_stats.memory_usage_mb = self.memory_manager.get_memory_stats()['current_mb']
        
        logger.info(f"Large document processing completed. "
                   f"Total claims: {combined_stats.claims_detected}/{combined_stats.total_sentences}")
        
        return {
            'results': all_results,
            'stats': combined_stats
        }


def create_batch_processor(
    classifier: ClaimClassifier,
    batch_size: Optional[int] = None,
    max_memory_mb: int = 2048,
    progress_callback: Optional[Callable[[Dict], None]] = None
) -> BatchProcessor:
    """
    Factory function to create a BatchProcessor instance.
    
    Args:
        classifier: ClaimClassifier instance
        batch_size: Batch size for processing
        max_memory_mb: Maximum memory usage
        progress_callback: Progress callback function
        
    Returns:
        Initialized BatchProcessor instance
    """
    return BatchProcessor(classifier, batch_size, max_memory_mb, progress_callback)