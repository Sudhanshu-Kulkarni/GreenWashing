import React from 'react';
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

export default function HistoryScreen({ navigation }) {
  // Get documents from DataService instead of hardcoded data
  const documents = DataService.getAllDocuments();

  // Helper function to format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 15) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Handle document selection - navigate directly to Claims tab
  const handleDocumentPress = (document) => {
    // Only navigate to claims if document is completed and has claims
    if (document.status === 'completed') {
      navigation.navigate('ClaimReview', {
        documentId: document.id,
        document: document,
        fromHistory: true, // Flag to indicate navigation came from History
      });
    }
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
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>{documents.length} documents scanned</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents..."
            placeholderTextColor="#999"
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity style={[styles.filterTab, styles.activeTab]}>
            <Text style={[styles.filterText, styles.activeFilterText]}>All</Text>
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{documents.length}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterText}>Completed</Text>
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {documents.filter(doc => doc.status === 'completed').length}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterText}>Processing</Text>
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {documents.filter(doc => doc.status === 'processing').length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Document List */}
        <View style={styles.documentList}>
          {documents.map((doc) => (
            <TouchableOpacity 
              key={doc.id} 
              style={[
                styles.documentCard,
                doc.status === 'processing' && styles.disabledCard
              ]}
              onPress={() => handleDocumentPress(doc)}
              disabled={doc.status === 'processing'}
            >
              <View style={styles.documentIcon}>
                <Text style={styles.documentIconText}>📄</Text>
              </View>
              <View style={styles.documentInfo}>
                <View style={styles.documentHeader}>
                  <Text style={styles.documentTitle}>{truncateText(doc.title)}</Text>
                  <View style={[
                    styles.statusBadge,
                    doc.status === 'completed' ? styles.completedBadge : styles.processingBadge
                  ]}>
                    <Text style={[
                      styles.statusText,
                      doc.status === 'completed' ? styles.completedText : styles.processingText
                    ]}>
                      {doc.status === 'completed' ? 'Completed' : 'Processing'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.moreButton}>
                    <Text style={styles.moreIcon}>⋮</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.documentFilename}>{truncateText(doc.filename, 20)}</Text>
                <View style={styles.documentMeta}>
                  <Text style={styles.metaText}>{doc.size}</Text>
                  <Text style={styles.metaText}>•</Text>
                  <Text style={styles.metaText}>{formatDate(doc.uploadDate)}</Text>
                </View>
                {doc.status === 'completed' ? (
                  <View style={styles.documentStats}>
                    <Text style={styles.statText}>📄 {doc.summary?.totalClaims || 0} claims</Text>
                    {(doc.summary?.flagged || 0) > 0 && (
                      <Text style={styles.statText}>● {doc.summary.flagged} flagged</Text>
                    )}
                    <Text style={styles.modeText}>{doc.processingMode}</Text>
                  </View>
                ) : (
                  <View style={styles.processingStatus}>
                    <Text style={styles.processingText}>🔄 Processing...</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
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
  searchContainer: {
    padding: 20,
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  activeTab: {
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
  documentList: {
    paddingHorizontal: 20,
  },
  documentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  disabledCard: {
    opacity: 0.6,
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
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  completedBadge: {
    backgroundColor: '#E8F5E8',
  },
  processingBadge: {
    backgroundColor: '#E3F2FD',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  completedText: {
    color: '#00C851',
  },
  processingText: {
    color: '#007AFF',
  },
  moreButton: {
    padding: 4,
  },
  moreIcon: {
    fontSize: 16,
    color: '#666',
  },
  documentFilename: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  documentStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  modeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 'auto',
  },
  processingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});