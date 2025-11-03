import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';

export default function ExportDataScreen({ navigation }) {
  const [selectedFormat, setSelectedFormat] = useState('CSV');
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeRawText, setIncludeRawText] = useState(false);

  const formats = [
    {
      id: 'CSV',
      title: 'CSV (Spreadsheet)',
      description: 'Compatible with Excel, Google Sheets, and data analysis tools',
      icon: '📊',
      size: '~0 KB',
    },
    {
      id: 'JSON',
      title: 'JSON (Structured)',
      description: 'Machine-readable format for APIs and further processing',
      icon: '📄',
      size: '~0 KB',
    },
  ];

  const handleExport = () => {
    // Simulate export process
    navigation.navigate('Processing', { 
      type: 'export',
      format: selectedFormat,
      options: { includeEvidence, includeRawText }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Export Data</Text>
            <Text style={styles.subtitle}>Export report</Text>
          </View>
        </View>

        {/* Export Format Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          
          {formats.map((format) => (
            <TouchableOpacity
              key={format.id}
              style={[
                styles.formatOption,
                selectedFormat === format.id && styles.selectedFormat
              ]}
              onPress={() => setSelectedFormat(format.id)}
            >
              <View style={styles.formatIcon}>
                <Text style={styles.formatIconText}>{format.icon}</Text>
              </View>
              <View style={styles.formatInfo}>
                <Text style={styles.formatTitle}>{format.title}</Text>
                <Text style={styles.formatDescription}>{format.description}</Text>
              </View>
              <View style={styles.formatMeta}>
                <Text style={styles.formatSize}>{format.size}</Text>
                <View style={[
                  styles.radioButton,
                  selectedFormat === format.id && styles.radioButtonSelected
                ]}>
                  {selectedFormat === format.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Include Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Include Data</Text>
          
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setIncludeEvidence(!includeEvidence)}
          >
            <View style={[
              styles.checkbox,
              includeEvidence && styles.checkboxSelected
            ]}>
              {includeEvidence && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Include Evidence Sources</Text>
              <Text style={styles.optionDescription}>
                Add supporting evidence and source references for each claim
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setIncludeRawText(!includeRawText)}
          >
            <View style={[
              styles.checkbox,
              includeRawText && styles.checkboxSelected
            ]}>
              {includeRawText && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Include Raw Text</Text>
              <Text style={styles.optionDescription}>
                Add the full extracted document text (increases file size)
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Export Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Preview</Text>
          
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>
              TechCorp_Sustainability_Analysis.{selectedFormat.toLowerCase()}
            </Text>
            <Text style={styles.previewDescription}>
              Contains {includeEvidence ? '12 claims with evidence sources' : '12 claims'} 
              {includeRawText ? ' and full document text' : ''}
            </Text>
            <Text style={styles.previewSize}>
              Estimated size: {includeRawText ? '~2.1 MB' : '~45 KB'}
            </Text>
          </View>
        </View>

        {/* Export Button */}
        <View style={styles.exportSection}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleExport}
          >
            <Text style={styles.exportButtonText}>
              ↓ Export as {selectedFormat}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
    marginBottom: 16,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    marginBottom: 12,
  },
  selectedFormat: {
    borderColor: '#007AFF',
    backgroundColor: '#F8F9FF',
  },
  formatIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  formatIconText: {
    fontSize: 24,
  },
  formatInfo: {
    flex: 1,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  formatDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  formatMeta: {
    alignItems: 'flex-end',
  },
  formatSize: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  previewContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  previewSize: {
    fontSize: 12,
    color: '#999',
  },
  exportSection: {
    padding: 20,
  },
  exportButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});