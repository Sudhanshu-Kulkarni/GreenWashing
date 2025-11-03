import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const FadeInView = ({ 
  children, 
  duration = 300, 
  delay = 0,
  style,
  ...props 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [fadeAnim, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
        },
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export default FadeInView;