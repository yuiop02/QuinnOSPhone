import React, { useMemo } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import QuinnSurfaceShell from './QuinnSurfaceShell';
import { SURFACE_THEME } from './quinnSurfaceTheme';
import { AppScreen, QuinnSettings } from './quinnTypes';

type AppSwitcherProps = {
  onBack: () => void;
  onSwitchToScreen: (screen: AppScreen) => void;
  currentScreen: AppScreen;
  packetTitle: string;
  lastSummary: string;
  notificationCount: number;
  memoryCount: number;
  recentRunCount: number;
  voiceSessionCount: number;
  settings: QuinnSettings;
};

export default function AppSwitcher({
  onBack,
  onSwitchToScreen,
  currentScreen,
  packetTitle,
  lastSummary,
  notificationCount,
  memoryCount,
  recentRunCount,
  voiceSessionCount,
  settings,
}: AppSwitcherProps) {
  const cards = useMemo<
    {
      key: AppScreen;
      eyebrow: string;
      title: string;
      body: string;
    }[]
  >(
    () => [
      {
        key: 'QuinnConversation',
        eyebrow: 'QUINN',
        title: 'Homepage',
        body: `Live thread: ${String(packetTitle || '').trim() || 'Current signal'}`,
      },
      {
        key: 'HomeTileGrid',
        eyebrow: 'SYSTEM',
        title: 'System deck',
        body:
          lastSummary ||
          'See the live thread, recent runs, memory, alerts, and control at a glance.',
      },
      {
        key: 'VoiceMode',
        eyebrow: 'VOICE',
        title: 'Voice studio',
        body: `${voiceSessionCount} saved voice handoff${
          voiceSessionCount === 1 ? '' : 's'
        } ready for recording, transcription, or preview.`,
      },
      {
        key: 'MemoryPanel',
        eyebrow: 'MEMORY',
        title: 'Memory deck',
        body: `${memoryCount} kept memory item${
          memoryCount === 1 ? '' : 's'
        } ready to load back into Quinn.`,
      },
      {
        key: 'ExportsPanel',
        eyebrow: 'EXPORTS',
        title: 'Export studio',
        body: 'Copy or share the current shape.',
      },
      {
        key: 'NotificationsPanel',
        eyebrow: 'SIGNALS',
        title: 'Alerts',
        body: notificationCount
          ? `${notificationCount} live alert${notificationCount === 1 ? '' : 's'} in the stack.`
          : 'Runs, memory actions, and system signals land here.',
      },
      {
        key: 'ControlCenter',
        eyebrow: 'CONTROL',
        title: 'Control center',
        body: `Focus ${settings.focusMode ? 'on' : 'off'} • Motion ${
          settings.reduceMotion ? 'reduced' : 'live'
        }`,
      },
    ],
    [
      lastSummary,
      memoryCount,
      notificationCount,
      packetTitle,
      settings.focusMode,
      settings.reduceMotion,
      voiceSessionCount,
    ]
  );

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <QuinnSurfaceShell
        eyebrow="SURFACE INDEX"
        title="Move across QuinnOS without losing the thread."
        description="The homepage stays central. This index is the fast, quiet way to step into memory, voice, exports, alerts, or control when the moment needs more than the main conversation surface."
        onBack={onBack}
        actions={[
          { label: `${recentRunCount} runs`, tone: 'secondary' },
          { label: `${memoryCount} memory items`, tone: 'ghost' },
          { label: notificationCount ? `${notificationCount} live signals` : 'Signals quiet', tone: 'primary' },
        ]}
      />

      <View style={styles.grid}>
        {cards.map((card) => (
          <Pressable
            key={card.key}
            onPress={() => onSwitchToScreen(card.key)}
            style={[
              styles.card,
              currentScreen === card.key && styles.cardActive,
            ]}
          >
            <Text style={styles.cardEyebrow}>{card.eyebrow}</Text>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardBody}>{card.body}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusEyebrow}>LIVE SNAPSHOT</Text>
        <Text style={styles.statusTitle}>What is live now</Text>
        <Text style={styles.statusBody}>Homepage signal: {String(packetTitle || '').trim() || 'Current signal'}</Text>
        <Text style={styles.statusBody}>Runs: {recentRunCount}</Text>
        <Text style={styles.statusBody}>Memory: {memoryCount}</Text>
        <Text style={styles.statusBody}>Alerts: {notificationCount}</Text>
        <Text style={styles.statusBody}>Voice handoffs: {voiceSessionCount}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  card: {
    width: '47.5%',
    backgroundColor: SURFACE_THEME.panelAlt,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
  },

  cardActive: {
    borderColor: SURFACE_THEME.borderStrong,
    backgroundColor: SURFACE_THEME.plumSoft,
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
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginBottom: 6,
  },

  cardBody: {
    color: SURFACE_THEME.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  statusCard: {
    backgroundColor: SURFACE_THEME.panel,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 30,
    padding: 18,
  },

  statusEyebrow: {
    color: SURFACE_THEME.eyebrow,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  statusTitle: {
    color: SURFACE_THEME.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    marginBottom: 8,
  },

  statusBody: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 6,
  },
});
