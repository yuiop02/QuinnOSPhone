import React, { useMemo } from 'react';
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
  onLoadMemoryItem,
  onTogglePin,
  onDeleteMemoryItem,
}: MemoryPanelProps) {
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
            Run Quinn from the homepage. When a reply creates a strong reusable shape, it lands here and can be loaded back into the composer.
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

  bodyLine: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 8,
  },
});
