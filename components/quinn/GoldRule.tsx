import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SURFACE_THEME } from './quinnSurfaceTheme';

export default function GoldRule() {
  return (
    <View style={styles.wrap}>
      <Svg width="100%" height="8" viewBox="0 0 390 8" preserveAspectRatio="none">
        <Path
          d="M1 4H389"
          stroke={SURFACE_THEME.borderStrong}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Circle cx="98" cy="4" r="1.5" fill={SURFACE_THEME.gold} />
        <Circle cx="196" cy="4" r="1.5" fill={SURFACE_THEME.gold} />
        <Circle cx="292" cy="4" r="1.5" fill={SURFACE_THEME.gold} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
});
