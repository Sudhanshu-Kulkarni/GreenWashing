import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import AnimatedTouchable from './AnimatedTouchable';

const ErrorState = ({ 
  title = 'Something went wrong',
  message = 'An error occurred while loading data.',
  onRetry,
  retryText = 'Try Again',
  icon = '⚠️',
  style 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <Text 
        style={styles.icon}
        accessibilityLabel={`Error icon: ${icon}`}
      >
        {icon}
      </Text>
      <Text 
        style={styles.title}
        accessibilityRole="header"
        accessibilityLabel={title}
      >
        {title}
      </Text>
      <Text 
        style={styles.message}
        accessibilityLabel={message}
      >
        {message}
      </Text>
      {onRetry && (
        <AnimatedTouchable 
          style={styles.retryButton} 
          onPress={onRetry}
          accessibilityLabel={retryText}
          accessibilityHint="Tap to retry the failed operation"
          accessibilityRole="button"
          animationType="scale"
        >
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </AnimatedTouchable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorState;