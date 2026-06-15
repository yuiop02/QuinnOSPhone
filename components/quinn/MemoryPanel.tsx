import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import QuinnSurfaceShell from './QuinnSurfaceShell';
import SectionCard from './SectionCard';
import { SURFACE_THEME } from './quinnSurfaceTheme';
import type { QuinnMemoryHygieneReviewResultPreview } from './quinnIntakeForms';
import { MemoryItem } from './quinnTypes';

const MEMORY_REVIEW_COPY_TITLE = 'Latest Memory Review';
const MEMORY_REVIEW_PROVENANCE_LINE = 'Latest review from recent runs.';
const MEMORY_REVIEW_TIMESTAMP_UNAVAILABLE_LINE =
  'Last updated: Not available for this review.';

type LatestMemoryReviewPanelItem = {
  id: string;
  timestamp: string;
  resultPreview: QuinnMemoryHygieneReviewResultPreview;
};

type MemoryPanelProps = {
  onBack: () => void;
  onOpenCanvas: () => void;
  memories: MemoryItem[];
  latestMemoryReview?: LatestMemoryReviewPanelItem | null;
  onLoadMemoryReviewNextAction: (nextAction: string) => void;
  onLoadMemoryItem: (item: MemoryItem) => void;
  onTogglePin: (id: string) => void;
  onDeleteMemoryItem: (id: string) => void;
};

function formatTimestamp(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatMemoryReviewUpdatedLine(value?: string | null) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return MEMORY_REVIEW_TIMESTAMP_UNAVAILABLE_LINE;
  }

  const timestamp = new Date(normalizedValue);

  if (Number.isNaN(timestamp.getTime())) {
    return MEMORY_REVIEW_TIMESTAMP_UNAVAILABLE_LINE;
  }

  return `Last updated: ${timestamp.toLocaleString()}`;
}

function formatSource(source: MemoryItem['source']) {
  if (source === 'run-summary') {
    return 'From Quinn reply';
  }

  if (source === 'packet') {
    return 'From live thread';
  }

  return 'Starter memory';
}

export default function MemoryPanel({
  onBack,
  onOpenCanvas,
  memories,
  latestMemoryReview,
  onLoadMemoryReviewNextAction,
  onLoadMemoryItem,
  onTogglePin,
  onDeleteMemoryItem,
}: MemoryPanelProps) {
  const [showMemoryReviewDetails, setShowMemoryReviewDetails] = useState(false);
  const [memoryReviewCopyStatus, setMemoryReviewCopyStatus] = useState('');
  const [memoryReviewFullCopyStatus, setMemoryReviewFullCopyStatus] = useState('');
  const { orderedMemories, pinnedCount } = useMemo(() => {
    const safeMemories = Array.isArray(memories) ? memories : [];
    const nextOrderedMemories = [...safeMemories].sort((a, b) => {
      const pinDelta = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));

      if (pinDelta !== 0) {
        return pinDelta;
      }

      return String(b.timestamp || '').localeCompare(String(a.timestamp || ''));
    });

    return {
      orderedMemories: nextOrderedMemories,
      pinnedCount: nextOrderedMemories.filter((item) => item.pinned).length,
    };
  }, [memories]);
  const latestMemoryReviewResult = latestMemoryReview?.resultPreview || null;
  const memoryReviewUpdatedLine = formatMemoryReviewUpdatedLine(latestMemoryReview?.timestamp);
  const memoryReviewSections = useMemo(
    () =>
      latestMemoryReviewResult
        ? [
            ['MEMORY SHELF READ', latestMemoryReviewResult.memoryShelfRead],
            ['DURABLE SIGNALS', latestMemoryReviewResult.durableSignals],
            ['TRANSIENT / TEST NOISE', latestMemoryReviewResult.transientTestNoise],
            ['DUPLICATES / STALE CONTEXT', latestMemoryReviewResult.duplicatesStaleContext],
            [
              'DO NOT TREAT AS IDENTITY TRUTH',
              latestMemoryReviewResult.doNotTreatAsIdentityTruth,
            ],
            ['NEXT MANUAL MEMORY ACTION', latestMemoryReviewResult.nextManualMemoryAction],
          ]
        : [],
    [latestMemoryReviewResult]
  );
  const fullMemoryReviewText = useMemo(
    () => {
      const renderedSectionsText = memoryReviewSections
        .map(([label, value]) => `${label}:\n${String(value || 'No text captured.').trim()}`)
        .join('\n\n')
        .trim();

      return [
        MEMORY_REVIEW_COPY_TITLE,
        MEMORY_REVIEW_PROVENANCE_LINE,
        memoryReviewUpdatedLine,
        '',
        renderedSectionsText,
      ]
        .join('\n')
        .trim();
    },
    [memoryReviewSections, memoryReviewUpdatedLine]
  );
  const nextManualMemoryAction = latestMemoryReviewResult?.nextManualMemoryAction?.trim() || '';

  useEffect(() => {
    setMemoryReviewCopyStatus('');
  }, [nextManualMemoryAction]);

  useEffect(() => {
    setMemoryReviewFullCopyStatus('');
  }, [fullMemoryReviewText]);

  async function handleCopyFullMemoryReview() {
    if (!fullMemoryReviewText) {
      return;
    }

    try {
      await Clipboard.setStringAsync(fullMemoryReviewText);
      setMemoryReviewFullCopyStatus('Copied');
    } catch {
      setMemoryReviewFullCopyStatus('Copy failed');
    }
  }

  async function handleCopyMemoryReviewNextAction() {
    if (!nextManualMemoryAction) {
      return;
    }

    try {
      await Clipboard.setStringAsync(nextManualMemoryAction);
      setMemoryReviewCopyStatus('Copied');
    } catch {
      setMemoryReviewCopyStatus('Copy failed');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <QuinnSurfaceShell
        eyebrow="MEMORY DECK"
        title="Memory, kept on purpose."
        description="This is where Quinn keeps useful shapes. Not everything. Just the parts worth carrying forward when the next run actually needs them."
        onBack={onBack}
        actions={[
          { label: `${orderedMemories.length} kept`, tone: 'secondary' },
          { label: `${pinnedCount} pinned`, tone: 'ghost' },
          { label: 'Open Quinn', tone: 'primary', onPress: onOpenCanvas },
        ]}
      />

      <SectionCard eyebrow="STATUS" title={`${orderedMemories.length} kept memory item${orderedMemories.length === 1 ? '' : 's'}`}>
        <Text style={styles.bodyLine}>Pinned: {pinnedCount}</Text>
        <Text style={styles.bodyLine}>
          Load a memory back into Quinn when the current thread needs it. Pin the ones that should stay close and delete the weak ones.
        </Text>

        <View style={styles.quickRow}>
          <Pressable style={styles.quickPill} onPress={onOpenCanvas}>
            <Text style={styles.quickPillText}>Open Quinn</Text>
          </Pressable>
        </View>
      </SectionCard>

      {latestMemoryReviewResult ? (
        <View style={styles.memoryReviewPanel}>
          <View style={styles.memoryReviewHeader}>
            <View style={styles.memoryReviewTitleStack}>
              <Text style={styles.memoryReviewEyebrow}>LATEST MEMORY REVIEW</Text>
              <Text style={styles.memoryReviewTitle}>Review only</Text>
              <Text style={styles.memoryReviewMeta}>
                {MEMORY_REVIEW_PROVENANCE_LINE}
              </Text>
              <Text style={styles.memoryReviewMeta}>
                {memoryReviewUpdatedLine}
              </Text>
            </View>

            <Pressable
              style={styles.memoryReviewToggle}
              onPress={() => setShowMemoryReviewDetails((current) => !current)}
            >
              <Text style={styles.memoryReviewToggleText}>
                {showMemoryReviewDetails ? 'Hide' : 'View'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.memoryReviewHelper}>
            Review only. No memory changes happen from this panel.
          </Text>

          <View style={styles.memoryReviewPanelActions}>
            <Pressable
              style={styles.memoryReviewCopyButton}
              onPress={handleCopyFullMemoryReview}
            >
              <Text style={styles.memoryReviewCopyButtonText}>Copy full review</Text>
            </Pressable>
            {memoryReviewFullCopyStatus ? (
              <Text style={styles.memoryReviewCopyStatus}>{memoryReviewFullCopyStatus}</Text>
            ) : null}
          </View>

          {nextManualMemoryAction ? (
            <View style={styles.memoryReviewSpotlight}>
              <Text style={styles.memoryReviewSpotlightLabel}>Next manual action</Text>
              <Text style={styles.memoryReviewSpotlightBody} selectable>
                {nextManualMemoryAction}
              </Text>
              <View style={styles.memoryReviewSpotlightActions}>
                <Pressable
                  style={styles.memoryReviewCopyButton}
                  onPress={handleCopyMemoryReviewNextAction}
                >
                  <Text style={styles.memoryReviewCopyButtonText}>Copy</Text>
                </Pressable>
                {memoryReviewCopyStatus ? (
                  <Text style={styles.memoryReviewCopyStatus}>{memoryReviewCopyStatus}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {showMemoryReviewDetails ? (
            memoryReviewSections.map(([label, value]) => (
              <View key={label} style={styles.memoryReviewSection}>
                <Text style={styles.memoryReviewSectionLabel}>{label}</Text>
                <Text style={styles.memoryReviewBody}>{value || 'No text captured.'}</Text>
              </View>
            ))
          ) : (
            <>
              <View style={styles.memoryReviewSection}>
                <Text style={styles.memoryReviewSectionLabel}>MEMORY SHELF READ</Text>
                <Text style={styles.memoryReviewBody} numberOfLines={2}>
                  {latestMemoryReviewResult.memoryShelfRead || 'No shelf read captured.'}
                </Text>
              </View>

              <View style={styles.memoryReviewSection}>
                <Text style={styles.memoryReviewSectionLabel}>NEXT MANUAL MEMORY ACTION</Text>
                <Text style={styles.memoryReviewBody} numberOfLines={2}>
                  {nextManualMemoryAction || 'No next action captured.'}
                </Text>
              </View>
            </>
          )}

          <View style={styles.rowWrap}>
            <Pressable
              style={[
                styles.primaryButton,
                !nextManualMemoryAction && styles.disabledButton,
              ]}
              disabled={!nextManualMemoryAction}
              onPress={() => onLoadMemoryReviewNextAction(nextManualMemoryAction)}
            >
              <Text style={styles.primaryButtonText}>Load next action</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.memoryReviewPanel}>
          <View style={styles.memoryReviewHeader}>
            <View style={styles.memoryReviewTitleStack}>
              <Text style={styles.memoryReviewEyebrow}>MEMORY REVIEW</Text>
              <Text style={styles.memoryReviewTitle}>Latest Memory Review</Text>
              <Text style={styles.memoryReviewMeta}>
                No completed Memory Review yet.
              </Text>
            </View>
          </View>

          <Text style={styles.memoryReviewHelper}>
            Run Memory Review to generate one. Completed reviews will appear here
            with provenance and the next manual memory action.
          </Text>
        </View>
      )}

      {orderedMemories.length ? (
        orderedMemories.map((item) => (
          <View key={item.id} style={styles.memoryCard}>
            <View style={styles.memoryHeader}>
              <Text style={styles.memoryLabel} numberOfLines={1}>
                {item.label}
              </Text>

              {item.pinned ? (
                <View style={styles.pinBadge}>
                  <Text style={styles.pinBadgeText}>PINNED</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.memoryMeta}>
              {formatSource(item.source)} • {formatTimestamp(item.timestamp)}
            </Text>

            <Text style={styles.memoryBody}>{item.body}</Text>

            <View style={styles.rowWrap}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => onLoadMemoryItem(item)}
              >
                <Text style={styles.primaryButtonText}>Load into Quinn</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => onTogglePin(item.id)}
              >
                <Text style={styles.secondaryButtonText}>
                  {item.pinned ? 'Unpin' : 'Pin'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.deleteButton}
                onPress={() => onDeleteMemoryItem(item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        <SectionCard eyebrow="EMPTY" title="Nothing worth keeping yet">
          <Text style={styles.bodyLine}>
            Run Ren from the homepage. When a reply creates a strong reusable shape, it lands here and can be loaded back into the composer.
          </Text>
        </SectionCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },

  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },

  quickPill: {
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    backgroundColor: SURFACE_THEME.panelSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 8,
  },

  quickPillText: {
    color: SURFACE_THEME.text,
    fontSize: 12,
    fontWeight: '800',
  },

  memoryCard: {
    backgroundColor: SURFACE_THEME.panelAlt,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },

  memoryReviewPanel: {
    backgroundColor: SURFACE_THEME.panelAlt,
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderWarm,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },

  memoryReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  memoryReviewTitleStack: {
    flex: 1,
    marginRight: 12,
  },

  memoryReviewEyebrow: {
    color: SURFACE_THEME.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  memoryReviewTitle: {
    color: SURFACE_THEME.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },

  memoryReviewMeta: {
    color: SURFACE_THEME.textSoft,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    marginTop: 4,
  },

  memoryReviewToggle: {
    backgroundColor: SURFACE_THEME.panelSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  memoryReviewToggleText: {
    color: SURFACE_THEME.text,
    fontSize: 12,
    fontWeight: '900',
  },

  memoryReviewHelper: {
    color: SURFACE_THEME.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginBottom: 10,
  },

  memoryReviewSpotlight: {
    backgroundColor: SURFACE_THEME.goldSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderWarm,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },

  memoryReviewSpotlightLabel: {
    color: SURFACE_THEME.gold,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 4,
  },

  memoryReviewSpotlightBody: {
    color: SURFACE_THEME.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '800',
  },

  memoryReviewSpotlightActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 10,
  },

  memoryReviewPanelActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 6,
  },

  memoryReviewCopyButton: {
    backgroundColor: SURFACE_THEME.panelSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderWarm,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 10,
    marginBottom: 4,
  },

  memoryReviewCopyButtonText: {
    color: SURFACE_THEME.gold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  memoryReviewCopyStatus: {
    color: SURFACE_THEME.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    marginBottom: 4,
  },

  memoryReviewSection: {
    marginTop: 8,
  },

  memoryReviewSectionLabel: {
    color: SURFACE_THEME.gold,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 3,
  },

  memoryReviewBody: {
    color: SURFACE_THEME.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },

  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  memoryLabel: {
    flex: 1,
    color: SURFACE_THEME.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginRight: 10,
  },

  pinBadge: {
    backgroundColor: SURFACE_THEME.goldSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderWarm,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  pinBadgeText: {
    color: SURFACE_THEME.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  memoryMeta: {
    color: SURFACE_THEME.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  memoryBody: {
    color: SURFACE_THEME.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },

  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
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

  primaryButtonText: {
    color: SURFACE_THEME.gold,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
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
    fontWeight: '900',
  },

  deleteButton: {
    backgroundColor: SURFACE_THEME.danger,
    borderWidth: 1,
    borderColor: 'rgba(233, 116, 142, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  deleteButtonText: {
    color: '#FFD6E1',
    fontSize: 13,
    fontWeight: '900',
  },

  disabledButton: {
    opacity: 0.45,
  },

  bodyLine: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 8,
  },
});
