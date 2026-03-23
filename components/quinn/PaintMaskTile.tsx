import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PaintMaskArtwork from './PaintMaskArtwork';
import { DESIGN_TOKENS, TOKENS } from './quinnSystem';

type PaintMaskTileProps = {
  title: string;
  subtitle: string;
  large?: boolean;
  onPress?: () => void;
  offset?: boolean;
};

export default function PaintMaskTile({
  title,
  subtitle,
  large,
  onPress,
  offset,
}: PaintMaskTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, large && styles.tileLarge, offset && styles.tileOffset]}
    >
      <View style={styles.paintMaskWrap}>
        <PaintMaskArtwork />
      </View>

      <View style={styles.tileTexture} />

      <View style={styles.tileContent}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '47.5%',
    minHeight: 152,
    backgroundColor: TOKENS.color.tile,
    borderRadius: TOKENS.radius.lg,
    padding: 16,
    marginBottom: DESIGN_TOKENS.gutters['grid.imperfectOffsetA'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: TOKENS.color.rule,
    shadowColor: 'rgba(17,17,17,0.08)',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 18,
    elevation: 2,
  },

  tileLarge: {
    width: '100%',
    minHeight: 180,
    marginBottom: DESIGN_TOKENS.gutters['grid.imperfectOffsetB'],
    backgroundColor: TOKENS.color.tileAlt,
  },

  tileOffset: {
    marginTop: 2,
  },

  paintMaskWrap: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.95,
  },

  tileTexture: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.03)',
    opacity: 0.12,
  },

  tileContent: {
    zIndex: 2,
  },

  tileTitle: {
    color: TOKENS.color.ink,
    fontSize: 23,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginBottom: 6,
  },

  tileSubtitle: {
    color: TOKENS.color.inkMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    paddingRight: 12,
  },
});