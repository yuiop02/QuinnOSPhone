import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TOKENS } from './quinnSystem';

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
    backgroundColor: TOKENS.color?.creamSoft ?? '#FBF7EF',
    borderRadius: TOKENS.radius?.lg ?? 24,
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(17,17,17,0.08)',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 18,
    elevation: 1,
  },

  cardEyebrow: {
    color: TOKENS.color?.gold ?? '#B88A2A',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  cardTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
});