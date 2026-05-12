import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import QuinnSurfaceShell from './QuinnSurfaceShell';
import { SURFACE_THEME } from './quinnSurfaceTheme';
import { QuinnSettings } from './quinnTypes';

type ControlCenterProps = {
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  settings: QuinnSettings;
  unreadCount: number;
  onToggleSetting: (key: keyof QuinnSettings) => void;
};

function ToggleCard({
  title,
  body,
  active,
  onPress,
}: {
  title: string;
  body: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.toggleCard, active && styles.toggleCardActive]}
    >
      <Text style={styles.toggleTitle}>{title}</Text>
      <Text style={styles.toggleMeta}>{active ? 'On' : 'Off'}</Text>
      <Text style={styles.toggleBody}>{body}</Text>
    </Pressable>
  );
}

export default function ControlCenter({
  onBack,
  onOpenSettings,
  onOpenNotifications,
  settings,
  unreadCount,
  onToggleSetting,
}: ControlCenterProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <QuinnSurfaceShell
        eyebrow="PREFERENCES"
        title="Make it feel right."
        description="Adjust the small things that change how QuinnOS feels: motion, quieter updates, and focus."
        onBack={onBack}
        actions={[
          { label: settings.focusMode ? 'Focus on' : 'Focus off', tone: 'secondary' },
          { label: settings.reduceMotion ? 'Motion reduced' : 'Motion live', tone: 'ghost' },
          { label: unreadCount ? `${unreadCount} updates waiting` : 'Quiet right now', tone: 'primary' },
        ]}
      />

      <View style={styles.utilityRow}>
        <Pressable style={styles.utilityPill} onPress={onOpenSettings}>
          <Text style={styles.utilityPillText}>Quinn Home</Text>
        </Pressable>

        <Pressable style={styles.utilityPill} onPress={onOpenNotifications}>
          <Text style={styles.utilityPillText}>Updates {unreadCount ? `(${unreadCount})` : ''}</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        <ToggleCard
          title="Reduce motion"
          body="Softens motion so the app feels calmer."
          active={settings.reduceMotion}
          onPress={() => onToggleSetting('reduceMotion')}
        />

        <ToggleCard
          title="Quiet updates"
          body="Updates still save, but they stop waving for attention."
          active={settings.quietNotifications}
          onPress={() => onToggleSetting('quietNotifications')}
        />

        <ToggleCard
          title="Focus mode"
          body="Trims the interface toward the strongest current action."
          active={settings.focusMode}
          onPress={() => onToggleSetting('focusMode')}
        />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryEyebrow}>CURRENT FEEL</Text>
        <Text style={styles.summaryTitle}>How QuinnOS is set</Text>
        <Text style={styles.summaryBody}>
          Reduce motion: {settings.reduceMotion ? 'on' : 'off'}
        </Text>
        <Text style={styles.summaryBody}>
          Quiet updates: {settings.quietNotifications ? 'on' : 'off'}
        </Text>
        <Text style={styles.summaryBody}>
          Focus mode: {settings.focusMode ? 'on' : 'off'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },

  utilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },

  utilityPill: {
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    backgroundColor: SURFACE_THEME.panelSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 8,
  },

  utilityPillText: {
    color: SURFACE_THEME.text,
    fontSize: 12,
    fontWeight: '900',
  },

  grid: {
    marginBottom: 14,
  },

  toggleCard: {
    backgroundColor: SURFACE_THEME.panelAlt,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 30,
    padding: 18,
    marginBottom: 12,
  },

  toggleCardActive: {
    borderColor: SURFACE_THEME.borderStrong,
    backgroundColor: SURFACE_THEME.plumSoft,
  },

  toggleTitle: {
    color: SURFACE_THEME.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    marginBottom: 4,
  },

  toggleMeta: {
    color: SURFACE_THEME.eyebrow,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '900',
    marginBottom: 8,
  },

  toggleBody: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  summaryCard: {
    backgroundColor: SURFACE_THEME.panel,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 30,
    padding: 18,
  },

  summaryEyebrow: {
    color: SURFACE_THEME.eyebrow,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  summaryTitle: {
    color: SURFACE_THEME.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    marginBottom: 8,
  },

  summaryBody: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 6,
  },
});
