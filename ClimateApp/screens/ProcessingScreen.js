import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { DocumentProcessor } from '../services/documentProcessor';
import { PythonBridge } from '../services/pythonBridge';

export default function ProcessingScreen({ navigation, route }) {
  const [currentStep, setCurrentStep] = useState('uploading');
  const [progress, setProgress] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [processingResults, setProcessingResults] = useState(null);
  
  const { documentData } = route.params || {};

  const steps = [
    {
      id: 'uploading',
      title: 'File Upload',
      description: 'Preparing document for processing...',
      icon: '📤',
    },
    {
      id: 'extracting',
      title: 'Text Extraction',
      description: 'Extracting text from PDF document...',
      icon: '📄',
    },
    {
      id: 'classifying',
      title: 'Claim Detection',
      description: 'Analyzing text with fine-tuned BERT model...',
      icon: '🤖',
    },
    {
      id: 'verifying',
      title: 'ESG Verification',
      description: 'Verifying claims against ESG database...',
      icon: '🔍',
    },
    {
      id: 'formatting',
      title: 'Report Generation',
      description: 'Compiling analysis results...',
      icon: '📊',
    },
  ];

  useEffect(() => {
    if (!documentData) {
      setError('No document data provided');
      return;
    }

    processDocument();
  }, [documentData]);

  const processDocument = async () => {
    try {
      setError(null);
      
      const results = await DocumentProcessor.processDocument(
        documentData,
        (progressValue, message) => {
          setProgress(progressValue);
          // Update current step based on progress
          if (progressValue < 20) setCurrentStep('uploading');
          else if (progressValue < 40) setCurrentStep('extracting');
          else if (progressValue < 60) setCurrentStep('classifying');
          else if (progressValue < 80) setCurrentStep('verifying');
          else setCurrentStep('formatting');
        },
        (event, queueItem) => {
          switch (event) {
            case DocumentProcessor.ProcessingEvents.PROCESSING_STARTED:
              setJobId(queueItem.jobId);
              setDocumentInfo(queueItem.documentInfo);
              break;
            case DocumentProcessor.ProcessingEvents.PROCESSING_COMPLETED:
              setProcessingComplete(true);
              setProcessingResults(queueItem.results);
              setProgress(100);
              
              // Navigate to results after a short delay
              setTimeout(() => {
                navigation.replace('ClaimReview', {
                  documentId: queueItem.completedDocument.id,
                  document: queueItem.completedDocument,
                  fromProcessing: true,
                });
              }, 2000);
              break;
            case DocumentProcessor.ProcessingEvents.PROCESSING_FAILED:
              setError(queueItem.error || 'Processing failed');
              break;
          }
        }
      );

    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message || 'Failed to process document');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Processing',
      'Are you sure you want to cancel the processing? This action cannot be undone.',
      [
        { text: 'Continue Processing', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: () => {
            if (jobId) {
              DocumentProcessor.cancelProcessing(jobId);
            }
            navigation.goBack();
          }
        },
      ]
    );
  };

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setCurrentStep('uploading');
    setProcessingComplete(false);
    setJobId(null);
    setProcessingResults(null);
    processDocument();
  };

  const getErrorMessage = (error) => {
    if (typeof error === 'object' && error.getUserMessage) {
      return error.getUserMessage();
    }
    
    if (typeof error === 'object' && error.message) {
      return error.message;
    }
    
    return typeof error === 'string' ? error : 'An unexpected error occurred';
  };

  const isRetryableError = (error) => {
    if (typeof error === 'object' && error.isRetryable) {
      return error.isRetryable();
    }
    
    // Default retry logic for string errors
    const nonRetryableKeywords = ['validation', 'not supported', 'invalid', 'too large'];
    const errorMessage = (error?.message || error || '').toLowerCase();
    
    return !nonRetryableKeywords.some(keyword => errorMessage.includes(keyword));
  };

  const getStepStatus = (step) => {
    const stepIndex = steps.findIndex(s => s.id === step.id);
    const currentStepIndex = steps.findIndex(s => s.id === currentStep);
    
    if (error) {
      if (stepIndex <= currentStepIndex) return 'error';
      return 'pending';
    }
    
    if (processingComplete) return 'completed';
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'processing';
    return 'pending';
  };

  const getStepIcon = (step) => {
    const status = getStepStatus(step);
    if (status === 'completed') return '✓';
    if (status === 'processing') return '🔄';
    if (status === 'error') return '✗';
    return step.icon;
  };

  const getStepColor = (step) => {
    const status = getStepStatus(step);
    if (status === 'completed') return '#00C851';
    if (status === 'processing') return '#007AFF';
    if (status === 'error') return '#FF4444';
    return '#999';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getEstimatedTime = () => {
    if (error) return 'Processing failed';
    if (processingComplete) return 'Completed';
    
    const remainingProgress = 100 - progress;
    const estimatedSeconds = Math.ceil(remainingProgress * 0.5); // Rough estimate
    
    if (estimatedSeconds < 60) return `${estimatedSeconds}s remaining`;
    const minutes = Math.ceil(estimatedSeconds / 60);
    return `${minutes}m remaining`;
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>Processing Failed</Text>
              <Text style={styles.subtitle}>An error occurred</Text>
            </View>
          </View>

          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>⚠️</Text>
            </View>
            <Text style={styles.errorTitle}>Processing Failed</Text>
            <Text style={styles.errorMessage}>{getErrorMessage(error)}</Text>
            
            {/* Error details for debugging (only show if error has details) */}
            {error?.code && (
              <Text style={styles.errorCode}>Error Code: {error.code}</Text>
            )}
            
            <View style={styles.errorActions}>
              {isRetryableError(error) && (
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.cancelButton, !isRetryableError(error) && styles.primaryButton]} 
                onPress={() => navigation.goBack()}
              >
                <Text style={[styles.cancelButtonText, !isRetryableError(error) && styles.primaryButtonText]}>
                  Go Back
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Help text for non-retryable errors */}
            {!isRetryableError(error) && (
              <Text style={styles.helpText}>
                Please check your file and try selecting a different document.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>
              {processingComplete ? 'Processing Complete' : 'Processing Document'}
            </Text>
            <Text style={styles.subtitle}>
              {processingComplete ? 'Analysis completed successfully' : 'Analyzing ESG claims...'}
            </Text>
          </View>
        </View>

        {/* Document Info */}
        <View style={styles.documentInfo}>
          <View style={styles.documentIcon}>
            <Text style={styles.documentIconText}>📄</Text>
          </View>
          <View style={styles.documentDetails}>
            <Text style={styles.documentName} numberOfLines={1}>
              {documentInfo?.name || documentData?.name || 'Document'}
            </Text>
            <Text style={styles.documentMeta}>
              {formatFileSize(documentInfo?.size || documentData?.size)} • PDF
            </Text>
          </View>
          <View style={[
            styles.modeTag,
            { backgroundColor: processingComplete ? '#E8F5E8' : '#E3F2FD' }
          ]}>
            <Text style={[
              styles.modeText,
              { color: processingComplete ? '#00C851' : '#007AFF' }
            ]}>
              {processingComplete ? 'Completed' : 'Processing'}
            </Text>
          </View>
        </View>

        {/* Overall Progress */}
        <View style={styles.overallProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Overall Progress</Text>
            <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.estimatedTime}>{getEstimatedTime()}</Text>
        </View>

        {/* Processing Pipeline */}
        <View style={styles.pipelineSection}>
          <Text style={styles.pipelineTitle}>Processing Pipeline</Text>

          <View style={styles.stepsContainer}>
            {steps.map((step, index) => {
              const status = getStepStatus(step);
              return (
                <View key={step.id} style={styles.stepItem}>
                  <View style={styles.stepIndicator}>
                    <View style={[
                      styles.stepIcon,
                      { backgroundColor: getStepColor(step) }
                    ]}>
                      <Text style={styles.stepIconText}>
                        {getStepIcon(step)}
                      </Text>
                    </View>
                    {index < steps.length - 1 && (
                      <View style={[
                        styles.stepConnector,
                        { backgroundColor: status === 'completed' ? '#00C851' : '#e0e0e0' }
                      ]} />
                    )}
                  </View>
                  
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={[
                      styles.stepDescription,
                      { color: status === 'error' ? '#FF4444' : '#666' }
                    ]}>
                      {status === 'error' ? 'Processing failed at this step' : step.description}
                    </Text>
                    
                    {status === 'processing' && (
                      <View style={styles.processingIndicator}>
                        <View style={styles.processingDot} />
                        <Text style={styles.processingText}>In progress...</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!processingComplete && !error && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel Processing</Text>
            </TouchableOpacity>
          )}
          
          {processingComplete && (
            <TouchableOpacity 
              style={styles.viewResultsButton}
              onPress={() => navigation.replace('ClaimReview', {
                documentId: processingResults?.document?.id,
                document: processingResults?.document,
                fromProcessing: true,
              })}
            >
              <Text style={styles.viewResultsButtonText}>View Results</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 24,
    marginRight: 16,
    color: '#007AFF',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  documentIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentIconText: {
    fontSize: 24,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  documentMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  modeTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modeText: {
    fontSize: 12,
    color: '#00C851',
    fontWeight: '600',
  },
  pipelineSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  pipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pipelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#666',
  },
  stepsContainer: {
    gap: 20,
  },
  stepItem: {
    flexDirection: 'row',
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepConnector: {
    width: 2,
    height: 40,
    marginTop: 8,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDuration: {
    fontSize: 12,
    color: '#666',
  },
  stepTime: {
    fontSize: 12,
    color: '#666',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  actionButtons: {
    padding: 20,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  overallProgress: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  processingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  processingText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
  },
  errorIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#FFEBEE',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorIconText: {
    fontSize: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewResultsButton: {
    backgroundColor: '#00C851',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  viewResultsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCode: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginBottom: 16,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
  },
});