import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SURFACE_THEME } from './quinnSurfaceTheme';

type SectionCardProps = {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
};

export default function SectionCard({
  eyebrow,
  title,
  children,
}: SectionCardProps) {
  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.cardGlow} />
      <View pointerEvents="none" style={styles.cardWarmGlow} />
      <View pointerEvents="none" style={styles.cardOrbitalArc} />
      <View pointerEvents="none" style={styles.cardSheen} />
      <Text style={styles.cardEyebrow}>{eyebrow}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: SURFACE_THEME.panelAlt,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderStrong,
    padding: 18,
    marginBottom: 12,
    shadowColor: SURFACE_THEME.shadow,
    shadowOpacity: 0.34,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 30,
    elevation: 6,
  },

  cardGlow: {
    position: 'absolute',
    top: -52,
    left: -32,
    width: 216,
    height: 160,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.plumGlow,
  },

  cardWarmGlow: {
    position: 'absolute',
    right: -34,
    bottom: -48,
    width: 174,
    height: 126,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.peachGlow,
  },

  cardOrbitalArc: {
    position: 'absolute',
    top: -18,
    right: -38,
    width: 176,
    height: 90,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SURFACE_THEME.orbital,
    transform: [{ rotate: '-12deg' }],
  },

  cardSheen: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    height: 18,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.glassHighlight,
  },

  cardEyebrow: {
    color: SURFACE_THEME.eyebrow,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  cardTitle: {
    color: SURFACE_THEME.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
});
