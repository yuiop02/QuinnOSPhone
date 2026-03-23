import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { TOKENS } from './quinnSystem';

type NodeBadgeProps = {
  fill: string;
  style?: ViewStyle | ViewStyle[];
};

export default function NodeBadge({ fill, style }: NodeBadgeProps) {
  return (
    <View style={[styles.nodeBadge, style]}>
      <Svg width="32" height="32" viewBox="0 0 32 32">
        <Circle cx="16" cy="16" r="10" fill={fill} />
        <Circle cx="16" cy="16" r="13" stroke={TOKENS.color.gold} strokeOpacity="0.22" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  nodeBadge: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
});