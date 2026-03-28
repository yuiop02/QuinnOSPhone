import React, { useMemo } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import GoldRule from './GoldRule';
import PaintMaskTile from './PaintMaskTile';
import QuinnSurfaceShell from './QuinnSurfaceShell';
import { SURFACE_THEME } from './quinnSurfaceTheme';
import {
    MemoryResonanceItem,
    MemoryItem,
    NotificationItem,
    QuinnSettings,
    RunHistoryItem,
    SessionArc,
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
  canRunCurrentPacket: boolean;
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
  activeLensLabel: string;
  currentSessionArc: SessionArc | null;
  currentMemoryResonance: MemoryResonanceItem[];
  writtenResult: string;
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
    return 'From Quinn reply';
  }

  if (source === 'packet') {
    return 'From live thread';
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
  canRunCurrentPacket,
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
  activeLensLabel,
  currentSessionArc,
  currentMemoryResonance,
  writtenResult,
}: HomeTileGridProps) {
  const safePacketTitle = String(packetTitle || '').trim() || 'Untitled packet';
  const cleanPacket = String(packetText || '').trim();
  const {
    latestRun,
    latestMemory,
    latestNotification,
    memoryCount,
    pinnedCount,
    unreadCount,
    recentRunCount,
    visibleRecentRuns,
  } = useMemo(
    () => {
      const safeRecentRuns = Array.isArray(recentRuns) ? recentRuns : [];
      const safeMemories = Array.isArray(memories) ? memories : [];
      const safeNotifications = Array.isArray(notifications) ? notifications : [];

      return {
        latestRun: safeRecentRuns[0],
        latestMemory: safeMemories[0],
        latestNotification: safeNotifications[0],
        memoryCount: safeMemories.length,
        pinnedCount: safeMemories.filter((item) => item.pinned).length,
        unreadCount: safeNotifications.filter((item) => !item.read).length,
        recentRunCount: safeRecentRuns.length,
        visibleRecentRuns: safeRecentRuns.slice(0, 3),
      };
    },
    [recentRuns, memories, notifications]
  );

  const signalPreview =
    cleanPacket || 'The surface is waiting. Start with the strongest signal.';
  const compressionPreview =
    runError || lastSummary || 'No Quinn reply yet. Run Quinn from the homepage.';
  const storageMeta = isHydrated
    ? formatStamp(lastSavedAt, 'Saved on device')
    : 'Loading saved state...';
  const threadTitle = currentSessionArc?.title || 'Fresh thread';
  const threadMeta = [
    `${activeLensLabel} lens`,
    currentSessionArc ? `Step ${currentSessionArc.stepCount}` : 'Fresh start',
    String(writtenResult || '').trim() ? 'Latest reply live' : 'Waiting for first reply',
  ].join(' • ');
  const threadBody = String(writtenResult || '').trim()
    ? currentMemoryResonance.length
      ? `${currentMemoryResonance.length} memory signal${
          currentMemoryResonance.length === 1 ? '' : 's'
        } helped shape the latest reply. Use Stage next move on the homepage if this thought should keep carrying forward.`
      : 'The latest reply is live. Follow up on the homepage or start fresh to open a new topic.'
    : 'Run Quinn once and this rail will show the current lens, whether the thought is carrying forward, and how memory shaped the answer.';

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <QuinnSurfaceShell
        eyebrow="SYSTEM DECK"
        title="Everything around Quinn, without losing the thread."
        description="The homepage stays live. This deck keeps memory, alerts, exports, and system state within reach without turning QuinnOS into a dashboard."
        onBack={onOpenCanvas}
        backLabel="Back to Quinn"
        actions={[
          { label: safePacketTitle, tone: 'secondary' },
          { label: `${recentRunCount} runs`, tone: 'ghost' },
          { label: unreadCount ? `${unreadCount} fresh alerts` : 'Alerts quiet', tone: 'primary' },
        ]}
      />

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
              <Text style={styles.heroPanelEyebrow}>READY TO RUN</Text>
            <Text style={styles.heroPanelTitle} numberOfLines={1}>
              {safePacketTitle}
            </Text>
            <Text style={styles.heroPanelMeta}>
                {cleanPacket ? `${cleanPacket.length} characters ready.` : 'Nothing staged yet.'}
            </Text>
          </View>

          <View style={styles.heroOrbWrap}>
            <View style={styles.heroOrbOuter} />
            <View style={styles.heroOrbInner} />
            <View style={styles.heroOrbCore} />
          </View>
        </View>

        <View style={styles.heroButtonRow}>
          <Pressable
            style={[styles.primaryButton, !canRunCurrentPacket && styles.primaryButtonDisabled]}
            onPress={onRunCurrentPacket}
            disabled={!canRunCurrentPacket}
          >
            <Text
              style={[
                styles.primaryButtonText,
                !canRunCurrentPacket && styles.primaryButtonTextDisabled,
              ]}
            >
              {isRunning ? 'Running Quinn...' : 'Run Quinn'}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onOpenCanvas}>
            <Text style={styles.secondaryButtonText}>Open Quinn</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onOpenGravity}>
            <Text style={styles.secondaryButtonText}>Open Voice</Text>
          </Pressable>
        </View>

        <View style={styles.threadBand}>
          <Text style={styles.threadBandEyebrow}>LIVE THREAD</Text>
          <Text style={styles.threadBandTitle}>{threadTitle}</Text>
          <Text style={styles.threadBandMeta}>{threadMeta}</Text>
          <Text style={styles.threadBandBody}>{threadBody}</Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>RUNS</Text>
          <Text style={styles.metricValue}>{recentRunCount}</Text>
          <Text style={styles.metricMeta}>{formatStamp(lastRunAt, 'Last run')}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>MEMORY</Text>
          <Text style={styles.metricValue}>{memoryCount}</Text>
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
            <Text style={styles.featureEyebrow}>COMPOSER</Text>
          <Text style={styles.featureTitle}>Current packet</Text>
          <Text style={styles.featureMeta}>
            {cleanPacket ? `${cleanPacket.length} characters ready.` : 'Nothing written yet.'}
          </Text>
          <Text style={styles.featureBody} numberOfLines={5}>
            {signalPreview}
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureEyebrow}>LATEST RESPONSE</Text>
          <Text style={styles.featureTitle}>
            {isRunning ? 'Running now' : runError ? 'Needs attention' : 'Quinn reply'}
          </Text>
          <Text style={styles.featureMeta}>
            {runError ? 'Run needs attention.' : formatStamp(lastRunAt, 'Last run')}
          </Text>
          <Text style={styles.featureBody} numberOfLines={4}>
            {compressionPreview}
          </Text>
        </View>

        <View style={styles.featureCard}>
            <Text style={styles.featureEyebrow}>ALERT STACK</Text>
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
            <Text style={styles.featureEyebrow}>SYSTEM STATE</Text>
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
          visibleRecentRuns.map((run) => (
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
                  style={[styles.feedPrimaryButton, isRunning && styles.feedButtonDisabled]}
                  onPress={() => onRestoreRunToCanvas(run)}
                  disabled={isRunning}
                >
                  <Text
                    style={[
                      styles.feedPrimaryButtonText,
                      isRunning && styles.feedButtonTextDisabled,
                    ]}
                  >
                    Load
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.feedSecondaryButton, isRunning && styles.feedButtonDisabled]}
                  onPress={() => onRerunHistoryItem(run)}
                  disabled={isRunning}
                >
                  <Text
                    style={[
                      styles.feedSecondaryButtonText,
                      isRunning && styles.feedButtonTextDisabled,
                    ]}
                  >
                    Rerun
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No runs yet. The next Quinn reply will land here.</Text>
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
          <Text style={styles.emptyText}>Run Quinn once and the strongest kept memory will land here.</Text>
        )}
      </View>

      <View style={styles.launchHeader}>
        <Text style={styles.launchEyebrow}>LAUNCH DECK</Text>
        <Text style={styles.launchTitle}>Open a QuinnOS layer</Text>
      </View>

      <View style={styles.tileGrid}>
        <PaintMaskTile
          title="Quinn"
          subtitle="Return to the live conversation surface."
          large
          onPress={onOpenCanvas}
        />

        <PaintMaskTile
          title="Voice"
          subtitle="Record, transcribe, and preview voice handoffs."
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
          subtitle="Open the system preferences and defaults."
          offset
          onPress={onOpenSettings}
        />

        <PaintMaskTile
          title="Switcher"
          subtitle="Jump between QuinnOS layers fast."
          offset
          onPress={onOpenSwitcher}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },

  systemDock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },

  systemPill: {
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    backgroundColor: SURFACE_THEME.panelSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 8,
  },

  systemPillText: {
    color: SURFACE_THEME.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  heroPanel: {
    backgroundColor: SURFACE_THEME.panel,
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderStrong,
    borderRadius: 30,
    padding: 18,
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
    color: SURFACE_THEME.eyebrow,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  heroPanelTitle: {
    color: SURFACE_THEME.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 6,
  },

  heroPanelMeta: {
    color: SURFACE_THEME.textMuted,
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
    borderColor: SURFACE_THEME.borderStrong,
    backgroundColor: SURFACE_THEME.plumSoft,
  },

  heroOrbInner: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    backgroundColor: SURFACE_THEME.panelInset,
  },

  heroOrbCore: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.gold,
  },

  heroButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },

  threadBand: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    backgroundColor: SURFACE_THEME.panelInset,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  threadBandEyebrow: {
    color: SURFACE_THEME.eyebrow,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 7,
  },

  threadBandTitle: {
    color: SURFACE_THEME.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    marginBottom: 4,
  },

  threadBandMeta: {
    color: SURFACE_THEME.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 6,
  },

  threadBandBody: {
    color: SURFACE_THEME.text,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },

  primaryButton: {
    backgroundColor: SURFACE_THEME.goldSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderWarm,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  primaryButtonDisabled: {
    backgroundColor: SURFACE_THEME.panelSoft,
    borderColor: SURFACE_THEME.border,
  },

  primaryButtonText: {
    color: SURFACE_THEME.gold,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  primaryButtonTextDisabled: {
    color: SURFACE_THEME.textSoft,
  },

  secondaryButton: {
    backgroundColor: SURFACE_THEME.panelSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  secondaryButtonText: {
    color: SURFACE_THEME.text,
    fontSize: 13,
    fontWeight: '800',
  },

  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  metricCard: {
    width: '31.5%',
    backgroundColor: SURFACE_THEME.panelAlt,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 24,
    padding: 12,
  },

  metricLabel: {
    color: SURFACE_THEME.eyebrow,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },

  metricValue: {
    color: SURFACE_THEME.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    marginBottom: 4,
  },

  metricMeta: {
    color: SURFACE_THEME.textMuted,
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
    backgroundColor: SURFACE_THEME.panelAlt,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
  },

  featureCardWide: {
    width: '100%',
  },

  featureEyebrow: {
    color: SURFACE_THEME.eyebrow,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  featureTitle: {
    color: SURFACE_THEME.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },

  featureMeta: {
    color: SURFACE_THEME.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 6,
  },

  featureBody: {
    color: SURFACE_THEME.text,
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
    borderColor: SURFACE_THEME.border,
    backgroundColor: SURFACE_THEME.panelSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  inlineGhostButtonText: {
    color: SURFACE_THEME.text,
    fontSize: 12,
    fontWeight: '800',
  },

  runDeck: {
    backgroundColor: SURFACE_THEME.panel,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 30,
    padding: 18,
    marginBottom: 14,
  },

  memoryDeck: {
    backgroundColor: SURFACE_THEME.panel,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 30,
    padding: 18,
    marginBottom: 14,
  },

  runDeckEyebrow: {
    color: SURFACE_THEME.eyebrow,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  runDeckTitle: {
    color: SURFACE_THEME.text,
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
    borderBottomColor: SURFACE_THEME.border,
  },

  runRowCopy: {
    marginBottom: 10,
  },

  runRowTitle: {
    color: SURFACE_THEME.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },

  runRowMeta: {
    color: SURFACE_THEME.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  runRowBody: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  runRowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  feedPrimaryButton: {
    backgroundColor: SURFACE_THEME.goldSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderWarm,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 8,
  },

  feedPrimaryButtonText: {
    color: SURFACE_THEME.gold,
    fontSize: 12,
    fontWeight: '900',
  },

  feedSecondaryButton: {
    backgroundColor: SURFACE_THEME.panelSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 8,
  },

  feedSecondaryButtonText: {
    color: SURFACE_THEME.text,
    fontSize: 12,
    fontWeight: '900',
  },

  feedButtonDisabled: {
    opacity: 0.45,
  },

  feedButtonTextDisabled: {
    color: SURFACE_THEME.textSoft,
  },

  memoryPreviewCard: {
    backgroundColor: SURFACE_THEME.panelInset,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 18,
    padding: 14,
  },

  memoryPreviewTitle: {
    color: SURFACE_THEME.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },

  memoryPreviewMeta: {
    color: SURFACE_THEME.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 6,
  },

  memoryPreviewBody: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  emptyText: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  launchHeader: {
    marginBottom: 10,
  },

  launchEyebrow: {
    color: SURFACE_THEME.eyebrow,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  launchTitle: {
    color: SURFACE_THEME.text,
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
