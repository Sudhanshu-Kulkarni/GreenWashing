# GreenCheck Climate App

A React Native app for climate claim analysis built with Expo, implementing an NLP pipeline for corporate sustainability report analysis.

## Features

### Core Functionality
- **Document Import**: Camera, file picker, photo library support
- **OCR Text Extraction**: Simulated 94% confidence text extraction
- **Climate Claim Detection**: NLP pipeline for identifying sustainability claims
- **Claim Classification**: Verified, Questionable, Unverified status
- **Evidence Lookup**: ESG database validation (simulated)
- **Export Options**: CSV and JSON format exports

### Screens
- **Login**: Simple authentication interface
- **Dashboard**: Overview with stats (Reports: 2, Claims: 20, Flagged: 4)
- **Import Document**: Multiple import methods with format support
- **Processing**: Real-time pipeline visualization
- **Claim Review**: Detailed claim analysis with filtering
- **Document Details**: File info, OCR confidence, analysis summary
- **Export Data**: Configurable export options
- **History**: Document processing history
- **Settings**: Processing mode and OCR backend configuration

## NLP Pipeline Implementation

Based on the project methodology, the app simulates:

1. **Data Ingestion & Preprocessing**
   - OCR/Text Extraction (PyMuPDF/Tesseract simulation)
   - Data Cleaning (stopwords, tokenization)
   - Sentence Segmentation

2. **NLP Processing Pipeline**
   - Named Entity Recognition
   - Claim Detection using ONNX classifier
   - Claim Classification (Verified/Questionable/Unverified)

3. **Evidence Validation**
   - ESG Database Lookup (simulated)
   - Fact Checking against emission reports
   - ClimateBERT/MLM-R model integration (placeholder)

4. **Output Generation**
   - Structured CSV/JSON export
   - Company claim status and confidence scores

## Getting Started

1. Install dependencies:
   ```bash
   cd climateapp
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on Android:
   ```bash
   npm run android
   ```

4. Or scan the QR code with Expo Go app on your Android device

## App Structure

```
climateapp/
├── App.js                          # Main app with navigation
├── screens/
│   ├── LoginScreen.js              # Authentication
│   ├── SimpleDashboard.js          # Main dashboard
│   ├── ImportScreen.js             # Document import
│   ├── ProcessingScreen.js         # NLP pipeline visualization
│   ├── ClaimReviewScreen.js        # Claim analysis results
│   ├── DocumentDetailsScreen.js    # Document information
│   ├── ExportDataScreen.js         # Export configuration
│   ├── HistoryScreen.js            # Processing history
│   └── SettingsScreen.js           # App configuration
├── services/
│   └── nlpService.js               # Mock NLP pipeline
└── package.json
```

## Usage

1. **Login**: Use any email/password combination
2. **Import Document**: Choose from camera, file picker, or photo library
3. **Processing**: Watch real-time NLP pipeline execution
4. **Review Claims**: Analyze detected climate claims with confidence scores
5. **Export Results**: Download CSV or JSON reports
6. **Settings**: Configure processing mode (Local/Server-Assisted)

## Mock Data

The app includes realistic mock data for:
- TechCorp Annual Sustainability Report 2023
- GreenEnergy Q3 Report
- Manufacturing Environmental Report

## Technical Implementation

- **React Navigation**: Stack-based navigation
- **Expo Document Picker**: File selection
- **Expo Image Picker**: Camera and photo library access
- **Mock NLP Service**: Simulates climate claim analysis pipeline
- **Real-time Processing**: Animated pipeline visualization

## Future Enhancements

- Integration with actual OCR libraries (Tesseract.js)
- Real NLP model deployment (ClimateBERT, ONNX)
- Backend API integration for server-assisted processing
- Enhanced evidence database connectivity
- Multi-language support for international reports