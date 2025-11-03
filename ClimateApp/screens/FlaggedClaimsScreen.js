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

export default function FlaggedClaimsScreen({ navigation }) {
  const [expandedDocuments, setExpandedDocuments] = useState({});
  const [flaggedClaims, setFlaggedClaims] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    // Load flagged claims from DataService
    const loadedFlaggedClaims = DataService.getFlaggedClaims();
    const loadedDocuments = DataService.getAllDocuments().filter(doc => doc.status === 'completed');
    setFlaggedClaims(loadedFlaggedClaims);
    setDocuments(loadedDocuments);
  }, []);

  const getGroupedFlaggedClaims = () => {
    try {
      const grouped = {};
      
      if (!Array.isArray(flaggedClaims)) {
        console.warn('Flagged claims is not an array');
        return {};
      }
      
      flaggedClaims.forEach(claim => {
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
      console.error('Error grouping flagged claims:', error);
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

  const groupedClaims = getGroupedFlaggedClaims();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Flagged Claims</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>
          Claims requiring attention ({flaggedClaims.length})
        </Text>
        
        {/* Grouped Claims by Document */}
        <View style={styles.claimsContainer}>
          {Object.entries(groupedClaims).map(([documentId, { document, claims }]) => (
            <View key={documentId} style={styles.documentGroup}>
              {/* Document Header */}
              <TouchableOpacity
                style={styles.documentHeader}
                onPress={() => toggleDocumentExpansion(documentId)}
              >
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>{document?.title || 'Unknown Document'}</Text>
                  <Text style={styles.claimsCount}>
                    {claims.length} flagged claim{claims.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.expandIcon}>
                  {expandedDocuments[documentId] ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {/* Claims List (Expandable) */}
              {expandedDocuments[documentId] && (
                <View style={styles.claimsSection}>
                  {claims.map((claim, index) => (
                    <TouchableOpacity
                      key={claim.id}
                      style={styles.claimCard}
                      onPress={() => handleClaimPress(claim)}
                    >
                      <View style={styles.claimHeader}>
                        <View style={styles.flagIcon}>
                          <Text style={styles.flagEmoji}>⚠️</Text>
                        </View>
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
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Empty State */}
          {Object.keys(groupedClaims).length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No flagged claims found
              </Text>
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  claimsContainer: {
    padding: 20,
    paddingTop: 0,
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
    borderLeftColor: '#FF8800',
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  flagIcon: {
    marginRight: 8,
  },
  flagEmoji: {
    fontSize: 16,
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
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});