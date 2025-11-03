import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { DataService } from '../services/dataService';
import { SkeletonCard } from '../components/SkeletonLoader';
import AnimatedTouchable from '../components/AnimatedTouchable';

export default function ReportsListScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      const documents = DataService.getAllDocuments();
      
      if (!Array.isArray(documents)) {
        throw new Error('Invalid documents data received');
      }
      
      setReports(documents);
    } catch (error) {
      console.error('Error loading reports:', error);
      // Could set an error state here if needed
      setReports([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentPress = (document) => {
    try {
      if (!document || !document.id) {
        console.error('Invalid document data for navigation:', document);
        return;
      }
      navigation.navigate('DocumentDetails', { 
        documentId: document.id,
        document: document 
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown date';
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>Completed</Text>
        </View>
      );
    } else if (status === 'processing') {
      return (
        <View style={styles.processingBadge}>
          <Text style={styles.processingText}>Processing</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📄</Text>
      <Text style={styles.emptyTitle}>No Reports Found</Text>
      <Text style={styles.emptyMessage}>
        Upload and process documents to see them here
      </Text>
      <AnimatedTouchable 
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Import')}
        accessibilityLabel="Import Document"
        accessibilityHint="Import a new document to get started"
        animationType="scale"
      >
        <Text style={styles.emptyButtonText}>Import Document</Text>
      </AnimatedTouchable>
    </View>
  );

  const renderLoadingState = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.subtitle}>Loading reports...</Text>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reports</Text>
      </View>

      {loading ? (
        renderLoadingState()
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.subtitle}>
            All processed documents ({reports.length})
          </Text>
          
          {reports.length === 0 ? (
            renderEmptyState()
          ) : (
            reports.map((report) => {
              // Validate report data before rendering
              if (!report || !report.id) {
                console.warn('Invalid report data:', report);
                return null;
              }
              
              return (
                <AnimatedTouchable
                  key={report.id}
                  style={styles.reportCard}
                  onPress={() => handleDocumentPress(report)}
                  accessibilityLabel={`${report.title || 'Untitled Document'} report`}
                  accessibilityHint={`${report.summary?.totalClaims || 0} claims, ${report.summary?.flagged || 0} flagged. Tap to view details.`}
                  animationType="scale"
                  scaleValue={0.98}
                >
                  <View style={styles.documentIcon}>
                    <Text style={styles.documentIconText}>📄</Text>
                  </View>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportTitle} numberOfLines={2}>
                      {report.title || 'Untitled Document'}
                    </Text>
                    <Text style={styles.reportFilename} numberOfLines={1}>
                      {report.filename || 'unknown.pdf'}
                    </Text>
                    <View style={styles.reportMeta}>
                      <Text style={styles.reportDate}>
                        {formatDate(report.uploadDate)}
                      </Text>
                      {getStatusBadge(report.status)}
                    </View>
                    <View style={styles.reportStats}>
                      <Text style={styles.reportStat}>
                        📄 {report.summary?.totalClaims || 0} claims
                      </Text>
                      <Text style={styles.reportStat}>
                        ⚠️ {report.summary?.flagged || 0} flagged
                      </Text>
                      <Text style={styles.reportStat}>
                        ✅ {report.summary?.verified || 0} verified
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.viewDetailsText}>View Details →</Text>
                </AnimatedTouchable>
              );
            }).filter(Boolean)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  backIcon: {
    fontSize: 24,
    color: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  documentIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentIconText: {
    fontSize: 20,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reportFilename: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  completedBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedText: {
    fontSize: 10,
    color: '#00C851',
    fontWeight: '500',
  },
  processingBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  processingText: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '500',
  },
  reportStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reportStat: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
    marginBottom: 2,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});