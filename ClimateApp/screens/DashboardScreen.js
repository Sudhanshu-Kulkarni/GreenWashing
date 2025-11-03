import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import AnimatedTouchable from '../components/AnimatedTouchable';
import FadeInView from '../components/FadeInView';
import LoadingState from '../components/LoadingState';
import { DataService } from '../services/dataService';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [recentDocument, setRecentDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get overall statistics
      const overallStats = DataService.calculateOverallStats();
      setStats(overallStats);

      // Get most recent completed document
      const completedDocuments = DataService.getDocumentsByStatus('completed');
      if (completedDocuments.length > 0) {
        // Sort by upload date and get the most recent
        const sortedDocs = completedDocuments.sort((a, b) => 
          new Date(b.uploadDate) - new Date(a.uploadDate)
        );
        setRecentDocument(sortedDocs[0]);
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState message="Loading dashboard..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadDashboardData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasData = stats && stats.totalDocuments > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <FadeInView delay={0}>
          <View style={styles.header}>
            <Text style={styles.title}>GreenCheck</Text>
            <Text style={styles.subtitle}>Climate claim analysis</Text>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
              accessibilityLabel="Settings"
              accessibilityHint="Open app settings"
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* Stats Cards */}
        <FadeInView delay={100}>
          <View style={styles.statsContainer}>
            <AnimatedTouchable
              style={styles.statCard}
              onPress={() => navigation.navigate('ReportsList')}
              accessibilityLabel={`Reports: ${stats?.totalDocuments || 0} processed documents`}
              accessibilityHint="Tap to view all reports"
              animationType="scale"
            >
              <Text style={styles.statNumber}>{stats?.totalDocuments || 0}</Text>
              <Text style={styles.statLabel}>Reports</Text>
            </AnimatedTouchable>
            <AnimatedTouchable
              style={styles.statCard}
              onPress={() => navigation.navigate('ClaimsOverview')}
              accessibilityLabel={`Claims: ${stats?.totalClaims || 0} total claims`}
              accessibilityHint="Tap to view all claims"
              animationType="scale"
            >
              <Text style={styles.statNumber}>{stats?.totalClaims || 0}</Text>
              <Text style={styles.statLabel}>Claims</Text>
            </AnimatedTouchable>
            <AnimatedTouchable
              style={styles.statCard}
              onPress={() => navigation.navigate('FlaggedClaims')}
              accessibilityLabel={`Flagged: ${stats?.flagged || 0} flagged claims`}
              accessibilityHint="Tap to view flagged claims"
              animationType="scale"
            >
              <Text style={styles.statNumber}>{stats?.flagged || 0}</Text>
              <Text style={styles.statLabel}>Flagged</Text>
            </AnimatedTouchable>
          </View>
        </FadeInView>

        {/* Scan New Document Button */}
        <FadeInView delay={200}>
          <AnimatedTouchable 
            style={styles.scanButton}
            onPress={() => navigation.navigate('Import')}
            accessibilityLabel="Scan New Document"
            accessibilityHint="Tap to import and analyze a new document"
            animationType="scale"
            scaleValue={0.98}
          >
            <Text style={styles.scanButtonText}>Scan New Document</Text>
            <Text style={styles.scanButtonSubtext}>
              Analyze sustainability reports and climate claims
            </Text>
            <Text style={styles.scanIcon}>📄</Text>
          </AnimatedTouchable>
        </FadeInView>

        {/* Recent Document Section */}
        <FadeInView delay={300}>
          {hasData && recentDocument ? (
            <View style={styles.lastScanSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Document</Text>
                <Text style={styles.sectionDate}>{formatDate(recentDocument.uploadDate)}</Text>
              </View>
            
              <AnimatedTouchable 
                style={styles.documentCard}
                onPress={() => navigation.navigate('DocumentDetails', { documentId: recentDocument.id })}
                accessibilityLabel={`${recentDocument.title} document`}
                accessibilityHint="Tap to view document details and claims"
                animationType="scale"
                scaleValue={0.98}
              >
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>📄</Text>
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle} numberOfLines={1}>
                    {recentDocument.title}
                  </Text>
                  <Text style={styles.documentFilename} numberOfLines={1}>
                    {recentDocument.filename}
                  </Text>
                  <View style={styles.documentStats}>
                    <Text style={styles.documentStat}>
                      📄 {recentDocument.summary?.totalClaims || 0} claims
                    </Text>
                    {recentDocument.summary?.flagged > 0 && (
                      <Text style={[styles.documentStat, { marginLeft: 12 }]}>
                        ⚠️ {recentDocument.summary.flagged} flagged
                      </Text>
                    )}
                    {recentDocument.summary?.verified > 0 && (
                      <View style={[styles.verifiedBadge, { marginLeft: 12 }]}>
                        <Text style={styles.verifiedText}>
                          {recentDocument.summary.verified} Verified
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.processingMode}>
                    {recentDocument.processingMode || 'Python'}
                  </Text>
                </View>
                <AnimatedTouchable 
                  style={styles.viewDetailsButton}
                  onPress={() => navigation.navigate('DocumentDetails', { documentId: recentDocument.id })}
                  accessibilityLabel="View Details"
                  accessibilityHint="Navigate to document details"
                  animationType="opacity"
                >
                  <Text style={styles.viewDetailsText}>View Details →</Text>
                </AnimatedTouchable>
              </AnimatedTouchable>
            </View>
          ) : (
            <View style={styles.emptyStateSection}>
              <View style={styles.emptyStateIcon}>
                <Text style={styles.emptyStateIconText}>📄</Text>
              </View>
              <Text style={styles.emptyStateTitle}>No Documents Yet</Text>
              <Text style={styles.emptyStateMessage}>
                Upload your first sustainability report to start analyzing ESG claims
              </Text>
              <AnimatedTouchable 
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('Import')}
                accessibilityLabel="Upload First Document"
                accessibilityHint="Navigate to document upload screen"
                animationType="scale"
              >
                <Text style={styles.emptyStateButtonText}>Upload First Document</Text>
              </AnimatedTouchable>
            </View>
          )}
        </FadeInView>

        {/* Bottom Navigation */}
        <FadeInView delay={400}>
          <View style={styles.bottomNav}>
            <AnimatedTouchable 
              style={styles.navButton}
              onPress={() => navigation.navigate('Import')}
              accessibilityLabel="Import File"
              accessibilityHint="Import a new document for analysis"
              animationType="scale"
            >
              <Text style={styles.navIcon}>+</Text>
              <Text style={styles.navLabel}>Import File</Text>
            </AnimatedTouchable>
            <AnimatedTouchable 
              style={styles.navButton}
              onPress={() => navigation.navigate('History')}
              accessibilityLabel="View History"
              accessibilityHint="View all processed documents"
              animationType="scale"
            >
              <Text style={styles.navIcon}>🕒</Text>
              <Text style={styles.navLabel}>View History</Text>
            </AnimatedTouchable>
          </View>
        </FadeInView>
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
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
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
    padding: 20,
    backgroundColor: '#007AFF',
    borderRadius: 16,
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
    fontSize: 24,
  },
  lastScanSection: {
    padding: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyStateSection: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#F0F0F0',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateIconText: {
    fontSize: 40,
    opacity: 0.5,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewDetailsButton: {
    marginLeft: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  navButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
});