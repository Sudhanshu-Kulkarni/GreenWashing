import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';

export default function SettingsScreen({ navigation }) {
  const [processingMode, setProcessingMode] = useState('local');
  const [ocrBackend, setOcrBackend] = useState('tesseract');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity style={styles.settingsIcon}>
            <Text style={styles.settingsIconText}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Build & Mode Configuration</Text>

        {/* Processing Mode Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Processing Mode</Text>
          <Text style={styles.sectionDescription}>
            Choose how documents are processed
          </Text>

          <TouchableOpacity
            style={[
              styles.optionCard,
              processingMode === 'local' && styles.selectedOption
            ]}
            onPress={() => setProcessingMode('local')}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionIcon}>
                <Text style={styles.optionIconText}>📱</Text>
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Local-Only Processing</Text>
                <Text style={styles.optionBadge}>Default</Text>
              </View>
              <View style={[
                styles.radioButton,
                processingMode === 'local' && styles.radioButtonSelected
              ]}>
                {processingMode === 'local' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </View>
            <Text style={styles.optionDescription}>
              All processing happens on your device. Complete privacy, works offline.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              processingMode === 'server' && styles.selectedOption
            ]}
            onPress={() => setProcessingMode('server')}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionIcon}>
                <Text style={styles.optionIconText}>🌐</Text>
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Server-Assisted Processing</Text>
                <Text style={styles.optionBadge}>Advanced</Text>
              </View>
              <View style={[
                styles.radioButton,
                processingMode === 'server' && styles.radioButtonSelected
              ]}>
                {processingMode === 'server' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </View>
            <Text style={styles.optionDescription}>
              Use local server for heavier models like ClimateBERT. Requires network connection.
            </Text>
          </TouchableOpacity>
        </View>

        {/* OCR Backend Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OCR Backend</Text>
          <Text style={styles.sectionDescription}>
            Choose text extraction method
          </Text>

          <TouchableOpacity
            style={[
              styles.optionCard,
              ocrBackend === 'native' && styles.selectedOption
            ]}
            onPress={() => setOcrBackend('native')}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionIcon}>
                <Text style={styles.optionIconText}>⚡</Text>
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Tesseract Native</Text>
                <Text style={styles.optionBadge}>EAS Required</Text>
              </View>
              <View style={[
                styles.radioButton,
                ocrBackend === 'native' && styles.radioButtonSelected
              ]}>
                {ocrBackend === 'native' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </View>
            <Text style={styles.optionDescription}>
              High performance OCR with native libraries. Requires EAS development build.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              ocrBackend === 'tesseract' && styles.selectedOption
            ]}
            onPress={() => setOcrBackend('tesseract')}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionIcon}>
                <Text style={styles.optionIconText}>✓</Text>
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Tesseract.js WASM</Text>
                <Text style={styles.optionBadge}>Fallback</Text>
              </View>
              <View style={[
                styles.radioButton,
                ocrBackend === 'tesseract' && styles.radioButtonSelected
              ]}>
                {ocrBackend === 'tesseract' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </View>
            <Text style={styles.optionDescription}>
              JavaScript implementation. Works with Expo Go, slower performance.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 24,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  settingsIcon: {
    padding: 4,
  },
  settingsIconText: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  optionCard: {
    borderWidth: 2,
    borderColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: '#00C851',
    backgroundColor: '#F8FFF8',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIconText: {
    fontSize: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionBadge: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#00C851',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00C851',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  saveSection: {
    padding: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});