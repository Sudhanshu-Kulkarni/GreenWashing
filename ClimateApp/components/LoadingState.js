import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';

const LoadingState = ({ 
  message = 'Loading...', 
  size = 'large', 
  color = '#007AFF',
  style 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      <ActivityIndicator 
        size={size} 
        color={color} 
        accessibilityLabel="Loading indicator"
      />
      <Text 
        style={styles.message}
        accessibilityLabel={message}
        accessibilityRole="text"
      >
        {message}
      </Text>
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
  message: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default LoadingState;