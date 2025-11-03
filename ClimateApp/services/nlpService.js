// NLP Service for Climate Claim Analysis
// Connects to Python backend API

// Local Flask server URL
const API_BASE_URL = 'http://localhost:8000'; // Local Flask server
const LOCAL_API_URL = 'http://192.168.1.5:8000'; // Network IP for physical devices

// Auto-detect environment
const isDevelopment = __DEV__ || false;
const CURRENT_API_URL = isDevelopment ? LOCAL_API_URL : API_BASE_URL;

export class NLPService {
  static async processDocument(documentUri, filename) {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: documentUri,
        type: 'application/pdf',
        name: filename || 'document.pdf'
      });
      
      // Optional: add company name if extracted from filename
      if (filename) {
        formData.append('company_name', this.extractCompanyName(filename));
      }

      // Call Python backend API
      const response = await fetch(`${CURRENT_API_URL}/api/process-document`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      
      // Transform backend response to match app format
      return this.transformBackendResponse(result, filename);
      
    } catch (error) {
      console.error('Error processing document:', error);
      // Fallback to mock data if API fails
      return this.processDocumentMock(documentUri, filename);
    }
  }

  static extractCompanyName(filename) {
    // Extract company name from filename
    return filename.replace(/[_-]/g, ' ')
                  .replace(/\.(pdf|PDF)$/, '')
                  .replace(/\d{4}/g, '') // Remove years
                  .replace(/report|sustainability|annual|esg/gi, '')
                  .trim();
  }

  static transformBackendResponse(backendResult, filename) {
    // Transform Python backend response to match app expectations
    const claims = backendResult.verified_claims?.map((claim, index) => ({
      id: claim.id || index + 1,
      text: claim.text,
      category: this.mapMetricToCategory(claim.extracted_data?.metric),
      confidence: claim.confidence,
      status: claim.verification_status,
      evidence: claim.match_details?.csv_match ? 3 : 0,
      reasoning: claim.match_details?.reasoning || 'No reasoning provided'
    })) || [];

    return {
      documentInfo: {
        filename: filename || 'document.pdf',
        size: backendResult.document_info?.file_size || 'Unknown',
        pages: backendResult.document_info?.total_sentences || 0,
        uploadDate: new Date().toLocaleString(),
        ocrConfidence: 0.94,
        processingMode: 'AI-Powered',
      },
      extractedText: backendResult.document_info?.extracted_text || '',
      claims: claims,
      summary: backendResult.summary || {
        totalClaims: claims.length,
        verified: claims.filter(c => c.status === 'verified').length,
        questionable: claims.filter(c => c.status === 'questionable').length,
        unverified: claims.filter(c => c.status === 'unverified').length,
      },
      processingSteps: [
        { name: 'fileUpload', duration: 1200 },
        { name: 'textExtraction', duration: 3400 },
        { name: 'claimDetection', duration: 1100 },
        { name: 'evidenceLookup', duration: 8000 },
        { name: 'reportGeneration', duration: 2000 },
      ],
    };
  }

  static mapMetricToCategory(metric) {
    const categoryMap = {
      'emissions': 'Emissions Reduction',
      'scope_1_emissions': 'Emissions Reduction', 
      'scope_2_emissions': 'Emissions Reduction',
      'renewable_energy_percent': 'Renewable Energy',
      'climate_policy_score': 'Climate Policy'
    };
    return categoryMap[metric] || 'Environmental';
  }

  static async processDocumentMock(documentUri, filename) {
    // Simulate the NLP pipeline steps
    const steps = [
      { name: 'fileUpload', duration: 1200 },
      { name: 'textExtraction', duration: 3400 },
      { name: 'claimDetection', duration: 1100 },
      { name: 'evidenceLookup', duration: 8000 },
      { name: 'reportGeneration', duration: 2000 },
    ];

    // Mock extracted text (would come from OCR in real implementation)
    const mockText = `
      TechCorp Annual Sustainability Report 2023
      
      Executive Summary
      We are committed to achieving carbon neutrality across all operations by 2030.
      
      Emissions Reduction
      Company X reduced direct emissions by 40% in 2023 compared to our 2022 baseline.
      This reduction was achieved through renewable energy adoption and efficiency improvements.
      
      Carbon Neutrality
      We achieved carbon neutrality across all operations through verified carbon offsets.
      Our Scope 1 and Scope 2 emissions have been fully offset through certified projects.
      
      Renewable Energy
      100% of our electricity consumption now comes from renewable sources.
      We have installed solar panels across 15 facilities, generating 2.5 MW of clean energy.
      
      Water Conservation
      Water usage decreased by 25% through implementation of recycling systems.
      
      Waste Reduction
      Zero waste to landfill achieved across all manufacturing facilities.
    `;

    // Mock claim detection results
    const detectedClaims = [
      {
        id: 1,
        text: 'Company X reduced direct emissions by 40% in 2023',
        category: 'Emissions Reduction',
        confidence: 0.72,
        status: 'questionable',
        evidence: 2,
        reasoning: 'Specific percentage claim requires verification against baseline data',
      },
      {
        id: 2,
        text: 'We achieved carbon neutrality across all operations',
        category: 'Carbon Neutrality',
        confidence: 0.89,
        status: 'unverified',
        evidence: 0,
        reasoning: 'Carbon neutrality claim lacks supporting evidence or certification details',
      },
      {
        id: 3,
        text: '100% of our electricity consumption now comes from renewable sources',
        category: 'Renewable Energy',
        confidence: 0.95,
        status: 'verified',
        evidence: 3,
        reasoning: 'Renewable energy claim supported by facility data and certificates',
      },
      {
        id: 4,
        text: 'Water usage decreased by 25% through implementation of recycling systems',
        category: 'Water Conservation',
        confidence: 0.88,
        status: 'verified',
        evidence: 2,
        reasoning: 'Water reduction claim supported by usage data and system documentation',
      },
      {
        id: 5,
        text: 'Zero waste to landfill achieved across all manufacturing facilities',
        category: 'Waste Management',
        confidence: 0.91,
        status: 'verified',
        evidence: 4,
        reasoning: 'Waste diversion claim supported by facility reports and certifications',
      },
    ];

    return {
      documentInfo: {
        filename: filename || 'document.pdf',
        size: '2.4 MB',
        pages: 45,
        uploadDate: new Date().toLocaleString(),
        ocrConfidence: 0.94,
        processingMode: 'Local',
      },
      extractedText: mockText,
      claims: detectedClaims,
      summary: {
        totalClaims: detectedClaims.length,
        verified: detectedClaims.filter(c => c.status === 'verified').length,
        questionable: detectedClaims.filter(c => c.status === 'questionable').length,
        unverified: detectedClaims.filter(c => c.status === 'unverified').length,
      },
      processingSteps: steps,
    };
  }

  static async simulateProcessingStep(stepName, onProgress) {
    const stepDurations = {
      fileUpload: 1200,
      textExtraction: 3400,
      claimDetection: 1100,
      evidenceLookup: 8000,
      reportGeneration: 2000,
    };

    const duration = stepDurations[stepName] || 1000;
    const interval = 100;
    const totalSteps = duration / interval;
    
    for (let i = 0; i <= totalSteps; i++) {
      const progress = (i / totalSteps) * 100;
      onProgress(progress);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  static generateCSVExport(claims, includeEvidence = true, includeRawText = false) {
    let csv = 'ID,Claim Text,Category,Status,Confidence,Evidence Count';
    if (includeEvidence) {
      csv += ',Reasoning';
    }
    csv += '\n';

    claims.forEach(claim => {
      const row = [
        claim.id,
        `"${claim.text}"`,
        claim.category,
        claim.status,
        (claim.confidence * 100).toFixed(1) + '%',
        claim.evidence || 0,
      ];
      
      if (includeEvidence) {
        row.push(`"${claim.reasoning}"`);
      }
      
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  static generateJSONExport(documentInfo, claims, includeRawText = false) {
    const exportData = {
      document: documentInfo,
      analysis: {
        timestamp: new Date().toISOString(),
        totalClaims: claims.length,
        summary: {
          verified: claims.filter(c => c.status === 'verified').length,
          questionable: claims.filter(c => c.status === 'questionable').length,
          unverified: claims.filter(c => c.status === 'unverified').length,
        },
      },
      claims: claims.map(claim => ({
        id: claim.id,
        text: claim.text,
        category: claim.category,
        status: claim.status,
        confidence: claim.confidence,
        evidenceCount: claim.evidence || 0,
        reasoning: claim.reasoning,
      })),
    };

    if (includeRawText) {
      exportData.rawText = documentInfo.extractedText;
    }

    return JSON.stringify(exportData, null, 2);
  }
}

// Mock evidence database for ESG claims
export const mockEvidenceDatabase = {
  'emissions reduction': [
    'EPA Greenhouse Gas Reporting Program data',
    'Third-party emissions verification reports',
    'Carbon footprint assessment documentation',
  ],
  'carbon neutrality': [
    'Carbon offset purchase certificates',
    'Third-party carbon neutral certification',
    'Scope 1, 2, 3 emissions inventory',
  ],
  'renewable energy': [
    'Renewable Energy Certificate (REC) purchases',
    'Power Purchase Agreement (PPA) contracts',
    'On-site renewable energy generation data',
  ],
  'water conservation': [
    'Water usage monitoring reports',
    'Water recycling system documentation',
    'Third-party water stewardship certification',
  ],
  'waste management': [
    'Waste diversion tracking reports',
    'Zero waste to landfill certification',
    'Recycling and composting program data',
  ],
};