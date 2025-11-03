import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { DataService } from '../services/dataService';
import AnimatedTouchable from '../components/AnimatedTouchable';
import LoadingState from '../components/LoadingState';

export default function ClaimsOverviewScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedDocuments, setExpandedDocuments] = useState({});
  const [allClaims, setAllClaims] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClaimsData();
  }, []);

  const loadClaimsData = async () => {
    try {
      setError(null);
      
      // Load data from DataService
      const loadedClaims = DataService.getAllClaims();
      const loadedDocuments = DataService.getAllDocuments().filter(doc => doc.status === 'completed');
      
      setAllClaims(loadedClaims);
      setDocuments(loadedDocuments);
      
    } catch (err) {
      console.error('Error loading claims data:', err);
      setError('Failed to load claims data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadClaimsData();
  };

  const getFilteredClaims = () => {
    try {
      return DataService.filterClaimsByStatus(activeFilter);
    } catch (err) {
      console.error('Error filtering claims:', err);
      return [];
    }
  };

  const getStatusCounts = () => {
    try {
      const stats = DataService.calculateOverallStats();
      return {
        all: stats.totalClaims,
        verified: stats.verified,
        questionable: stats.questionable,
        unverified: stats.unverified
      };
    } catch (err) {
      console.error('Error calculating status counts:', err);
      return {
        all: 0,
        verified: 0,
        questionable: 0,
        unverified: 0
      };
    }
  };

  const getGroupedClaims = () => {
    try {
      const filteredClaims = getFilteredClaims();
      const grouped = {};
      
      if (!Array.isArray(filteredClaims)) {
        console.warn('Filtered claims is not an array');
        return {};
      }
      
      filteredClaims.forEach(claim => {
        if (!claim || !claim.documentId) {
          console.warn('Invalid claim data:', claim);
          return;
        }
        
        if (!grouped[claim.documentId]) {
          const document = documents.find(doc => doc.id === claim.documentId);
          if (!document) {
            console.warn('Document not found for claim:', claim.documentId);
            return;
          }
          
          grouped[claim.documentId] = {
            document: document,
            claims: []
          };
        }
        grouped[claim.documentId].claims.push(claim);
      });
      
      return grouped;
    } catch (error) {
      console.error('Error grouping claims:', error);
      return {};
    }
  };

  const toggleDocumentExpansion = (documentId) => {
    setExpandedDocuments(prev => ({
      ...prev,
      [documentId]: !prev[documentId]
    }));
  };

  const handleClaimPress = (claim) => {
    try {
      if (!claim || !claim.documentId) {
        console.error('Invalid claim data for navigation:', claim);
        return;
      }
      
      const document = documents.find(doc => doc.id === claim.documentId);
      if (!document) {
        console.error('Document not found for claim:', claim.documentId);
        return;
      }
      
      navigation.navigate('ClaimReview', { 
        documentId: claim.documentId,
        document: document,
        initialTab: 'claims'
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#00C851';
      case 'questionable': return '#FF8800';
      case 'unverified': return '#FF4444';
      default: return '#666';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Claims Overview</Text>
        </View>
        <LoadingState message="Loading claims..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Claims Overview</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadClaimsData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const counts = getStatusCounts();
  const groupedClaims = getGroupedClaims();
  const hasData = allClaims.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Claims Overview</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        {/* Filter Tabs - Only show if there's data */}
        {hasData && (
          <View style={styles.filterContainer}>
            <AnimatedTouchable
              style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
              onPress={() => setActiveFilter('all')}
              accessibilityLabel={`All Claims filter, ${counts.all} items`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeFilter === 'all' }}
              animationType="scale"
              scaleValue={0.95}
            >
              <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
                All ({counts.all})
              </Text>
            </AnimatedTouchable>
            <AnimatedTouchable
              style={[styles.filterTab, activeFilter === 'verified' && styles.activeFilterTab]}
              onPress={() => setActiveFilter('verified')}
              accessibilityLabel={`Verified filter, ${counts.verified} items`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeFilter === 'verified' }}
              animationType="scale"
              scaleValue={0.95}
            >
              <Text style={[styles.filterText, activeFilter === 'verified' && styles.activeFilterText]}>
                Verified ({counts.verified})
              </Text>
            </AnimatedTouchable>
            <AnimatedTouchable
              style={[styles.filterTab, activeFilter === 'questionable' && styles.activeFilterTab]}
              onPress={() => setActiveFilter('questionable')}
              accessibilityLabel={`Questionable filter, ${counts.questionable} items`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeFilter === 'questionable' }}
              animationType="scale"
              scaleValue={0.95}
            >
              <Text style={[styles.filterText, activeFilter === 'questionable' && styles.activeFilterText]}>
                Questionable ({counts.questionable})
              </Text>
            </AnimatedTouchable>
            <AnimatedTouchable
              style={[styles.filterTab, activeFilter === 'unverified' && styles.activeFilterTab]}
              onPress={() => setActiveFilter('unverified')}
              accessibilityLabel={`Unverified filter, ${counts.unverified} items`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeFilter === 'unverified' }}
              animationType="scale"
              scaleValue={0.95}
            >
              <Text style={[styles.filterText, activeFilter === 'unverified' && styles.activeFilterText]}>
                Unverified ({counts.unverified})
              </Text>
            </AnimatedTouchable>
          </View>
        )}

        {/* Claims Content */}
        <View style={styles.claimsContainer}>
          {hasData ? (
            <>
              {Object.entries(groupedClaims).map(([documentId, { document, claims }]) => (
                <View key={documentId} style={styles.documentGroup}>
                  {/* Document Header */}
                  <AnimatedTouchable
                    style={styles.documentHeader}
                    onPress={() => toggleDocumentExpansion(documentId)}
                    accessibilityLabel={`${document?.title || 'Unknown Document'}, ${claims.length} claims`}
                    accessibilityHint={`Tap to ${expandedDocuments[documentId] ? 'collapse' : 'expand'} claims list`}
                    accessibilityRole="button"
                    animationType="scale"
                    scaleValue={0.98}
                  >
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentTitle}>{document?.title || 'Unknown Document'}</Text>
                      <Text style={styles.claimsCount}>
                        {claims.length} claim{claims.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Text style={styles.expandIcon}>
                      {expandedDocuments[documentId] ? '▼' : '▶'}
                    </Text>
                  </AnimatedTouchable>

                  {/* Claims List (Expandable) */}
                  {expandedDocuments[documentId] && (
                    <View style={styles.claimsSection}>
                      {claims.map((claim, index) => (
                        <AnimatedTouchable
                          key={claim.id}
                          style={[
                            styles.claimCard,
                            { borderLeftColor: getStatusColor(claim.status) }
                          ]}
                          onPress={() => handleClaimPress(claim)}
                          accessibilityLabel={`Claim ${claim.id}: ${claim.text.substring(0, 50)}...`}
                          accessibilityHint={`${claim.status} claim with ${Math.round(claim.confidence * 100)}% confidence. Tap to view details.`}
                          animationType="scale"
                          scaleValue={0.98}
                        >
                          <View style={styles.claimHeader}>
                            <View style={styles.claimBadge}>
                              <Text style={styles.claimNumber}>#{claim.id}</Text>
                            </View>
                            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(claim.status) }]} />
                            <Text style={styles.confidenceText}>{Math.round(claim.confidence * 100)}%</Text>
                          </View>
                          <Text style={styles.claimText} numberOfLines={2}>
                            {claim.text}
                          </Text>
                          <View style={styles.claimFooter}>
                            <Text style={styles.categoryText}>{claim.category}</Text>
                            <Text style={styles.evidenceText}>
                              {claim.evidence} evidence
                            </Text>
                          </View>
                        </AnimatedTouchable>
                      ))}
                    </View>
                  )}
                </View>
              ))}

              {/* Filter-specific Empty State */}
              {Object.keys(groupedClaims).length === 0 && activeFilter !== 'all' && (
                <View style={styles.emptyState}>
                  <View style={styles.emptyStateIcon}>
                    <Text style={styles.emptyStateIconText}>🔍</Text>
                  </View>
                  <Text style={styles.emptyStateTitle}>No {activeFilter} claims found</Text>
                  <Text style={styles.emptyStateMessage}>
                    Try selecting a different filter to view other claims
                  </Text>
                </View>
              )}
            </>
          ) : (
            /* No Data Empty State */
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Text style={styles.emptyStateIconText}>📄</Text>
              </View>
              <Text style={styles.emptyStateTitle}>No Claims Available</Text>
              <Text style={styles.emptyStateMessage}>
                Upload and process sustainability reports to see ESG claims here
              </Text>
              <AnimatedTouchable 
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('Import')}
                accessibilityLabel="Upload Document"
                accessibilityHint="Navigate to document upload screen"
                animationType="scale"
              >
                <Text style={styles.emptyStateButtonText}>Upload Document</Text>
              </AnimatedTouchable>
            </View>
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
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  claimsContainer: {
    padding: 20,
    paddingTop: 10,
  },
  documentGroup: {
    marginBottom: 16,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
  claimsCount: {
    fontSize: 14,
    color: '#666',
  },
  expandIcon: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
  },
  claimsSection: {
    paddingLeft: 16,
  },
  claimCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E3F2FD',
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  claimBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  claimNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginLeft: 'auto',
  },
  claimText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  evidenceText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
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
});