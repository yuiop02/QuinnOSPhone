import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import GoldRule from './GoldRule';
import PaintMaskTile from './PaintMaskTile';
import { TOKENS } from './quinnSystem';
import {
    MemoryItem,
    NotificationItem,
    QuinnSettings,
    RunHistoryItem,
} from './quinnTypes';

type HomeTileGridProps = {
  onOpenCanvas: () => void;
  onOpenGravity: () => void;
  onOpenMemory: () => void;
  onOpenExports: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenControlCenter: () => void;
  onOpenSwitcher: () => void;
  onRunCurrentPacket: () => void;
  onRestoreRunToCanvas: (run: RunHistoryItem) => void;
  onRerunHistoryItem: (run: RunHistoryItem) => void;
  packetTitle: string;
  packetText: string;
  lastSummary: string;
  lastRunAt: string | null;
  lastSavedAt: string | null;
  isHydrated: boolean;
  isRunning: boolean;
  runError: string;
  recentRuns: RunHistoryItem[];
  memories: MemoryItem[];
  notifications: NotificationItem[];
  settings: QuinnSettings;
};

function formatStamp(value: string | null, prefix: string) {
  if (!value) {
    return `${prefix}: none yet`;
  }

  try {
    return `${prefix}: ${new Date(value).toLocaleString()}`;
  } catch {
    return `${prefix}: ${value}`;
  }
}

function formatMemorySource(source: MemoryItem['source']) {
  if (source === 'run-summary') {
    return 'From Gravity';
  }

  if (source === 'packet') {
    return 'From Canvas';
  }

  return 'Starter memory';
}

export default function HomeTileGrid({
  onOpenCanvas,
  onOpenGravity,
  onOpenMemory,
  onOpenExports,
  onOpenSettings,
  onOpenNotifications,
  onOpenControlCenter,
  onOpenSwitcher,
  onRunCurrentPacket,
  onRestoreRunToCanvas,
  onRerunHistoryItem,
  packetTitle,
  packetText,
  lastSummary,
  lastRunAt,
  lastSavedAt,
  isHydrated,
  isRunning,
  runError,
  recentRuns,
  memories,
  notifications,
  settings,
}: HomeTileGridProps) {
  const safeRecentRuns = Array.isArray(recentRuns) ? recentRuns : [];
  const safeMemories = Array.isArray(memories) ? memories : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const safePacketTitle = String(packetTitle || '').trim() || 'Untitled packet';
  const cleanPacket = String(packetText || '').trim();

  const latestRun = safeRecentRuns[0];
  const latestMemory = safeMemories[0];
  const latestNotification = safeNotifications[0];
  const pinnedCount = safeMemories.filter((item) => item.pinned).length;
  const unreadCount = safeNotifications.filter((item) => !item.read).length;

  const signalPreview =
    cleanPacket || 'The surface is waiting. Start with the strongest signal.';
  const compressionPreview =
    runError || lastSummary || 'Nothing compressed yet. Run Quinn from Home or Gravity.';
  const storageMeta = isHydrated
    ? formatStamp(lastSavedAt, 'Saved on device')
    : 'Loading saved state...';

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>QUINNOS SURFACE</Text>
      <Text style={styles.heroTitle}>Now we get to the fun stuff.</Text>
      <Text style={styles.heroText}>
        This is the authored home surface: signal, pull, memory, alerts, and launch.
      </Text>

      <View style={styles.systemDock}>
        <Pressable style={styles.systemPill} onPress={onOpenSettings}>
          <Text style={styles.systemPillText}>Settings</Text>
        </Pressable>

        <Pressable style={styles.systemPill} onPress={onOpenNotifications}>
          <Text style={styles.systemPillText}>Alerts {unreadCount ? `(${unreadCount})` : ''}</Text>
        </Pressable>

        <Pressable style={styles.systemPill} onPress={onOpenControlCenter}>
          <Text style={styles.systemPillText}>Control</Text>
        </Pressable>

        <Pressable style={styles.systemPill} onPress={onOpenSwitcher}>
          <Text style={styles.systemPillText}>Switcher</Text>
        </Pressable>
      </View>

      <View style={styles.heroPanel}>
        <View style={styles.heroPanelTop}>
          <View style={styles.heroPanelCopy}>
            <Text style={styles.heroPanelEyebrow}>CURRENT SIGNAL</Text>
            <Text style={styles.heroPanelTitle} numberOfLines={1}>
              {safePacketTitle}
            </Text>
            <Text style={styles.heroPanelMeta}>
              {cleanPacket ? `${cleanPacket.length} characters ready.` : 'Packet is blank.'}
            </Text>
          </View>

          <View style={styles.heroOrbWrap}>
            <View style={styles.heroOrbOuter} />
            <View style={styles.heroOrbInner} />
            <View style={styles.heroOrbCore} />
          </View>
        </View>

        <View style={styles.heroButtonRow}>
          <Pressable style={styles.primaryButton} onPress={onRunCurrentPacket}>
            <Text style={styles.primaryButtonText}>
              {isRunning ? 'Running Quinn...' : 'Run Quinn'}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onOpenCanvas}>
            <Text style={styles.secondaryButtonText}>Open Canvas</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onOpenGravity}>
            <Text style={styles.secondaryButtonText}>Open Gravity</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>RUNS</Text>
          <Text style={styles.metricValue}>{safeRecentRuns.length}</Text>
          <Text style={styles.metricMeta}>{formatStamp(lastRunAt, 'Last run')}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>MEMORY</Text>
          <Text style={styles.metricValue}>{safeMemories.length}</Text>
          <Text style={styles.metricMeta}>{pinnedCount} pinned</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>ALERTS</Text>
          <Text style={styles.metricValue}>{unreadCount}</Text>
          <Text style={styles.metricMeta}>
            {settings.quietNotifications ? 'quiet mode on' : 'live feed'}
          </Text>
        </View>
      </View>

      <GoldRule />

      <View style={styles.featureGrid}>
        <View style={[styles.featureCard, styles.featureCardWide]}>
          <Text style={styles.featureEyebrow}>SIGNAL FIELD</Text>
          <Text style={styles.featureTitle}>Current packet</Text>
          <Text style={styles.featureMeta}>
            {cleanPacket ? `${cleanPacket.length} characters ready.` : 'Nothing written yet.'}
          </Text>
          <Text style={styles.featureBody} numberOfLines={5}>
            {signalPreview}
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureEyebrow}>GRAVITY CHAMBER</Text>
          <Text style={styles.featureTitle}>
            {isRunning ? 'Running now' : runError ? 'Needs attention' : 'Compression'}
          </Text>
          <Text style={styles.featureMeta}>
            {runError ? 'Run needs attention.' : formatStamp(lastRunAt, 'Last run')}
          </Text>
          <Text style={styles.featureBody} numberOfLines={4}>
            {compressionPreview}
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureEyebrow}>NOTIFICATION STACK</Text>
          <Text style={styles.featureTitle}>
            {latestNotification ? latestNotification.title : 'No fresh alerts'}
          </Text>
          <Text style={styles.featureMeta}>{storageMeta}</Text>
          <Text style={styles.featureBody} numberOfLines={4}>
            {latestNotification
              ? latestNotification.body
              : 'Runs, memory actions, and system changes land here.'}
          </Text>

          <View style={styles.inlineActionRow}>
            <Pressable style={styles.inlineGhostButton} onPress={onOpenNotifications}>
              <Text style={styles.inlineGhostButtonText}>Open Alerts</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureEyebrow}>CONTROL STATE</Text>
          <Text style={styles.featureTitle}>
            {settings.focusMode ? 'Focus mode on' : 'Focus mode off'}
          </Text>
          <Text style={styles.featureMeta}>
            Reduce motion {settings.reduceMotion ? 'on' : 'off'} • Quiet{' '}
            {settings.quietNotifications ? 'on' : 'off'}
          </Text>
          <Text style={styles.featureBody} numberOfLines={4}>
            {settings.focusMode
              ? 'The surface is trimmed down for stronger signal.'
              : 'All surfaces stay open and visible.'}
          </Text>

          <View style={styles.inlineActionRow}>
            <Pressable style={styles.inlineGhostButton} onPress={onOpenControlCenter}>
              <Text style={styles.inlineGhostButtonText}>Open Control</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.runDeck}>
        <Text style={styles.runDeckEyebrow}>RECENT RUNS</Text>
        <Text style={styles.runDeckTitle}>Restore or rerun</Text>

        {latestRun ? (
          safeRecentRuns.slice(0, 3).map((run) => (
            <View key={run.id} style={styles.runRow}>
              <View style={styles.runRowCopy}>
                <Text style={styles.runRowTitle} numberOfLines={1}>
                  {run.packetTitle || 'Untitled packet'}
                </Text>
                <Text style={styles.runRowMeta}>{formatStamp(run.timestamp, 'Run')}</Text>
                <Text style={styles.runRowBody} numberOfLines={2}>
                  {run.compressedSummary || run.writtenResult}
                </Text>
              </View>

              <View style={styles.runRowActions}>
                <Pressable
                  style={styles.feedPrimaryButton}
                  onPress={() => onRestoreRunToCanvas(run)}
                >
                  <Text style={styles.feedPrimaryButtonText}>Load</Text>
                </Pressable>

                <Pressable
                  style={styles.feedSecondaryButton}
                  onPress={() => onRerunHistoryItem(run)}
                >
                  <Text style={styles.feedSecondaryButtonText}>Rerun</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No run history yet. First run lands here.</Text>
        )}
      </View>

      <View style={styles.memoryDeck}>
        <Text style={styles.runDeckEyebrow}>MEMORY DECK</Text>
        <Text style={styles.runDeckTitle}>What Quinn kept</Text>

        {latestMemory ? (
          <View style={styles.memoryPreviewCard}>
            <Text style={styles.memoryPreviewTitle}>{latestMemory.label}</Text>
            <Text style={styles.memoryPreviewMeta}>
              {formatMemorySource(latestMemory.source)}
            </Text>
            <Text style={styles.memoryPreviewBody} numberOfLines={4}>
              {latestMemory.body}
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>Memory is still waiting for the first strong shape.</Text>
        )}
      </View>

      <View style={styles.launchHeader}>
        <Text style={styles.launchEyebrow}>LAUNCH DECK</Text>
        <Text style={styles.launchTitle}>Open the system</Text>
      </View>

      <View style={styles.tileGrid}>
        <PaintMaskTile
          title="Canvas"
          subtitle="Write and shape the packet."
          large
          onPress={onOpenCanvas}
        />

        <PaintMaskTile
          title="Gravity"
          subtitle="Run and compress the strongest signal."
          onPress={onOpenGravity}
        />

        <PaintMaskTile
          title="Memory"
          subtitle="Keep what should keep mattering."
          offset
          onPress={onOpenMemory}
        />

        <PaintMaskTile
          title="Exports"
          subtitle="Copy or share the current shape."
          onPress={onOpenExports}
        />

        <PaintMaskTile
          title="Settings"
          subtitle="Open the QuinnOS system surfaces."
          offset
          onPress={onOpenSettings}
        />

        <PaintMaskTile
          title="Switcher"
          subtitle="Move across surfaces fast."
          offset
          onPress={onOpenSwitcher}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: TOKENS.spacing?.lg ?? 18,
    paddingBottom: 30,
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

  systemDock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },

  systemPill: {
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 8,
  },

  systemPillText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  heroPanel: {
    backgroundColor: TOKENS.color?.creamSoft ?? '#FBF7EF',
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    borderRadius: TOKENS.radius?.xl ?? 30,
    padding: 16,
    marginBottom: 14,
  },

  heroPanelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroPanelCopy: {
    flex: 1,
    paddingRight: 14,
  },

  heroPanelEyebrow: {
    color: TOKENS.color?.gold ?? '#B88A2A',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  heroPanelTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 6,
  },

  heroPanelMeta: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },

  heroOrbWrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroOrbOuter: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    backgroundColor: 'rgba(184,138,42,0.08)',
  },

  heroOrbInner: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.color?.ink ?? '#111111',
    backgroundColor: 'rgba(17,17,17,0.03)',
  },

  heroOrbCore: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: TOKENS.color?.ink ?? '#111111',
  },

  heroButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },

  primaryButton: {
    backgroundColor: TOKENS.color?.ink ?? '#111111',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  primaryButtonText: {
    color: TOKENS.color?.creamSoft ?? '#FBF7EF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  secondaryButton: {
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  secondaryButtonText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 13,
    fontWeight: '900',
  },

  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  metricCard: {
    width: '31.5%',
    backgroundColor: TOKENS.color?.creamSoft ?? '#FBF7EF',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.lg ?? 24,
    padding: 12,
  },

  metricLabel: {
    color: TOKENS.color?.gold ?? '#B88A2A',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },

  metricValue: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    marginBottom: 4,
  },

  metricMeta: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  featureCard: {
    width: '47.5%',
    backgroundColor: TOKENS.color?.creamSoft ?? '#FBF7EF',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.lg ?? 24,
    padding: 14,
    marginBottom: 12,
  },

  featureCardWide: {
    width: '100%',
  },

  featureEyebrow: {
    color: TOKENS.color?.gold ?? '#B88A2A',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  featureTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },

  featureMeta: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 6,
  },

  featureBody: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  inlineActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },

  inlineGhostButton: {
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  inlineGhostButtonText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 12,
    fontWeight: '800',
  },

  runDeck: {
    backgroundColor: TOKENS.color?.creamSoft ?? '#FBF7EF',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.xl ?? 30,
    padding: 16,
    marginBottom: 14,
  },

  memoryDeck: {
    backgroundColor: TOKENS.color?.creamSoft ?? '#FBF7EF',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.xl ?? 30,
    padding: 16,
    marginBottom: 14,
  },

  runDeckEyebrow: {
    color: TOKENS.color?.gold ?? '#B88A2A',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  runDeckTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 10,
  },

  runRow: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.color?.rule ?? '#D8C8A6',
  },

  runRowCopy: {
    marginBottom: 10,
  },

  runRowTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },

  runRowMeta: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  runRowBody: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  runRowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  feedPrimaryButton: {
    backgroundColor: TOKENS.color?.ink ?? '#111111',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 8,
  },

  feedPrimaryButtonText: {
    color: TOKENS.color?.creamSoft ?? '#FBF7EF',
    fontSize: 12,
    fontWeight: '900',
  },

  feedSecondaryButton: {
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 8,
  },

  feedSecondaryButtonText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 12,
    fontWeight: '900',
  },

  memoryPreviewCard: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: 18,
    padding: 14,
  },

  memoryPreviewTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },

  memoryPreviewMeta: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 6,
  },

  memoryPreviewBody: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  emptyText: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  launchHeader: {
    marginBottom: 10,
  },

  launchEyebrow: {
    color: TOKENS.color?.gold ?? '#B88A2A',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  launchTitle: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
});
