# Dashboard Navigation Enhancement Design

## Overview

This design document outlines the implementation approach for making the dashboard stats cards interactive and creating a seamless navigation flow from documents to claims across different screens in the GreenCheck app.

## Architecture

### Navigation Flow Architecture
```
Dashboard
├── Stats Cards (Reports/Claims/Flagged) → Respective List Views
├── Document Card → Document Details
│   └── Claims Tab → Claim Review (Document-Specific)
└── History Button → History Screen
    └── Document Selection → Claim Review (Document-Specific)
```

### Screen Hierarchy
1. **Dashboard** (Entry Point)
2. **Reports List** (New Screen)
3. **Claims Overview** (New Screen) 
4. **Document Details** (Existing, Enhanced)
5. **Claim Review** (Existing, Enhanced with Tabs)
6. **History** (Existing, Enhanced Navigation)

## Components and Interfaces

### Enhanced Dashboard Component
- **Interactive Stats Cards**: Add onPress handlers to navigate to respective screens
- **Document Context**: Pass document data through navigation params
- **Visual Feedback**: Add press states and animations to stats cards

### New Screen Components

#### Reports List Screen
- Display all processed documents in a list format
- Show document metadata (name, date, status, claims count)
- Navigate to Document Details on document selection

#### Claims Overview Screen  
- Aggregate view of all claims across all documents
- Group by document with expandable sections
- Filter by status (All/Verified/Questionable/Unverified)
- Navigate to specific document's Claim Review on claim selection

### Enhanced Existing Components

#### Document Details Screen
- **Tab Navigation**: Implement proper tab switching
- **Claims Tab Integration**: Direct navigation to Claim Review
- **Context Preservation**: Maintain document context across navigation

#### Claim Review Screen
- **Tab System**: Implement four-tab filtering system
- **Dynamic Filtering**: Filter claims based on active tab
- **Count Display**: Show accurate counts in tab badges
- **Document Context**: Display document-specific claims only

#### History Screen
- **Direct Navigation**: Navigate to Claim Review instead of Document Details
- **Context Passing**: Pass document data for claim filtering

## Data Models

### Document Data Structure
```javascript
{
  id: string,
  title: string,
  filename: string,
  uploadDate: string,
  status: 'completed' | 'processing',
  claims: Claim[],
  summary: {
    totalClaims: number,
    verified: number,
    questionable: number,
    unverified: number,
    flagged: number
  }
}
```

### Navigation Parameters
```javascript
// For Document-specific screens
{
  documentId: string,
  document: DocumentData,
  initialTab?: 'overview' | 'fulltext' | 'claims'
}

// For Claims filtering
{
  filter: 'all' | 'verified' | 'questionable' | 'unverified' | 'flagged',
  documentId?: string // Optional for document-specific filtering
}
```

## Error Handling

### Navigation Error Scenarios
- **Missing Document Data**: Fallback to dashboard with error message
- **Invalid Document ID**: Show "Document not found" state
- **Empty Claims**: Show "No claims found" placeholder
- **Network Issues**: Handle offline state gracefully

### Data Validation
- Validate document existence before navigation
- Ensure claims data integrity
- Handle malformed navigation parameters

## Testing Strategy

### Unit Tests
- Stats card press handlers
- Navigation parameter passing
- Claims filtering logic
- Tab switching functionality

### Integration Tests
- End-to-end navigation flows
- Data consistency across screens
- Back navigation behavior
- Context preservation

### User Experience Tests
- Navigation timing and responsiveness
- Visual feedback on interactions
- Tab switching smoothness
- Data loading states

## Implementation Phases

### Phase 1: Core Navigation
1. Make stats cards interactive
2. Create Reports List screen
3. Create Claims Overview screen
4. Update navigation stack

### Phase 2: Enhanced Claim Review
1. Implement tab system in Claim Review
2. Add filtering logic
3. Update Document Details Claims tab
4. Enhance History navigation

### Phase 3: Polish and Optimization
1. Add loading states and animations
2. Implement error handling
3. Optimize data flow
4. Add accessibility features

## Technical Considerations

### Performance
- **Lazy Loading**: Load claims data only when needed
- **Memoization**: Cache filtered claims to avoid re-computation
- **Navigation Optimization**: Use React Navigation's optimization features

### State Management
- **Context Preservation**: Maintain document context across screens
- **Data Synchronization**: Ensure stats reflect current data state
- **Memory Management**: Clean up unused data when navigating away

### Accessibility
- **Screen Reader Support**: Add proper accessibility labels
- **Keyboard Navigation**: Support tab navigation
- **High Contrast**: Ensure visual elements are accessible

## Dependencies

### Existing Dependencies
- React Navigation (already installed)
- NLP Service (existing mock service)

### New Dependencies
- None required - using existing React Native and Expo components

## Migration Strategy

### Backward Compatibility
- Maintain existing navigation paths
- Preserve current screen functionality
- Add new features without breaking existing flows

### Data Migration
- No data migration required (using mock data)
- Ensure new screens work with existing data structure
- Add fallbacks for missing data fields