"""
Results Formatting and Output Module for ESG Claim Verification System.

This module provides comprehensive formatting and output capabilities for
processing results, including JSON output, summary statistics, and detailed
reasoning for verification decisions.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import csv

logger = logging.getLogger(__name__)


class ResultsFormatter:
    """
    Formats and outputs ESG claim verification results in various formats.
    
    Provides JSON output, CSV export, summary reports, and detailed
    verification reasoning for each claim.
    """
    
    def __init__(self):
        """Initialize the results formatter."""
        pass
    
    def format_processing_results(self, 
                                 pdf_path: str,
                                 company_name: str,
                                 sentences: List[str],
                                 verified_claims: List[Dict],
                                 processing_time: float,
                                 model_info: Dict[str, Any],
                                 processing_status: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format complete processing results with comprehensive statistics and details.
        
        Args:
            pdf_path: Path to the processed PDF file
            company_name: Company name used for verification
            sentences: List of extracted sentences
            verified_claims: List of verified claims with results
            processing_time: Total processing time in seconds
            model_info: Information about the model and configuration
            processing_status: Processing status and progress information
            
        Returns:
            Comprehensive results dictionary
        """
        try:
            # Calculate summary statistics
            summary_stats = self._calculate_summary_statistics(verified_claims)
            
            # Generate detailed reasoning breakdown
            reasoning_breakdown = self._generate_reasoning_breakdown(verified_claims)
            
            # Create confidence analysis
            confidence_analysis = self._analyze_confidence_scores(verified_claims)
            
            # Generate verification insights
            verification_insights = self._generate_verification_insights(verified_claims, company_name)
            
            # Create the main results structure
            results = {
                'document_info': {
                    'filename': Path(pdf_path).name,
                    'company_name': company_name,
                    'total_sentences': len(sentences),
                    'processing_time': processing_time,
                    'processed_at': datetime.now().isoformat(),
                    'file_size_mb': self._get_file_size_mb(pdf_path)
                },
                'claims': self._format_claims_details(verified_claims),
                'summary': summary_stats,
                'reasoning_breakdown': reasoning_breakdown,
                'confidence_analysis': confidence_analysis,
                'verification_insights': verification_insights,
                'processing_status': processing_status,
                'model_info': model_info,
                'metadata': {
                    'version': '1.0',
                    'format_version': '1.0',
                    'generated_by': 'ESG Claim Verification System'
                }
            }
            
            logger.info("Processing results formatted successfully")
            return results
            
        except Exception as e:
            logger.error(f"Error formatting results: {str(e)}")
            raise
    
    def _calculate_summary_statistics(self, verified_claims: List[Dict]) -> Dict[str, Any]:
        """Calculate comprehensive summary statistics"""
        total_claims = len(verified_claims)
        
        if total_claims == 0:
            return {
                'total_claims': 0,
                'verified': 0,
                'questionable': 0,
                'unverified': 0,
                'verification_rate': 0.0,
                'avg_classification_confidence': 0.0,
                'avg_verification_confidence': 0.0,
                'high_confidence_claims': 0,
                'low_confidence_claims': 0
            }
        
        # Count by verification status
        verified_count = sum(1 for c in verified_claims if c['verification_status'] == 'verified')
        questionable_count = sum(1 for c in verified_claims if c['verification_status'] == 'questionable')
        unverified_count = sum(1 for c in verified_claims if c['verification_status'] == 'unverified')
        
        # Calculate confidence statistics
        classification_confidences = [c['confidence'] for c in verified_claims]
        verification_confidences = [c['verification_confidence'] for c in verified_claims]
        
        avg_classification_confidence = sum(classification_confidences) / total_claims
        avg_verification_confidence = sum(verification_confidences) / total_claims
        
        # Count high/low confidence claims
        high_confidence_threshold = 0.8
        low_confidence_threshold = 0.3
        
        high_confidence_claims = sum(1 for c in classification_confidences if c >= high_confidence_threshold)
        low_confidence_claims = sum(1 for c in classification_confidences if c <= low_confidence_threshold)
        
        return {
            'total_claims': total_claims,
            'verified': verified_count,
            'questionable': questionable_count,
            'unverified': unverified_count,
            'verification_rate': verified_count / total_claims,
            'questionable_rate': questionable_count / total_claims,
            'unverified_rate': unverified_count / total_claims,
            'avg_classification_confidence': avg_classification_confidence,
            'avg_verification_confidence': avg_verification_confidence,
            'high_confidence_claims': high_confidence_claims,
            'low_confidence_claims': low_confidence_claims,
            'confidence_distribution': {
                'high': high_confidence_claims,
                'medium': total_claims - high_confidence_claims - low_confidence_claims,
                'low': low_confidence_claims
            }
        }
    
    def _generate_reasoning_breakdown(self, verified_claims: List[Dict]) -> Dict[str, Any]:
        """Generate detailed breakdown of verification reasoning"""
        reasoning_categories = {
            'verified': [],
            'questionable': [],
            'unverified': []
        }
        
        # Common reasoning patterns
        reasoning_patterns = {
            'company_not_found': 0,
            'metric_not_found': 0,
            'no_data_for_year': 0,
            'value_within_tolerance': 0,
            'value_outside_tolerance': 0,
            'no_numerical_value': 0,
            'csv_match_found': 0,
            'extraction_failed': 0
        }
        
        for claim in verified_claims:
            status = claim['verification_status']
            reasoning = claim['match_details']['reasoning']
            
            # Categorize reasoning
            reasoning_categories[status].append({
                'claim_id': claim['id'],
                'reasoning': reasoning,
                'confidence': claim['verification_confidence']
            })
            
            # Count reasoning patterns
            reasoning_lower = reasoning.lower()
            if 'company' in reasoning_lower and 'not found' in reasoning_lower:
                reasoning_patterns['company_not_found'] += 1
            elif 'metric' in reasoning_lower and 'not found' in reasoning_lower:
                reasoning_patterns['metric_not_found'] += 1
            elif 'no data found' in reasoning_lower and 'year' in reasoning_lower:
                reasoning_patterns['no_data_for_year'] += 1
            elif 'verified' in reasoning_lower and 'matches' in reasoning_lower:
                reasoning_patterns['value_within_tolerance'] += 1
            elif 'questionable' in reasoning_lower and 'differs' in reasoning_lower:
                reasoning_patterns['value_outside_tolerance'] += 1
            elif 'no numerical value' in reasoning_lower:
                reasoning_patterns['no_numerical_value'] += 1
            elif claim['match_details']['csv_match']:
                reasoning_patterns['csv_match_found'] += 1
            elif 'extraction failed' in reasoning_lower or 'failed to extract' in reasoning_lower:
                reasoning_patterns['extraction_failed'] += 1
        
        return {
            'by_status': reasoning_categories,
            'common_patterns': reasoning_patterns,
            'pattern_analysis': {
                'data_availability_issues': (
                    reasoning_patterns['company_not_found'] + 
                    reasoning_patterns['metric_not_found'] + 
                    reasoning_patterns['no_data_for_year']
                ),
                'successful_matches': reasoning_patterns['csv_match_found'],
                'value_comparison_issues': (
                    reasoning_patterns['value_outside_tolerance'] + 
                    reasoning_patterns['no_numerical_value']
                ),
                'technical_issues': reasoning_patterns['extraction_failed']
            }
        }
    
    def _analyze_confidence_scores(self, verified_claims: List[Dict]) -> Dict[str, Any]:
        """Analyze confidence score distributions and patterns"""
        if not verified_claims:
            return {'analysis': 'No claims to analyze'}
        
        classification_scores = [c['confidence'] for c in verified_claims]
        verification_scores = [c['verification_confidence'] for c in verified_claims]
        
        # Calculate statistics
        def calculate_stats(scores):
            if not scores:
                return {'min': 0, 'max': 0, 'mean': 0, 'median': 0}
            
            sorted_scores = sorted(scores)
            n = len(sorted_scores)
            
            return {
                'min': min(scores),
                'max': max(scores),
                'mean': sum(scores) / n,
                'median': sorted_scores[n // 2] if n % 2 == 1 else (sorted_scores[n//2-1] + sorted_scores[n//2]) / 2
            }
        
        classification_stats = calculate_stats(classification_scores)
        verification_stats = calculate_stats(verification_scores)
        
        # Analyze correlation between classification and verification confidence
        correlation_analysis = self._analyze_confidence_correlation(verified_claims)
        
        # Distribution analysis
        distribution_analysis = self._analyze_confidence_distribution(classification_scores, verification_scores)
        
        return {
            'classification_confidence': classification_stats,
            'verification_confidence': verification_stats,
            'correlation_analysis': correlation_analysis,
            'distribution_analysis': distribution_analysis,
            'recommendations': self._generate_confidence_recommendations(classification_stats, verification_stats)
        }
    
    def _analyze_confidence_correlation(self, verified_claims: List[Dict]) -> Dict[str, Any]:
        """Analyze correlation between classification and verification confidence"""
        if len(verified_claims) < 2:
            return {'correlation': 'Insufficient data for correlation analysis'}
        
        # Group by verification status and analyze confidence patterns
        status_confidence = {
            'verified': [],
            'questionable': [],
            'unverified': []
        }
        
        for claim in verified_claims:
            status = claim['verification_status']
            status_confidence[status].append({
                'classification': claim['confidence'],
                'verification': claim['verification_confidence']
            })
        
        # Calculate average confidences by status
        status_averages = {}
        for status, claims in status_confidence.items():
            if claims:
                avg_class = sum(c['classification'] for c in claims) / len(claims)
                avg_verif = sum(c['verification'] for c in claims) / len(claims)
                status_averages[status] = {
                    'avg_classification': avg_class,
                    'avg_verification': avg_verif,
                    'count': len(claims)
                }
        
        return {
            'by_status': status_averages,
            'insights': self._generate_correlation_insights(status_averages)
        }
    
    def _analyze_confidence_distribution(self, classification_scores: List[float], verification_scores: List[float]) -> Dict[str, Any]:
        """Analyze the distribution of confidence scores"""
        def create_distribution(scores, bins=5):
            if not scores:
                return {}
            
            min_score, max_score = min(scores), max(scores)
            bin_size = (max_score - min_score) / bins if max_score > min_score else 1
            
            distribution = {}
            for i in range(bins):
                bin_start = min_score + i * bin_size
                bin_end = min_score + (i + 1) * bin_size
                bin_label = f"{bin_start:.2f}-{bin_end:.2f}"
                
                count = sum(1 for score in scores if bin_start <= score < bin_end)
                if i == bins - 1:  # Include max value in last bin
                    count = sum(1 for score in scores if bin_start <= score <= bin_end)
                
                distribution[bin_label] = count
            
            return distribution
        
        return {
            'classification_distribution': create_distribution(classification_scores),
            'verification_distribution': create_distribution(verification_scores)
        }
    
    def _generate_confidence_recommendations(self, class_stats: Dict, verif_stats: Dict) -> List[str]:
        """Generate recommendations based on confidence analysis"""
        recommendations = []
        
        if class_stats['mean'] < 0.7:
            recommendations.append("Consider reviewing classification threshold - average classification confidence is low")
        
        if verif_stats['mean'] < 0.5:
            recommendations.append("Many claims have low verification confidence - review ESG data coverage")
        
        if class_stats['min'] < 0.3:
            recommendations.append("Some claims have very low classification confidence - consider filtering")
        
        if verif_stats['max'] - verif_stats['min'] > 0.8:
            recommendations.append("High variance in verification confidence - review verification criteria")
        
        if not recommendations:
            recommendations.append("Confidence scores look good - no specific recommendations")
        
        return recommendations
    
    def _generate_correlation_insights(self, status_averages: Dict) -> List[str]:
        """Generate insights from confidence correlation analysis"""
        insights = []
        
        if 'verified' in status_averages and 'unverified' in status_averages:
            verified_class = status_averages['verified']['avg_classification']
            unverified_class = status_averages['unverified']['avg_classification']
            
            if verified_class > unverified_class + 0.1:
                insights.append("Verified claims tend to have higher classification confidence")
            elif unverified_class > verified_class + 0.1:
                insights.append("Unverified claims have higher classification confidence - review verification logic")
        
        if 'questionable' in status_averages:
            questionable_verif = status_averages['questionable']['avg_verification']
            if questionable_verif < 0.4:
                insights.append("Questionable claims have appropriately low verification confidence")
        
        return insights
    
    def _generate_verification_insights(self, verified_claims: List[Dict], company_name: str) -> Dict[str, Any]:
        """Generate insights about the verification process and results"""
        if not verified_claims:
            return {'insights': ['No claims to analyze']}
        
        insights = []
        metrics_found = set()
        years_found = set()
        
        # Analyze extracted data patterns
        for claim in verified_claims:
            extracted = claim['extracted_data']
            if extracted['metric']:
                metrics_found.add(extracted['metric'])
            if extracted['year']:
                years_found.add(extracted['year'])
        
        # Generate insights
        if len(metrics_found) > 3:
            insights.append(f"Good metric diversity detected: {len(metrics_found)} different metric types")
        elif len(metrics_found) == 0:
            insights.append("No metrics could be extracted from claims - review extraction patterns")
        
        if years_found:
            year_range = max(years_found) - min(years_found) if len(years_found) > 1 else 0
            if year_range > 2:
                insights.append(f"Claims span {year_range + 1} years ({min(years_found)}-{max(years_found)})")
            else:
                insights.append(f"Claims primarily from year(s): {sorted(years_found)}")
        
        # Analyze verification success patterns
        csv_matches = sum(1 for c in verified_claims if c['match_details']['csv_match'])
        if csv_matches > 0:
            match_rate = csv_matches / len(verified_claims)
            if match_rate > 0.7:
                insights.append(f"High CSV match rate ({match_rate:.1%}) - good data coverage for {company_name}")
            elif match_rate < 0.3:
                insights.append(f"Low CSV match rate ({match_rate:.1%}) - limited data for {company_name}")
        
        return {
            'insights': insights,
            'metrics_detected': sorted(list(metrics_found)),
            'years_detected': sorted(list(years_found)),
            'data_coverage': {
                'csv_match_rate': csv_matches / len(verified_claims) if verified_claims else 0,
                'metric_extraction_rate': len([c for c in verified_claims if c['extracted_data']['metric']]) / len(verified_claims),
                'value_extraction_rate': len([c for c in verified_claims if c['extracted_data']['value'] or c['extracted_data']['percentage']]) / len(verified_claims)
            }
        }
    
    def _format_claims_details(self, verified_claims: List[Dict]) -> List[Dict]:
        """Format claims with enhanced details and readability"""
        formatted_claims = []
        
        for claim in verified_claims:
            # Create a more readable format
            formatted_claim = {
                'id': claim['id'],
                'text': claim['text'],
                'classification': {
                    'confidence': claim['confidence'],
                    'confidence_level': self._get_confidence_level(claim['confidence'])
                },
                'extracted_data': claim['extracted_data'],
                'verification': {
                    'status': claim['verification_status'],
                    'confidence': claim['verification_confidence'],
                    'confidence_level': self._get_confidence_level(claim['verification_confidence']),
                    'csv_match': claim['match_details']['csv_match'],
                    'tolerance_check': claim['match_details']['tolerance_check'],
                    'reasoning': claim['match_details']['reasoning'],
                    'matched_data': claim['match_details']['matched_data']
                },
                'summary': self._create_claim_summary(claim)
            }
            
            formatted_claims.append(formatted_claim)
        
        return formatted_claims
    
    def _get_confidence_level(self, confidence: float) -> str:
        """Convert confidence score to human-readable level"""
        if confidence >= 0.8:
            return "High"
        elif confidence >= 0.6:
            return "Medium"
        elif confidence >= 0.4:
            return "Low"
        else:
            return "Very Low"
    
    def _create_claim_summary(self, claim: Dict) -> str:
        """Create a human-readable summary of the claim verification"""
        status = claim['verification_status']
        confidence = claim['confidence']
        extracted = claim['extracted_data']
        
        # Build summary components
        parts = []
        
        # Classification part
        parts.append(f"Detected as claim with {confidence:.1%} confidence")
        
        # Extraction part
        if extracted['metric']:
            parts.append(f"extracted {extracted['metric']}")
            if extracted['value']:
                parts.append(f"value {extracted['value']}")
            if extracted['percentage']:
                parts.append(f"percentage {extracted['percentage']}%")
            if extracted['year']:
                parts.append(f"for year {extracted['year']}")
        
        # Verification part
        if status == 'verified':
            parts.append("and verified against ESG data")
        elif status == 'questionable':
            parts.append("but verification is questionable")
        else:
            parts.append("but could not be verified")
        
        return "; ".join(parts)
    
    def _get_file_size_mb(self, file_path: str) -> float:
        """Get file size in MB"""
        try:
            size_bytes = Path(file_path).stat().st_size
            return round(size_bytes / (1024 * 1024), 2)
        except:
            return 0.0
    
    def save_results_json(self, results: Dict[str, Any], output_path: str):
        """Save results to JSON file with proper formatting"""
        try:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False, default=str)
            
            logger.info(f"Results saved to JSON: {output_path}")
            
        except Exception as e:
            logger.error(f"Failed to save JSON results: {str(e)}")
            raise
    
    def save_results_csv(self, results: Dict[str, Any], output_path: str):
        """Save claims results to CSV file"""
        try:
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            claims = results.get('claims', [])
            if not claims:
                logger.warning("No claims to save to CSV")
                return
            
            # Define CSV headers
            headers = [
                'claim_id', 'claim_text', 'classification_confidence', 'classification_level',
                'extracted_metric', 'extracted_value', 'extracted_unit', 'extracted_year', 'extracted_percentage',
                'verification_status', 'verification_confidence', 'verification_level',
                'csv_match', 'tolerance_check', 'reasoning', 'claim_summary'
            ]
            
            with open(output_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(headers)
                
                for claim in claims:
                    row = [
                        claim['id'],
                        claim['text'],
                        claim['classification']['confidence'],
                        claim['classification']['confidence_level'],
                        claim['extracted_data']['metric'] or '',
                        claim['extracted_data']['value'] or '',
                        claim['extracted_data']['unit'] or '',
                        claim['extracted_data']['year'] or '',
                        claim['extracted_data']['percentage'] or '',
                        claim['verification']['status'],
                        claim['verification']['confidence'],
                        claim['verification']['confidence_level'],
                        claim['verification']['csv_match'],
                        claim['verification']['tolerance_check'],
                        claim['verification']['reasoning'],
                        claim['summary']
                    ]
                    writer.writerow(row)
            
            logger.info(f"Results saved to CSV: {output_path}")
            
        except Exception as e:
            logger.error(f"Failed to save CSV results: {str(e)}")
            raise
    
    def generate_summary_report(self, results: Dict[str, Any]) -> str:
        """Generate a human-readable summary report"""
        try:
            doc_info = results['document_info']
            summary = results['summary']
            insights = results.get('verification_insights', {})
            
            report_lines = [
                "ESG CLAIM VERIFICATION REPORT",
                "=" * 50,
                "",
                f"Document: {doc_info['filename']}",
                f"Company: {doc_info['company_name']}",
                f"Processed: {doc_info['processed_at'][:19]}",
                f"Processing Time: {doc_info['processing_time']:.2f} seconds",
                "",
                "SUMMARY STATISTICS",
                "-" * 20,
                f"Total Sentences Analyzed: {doc_info['total_sentences']}",
                f"Claims Detected: {summary['total_claims']}",
                f"  • Verified: {summary['verified']} ({summary['verified']/summary['total_claims']*100:.1f}%)" if summary['total_claims'] > 0 else "  • Verified: 0",
                f"  • Questionable: {summary['questionable']} ({summary['questionable']/summary['total_claims']*100:.1f}%)" if summary['total_claims'] > 0 else "  • Questionable: 0",
                f"  • Unverified: {summary['unverified']} ({summary['unverified']/summary['total_claims']*100:.1f}%)" if summary['total_claims'] > 0 else "  • Unverified: 0",
                "",
                f"Average Classification Confidence: {summary['avg_classification_confidence']:.1%}",
                f"Average Verification Confidence: {summary['avg_verification_confidence']:.1%}",
                ""
            ]
            
            # Add insights if available
            if insights.get('insights'):
                report_lines.extend([
                    "KEY INSIGHTS",
                    "-" * 15
                ])
                for insight in insights['insights']:
                    report_lines.append(f"• {insight}")
                report_lines.append("")
            
            # Add metrics and years detected
            if insights.get('metrics_detected'):
                report_lines.extend([
                    f"Metrics Detected: {', '.join(insights['metrics_detected'])}",
                    f"Years Detected: {', '.join(map(str, insights.get('years_detected', [])))}"
                ])
            
            return "\n".join(report_lines)
            
        except Exception as e:
            logger.error(f"Failed to generate summary report: {str(e)}")
            return f"Error generating report: {str(e)}"


# Convenience functions
def format_and_save_results(pdf_path: str,
                           company_name: str,
                           sentences: List[str],
                           verified_claims: List[Dict],
                           processing_time: float,
                           model_info: Dict[str, Any],
                           processing_status: Dict[str, Any],
                           output_dir: str,
                           save_csv: bool = True,
                           save_summary: bool = True) -> Dict[str, Any]:
    """
    Format results and save to multiple output formats.
    
    Args:
        pdf_path: Path to processed PDF
        company_name: Company name
        sentences: Extracted sentences
        verified_claims: Verified claims results
        processing_time: Processing duration
        model_info: Model information
        processing_status: Processing status
        output_dir: Output directory for files
        save_csv: Whether to save CSV format
        save_summary: Whether to save text summary
        
    Returns:
        Formatted results dictionary
    """
    formatter = ResultsFormatter()
    
    # Format results
    results = formatter.format_processing_results(
        pdf_path, company_name, sentences, verified_claims,
        processing_time, model_info, processing_status
    )
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Generate base filename
    base_name = f"{company_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Save JSON
    json_path = output_path / f"{base_name}_results.json"
    formatter.save_results_json(results, str(json_path))
    
    # Save CSV if requested
    if save_csv:
        csv_path = output_path / f"{base_name}_claims.csv"
        formatter.save_results_csv(results, str(csv_path))
    
    # Save summary report if requested
    if save_summary:
        summary_path = output_path / f"{base_name}_summary.txt"
        summary_report = formatter.generate_summary_report(results)
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(summary_report)
        logger.info(f"Summary report saved: {summary_path}")
    
    return results