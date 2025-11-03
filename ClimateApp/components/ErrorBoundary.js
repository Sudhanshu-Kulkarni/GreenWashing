import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    // Reset error state and navigate to dashboard
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.navigation) {
      this.props.navigation.navigate('Dashboard');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.errorContent}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>
              {this.props.fallbackMessage || 
               'An unexpected error occurred. Please try again or return to the dashboard.'}
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>{this.state.error.toString()}</Text>
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.retryButton]} 
                onPress={this.handleRetry}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              {this.props.navigation && (
                <TouchableOpacity 
                  style={[styles.button, styles.homeButton]} 
                  onPress={this.handleGoHome}
                >
                  <Text style={styles.homeButtonText}>Go to Dashboard</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  debugInfo: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  homeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;