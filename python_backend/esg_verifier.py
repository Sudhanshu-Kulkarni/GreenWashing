"""
ESG Verification Engine with Gemini AI Integration

This module provides functionality to verify ESG claims using Google's Gemini AI
instead of rule-based logic. It loads ESG lookup data and uses Gemini to perform
intelligent claim verification with reasoning.
"""

import pandas as pd
import logging
import json
import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ExtractedClaimData:
    """Data structure for extracted claim information"""
    metric: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    year: Optional[int] = None
    percentage: Optional[float] = None
    raw_text: str = ""


@dataclass
class VerificationResult:
    """Result of claim verification"""
    status: str  # verified, questionable, unverified
    confidence: float
    reasoning: str
    csv_match: bool
    tolerance_check: bool
    matched_data: Optional[Dict] = None


class ESGVerifier:
    """
    ESG Verification Engine using Gemini AI for intelligent claim verification
    """
    
    def __init__(self, csv_path: str):
        """
        Initialize the ESG verifier with CSV data and Gemini AI
        
        Args:
            csv_path: Path to the ESG lookup CSV file
        """
        self.csv_path = csv_path
        self.data = None
        
        # Initialize Gemini AI
        self._setup_gemini()
        
        # Load ESG data
        self._load_data()
    
    def _setup_gemini(self):
        """Setup Gemini AI client"""
        try:
            # Get API key from environment variable
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                logger.warning("GEMINI_API_KEY not found in environment variables")
                logger.info("Please set GEMINI_API_KEY environment variable")
                self.gemini_model = None
                return
            
            # Configure Gemini
            genai.configure(api_key=api_key)
            
            # Initialize the model
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
            
            logger.info("Gemini AI initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini AI: {str(e)}")
            self.gemini_model = None
    
    def _load_data(self):
        """Load CSV data"""
        try:
            logger.info(f"Loading ESG data from {self.csv_path}")
            self.data = pd.read_csv(self.csv_path)
            
            # Validate CSV schema
            required_columns = ['company', 'year', 'metric', 'value', 'unit', 'source']
            if not all(col in self.data.columns for col in required_columns):
                raise ValueError(f"CSV missing required columns. Expected: {required_columns}")
            
            # Clean and prepare data
            self.data['company'] = self.data['company'].str.strip()
            self.data['metric'] = self.data['metric'].str.strip()
            self.data['unit'] = self.data['unit'].fillna('')
            
            # Ensure value column is numeric
            self.data['value'] = pd.to_numeric(self.data['value'], errors='coerce')
            self.data['year'] = pd.to_numeric(self.data['year'], errors='coerce')
            
            logger.info(f"Loaded {len(self.data)} ESG records")
            
        except Exception as e:
            logger.error(f"Error loading ESG data: {str(e)}")
            raise
    
    def get_data_summary(self) -> Dict[str, Any]:
        """Get summary statistics of the loaded data"""
        if self.data is None:
            return {}
        
        return {
            'total_records': len(self.data),
            'companies': len(self.company_names),
            'metrics': len(self.metric_names),
            'years': sorted(self.data['year'].unique().tolist()),
            'company_list': sorted(self.company_names),
            'metric_list': sorted(self.metric_names)
        }
    
    def validate_csv_schema(self) -> bool:
        """Validate that the CSV has the expected schema"""
        if self.data is None:
            return False
        
        required_columns = ['company', 'year', 'metric', 'value', 'unit', 'source']
        missing_columns = [col for col in required_columns if col not in self.data.columns]
        
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return False
        
        # Check for reasonable data types
        try:
            pd.to_numeric(self.data['year'], errors='raise')
            pd.to_numeric(self.data['value'], errors='coerce')
        except Exception as e:
            logger.error(f"Invalid data types in CSV: {str(e)}")
            return False
        
        return True
    
    def extract_claim_data(self, claim_text: str) -> ExtractedClaimData:
        """
        Extract structured data from claim text using Gemini AI
        
        Args:
            claim_text: Raw claim text to extract data from
            
        Returns:
            ExtractedClaimData object with extracted information
        """
        if not self.gemini_model:
            logger.warning("Gemini AI not available, using basic extraction")
            return self._basic_extract_claim_data(claim_text)
        
        try:
            prompt = f"""
            Extract structured data from this environmental/ESG claim:
            "{claim_text}"
            
            Return a JSON object with these fields:
            - metric: type of environmental metric (e.g., "emissions", "renewable_energy_percent", "scope_1_emissions")
            - value: numerical value if present
            - unit: unit of measurement if present
            - year: year mentioned if present
            - percentage: percentage value if present
            
            Example output:
            {{"metric": "emissions", "value": 1800000, "unit": "tons", "year": 2024, "percentage": null}}
            
            Only return the JSON object, no other text.
            """
            
            response = self.gemini_model.generate_content(prompt)
            
            # Parse the JSON response
            try:
                extracted_data = json.loads(response.text.strip())
                
                return ExtractedClaimData(
                    metric=extracted_data.get('metric'),
                    value=extracted_data.get('value'),
                    unit=extracted_data.get('unit'),
                    year=extracted_data.get('year'),
                    percentage=extracted_data.get('percentage'),
                    raw_text=claim_text
                )
                
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse Gemini response as JSON: {response.text}")
                return self._basic_extract_claim_data(claim_text)
                
        except Exception as e:
            logger.error(f"Error using Gemini for claim extraction: {str(e)}")
            return self._basic_extract_claim_data(claim_text)
    
    def _basic_extract_claim_data(self, claim_text: str) -> ExtractedClaimData:
        """Fallback basic extraction method"""
        import re
        
        extracted = ExtractedClaimData(raw_text=claim_text)
        clean_text = claim_text.lower().strip()
        
        # Extract years
        year_pattern = r'\b(202[0-5])\b'
        year_matches = re.findall(year_pattern, clean_text)
        if year_matches:
            extracted.year = int(year_matches[0])
        
        # Extract percentages
        percentage_pattern = r'(\d+(?:\.\d+)?)\s*%'
        percentage_matches = re.findall(percentage_pattern, clean_text)
        if percentage_matches:
            extracted.percentage = float(percentage_matches[0])
        
        # Extract values with units
        number_pattern = r'(\d+(?:,\d{3})*(?:\.\d+)?)\s*(tons?|tonnes?|tco2e?|kwh|mwh|gwh)'
        number_matches = re.findall(number_pattern, clean_text)
        if number_matches:
            extracted.value = float(number_matches[0][0].replace(',', ''))
            extracted.unit = number_matches[0][1]
        
        # Basic metric detection
        if 'emission' in clean_text or 'co2' in clean_text:
            extracted.metric = 'emissions'
        elif 'renewable' in clean_text:
            extracted.metric = 'renewable_energy_percent'
        
        return extracted
    

    
    def verify_claim(self, claim_data: ExtractedClaimData, company_name: str) -> VerificationResult:
        """
        Verify a claim against the ESG lookup data using Gemini AI
        
        Args:
            claim_data: Extracted claim data
            company_name: Company name (from PDF filename or extracted)
            
        Returns:
            VerificationResult with verification status and details
        """
        if not self.gemini_model:
            logger.warning("Gemini AI not available, using basic verification")
            return self._basic_verify_claim(claim_data, company_name)
        
        try:
            # Get relevant data from CSV for the company
            company_data = self._get_company_data_for_verification(company_name)
            
            if company_data.empty:
                return VerificationResult(
                    status="unverified",
                    confidence=0.0,
                    reasoning=f"No data found for company '{company_name}' in dataset",
                    csv_match=False,
                    tolerance_check=False
                )
            
            # Create verification prompt
            prompt = self._create_verification_prompt(claim_data, company_name, company_data)
            
            # Get Gemini's analysis
            response = self.gemini_model.generate_content(prompt)
            
            # Parse the response
            return self._parse_gemini_verification_response(response.text, company_data)
            
        except Exception as e:
            logger.error(f"Error using Gemini for claim verification: {str(e)}")
            return self._basic_verify_claim(claim_data, company_name)
    
    def _get_company_data_for_verification(self, company_name: str) -> pd.DataFrame:
        """Get relevant company data from CSV with fuzzy matching"""
        # Try exact match first
        exact_match = self.data[self.data['company'].str.lower() == company_name.lower()]
        if not exact_match.empty:
            return exact_match
        
        # Try partial matching
        for _, row in self.data.iterrows():
            csv_company = row['company'].lower()
            input_company = company_name.lower()
            
            # Check if either name contains the other
            if (input_company in csv_company or csv_company in input_company) and len(input_company) > 3:
                return self.data[self.data['company'] == row['company']]
        
        return pd.DataFrame()
    
    def _create_verification_prompt(self, claim_data: ExtractedClaimData, company_name: str, company_data: pd.DataFrame) -> str:
        """Create a verification prompt for Gemini"""
        
        # Convert company data to a readable format
        data_summary = []
        for _, row in company_data.iterrows():
            data_summary.append(f"- {row['metric']}: {row['value']} {row['unit']} in {row['year']} (Source: {row['source']})")
        
        data_text = "\n".join(data_summary[:10])  # Limit to first 10 entries
        
        prompt = f"""
        You are an ESG claim verification expert. Analyze this environmental claim against verified data.
        
        CLAIM TO VERIFY:
        Company: {company_name}
        Claim Text: "{claim_data.raw_text}"
        Extracted Data:
        - Metric: {claim_data.metric}
        - Value: {claim_data.value}
        - Unit: {claim_data.unit}
        - Year: {claim_data.year}
        - Percentage: {claim_data.percentage}
        
        VERIFIED DATA FROM DATABASE:
        {data_text}
        
        TASK:
        Analyze if the claim is supported by the verified data. Consider:
        1. Does the company have data for the claimed metric?
        2. Are the values reasonably close (within 10-15% tolerance)?
        3. Do the years match or are close?
        4. Are the units compatible?
        
        Return a JSON object with:
        - status: "verified" (claim matches data), "questionable" (partial match/discrepancy), or "unverified" (no supporting data)
        - confidence: float between 0.0-1.0
        - reasoning: detailed explanation of your analysis
        - csv_match: boolean if relevant data was found
        - tolerance_check: boolean if values are within acceptable range
        - matched_data: the specific data point that best matches (if any)
        
        Example:
        {{"status": "verified", "confidence": 0.9, "reasoning": "The claim of 1.8M tons CO2e matches the database value of 1.75M tons within acceptable tolerance", "csv_match": true, "tolerance_check": true, "matched_data": {{"metric": "emissions", "value": 1750000, "year": 2024}}}}
        
        Only return the JSON object, no other text.
        """
        
        return prompt
    
    def _parse_gemini_verification_response(self, response_text: str, company_data: pd.DataFrame) -> VerificationResult:
        """Parse Gemini's verification response"""
        try:
            # Clean the response text
            response_text = response_text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            result_data = json.loads(response_text.strip())
            
            return VerificationResult(
                status=result_data.get('status', 'unverified'),
                confidence=float(result_data.get('confidence', 0.0)),
                reasoning=result_data.get('reasoning', 'No reasoning provided'),
                csv_match=bool(result_data.get('csv_match', False)),
                tolerance_check=bool(result_data.get('tolerance_check', False)),
                matched_data=result_data.get('matched_data')
            )
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse Gemini verification response: {e}")
            logger.warning(f"Response text: {response_text}")
            
            # Fallback: analyze response text for key indicators
            response_lower = response_text.lower()
            
            if 'verified' in response_lower and 'match' in response_lower:
                status = 'verified'
                confidence = 0.8
            elif 'questionable' in response_lower or 'partial' in response_lower:
                status = 'questionable'
                confidence = 0.5
            else:
                status = 'unverified'
                confidence = 0.2
            
            return VerificationResult(
                status=status,
                confidence=confidence,
                reasoning=f"Gemini analysis: {response_text[:200]}...",
                csv_match=not company_data.empty,
                tolerance_check=False
            )
    
    def _basic_verify_claim(self, claim_data: ExtractedClaimData, company_name: str) -> VerificationResult:
        """Fallback basic verification method"""
        company_data = self._get_company_data_for_verification(company_name)
        
        if company_data.empty:
            return VerificationResult(
                status="unverified",
                confidence=0.0,
                reasoning=f"No data found for company '{company_name}'",
                csv_match=False,
                tolerance_check=False
            )
        
        return VerificationResult(
            status="questionable",
            confidence=0.5,
            reasoning=f"Found data for {company_name} but detailed verification unavailable (Gemini AI not configured)",
            csv_match=True,
            tolerance_check=False,
            matched_data=company_data.iloc[0].to_dict() if not company_data.empty else None
        )    
    
    def get_company_data(self, company_name: str) -> Optional[pd.DataFrame]:
        """
        Get all data for a specific company
        
        Args:
            company_name: Name of the company
            
        Returns:
            DataFrame with company data or None if not found
        """
        return self._get_company_data_for_verification(company_name)
    
    def get_available_metrics_for_company(self, company_name: str) -> List[str]:
        """
        Get list of available metrics for a company
        
        Args:
            company_name: Name of the company
            
        Returns:
            List of available metrics
        """
        company_data = self.get_company_data(company_name)
        if company_data is not None and not company_data.empty:
            return company_data['metric'].unique().tolist()
        return []
    
    def get_available_years_for_company(self, company_name: str) -> List[int]:
        """
        Get list of available years for a company
        
        Args:
            company_name: Name of the company
            
        Returns:
            List of available years
        """
        company_data = self.get_company_data(company_name)
        if company_data is not None and not company_data.empty:
            return sorted(company_data['year'].unique().tolist())
        return []


# Example usage and testing
if __name__ == "__main__":
    import os
    
    # Set up Gemini API key for testing
    # os.environ['GEMINI_API_KEY'] = 'your-api-key-here'
    
    # Initialize the verifier
    verifier = ESGVerifier("esg_lookup_2020_2025.csv")
    
    # Test data summary
    summary = verifier.get_data_summary()
    print("Data Summary:")
    print(f"Total records: {summary['total_records']}")
    print(f"Companies: {len(verifier.data['company'].unique())}")
    print(f"Metrics: {len(verifier.data['metric'].unique())}")
    
    # Test claim extraction
    test_claims = [
        "Apple reduced its emissions to 1.8 million tons CO2e in 2024",
        "Tesla achieved 41.8% renewable energy in 2023",
        "Our company cut carbon emissions by 15% in 2022"
    ]
    
    print("\nTesting claim extraction:")
    for claim in test_claims:
        extracted = verifier.extract_claim_data(claim)
        print(f"Claim: {claim}")
        print(f"Extracted: metric={extracted.metric}, value={extracted.value}, "
              f"percentage={extracted.percentage}, year={extracted.year}, unit={extracted.unit}")
        print()
    
    # Test full verification
    print("\nTesting full verification:")
    claim_data = verifier.extract_claim_data("Apple achieved 84.7% renewable energy in 2024")
    result = verifier.verify_claim(claim_data, "Apple")
    print(f"Status: {result.status}")
    print(f"Confidence: {result.confidence}")
    print(f"Reasoning: {result.reasoning}")