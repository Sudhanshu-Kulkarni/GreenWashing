import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';

const AnimatedTouchable = ({ 
  children, 
  onPress, 
  style, 
  animationType = 'scale', // 'scale', 'opacity', 'both'
  scaleValue = 0.95,
  opacityValue = 0.7,
  duration = 150,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  ...props 
}) => {
  const animatedValue = useRef(new Animated.Value(1)).current;
  const opacityAnimatedValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    
    const animations = [];
    
    if (animationType === 'scale' || animationType === 'both') {
      animations.push(
        Animated.timing(animatedValue, {
          toValue: scaleValue,
          duration: duration,
          useNativeDriver: true,
        })
      );
    }
    
    if (animationType === 'opacity' || animationType === 'both') {
      animations.push(
        Animated.timing(opacityAnimatedValue, {
          toValue: opacityValue,
          duration: duration,
          useNativeDriver: true,
        })
      );
    }
    
    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    const animations = [];
    
    if (animationType === 'scale' || animationType === 'both') {
      animations.push(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        })
      );
    }
    
    if (animationType === 'opacity' || animationType === 'both') {
      animations.push(
        Animated.timing(opacityAnimatedValue, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        })
      );
    }
    
    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  };

  const animatedStyle = {
    transform: [{ scale: animatedValue }],
    opacity: opacityAnimatedValue,
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={style}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      {...props}
    >
      <Animated.View style={[animatedStyle, disabled && styles.disabled]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});

export default AnimatedTouchable;