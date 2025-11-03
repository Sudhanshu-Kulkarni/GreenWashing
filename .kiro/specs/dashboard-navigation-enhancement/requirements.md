# Dashboard Navigation Enhancement Requirements

## Introduction

This specification defines enhancements to the GreenCheck app's dashboard navigation system, focusing on making the stats cards interactive and improving document-to-claims navigation flow.

## Glossary

- **Dashboard**: The main screen showing overview statistics and recent documents
- **Stats Cards**: The three cards showing Reports, Claims, and Flagged counts
- **Document Details Screen**: Screen showing document information with Overview/Full Text/Claims tabs
- **Claim Review Screen**: Screen showing filtered list of claims with status-based tabs
- **History Screen**: Screen showing list of all processed documents

## Requirements

### Requirement 1: Interactive Stats Cards

**User Story:** As a user, I want to click on the stats cards (Reports, Claims, Flagged) on the dashboard to see detailed views of each category.

#### Acceptance Criteria

1. WHEN the user taps the "Reports" stats card, THE system SHALL navigate to a reports list screen showing all processed documents
2. WHEN the user taps the "Claims" stats card, THE system SHALL navigate to a claims overview screen showing all claims across all documents
3. WHEN the user taps the "Flagged" stats card, THE system SHALL navigate to a filtered claims view showing only flagged claims across all documents
4. THE stats cards SHALL provide visual feedback when tapped (highlight or press state)

### Requirement 2: Document to Claims Navigation

**User Story:** As a user, I want to access the claims for a specific document from multiple entry points with consistent navigation.

#### Acceptance Criteria

1. WHEN the user taps "View Details" on a document from the dashboard, THE system SHALL navigate to the Document Details screen
2. WHEN the user selects the "Claims" tab in Document Details screen, THE system SHALL show the Claim Review screen for that specific document
3. THE Claim Review screen SHALL display four filter tabs: "All Claims", "Verified", "Questionable", "Unverified"
4. WHEN the user taps any document from the History screen, THE system SHALL navigate directly to the Claims tab of that document
5. THE Claims tab view SHALL be identical whether accessed from dashboard document details or history document selection

### Requirement 3: Claims Tab Functionality

**User Story:** As a user, I want to filter and review claims by their verification status within the claims interface.

#### Acceptance Criteria

1. THE Claim Review screen SHALL display four tabs with accurate counts for each status
2. WHEN the user taps "All Claims" tab, THE system SHALL show all claims for the document with total count
3. WHEN the user taps "Verified" tab, THE system SHALL show only verified claims with verified count
4. WHEN the user taps "Questionable" tab, THE system SHALL show only questionable claims with questionable count  
5. WHEN the user taps "Unverified" tab, THE system SHALL show only unverified claims with unverified count
6. THE active tab SHALL be visually distinguished from inactive tabs
7. THE claim list SHALL update immediately when switching between tabs

### Requirement 4: Navigation Consistency

**User Story:** As a user, I want consistent navigation behavior when accessing claims from different parts of the app.

#### Acceptance Criteria

1. THE Claim Review screen accessed from Document Details Claims tab SHALL be identical to the screen accessed from History document selection
2. THE system SHALL maintain document context when navigating between screens
3. THE back navigation SHALL return users to their previous screen (Dashboard, Document Details, or History)
4. THE document title and metadata SHALL be displayed consistently across all claim-related screens

### Requirement 5: Data Integration

**User Story:** As a user, I want the stats and claims data to be accurate and synchronized across all screens.

#### Acceptance Criteria

1. THE stats cards SHALL display accurate counts based on actual document and claims data
2. THE claims filtering SHALL work correctly with the mock data from nlpService
3. THE document-specific claims SHALL be filtered correctly when viewing individual documents
4. THE system SHALL handle cases where documents have zero claims in specific categories
5. THE counts in filter tabs SHALL match the actual number of claims displayed in each category