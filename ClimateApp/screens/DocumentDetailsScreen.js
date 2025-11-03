import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { DataService } from '../services/dataService';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import AnimatedTabBar from '../components/AnimatedTabBar';
import AnimatedTouchable from '../components/AnimatedTouchable';

export default function DocumentDetailsScreen({ navigation, route }) {
  const { documentId, initialTab = 'Overview' } = route.params || {};
  const [activeTab, setActiveTab] = useState(initialTab);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDocumentData();
  }, [documentId]);

  const loadDocumentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let docData = null;
      
      if (documentId) {
        docData = DataService.getDocumentById(documentId);
        if (!docData) {
          throw new Error(`Document with ID "${documentId}" not found`);
        }
      } else {
        // Fallback to first document if no ID provided
        const allDocs = DataService.getAllDocuments();
        if (allDocs.length > 0) {
          docData = allDocs[0];
        } else {
          throw new Error('No documents available');
        }
      }
      
      setDocument(docData);
    } catch (err) {
      console.error('Error loading document data:', err);
      setError(err.message || 'Failed to load document data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = (tab) => {
    try {
      if (tab === 'Claims') {
        if (!document) {
          console.error('No document available for claims navigation');
          return;
        }
        // Navigate to Claim Review screen with document context
        navigation.navigate('ClaimReview', {
          documentId: document.id,
          document: document,
          fromDocumentDetails: true
        });
      } else {
        setActiveTab(tab);
      }
    } catch (err) {
      console.error('Navigation error:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Loading document..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Document Error"
          message={error}
          onRetry={loadDocumentData}
        />
      </SafeAreaView>
    );
  }

  if (!document) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Document Not Found"
          message="The requested document could not be found."
          onRetry={() => navigation.goBack()}
          retryText="Go Back"
        />
      </SafeAreaView>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return renderOverviewContent();
      case 'Full Text':
        return renderFullTextContent();
      default:
        return renderOverviewContent();
    }
  };

  const renderOverviewContent = () => (
    <>
      {/* Document Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📄</Text>
          <Text style={styles.sectionTitle}>Document Information</Text>
        </View>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>File Name</Text>
              <Text style={styles.infoValue} numberOfLines={2}>{document.filename}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>File Size</Text>
              <Text style={styles.infoValue}>{document.size || 'Unknown'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Pages</Text>
              <Text style={styles.infoValue}>{document.pages || 'Unknown'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Upload Date</Text>
              <Text style={styles.infoValue}>
                {new Date(document.uploadDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Processing Mode</Text>
              <Text style={styles.infoValue}>{document.processingMode || 'Unknown'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusIndicator, 
                  { backgroundColor: document.status === 'completed' ? '#00C851' : '#FF9500' }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: document.status === 'completed' ? '#00C851' : '#FF9500' }
                ]}>
                  {document.status?.charAt(0).toUpperCase() + document.status?.slice(1) || 'Unknown'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Analysis Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analysis Summary</Text>
        
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{document.summary?.totalClaims || 0}</Text>
            <Text style={styles.summaryLabel}>Total Claims</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#00C851' }]}>
              {document.summary?.verified || 0}
            </Text>
            <Text style={styles.summaryLabel}>Verified</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#FF9500' }]}>
              {document.summary?.questionable || 0}
            </Text>
            <Text style={styles.summaryLabel}>Questionable</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#FF4444' }]}>
              {document.summary?.unverified || 0}
            </Text>
            <Text style={styles.summaryLabel}>Unverified</Text>
          </View>
        </View>

        {/* Verification Status Breakdown */}
        {document.summary?.totalClaims > 0 && (
          <View style={styles.verificationBreakdown}>
            <Text style={styles.breakdownTitle}>Verification Breakdown</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressSegment, 
                  { 
                    flex: document.summary.verified,
                    backgroundColor: '#00C851'
                  }
                ]} 
              />
              <View 
                style={[
                  styles.progressSegment, 
                  { 
                    flex: document.summary.questionable,
                    backgroundColor: '#FF9500'
                  }
                ]} 
              />
              <View 
                style={[
                  styles.progressSegment, 
                  { 
                    flex: document.summary.unverified,
                    backgroundColor: '#FF4444'
                  }
                ]} 
              />
            </View>
            <View style={styles.progressLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#00C851' }]} />
                <Text style={styles.legendText}>Verified</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FF9500' }]} />
                <Text style={styles.legendText}>Questionable</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FF4444' }]} />
                <Text style={styles.legendText}>Unverified</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Export Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export Options</Text>
        
        <AnimatedTouchable 
          style={styles.exportButton}
          onPress={() => navigation.navigate('ExportData', { documentId: document.id })}
          accessibilityLabel="Export as CSV"
          accessibilityHint="Export document data as CSV file"
          animationType="scale"
        >
          <Text style={styles.exportButtonText}>↓ Export as CSV</Text>
        </AnimatedTouchable>
      </View>
    </>
  );

  const renderFullTextContent = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Full Document Text</Text>
      <Text style={styles.fullTextContent}>
        This is a placeholder for the full document text content. In a real implementation, 
        this would display the extracted text from the PDF document with proper formatting 
        and highlighting of identified claims.
        {'\n\n'}
        The document contains sustainability claims that have been analyzed and categorized 
        by the NLP service. Users can switch to the Claims tab to review the detailed 
        analysis of each claim.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Document Details</Text>
            <Text style={styles.filename}>{document.filename}</Text>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <AnimatedTabBar
            tabs={['Overview', 'Full Text', 'Claims']}
            activeTab={activeTab}
            onTabPress={handleTabPress}
            showCounts={true}
            counts={{
              'Claims': document.summary.totalClaims || 0
            }}
            style={styles.animatedTabBar}
          />
        </View>

        {/* Tab Content */}
        {renderTabContent()}
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
  filename: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
  },
  shareIcon: {
    fontSize: 20,
    color: '#007AFF',
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  animatedTabBar: {
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  fullTextContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#00C851',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C851',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  exportButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  verificationBreakdown: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  progressSegment: {
    height: '100%',
  },
  progressLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});