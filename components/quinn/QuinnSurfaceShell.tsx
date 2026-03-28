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
        <View pointerEvents="none" style={styles.heroGlow} />
        <View pointerEvents="none" style={styles.heroGlowWarm} />
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
    borderColor: SURFACE_THEME.border,
    backgroundColor: SURFACE_THEME.panelSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 7,
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
    borderColor: SURFACE_THEME.border,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 14,
    shadowColor: SURFACE_THEME.shadow,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 40,
    elevation: 10,
  },

  heroGlow: {
    position: 'absolute',
    top: -42,
    left: -18,
    width: 240,
    height: 200,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.plumGlow,
  },

  heroGlowWarm: {
    position: 'absolute',
    right: -24,
    bottom: -76,
    width: 220,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(226, 201, 131, 0.08)',
  },

  heroTitle: {
    color: SURFACE_THEME.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1.15,
    marginBottom: 10,
    maxWidth: SURFACE_COPY.heroMaxWidth,
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
