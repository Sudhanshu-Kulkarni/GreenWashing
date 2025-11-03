import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
} from 'react-native';

const SkeletonLoader = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e0e0e0', '#f0f0f0'],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

const SkeletonCard = ({ style }) => (
  <View style={[styles.card, style]}>
    <View style={styles.cardHeader}>
      <SkeletonLoader width={40} height={40} borderRadius={8} />
      <View style={styles.cardInfo}>
        <SkeletonLoader width="80%" height={16} />
        <SkeletonLoader width="60%" height={14} style={{ marginTop: 8 }} />
        <SkeletonLoader width="40%" height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
  </View>
);

const SkeletonClaimCard = ({ style }) => (
  <View style={[styles.claimCard, style]}>
    <View style={styles.claimHeader}>
      <SkeletonLoader width={30} height={20} borderRadius={10} />
      <SkeletonLoader width={60} height={20} borderRadius={10} style={{ marginLeft: 8 }} />
      <SkeletonLoader width={40} height={16} style={{ marginLeft: 'auto' }} />
    </View>
    <SkeletonLoader width="100%" height={16} style={{ marginTop: 12 }} />
    <SkeletonLoader width="85%" height={16} style={{ marginTop: 4 }} />
    <View style={styles.claimFooter}>
      <SkeletonLoader width={80} height={12} />
      <SkeletonLoader width={60} height={12} />
    </View>
  </View>
);

const SkeletonStatCard = ({ style }) => (
  <View style={[styles.statCard, style]}>
    <SkeletonLoader width={40} height={32} style={{ alignSelf: 'center' }} />
    <SkeletonLoader width={60} height={14} style={{ alignSelf: 'center', marginTop: 8 }} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
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
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
});

export default SkeletonLoader;
export { SkeletonCard, SkeletonClaimCard, SkeletonStatCard };