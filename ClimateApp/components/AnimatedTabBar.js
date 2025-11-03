import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';

const AnimatedTabBar = ({ 
  tabs, 
  activeTab, 
  onTabPress, 
  style,
  tabStyle,
  activeTabStyle,
  textStyle,
  activeTextStyle,
  showCounts = false,
  counts = {},
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const tabWidth = 100 / tabs.length; // Percentage width per tab

  useEffect(() => {
    const activeIndex = tabs.indexOf(activeTab);
    Animated.spring(slideAnim, {
      toValue: activeIndex,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeTab, tabs, slideAnim]);

  const indicatorStyle = {
    left: slideAnim.interpolate({
      inputRange: tabs.map((_, index) => index),
      outputRange: tabs.map((_, index) => `${index * tabWidth}%`),
    }),
    width: `${tabWidth}%`,
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab;
        const count = counts[tab] || 0;
        
        return (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              tabStyle,
              isActive && activeTabStyle,
            ]}
            onPress={() => onTabPress(tab)}
            accessibilityLabel={`${tab} tab${showCounts && count > 0 ? `, ${count} items` : ''}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.tabText,
                textStyle,
                isActive && styles.activeTabText,
                isActive && activeTextStyle,
              ]}
            >
              {tab}
              {showCounts && count > 0 && (
                <Text style={styles.countText}> ({count})</Text>
              )}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  countText: {
    fontSize: 14,
    fontWeight: '400',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: '#007AFF',
  },
});

export default AnimatedTabBar;