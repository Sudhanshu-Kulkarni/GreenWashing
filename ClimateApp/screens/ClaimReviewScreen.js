import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';

import { DataService } from '../services/dataService';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { SkeletonStatCard, SkeletonClaimCard } from '../components/SkeletonLoader';
import AnimatedTouchable from '../components/AnimatedTouchable';

export default function ClaimReviewScreen({ navigation, route }) {
  const { documentId, document, fromDocumentDetails, fromHistory } = route.params || {};
  const [activeFilter, setActiveFilter] = useState('All Claims');
  const [searchText, setSearchText] = useState('');
  const [documentData, setDocumentData] = useState(document);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClaimsData();
  }, [documentId, document]);

  const loadClaimsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let docData = documentData;
      let claimsData = [];
      
      // Load document data if not provided
      if (!docData && documentId) {
        docData = DataService.getDocumentById(documentId);
        if (!docData) {
          throw new Error(`Document with ID "${documentId}" not found`);
        }
        setDocumentData(docData);
      }

      // Load claims based on document context
      if (docData) {
        claimsData = docData.claims || [];
      } else if (documentId) {
        claimsData = DataService.getClaimsByDocumentId(documentId);
      } else {
        // If no document context, show error
        throw new Error('No document context provided for claim review');
      }
      
      setClaims(claimsData);
    } catch (err) {
      console.error('Error loading claims data:', err);
      setError(err.message || 'Failed to load claims data');
    } finally {
      setLoading(false);
    }
  };

  // Filter claims based on active filter with error handling
  const filteredClaims = React.useMemo(() => {
    try {
      if (!Array.isArray(claims)) {
        console.warn('Claims is not an array');
        return [];
      }
      
      return claims.filter(claim => {
        if (!claim || typeof claim.status !== 'string') {
          console.warn('Invalid claim data:', claim);
          return false;
        }
        
        if (activeFilter === 'All Claims') return true;
        return claim.status === activeFilter.toLowerCase();
      });
    } catch (err) {
      console.error('Error filtering claims:', err);
      return [];
    }
  }, [claims, activeFilter]);

  // Calculate filter counts with error handling
  const filterCounts = React.useMemo(() => {
    try {
      if (!Array.isArray(claims)) {
        return {
          'All Claims': 0,
          'Verified': 0,
          'Questionable': 0,
          'Unverified': 0,
        };
      }
      
      const validClaims = claims.filter(claim => 
        claim && typeof claim.status === 'string'
      );
      
      return {
        'All Claims': validClaims.length,
        'Verified': validClaims.filter(c => c.status === 'verified').length,
        'Questionable': validClaims.filter(c => c.status === 'questionable').length,
        'Unverified': validClaims.filter(c => c.status === 'unverified').length,
      };
    } catch (err) {
      console.error('Error calculating filter counts:', err);
      return {
        'All Claims': 0,
        'Verified': 0,
        'Questionable': 0,
        'Unverified': 0,
      };
    }
  }, [claims]);

  // Helper function to get status display properties
  const getStatusProperties = (status) => {
    switch (status) {
      case 'verified':
        return { color: '#00C851', bgColor: '#E8F5E8', icon: '✓', borderColor: '#00C851' };
      case 'questionable':
        return { color: '#FF9500', bgColor: '#FFF3E0', icon: '⚠', borderColor: '#FF9500' };
      case 'unverified':
        return { color: '#FF4444', bgColor: '#FFEBEE', icon: '✗', borderColor: '#FF4444' };
      default:
        return { color: '#666', bgColor: '#f0f0f0', icon: '?', borderColor: '#666' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          {/* Header Skeleton */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>Claim Review</Text>
              <Text style={styles.subtitle}>Loading...</Text>
            </View>
          </View>

          {/* Status Cards Skeleton */}
          <View style={styles.statusContainer}>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </View>

          {/* Claims Skeleton */}
          <View style={styles.claimsContainer}>
            <SkeletonClaimCard />
            <SkeletonClaimCard />
            <SkeletonClaimCard />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Claims Error"
          message={error}
          onRetry={loadClaimsData}
        />
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
            <Text style={styles.title}>Claim Review</Text>
            <Text style={styles.subtitle}>
              {documentData?.title || 'All Documents'}
            </Text>
          </View>
        </View>

        {/* Status Cards */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusCard, { backgroundColor: '#E8F5E8' }]}>
            <Text style={[styles.statusNumber, { color: '#00C851' }]}>
              {filterCounts.Verified}
            </Text>
            <Text style={styles.statusLabel}>Verified</Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={[styles.statusNumber, { color: '#FF9500' }]}>
              {filterCounts.Questionable}
            </Text>
            <Text style={styles.statusLabel}>Questionable</Text>
          </View>
          <View style={[styles.statusCard, { backgroundColor: '#FFEBEE' }]}>
            <Text style={[styles.statusNumber, { color: '#FF4444' }]}>
              {filterCounts.Unverified}
            </Text>
            <Text style={styles.statusLabel}>Unverified</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search claims..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {Object.entries(filterCounts).map(([filter, count]) => (
            <AnimatedTouchable
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.activeFilterTab
              ]}
              onPress={() => setActiveFilter(filter)}
              accessibilityLabel={`${filter} filter`}
              accessibilityHint={`Show ${filter.toLowerCase()} claims${count > 0 ? `, ${count} items` : ''}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeFilter === filter }}
              animationType="scale"
              scaleValue={0.95}
            >
              <Text style={[
                styles.filterText,
                activeFilter === filter && styles.activeFilterText
              ]}>
                {filter}
              </Text>
              {count > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{count}</Text>
                </View>
              )}
            </AnimatedTouchable>
          ))}
        </View>

        {/* Claims List */}
        <View style={styles.claimsContainer}>
          {filteredClaims.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyTitle}>No Claims Found</Text>
              <Text style={styles.emptyMessage}>
                {activeFilter === 'All Claims' 
                  ? 'This document has no claims to review.'
                  : `No ${activeFilter.toLowerCase()} claims found.`
                }
              </Text>
            </View>
          ) : (
            filteredClaims.map((claim) => {
            const statusProps = getStatusProperties(claim.status);
            return (
              <AnimatedTouchable 
                key={claim.id} 
                style={[
                  styles.claimCard,
                  { borderLeftColor: statusProps.borderColor, borderLeftWidth: 4 }
                ]}
                onPress={() => {/* Navigate to claim details */}}
                accessibilityLabel={`Claim ${claim.id}: ${claim.text.substring(0, 50)}...`}
                accessibilityHint={`${claim.status} claim with ${Math.round(claim.confidence * 100)}% confidence`}
                animationType="scale"
                scaleValue={0.98}
              >
                <View style={styles.claimHeader}>
                  <Text style={styles.claimNumber}>#{claim.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusProps.bgColor }]}>
                    <Text style={[styles.statusBadgeText, { color: statusProps.color }]}>
                      {statusProps.icon} {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.confidence,
                    { color: claim.confidence >= 0.8 ? '#00C851' : claim.confidence >= 0.6 ? '#FF9500' : '#FF4444' }
                  ]}>
                    {Math.round(claim.confidence * 100)}%
                  </Text>
                  <AnimatedTouchable 
                    style={styles.moreButton}
                    onPress={() => {/* Show more options */}}
                    accessibilityLabel="More options"
                    accessibilityHint="Show additional actions for this claim"
                    animationType="opacity"
                  >
                    <Text style={styles.moreIcon}>⋮</Text>
                  </AnimatedTouchable>
                </View>
                
                <Text style={styles.claimText}>
                  {claim.text}
                </Text>

                {/* Reasoning Section for questionable/unverified claims */}
                {(claim.status === 'questionable' || claim.status === 'unverified') && claim.reasoning && (
                  <View style={[styles.reasoningSection, { backgroundColor: statusProps.bgColor }]}>
                    <Text style={styles.reasoningLabel}>Verification Notes:</Text>
                    <Text style={styles.reasoningText}>{claim.reasoning}</Text>
                  </View>
                )}
                
                <View style={styles.claimFooter}>
                  <View style={styles.claimMeta}>
                    <Text style={styles.categoryText}>{claim.category}</Text>
                    {claim.evidence > 0 && (
                      <Text style={styles.evidenceText}>• {claim.evidence} evidence</Text>
                    )}
                  </View>
                  <AnimatedTouchable 
                    style={styles.viewDetailsButton}
                    onPress={() => {/* Navigate to claim details */}}
                    accessibilityLabel="View Details"
                    accessibilityHint="View detailed analysis of this claim"
                    animationType="opacity"
                  >
                    <Text style={styles.viewDetailsText}>View Details ↗</Text>
                  </AnimatedTouchable>
                </View>
              </AnimatedTouchable>
            );
          })
          )}
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <AnimatedTouchable 
            style={styles.exportButton}
            onPress={() => navigation.navigate('ExportData')}
            accessibilityLabel="Export Report"
            accessibilityHint="Export claims data as a report"
            animationType="scale"
          >
            <Text style={styles.exportButtonText}>Export Report</Text>
          </AnimatedTouchable>
          <AnimatedTouchable 
            style={styles.viewDocumentButton}
            onPress={() => {
              if (fromDocumentDetails) {
                navigation.goBack();
              } else if (fromHistory) {
                navigation.goBack(); // Go back to History screen
              } else {
                navigation.navigate('DocumentDetails', {
                  documentId: documentData?.id,
                  document: documentData
                });
              }
            }}
            accessibilityLabel={fromDocumentDetails ? 'Back to Document' : 
                               fromHistory ? 'Back to History' : 'View Document'}
            accessibilityHint="Navigate back or to document view"
            animationType="scale"
          >
            <Text style={styles.viewDocumentButtonText}>
              {fromDocumentDetails ? 'Back to Document' : 
               fromHistory ? 'Back to History' : 'View Document'}
            </Text>
          </AnimatedTouchable>
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
  statusContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 16,
  },
  statusCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statusNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  activeFilterTab: {
    backgroundColor: '#333',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  filterBadgeText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  claimsContainer: {
    paddingHorizontal: 20,
  },
  claimCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  claimNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confidence: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 'auto',
    marginRight: 8,
  },
  moreButton: {
    padding: 4,
  },
  moreIcon: {
    fontSize: 16,
    color: '#666',
  },
  claimText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  highlightedText: {
    backgroundColor: '#FFF3E0',
    color: '#FF9500',
    fontWeight: '600',
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  claimMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  evidenceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  viewDetailsButton: {
    padding: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exportButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  viewDocumentButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
  },
  viewDocumentButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 48,
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
    lineHeight: 22,
  },
  reasoningSection: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasoningLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
});