import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PaintMaskArtwork from './PaintMaskArtwork';
import { DESIGN_TOKENS } from './quinnSystem';
import { SURFACE_THEME } from './quinnSurfaceTheme';

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
    backgroundColor: SURFACE_THEME.panelAlt,
    borderRadius: 24,
    padding: 16,
    marginBottom: DESIGN_TOKENS.gutters['grid.imperfectOffsetA'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    shadowColor: SURFACE_THEME.shadow,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 4,
  },

  tileLarge: {
    width: '100%',
    minHeight: 180,
    marginBottom: DESIGN_TOKENS.gutters['grid.imperfectOffsetB'],
    backgroundColor: SURFACE_THEME.panel,
  },

  tileOffset: {
    marginTop: 2,
  },

  paintMaskWrap: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },

  tileTexture: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: SURFACE_THEME.veil,
    opacity: 0.22,
  },

  tileContent: {
    zIndex: 2,
  },

  tileTitle: {
    color: SURFACE_THEME.text,
    fontSize: 23,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginBottom: 6,
  },

  tileSubtitle: {
    color: SURFACE_THEME.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    paddingRight: 12,
  },
});
