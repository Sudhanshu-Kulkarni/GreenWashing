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
import { useErrorHandler } from '../hooks/useErrorHandler';
import { safeNavigate } from '../utils/navigationUtils';

export default function SimpleDashboard({ navigation }) {
  const { error, loading, executeWithErrorHandling } = useErrorHandler();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalClaims: 0,
    flagged: 0
  });
  const [lastDocument, setLastDocument] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    await executeWithErrorHandling(
      async () => {
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Load stats and last document
        const overallStats = DataService.calculateOverallStats();
        const allDocuments = DataService.getAllDocuments();
        const lastDoc = allDocuments.length > 0 ? allDocuments[0] : null;
        
        setStats(overallStats);
        setLastDocument(lastDoc);
      },
      {
        errorContext: 'loading dashboard data',
        loadingMessage: 'Loading dashboard...'
      }
    );
  };

  const handleStatsCardPress = (type) => {
    const screenMap = {
      'reports': 'ReportsList',
      'claims': 'ClaimsOverview',
      'flagged': 'FlaggedClaims'
    };
    
    const screenName = screenMap[type];
    if (screenName) {
      safeNavigate(navigation, screenName);
    } else {
      console.warn('Unknown stats card type:', type);
    }
  };

  const handleDocumentPress = () => {
    if (lastDocument) {
      safeNavigate(navigation, 'DocumentDetails', {
        documentId: lastDocument.id,
        document: lastDocument
      });
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (err) {
      console.error('Date formatting error:', err);
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Loading dashboard..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Dashboard Error"
          message={error}
          onRetry={loadDashboardData}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>GreenCheck</Text>
          <Text style={styles.subtitle}>Climate claim analysis</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => handleStatsCardPress('reports')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats.totalDocuments}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => handleStatsCardPress('claims')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats.totalClaims}</Text>
            <Text style={styles.statLabel}>Claims</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => handleStatsCardPress('flagged')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats.flagged}</Text>
            <Text style={styles.statLabel}>Flagged</Text>
          </TouchableOpacity>
        </View>

        {/* Scan New Document Button */}
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => navigation.navigate('Import')}
        >
          <View style={styles.scanButtonContent}>
            <Text style={styles.scanButtonText}>Scan New Document</Text>
            <Text style={styles.scanButtonSubtext}>
              Analyze sustainability reports and climate claims
            </Text>
            <View style={styles.scanIcon}>
              <Text style={styles.scanIconText}>📄</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Last Scan Section */}
        {lastDocument ? (
          <View style={styles.lastScanSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Last Scan</Text>
              <Text style={styles.sectionDate}>
                {formatDate(lastDocument.uploadDate)}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.documentCard}
              onPress={handleDocumentPress}
            >
              <View style={styles.documentIcon}>
                <Text style={styles.documentIconText}>📄</Text>
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle} numberOfLines={1}>
                  {lastDocument.title}
                </Text>
                <Text style={styles.documentFilename} numberOfLines={1}>
                  {lastDocument.filename}
                </Text>
                <View style={styles.documentStats}>
                  <Text style={styles.documentStat}>
                    📄 {lastDocument.summary?.totalClaims || 0} claims
                  </Text>
                  <Text style={styles.documentStat}>
                    ⚠️ {lastDocument.summary?.flagged || 0} flagged
                  </Text>
                  {lastDocument.status === 'completed' && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>Completed</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.processingMode}>
                  Processed {lastDocument.processingMode || 'Unknown'}
                </Text>
              </View>
              <Text style={styles.viewDetailsText}>View Details →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.lastScanSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Documents</Text>
            </View>
            <View style={styles.emptyDocumentCard}>
              <Text style={styles.emptyDocumentText}>
                No documents processed yet
              </Text>
              <TouchableOpacity 
                style={styles.emptyDocumentButton}
                onPress={() => navigation.navigate('Import')}
              >
                <Text style={styles.emptyDocumentButtonText}>
                  Import your first document
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('Import')}
          >
            <Text style={styles.navIcon}>+</Text>
            <Text style={styles.navLabel}>Import File</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.navIcon}>🕒</Text>
            <Text style={styles.navLabel}>View History</Text>
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
    padding: 20,
    backgroundColor: '#fff',
    position: 'relative',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  settingsButton: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  settingsIcon: {
    fontSize: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 0,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scanButton: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scanButtonContent: {
    backgroundColor: '#007AFF',
    padding: 20,
    position: 'relative',
  },
  scanButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  scanButtonSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  scanIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  scanIconText: {
    fontSize: 24,
  },
  lastScanSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionDate: {
    fontSize: 14,
    color: '#666',
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  documentFilename: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  documentStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentStat: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#00C851',
    fontWeight: '500',
  },
  processingMode: {
    fontSize: 12,
    color: '#666',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  emptyDocumentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyDocumentText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyDocumentButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyDocumentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});