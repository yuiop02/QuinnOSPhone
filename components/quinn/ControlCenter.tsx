import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { TOKENS } from './quinnSystem';
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
      <View style={styles.rowBetween}>
        <Text style={styles.eyebrow}>CONTROL CENTER</Text>
        <Pressable onPress={onBack} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Back</Text>
        </Pressable>
      </View>

      <Text style={styles.heroTitle}>Control, without clutter.</Text>
      <Text style={styles.heroText}>
        Tune the QuinnOS surface here. These switches affect motion, alerts, and focus.
      </Text>

      <View style={styles.utilityRow}>
        <Pressable style={styles.utilityPill} onPress={onOpenSettings}>
          <Text style={styles.utilityPillText}>Open Settings</Text>
        </Pressable>

        <Pressable style={styles.utilityPill} onPress={onOpenNotifications}>
          <Text style={styles.utilityPillText}>Alerts {unreadCount ? `(${unreadCount})` : ''}</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        <ToggleCard
          title="Reduce motion"
          body="Gravity shifts to a still version so the surface stays quieter."
          active={settings.reduceMotion}
          onPress={() => onToggleSetting('reduceMotion')}
        />

        <ToggleCard
          title="Quiet notifications"
          body="Alerts still land, but the system shifts into a softer mode."
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
        <Text style={styles.summaryEyebrow}>SYSTEM SUMMARY</Text>
        <Text style={styles.summaryTitle}>Current state</Text>
        <Text style={styles.summaryBody}>
          Reduce motion: {settings.reduceMotion ? 'on' : 'off'}
        </Text>
        <Text style={styles.summaryBody}>
          Quiet notifications: {settings.quietNotifications ? 'on' : 'off'}
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
    paddingHorizontal: TOKENS.spacing?.lg ?? 18,
    paddingBottom: 30,
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eyebrow: {
    color: TOKENS.color?.gold ?? '#B88A2A',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 8,
  },

  heroTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1.1,
    marginBottom: 10,
  },

  heroText: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 14,
  },

  ghostButton: {
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: TOKENS.radius?.pill ?? 999,
    marginTop: 10,
  },

  ghostButtonText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 12,
    fontWeight: '800',
  },

  utilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },

  utilityPill: {
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 8,
  },

  utilityPillText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 12,
    fontWeight: '900',
  },

  grid: {
    marginBottom: 14,
  },

  toggleCard: {
    backgroundColor: TOKENS.color?.creamSoft ?? '#FBF7EF',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.xl ?? 30,
    padding: 16,
    marginBottom: 12,
  },

  toggleCardActive: {
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
  },

  toggleTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    marginBottom: 4,
  },

  toggleMeta: {
    color: TOKENS.color?.gold ?? '#B88A2A',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '900',
    marginBottom: 8,
  },

  toggleBody: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  summaryCard: {
    backgroundColor: TOKENS.color?.creamSoft ?? '#FBF7EF',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.xl ?? 30,
    padding: 16,
  },

  summaryEyebrow: {
    color: TOKENS.color?.gold ?? '#B88A2A',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  summaryTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    marginBottom: 8,
  },

  summaryBody: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 6,
  },
});
