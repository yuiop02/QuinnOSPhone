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
      <Text style={styles.cardEyebrow}>{eyebrow}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE_THEME.panelAlt,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    padding: 18,
    marginBottom: 12,
    shadowColor: SURFACE_THEME.shadow,
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 26,
    elevation: 6,
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
