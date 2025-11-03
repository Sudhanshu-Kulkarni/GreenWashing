import React, { useState } from 'react';
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
import LoadingState from '../components/LoadingState';

export default function ImportScreen({ navigation }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChooseFile = async () => {
    try {
      setIsProcessing(true);
      
      // Pick PDF document
      const documentInfo = await DocumentProcessor.pickDocument();
      
      if (!documentInfo) {
        // User cancelled selection
        setIsProcessing(false);
        return;
      }

      // Navigate to processing screen with the document
      navigation.navigate('Processing', { 
        documentData: documentInfo
      });
      
    } catch (error) {
      console.error('Error picking document:', error);
      
      // Enhanced error handling with user-friendly messages
      const errorMessage = getImportErrorMessage(error);
      const showRetry = isRetryableImportError(error);
      
      Alert.alert(
        'Import Error', 
        errorMessage,
        showRetry ? [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: handleChooseFile }
        ] : [
          { text: 'OK' }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getImportErrorMessage = (error) => {
    if (error?.code) {
      const errorMessages = {
        'NO_DOCUMENT': 'No document was selected. Please try again.',
        'INVALID_DOCUMENT_STRUCTURE': 'The selected file appears to be corrupted. Please select a different file.',
        'FILE_TOO_LARGE': 'The selected file is too large. Please select a file smaller than 50MB.',
        'UNSUPPORTED_FILE_TYPE': 'Only PDF files are supported. Please select a PDF file.',
        'FILENAME_TOO_SHORT': 'The filename is too short. Please rename the file and try again.',
        'FILENAME_TOO_LONG': 'The filename is too long. Please rename the file and try again.',
        'INVALID_FILENAME_CHARACTERS': 'The filename contains invalid characters. Please rename the file and try again.',
        'EMPTY_FILENAME': 'The filename cannot be empty. Please rename the file and try again.',
        'INVALID_MIME_TYPE': 'The file type is not supported. Please select a PDF file.',
        'VALIDATION_ERROR': 'There was an issue validating the file. Please try a different file.',
      };
      
      return errorMessages[error.code] || error.message || 'Failed to import document. Please try again.';
    }
    
    return error.message || 'Failed to import document. Please try again.';
  };

  const isRetryableImportError = (error) => {
    const nonRetryableCodes = [
      'FILE_TOO_LARGE',
      'UNSUPPORTED_FILE_TYPE', 
      'INVALID_FILENAME_CHARACTERS',
      'FILENAME_TOO_LONG',
      'INVALID_MIME_TYPE'
    ];
    
    return !nonRetryableCodes.includes(error?.code);
  };

  const handleUnsupportedFeature = (featureName) => {
    Alert.alert(
      `${featureName} Not Available`,
      'This feature is not yet implemented. Please use "Choose PDF File" to upload sustainability reports.',
      [{ text: 'OK' }]
    );
  };
  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Preparing document..." />
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
          <Text style={styles.title}>Import Document</Text>
        </View>
        <Text style={styles.subtitle}>Upload sustainability reports for ESG claim verification</Text>

        {/* Supported Formats */}
        <View style={styles.section}>
          <View style={styles.supportedFormats}>
            <Text style={styles.sectionTitle}>Supported Formats</Text>
            <View style={styles.formatTags}>
              <View style={[styles.formatTag, styles.primaryFormat]}>
                <Text style={[styles.formatText, styles.primaryFormatText]}>PDF</Text>
              </View>
              <View style={[styles.formatTag, styles.disabledFormat]}>
                <Text style={[styles.formatText, styles.disabledFormatText]}>JPEG</Text>
              </View>
              <View style={[styles.formatTag, styles.disabledFormat]}>
                <Text style={[styles.formatText, styles.disabledFormatText]}>PNG</Text>
              </View>
            </View>
            <Text style={styles.formatNote}>
              Currently optimized for PDF sustainability reports. Image formats coming soon.
            </Text>
          </View>
        </View>

        {/* Import Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Methods</Text>
          
          {/* Primary Method - PDF Upload */}
          <TouchableOpacity 
            style={[styles.methodButton, styles.primaryMethod]} 
            onPress={handleChooseFile}
          >
            <View style={[styles.methodIcon, { backgroundColor: '#00C851' }]}>
              <Text style={styles.methodIconText}>📄</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Choose PDF File</Text>
              <Text style={styles.methodDescription}>
                Select sustainability report from device
              </Text>
              <Text style={styles.recommendedBadge}>✨ Recommended</Text>
            </View>
          </TouchableOpacity>

          {/* Disabled Methods */}
          <TouchableOpacity 
            style={[styles.methodButton, styles.disabledMethod]} 
            onPress={() => handleUnsupportedFeature('Camera')}
          >
            <View style={[styles.methodIcon, { backgroundColor: '#ccc' }]}>
              <Text style={styles.methodIconText}>📷</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodTitle, styles.disabledText]}>Take Photo</Text>
              <Text style={[styles.methodDescription, styles.disabledText]}>
                Capture document with camera
              </Text>
              <Text style={styles.comingSoonBadge}>Coming Soon</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.methodButton, styles.disabledMethod]} 
            onPress={() => handleUnsupportedFeature('Photo Library')}
          >
            <View style={[styles.methodIcon, { backgroundColor: '#ccc' }]}>
              <Text style={styles.methodIconText}>🖼️</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodTitle, styles.disabledText]}>Photo Library</Text>
              <Text style={[styles.methodDescription, styles.disabledText]}>
                Pick from photos
              </Text>
              <Text style={styles.comingSoonBadge}>Coming Soon</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.methodButton, styles.disabledMethod]} 
            onPress={() => handleUnsupportedFeature('Document Scanner')}
          >
            <View style={[styles.methodIcon, { backgroundColor: '#ccc' }]}>
              <Text style={styles.methodIconText}>📱</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodTitle, styles.disabledText]}>Document Scanner</Text>
              <Text style={[styles.methodDescription, styles.disabledText]}>
                Multi-page scanning with OCR
              </Text>
              <Text style={styles.comingSoonBadge}>Coming Soon</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <View style={styles.tipsContainer}>
            <Text style={styles.sectionTitle}>Tips for Best Results</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>📋</Text>
              <Text style={styles.tipText}>Use official sustainability or ESG reports</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🏢</Text>
              <Text style={styles.tipText}>Include company name in filename for better matching</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>📊</Text>
              <Text style={styles.tipText}>Reports with specific metrics work best</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  supportedFormats: {
    backgroundColor: '#E3F2FD',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  formatTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  formatTag: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  formatText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  formatNote: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodIconText: {
    fontSize: 24,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
  },
  easBadge: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
    marginTop: 4,
  },
  easNote: {
    fontSize: 12,
    color: '#FF9500',
    marginLeft: 64,
    marginTop: -8,
  },
  cancelButton: {
    margin: 20,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  primaryFormat: {
    backgroundColor: '#E8F5E8',
    borderWidth: 2,
    borderColor: '#00C851',
  },
  primaryFormatText: {
    color: '#00C851',
    fontWeight: '600',
  },
  disabledFormat: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  disabledFormatText: {
    color: '#999',
  },
  primaryMethod: {
    borderWidth: 2,
    borderColor: '#00C851',
    backgroundColor: '#F8FFF8',
  },
  disabledMethod: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#999',
  },
  recommendedBadge: {
    fontSize: 12,
    color: '#00C851',
    fontWeight: '600',
    marginTop: 4,
  },
  comingSoonBadge: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginTop: 4,
  },
  tipsContainer: {
    backgroundColor: '#FFF9E6',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});