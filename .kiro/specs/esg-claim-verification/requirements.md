# Requirements Document

## Introduction

The ESG Claim Verification feature enables users to upload sustainability or CSR reports in PDF format and automatically verify environmental claims against a verified ESG lookup dataset. The system uses a fine-tuned language model for claim detection and rule-based verification against the ESG lookup table to categorize claims as verified, questionable, or unverified.

## Glossary

- **ESG_System**: The ESG Claim Verification system within ClimateApp
- **LLM_Classifier**: The fine-tuned language model for claim detection located in trained_llm_for_claim_classification
- **ESG_Lookup**: The verified ESG dataset (esg_lookup_2020_2025.csv) containing company metrics
- **PDF_Document**: User-uploaded sustainability or CSR report in PDF format
- **Claim_Sentence**: A sentence classified as containing an environmental claim
- **Verification_Status**: Classification of claims as verified, questionable, or unverified
- **Python_Backend**: Python service handling NLP processing and LLM inference
- **Company_Name**: Company identifier extracted from PDF filename

## Requirements

### Requirement 1

**User Story:** As a sustainability analyst, I want to upload PDF reports and get automated claim verification, so that I can quickly assess ESG credibility.

#### Acceptance Criteria

1. WHEN a user uploads a PDF_Document, THE ESG_System SHALL extract raw text from the document
2. THE ESG_System SHALL extract Company_Name from the PDF filename
3. THE ESG_System SHALL clean extracted text by removing line breaks, extra spaces, and symbols
4. THE ESG_System SHALL split cleaned text into individual sentences
5. THE ESG_System SHALL display empty state screens when no data is available

### Requirement 2

**User Story:** As a sustainability analyst, I want claims to be automatically detected using AI, so that I can focus on verification rather than manual identification.

#### Acceptance Criteria

1. WHEN text sentences are processed, THE ESG_System SHALL pass each sentence through LLM_Classifier
2. THE LLM_Classifier SHALL classify each sentence as either "Claim" or "Non-Claim"
3. THE ESG_System SHALL provide confidence scores for each classification
4. THE ESG_System SHALL filter only sentences labeled as "Claim" for verification
5. THE ESG_System SHALL use the actual trained model from trained_llm_for_claim_classification directory

### Requirement 3

**User Story:** As a sustainability analyst, I want claims to be verified against reliable data sources, so that I can trust the verification results.

#### Acceptance Criteria

1. WHEN a Claim_Sentence is detected, THE ESG_System SHALL extract company metrics and values using pattern matching
2. THE ESG_System SHALL match extracted data against ESG_Lookup dataset
3. THE ESG_System SHALL handle numbers, percentages, and company names with fuzzy matching
4. THE ESG_System SHALL categorize each claim with appropriate Verification_Status
5. THE ESG_System SHALL use Company_Name from PDF filename for lookup matching

### Requirement 4

**User Story:** As a sustainability analyst, I want to see detailed verification results, so that I can understand which claims are reliable.

#### Acceptance Criteria

1. THE ESG_System SHALL display total number of detected claims
2. THE ESG_System SHALL show each claim with its Verification_Status
3. THE ESG_System SHALL provide confidence scores from LLM_Classifier
4. THE ESG_System SHALL highlight claims with color coding (green=verified, yellow=questionable, red=unverified)
5. THE ESG_System SHALL generate summary reports showing overall ESG credibility profile

### Requirement 5

**User Story:** As a sustainability analyst, I want the system to be production-ready, so that I can rely on it for real analysis work.

#### Acceptance Criteria

1. THE ESG_System SHALL remove all mock data and placeholder content from screens
2. THE ESG_System SHALL implement Python_Backend for NLP processing and LLM inference
3. THE ESG_System SHALL restructure services folder to accommodate new verification logic
4. THE ESG_System SHALL use existing ESG_Lookup dataset without modifications
5. THE ESG_System SHALL integrate Python processing results with ClimateApp frontend

### Requirement 6

**User Story:** As a sustainability analyst, I want accurate data extraction and matching, so that verification results are reliable.

#### Acceptance Criteria

1. THE ESG_System SHALL extract metrics, values, and years from claims using regex patterns
2. THE ESG_System SHALL handle percentage values and numerical ranges appropriately
3. THE ESG_System SHALL perform fuzzy matching for company names and metric variations
4. THE ESG_System SHALL validate extracted data against ESG_Lookup schema
5. THE ESG_System SHALL provide detailed matching explanations for questionable claims