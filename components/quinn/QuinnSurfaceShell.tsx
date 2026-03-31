import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SURFACE_COPY, SURFACE_THEME } from './quinnSurfaceTheme';

type ShellActionTone = 'primary' | 'secondary' | 'ghost';

type ShellAction = {
  label: string;
  onPress?: () => void;
  tone?: ShellActionTone;
};

type QuinnSurfaceShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  onBack: () => void;
  backLabel?: string;
  actions?: ShellAction[];
};

function renderAction(action: ShellAction, index: number) {
  const tone = action.tone || 'ghost';
  const content = (
    <Text
      style={[
        styles.actionText,
        tone === 'primary' && styles.actionTextPrimary,
      ]}
    >
      {action.label}
    </Text>
  );

  if (!action.onPress) {
    return (
      <View
        key={`${action.label}-${index}`}
        style={[
          styles.actionChip,
          styles.actionChipStatic,
          tone === 'primary' && styles.actionChipPrimary,
          tone === 'secondary' && styles.actionChipSecondary,
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      key={`${action.label}-${index}`}
      onPress={action.onPress}
      style={[
        styles.actionChip,
        tone === 'primary' && styles.actionChipPrimary,
        tone === 'secondary' && styles.actionChipSecondary,
      ]}
    >
      {content}
    </Pressable>
  );
}

export default function QuinnSurfaceShell({
  eyebrow,
  title,
  description,
  onBack,
  backLabel = 'Back',
  actions = [],
}: QuinnSurfaceShellProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.shellEyebrow}>{eyebrow}</Text>

        <Pressable onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={14} color={SURFACE_THEME.text} />
          <Text style={styles.backText}>{backLabel}</Text>
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <View pointerEvents="none" style={styles.heroHalo} />
        <View pointerEvents="none" style={styles.heroGlow} />
        <View pointerEvents="none" style={styles.heroGlowRose} />
        <View pointerEvents="none" style={styles.heroGlowWarm} />
        <View pointerEvents="none" style={styles.heroCoreBloom} />
        <View pointerEvents="none" style={styles.heroOrbitalArc} />
        <View pointerEvents="none" style={styles.heroPortalRing} />
        <View pointerEvents="none" style={styles.heroOrbitalArcSecondary} />
        <View pointerEvents="none" style={styles.heroSheen} />
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroDescription}>{description}</Text>

        {actions.length ? <View style={styles.actionRow}>{actions.map(renderAction)}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: SURFACE_COPY.shellMaxWidth,
    alignSelf: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },

  shellEyebrow: {
    color: SURFACE_THEME.eyebrow,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderStrong,
    backgroundColor: 'rgba(29, 12, 42, 0.74)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 7,
    shadowColor: SURFACE_THEME.shadow,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
  },

  backText: {
    color: SURFACE_THEME.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  heroCard: {
    overflow: 'hidden',
    backgroundColor: SURFACE_THEME.panel,
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderStrong,
    borderRadius: 34,
    paddingHorizontal: 22,
    paddingVertical: 20,
    marginBottom: 14,
    shadowColor: SURFACE_THEME.shadow,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 22 },
    shadowRadius: 50,
    elevation: 10,
  },

  heroHalo: {
    position: 'absolute',
    top: -78,
    left: -44,
    width: 330,
    height: 238,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.roseGlow,
  },

  heroGlow: {
    position: 'absolute',
    top: -56,
    left: -16,
    width: 276,
    height: 220,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.plumGlow,
  },

  heroGlowRose: {
    position: 'absolute',
    top: -34,
    right: 26,
    width: 184,
    height: 144,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.roseGlow,
  },

  heroGlowWarm: {
    position: 'absolute',
    right: -18,
    bottom: -84,
    width: 236,
    height: 190,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.peachGlow,
  },

  heroCoreBloom: {
    position: 'absolute',
    top: 6,
    left: 110,
    width: 186,
    height: 126,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.portalWarm,
  },

  heroOrbitalArc: {
    position: 'absolute',
    top: -8,
    right: -44,
    width: 220,
    height: 110,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SURFACE_THEME.orbital,
    transform: [{ rotate: '-12deg' }],
  },

  heroPortalRing: {
    position: 'absolute',
    top: 18,
    right: 36,
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 1,
    borderColor: 'rgba(255, 233, 244, 0.18)',
    transform: [{ scaleX: 1.08 }, { rotate: '-24deg' }],
  },

  heroOrbitalArcSecondary: {
    position: 'absolute',
    bottom: -48,
    right: 34,
    width: 188,
    height: 92,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 222, 200, 0.12)',
    transform: [{ rotate: '12deg' }],
  },

  heroSheen: {
    position: 'absolute',
    top: 6,
    left: 12,
    right: 12,
    height: 24,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.glassHighlight,
  },

  heroTitle: {
    color: SURFACE_THEME.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1.15,
    marginBottom: 10,
    maxWidth: SURFACE_COPY.heroMaxWidth,
    textShadowColor: 'rgba(255, 183, 226, 0.22)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },

  heroDescription: {
    color: SURFACE_THEME.textMuted,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    maxWidth: SURFACE_COPY.heroMaxWidth,
  },

  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },

  actionChip: {
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    backgroundColor: SURFACE_THEME.panelSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  actionChipStatic: {
    backgroundColor: SURFACE_THEME.veil,
    borderColor: 'rgba(214, 220, 241, 0.10)',
  },

  actionChipPrimary: {
    borderColor: SURFACE_THEME.borderWarm,
    backgroundColor: SURFACE_THEME.goldSoft,
  },

  actionChipSecondary: {
    borderColor: SURFACE_THEME.borderStrong,
    backgroundColor: SURFACE_THEME.plumSoft,
  },

  actionText: {
    color: SURFACE_THEME.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  actionTextPrimary: {
    color: SURFACE_THEME.gold,
  },
});
