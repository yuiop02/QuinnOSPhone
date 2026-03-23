import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import SectionCard from './SectionCard';
import { TOKENS } from './quinnSystem';
import { MemoryItem } from './quinnTypes';

type MemoryPanelProps = {
  onBack: () => void;
  onOpenCanvas: () => void;
  memories: MemoryItem[];
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

function formatSource(source: MemoryItem['source']) {
  if (source === 'run-summary') {
    return 'From Gravity';
  }

  if (source === 'packet') {
    return 'From Canvas';
  }

  return 'Starter memory';
}

export default function MemoryPanel({
  onBack,
  onOpenCanvas,
  memories,
  onLoadMemoryItem,
  onTogglePin,
  onDeleteMemoryItem,
}: MemoryPanelProps) {
  const safeMemories = Array.isArray(memories) ? memories : [];

  const orderedMemories = [...safeMemories].sort((a, b) => {
    const pinDelta = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));

    if (pinDelta !== 0) {
      return pinDelta;
    }

    return String(b.timestamp || '').localeCompare(String(a.timestamp || ''));
  });

  const pinnedCount = orderedMemories.filter((item) => item.pinned).length;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.rowBetween}>
        <Text style={styles.eyebrow}>MEMORY PANEL</Text>
        <Pressable onPress={onBack} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Back</Text>
        </Pressable>
      </View>

      <Text style={styles.heroTitle}>Memory, kept on purpose.</Text>
      <Text style={styles.heroText}>
        This is where Quinn keeps useful shapes. Not everything. Just the parts worth carrying forward.
      </Text>

      <SectionCard eyebrow="STATUS" title={`${orderedMemories.length} memory items`}>
        <Text style={styles.bodyLine}>Pinned: {pinnedCount}</Text>
        <Text style={styles.bodyLine}>
          Load any item back into Canvas, pin the ones that matter, and delete the weak ones.
        </Text>

        <View style={styles.quickRow}>
          <Pressable style={styles.quickPill} onPress={onOpenCanvas}>
            <Text style={styles.quickPillText}>Open Canvas</Text>
          </Pressable>
        </View>
      </SectionCard>

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
                <Text style={styles.primaryButtonText}>Load into Canvas</Text>
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
        <SectionCard eyebrow="EMPTY" title="Nothing saved yet">
          <Text style={styles.bodyLine}>
            Run a packet through Gravity and the strongest compressed shape will land here.
          </Text>
        </SectionCard>
      )}
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

  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },

  quickPill: {
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    backgroundColor: 'transparent',
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

  memoryCard: {
    backgroundColor: TOKENS.color?.creamSoft ?? '#FBF7EF',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: TOKENS.radius?.lg ?? 24,
    padding: 16,
    marginBottom: 12,
  },

  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  memoryLabel: {
    flex: 1,
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginRight: 10,
  },

  pinBadge: {
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  pinBadgeText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  memoryMeta: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  memoryBody: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
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

  deleteButton: {
    backgroundColor: 'rgba(139,30,45,0.10)',
    borderWidth: 1,
    borderColor: TOKENS.color?.nodeC ?? '#8B1E2D',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  deleteButtonText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 13,
    fontWeight: '900',
  },

  bodyLine: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 8,
  },
});