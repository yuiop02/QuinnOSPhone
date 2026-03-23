import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { TOKENS } from './quinnSystem';
import { QuinnSettings, QuinnSurfaceName } from './quinnTypes';

type AppSwitcherProps = {
  onBack: () => void;
  onSwitchToScreen: (screen: QuinnSurfaceName) => void;
  currentScreen: QuinnSurfaceName;
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
  const cards: {
    key: QuinnSurfaceName;
    eyebrow: string;
    title: string;
    body: string;
  }[] = [
    {
      key: 'HomeTileGrid',
      eyebrow: 'HOME',
      title: 'Surface',
      body: `Current packet: ${String(packetTitle || '').trim() || 'Untitled packet'}`,
    },
    {
      key: 'TileExpandedCanvas',
      eyebrow: 'CANVAS',
      title: 'Write',
      body: 'Shape the packet before it moves.',
    },
    {
      key: 'GravityMicro',
      eyebrow: 'GRAVITY',
      title: 'Run',
      body: lastSummary || 'Run Quinn to create a fresh compression.',
    },
    {
      key: 'VoiceMode',
      eyebrow: 'VOICE',
      title: 'Speak',
      body: `${voiceSessionCount} saved voice handoffs are ready.`,
    },
    {
      key: 'MemoryPanel',
      eyebrow: 'MEMORY',
      title: 'Keep',
      body: `${memoryCount} memory items are available.`,
    },
    {
      key: 'ExportsPanel',
      eyebrow: 'EXPORTS',
      title: 'Share',
      body: 'Copy or share the current shape.',
    },
    {
      key: 'NotificationsPanel',
      eyebrow: 'ALERTS',
      title: 'Notify',
      body: `${notificationCount} notifications in the stack.`,
    },
    {
      key: 'ControlCenter',
      eyebrow: 'CONTROL',
      title: 'Tune',
      body: `Focus ${settings.focusMode ? 'on' : 'off'} • Motion ${
        settings.reduceMotion ? 'reduced' : 'live'
      }`,
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.rowBetween}>
        <Text style={styles.eyebrow}>APP SWITCHER</Text>
        <Pressable onPress={onBack} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Back</Text>
        </Pressable>
      </View>

      <Text style={styles.heroTitle}>Move across the system.</Text>
      <Text style={styles.heroText}>
        This is the fast surface for jumping between QuinnOS layers.
      </Text>

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
        <Text style={styles.statusEyebrow}>SYSTEM SNAPSHOT</Text>
        <Text style={styles.statusTitle}>Right now</Text>
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

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  card: {
    width: '47.5%',
    backgroundColor: TOKENS.color?.creamSoft ?? '#FBF7EF',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.lg ?? 24,
    padding: 14,
    marginBottom: 12,
  },

  cardActive: {
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
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
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
    marginBottom: 6,
  },

  cardBody: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  statusCard: {
    backgroundColor: TOKENS.color?.creamSoft ?? '#FBF7EF',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.xl ?? 30,
    padding: 16,
  },

  statusEyebrow: {
    color: TOKENS.color?.gold ?? '#B88A2A',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  statusTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    marginBottom: 8,
  },

  statusBody: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 6,
  },
});
