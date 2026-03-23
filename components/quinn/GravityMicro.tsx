import LottieView from 'lottie-react-native';
import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import NodeBadge from './NodeBadge';
import SectionCard from './SectionCard';
import { buildCompressionSummary } from './quinnApi';
import { GRAVITY_WELL, TOKENS } from './quinnSystem';
import { RunHistoryItem } from './quinnTypes';

type GravityMicroProps = {
  onBack: () => void;
  onOpenCanvas: () => void;
  onOpenMemory: () => void;
  onOpenExports: () => void;
  onOpenNotifications: () => void;
  onOpenControlCenter: () => void;
  onRunPacket: () => void;
  onRestoreRunToCanvas: (run: RunHistoryItem) => void;
  onRerunHistoryItem: (run: RunHistoryItem) => void;
  packetTitle: string;
  packetText: string;
  writtenResult: string;
  compressedSummary: string;
  isRunning: boolean;
  runError: string;
  lastRunAt: string | null;
  recentRuns: RunHistoryItem[];
  reduceMotion: boolean;
  focusMode: boolean;
};

function formatRunStamp(value: string | null) {
  if (!value) {
    return 'No run yet.';
  }

  try {
    return `Last run: ${new Date(value).toLocaleString()}`;
  } catch {
    return `Last run: ${value}`;
  }
}

export default function GravityMicro({
  onBack,
  onOpenCanvas,
  onOpenMemory,
  onOpenExports,
  onOpenNotifications,
  onOpenControlCenter,
  onRunPacket,
  onRestoreRunToCanvas,
  onRerunHistoryItem,
  packetTitle,
  packetText,
  writtenResult,
  compressedSummary,
  isRunning,
  runError,
  lastRunAt,
  recentRuns,
  reduceMotion,
  focusMode,
}: GravityMicroProps) {
  const safeRecentRuns = Array.isArray(recentRuns) ? recentRuns : [];
  const cleanPacket = String(packetText || '').trim();
  const safePacketTitle = String(packetTitle || '').trim() || 'Untitled packet';
  const packetPreview =
    cleanPacket || 'Nothing is in Gravity yet. Open Canvas and write the packet first.';
  const summaryPreview =
    compressedSummary || buildCompressionSummary(writtenResult || cleanPacket);
  const latestHistory = safeRecentRuns[0];

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.rowBetween}>
        <Text style={styles.eyebrow}>GRAVITY MICRO</Text>
        <Pressable onPress={onBack} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Back</Text>
        </Pressable>
      </View>

      <Text style={styles.heroTitle}>Gravity, compressed.</Text>
      <Text style={styles.heroText}>
        This is the run surface. Less writing, more pull, compression, and result.
      </Text>

      <View style={styles.gravityHintBand}>
        <Text style={styles.gravityHintText}>
          Gravity is live against your backend. Press Run Quinn to send the current packet through the run endpoint.
        </Text>
      </View>

      {focusMode ? (
        <View style={styles.focusBand}>
          <Text style={styles.focusBandText}>
            Focus mode is on. Gravity stays trimmed to the strongest action.
          </Text>
        </View>
      ) : null}

      <View style={styles.gravityWrap}>
        {reduceMotion ? (
          <View style={styles.staticGravityWrap}>
            <View style={styles.staticRingOuter} />
            <View style={styles.staticRingInner} />
            <View style={styles.staticCore} />
          </View>
        ) : (
          <LottieView source={GRAVITY_WELL} autoPlay loop style={styles.gravityLottie} />
        )}

        <NodeBadge fill={TOKENS.color?.nodeA ?? '#1E3C34'} style={styles.nodeA} />
        <NodeBadge fill={TOKENS.color?.nodeB ?? '#7A4B18'} style={styles.nodeB} />
        <NodeBadge fill={TOKENS.color?.nodeC ?? '#8B1E2D'} style={styles.nodeC} />
      </View>

      <SectionCard eyebrow="CURRENT PACKET" title={safePacketTitle}>
        <Text style={styles.packetMeta}>
          {cleanPacket ? `${cleanPacket.length} characters ready.` : 'Packet is blank.'}
        </Text>

        <View style={styles.packetBubble}>
          <Text style={styles.packetText}>{packetPreview}</Text>
        </View>

        <View style={styles.rowWrap}>
          <Pressable
            style={[styles.primaryButton, (!cleanPacket || isRunning) && styles.buttonDisabled]}
            onPress={onRunPacket}
            disabled={!cleanPacket || isRunning}
          >
            <Text style={styles.primaryButtonText}>
              {isRunning ? 'Running Quinn...' : 'Run Quinn'}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onOpenCanvas}>
            <Text style={styles.secondaryButtonText}>Edit packet</Text>
          </Pressable>
        </View>

        <View style={styles.quickRow}>
          <Pressable style={styles.quickPill} onPress={onOpenMemory}>
            <Text style={styles.quickPillText}>Memory</Text>
          </Pressable>

          <Pressable style={styles.quickPill} onPress={onOpenNotifications}>
            <Text style={styles.quickPillText}>Alerts</Text>
          </Pressable>

          <Pressable style={styles.quickPill} onPress={onOpenControlCenter}>
            <Text style={styles.quickPillText}>Control</Text>
          </Pressable>

          <Pressable style={styles.quickPill} onPress={onOpenExports}>
            <Text style={styles.quickPillText}>Exports</Text>
          </Pressable>
        </View>
      </SectionCard>

      {runError ? (
        <View style={styles.errorBand}>
          <Text style={styles.errorBandText}>{runError}</Text>
        </View>
      ) : null}

      <SectionCard eyebrow="WRITTEN RESULT" title="Keep the long form here">
        <Text style={styles.runMeta}>{formatRunStamp(lastRunAt)}</Text>
        <View style={styles.resultBubble}>
          <Text style={styles.previewText}>
            {writtenResult || 'Run the current packet to pull a real written result from the backend.'}
          </Text>
        </View>
      </SectionCard>

      <SectionCard eyebrow="COMPRESSION" title="Short text summary">
        <Text style={styles.bodyLine}>
          This is the text-only compression layer. Voice stays parked until the real voice model is ready.
        </Text>
        <View style={styles.summaryBubble}>
          <Text style={styles.summaryText}>{summaryPreview}</Text>
        </View>
      </SectionCard>

      <SectionCard eyebrow="RECENT RUN" title="Restore or rerun">
        {latestHistory ? (
          <>
            <Text style={styles.runMeta}>{formatRunStamp(latestHistory.timestamp)}</Text>
            <Text style={styles.bodyLine}>{latestHistory.compressedSummary}</Text>

            <View style={styles.rowWrap}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => onRestoreRunToCanvas(latestHistory)}
              >
                <Text style={styles.primaryButtonText}>Load to Canvas</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => onRerunHistoryItem(latestHistory)}
              >
                <Text style={styles.secondaryButtonText}>Rerun latest</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Text style={styles.bodyLine}>No history yet. First run will land here.</Text>
        )}
      </SectionCard>
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

  gravityHintBand: {
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    borderRadius: TOKENS.radius?.md ?? 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },

  gravityHintText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },

  focusBand: {
    backgroundColor: 'rgba(17,17,17,0.05)',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.md ?? 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },

  focusBandText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
  },

  gravityWrap: {
    height: 300,
    borderRadius: TOKENS.radius?.xl ?? 30,
    backgroundColor: '#F0E7D6',
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
  },

  gravityLottie: {
    width: 280,
    height: 280,
  },

  staticGravityWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },

  staticRingOuter: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    backgroundColor: 'rgba(184,138,42,0.06)',
  },

  staticRingInner: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.color?.ink ?? '#111111',
    backgroundColor: 'rgba(17,17,17,0.03)',
  },

  staticCore: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: TOKENS.color?.ink ?? '#111111',
  },

  nodeA: {
    top: 76,
    left: 72,
  },

  nodeB: {
    bottom: 84,
    right: 66,
  },

  nodeC: {
    top: 142,
    right: 96,
  },

  packetMeta: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  packetBubble: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: 18,
    padding: 14,
  },

  packetText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },

  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },

  primaryButton: {
    backgroundColor: TOKENS.color?.ink ?? '#111111',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  buttonDisabled: {
    opacity: 0.45,
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

  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },

  quickPill: {
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 8,
  },

  quickPillText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 12,
    fontWeight: '800',
  },

  errorBand: {
    backgroundColor: 'rgba(139,30,45,0.10)',
    borderWidth: 1,
    borderColor: TOKENS.color?.nodeC ?? '#8B1E2D',
    borderRadius: TOKENS.radius?.md ?? 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },

  errorBandText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },

  runMeta: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  resultBubble: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: 18,
    padding: 14,
  },

  bodyLine: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 8,
  },

  summaryBubble: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: 18,
    padding: 14,
    marginTop: 6,
  },

  summaryText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },

  previewText: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
});