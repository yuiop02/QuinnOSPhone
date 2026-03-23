import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import SectionCard from './SectionCard';
import { TOKENS } from './quinnSystem';
import { ExportBundle } from './quinnTypes';

type ExportsPanelProps = {
  onBack: () => void;
  onOpenCanvas: () => void;
  exportBundle: ExportBundle;
  packetTitle: string;
  recentRunsCount: number;
  memoryCount: number;
};

type ExportMode = 'json' | 'markdown' | 'text';

function formatTimestamp(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function ExportsPanel({
  onBack,
  onOpenCanvas,
  exportBundle,
  packetTitle,
  recentRunsCount,
  memoryCount,
}: ExportsPanelProps) {
  const [mode, setMode] = useState<ExportMode>('markdown');
  const [statusMessage, setStatusMessage] = useState('');

  const activeContent = useMemo(() => {
    if (mode === 'json') {
      return exportBundle.json;
    }

    if (mode === 'text') {
      return exportBundle.text;
    }

    return exportBundle.markdown;
  }, [mode, exportBundle]);

  const activeLabel = useMemo(() => {
    if (mode === 'json') {
      return 'JSON';
    }

    if (mode === 'text') {
      return 'Plain text';
    }

    return 'Markdown';
  }, [mode]);

  async function handleCopy() {
    try {
      await Clipboard.setStringAsync(activeContent);
      setStatusMessage(`${activeLabel} copied.`);
    } catch {
      setStatusMessage('Copy failed.');
    }
  }

  async function handleShare() {
    try {
      await Share.share({
        title: `${packetTitle || 'QuinnOS Export'} - ${activeLabel}`,
        message: activeContent,
      });

      setStatusMessage(`${activeLabel} opened in share sheet.`);
    } catch {
      setStatusMessage('Share failed.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.rowBetween}>
        <Text style={styles.eyebrow}>EXPORTS PANEL</Text>
        <Pressable onPress={onBack} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Back</Text>
        </Pressable>
      </View>

      <Text style={styles.heroTitle}>Exports, cleaned up.</Text>
      <Text style={styles.heroText}>
        These are live bundle previews from the current QuinnOS state. Copy or share whichever format is strongest for the moment.
      </Text>

      <SectionCard eyebrow="SNAPSHOT" title={packetTitle.trim() || 'Untitled packet'}>
        <Text style={styles.bodyLine}>Generated: {formatTimestamp(exportBundle.generatedAt)}</Text>
        <Text style={styles.bodyLine}>Runs included: {recentRunsCount}</Text>
        <Text style={styles.bodyLine}>Memory items included: {memoryCount}</Text>

        <View style={styles.quickRow}>
          <Pressable style={styles.quickPill} onPress={onOpenCanvas}>
            <Text style={styles.quickPillText}>Open Canvas</Text>
          </Pressable>
        </View>
      </SectionCard>

      <SectionCard eyebrow="FORMAT" title="Choose export shape">
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modePill, mode === 'json' && styles.modePillActive]}
            onPress={() => setMode('json')}
          >
            <Text style={styles.modePillText}>JSON</Text>
          </Pressable>

          <Pressable
            style={[styles.modePill, mode === 'markdown' && styles.modePillActive]}
            onPress={() => setMode('markdown')}
          >
            <Text style={styles.modePillText}>Markdown</Text>
          </Pressable>

          <Pressable
            style={[styles.modePill, mode === 'text' && styles.modePillActive]}
            onPress={() => setMode('text')}
          >
            <Text style={styles.modePillText}>Plain text</Text>
          </Pressable>
        </View>

        <View style={styles.rowWrap}>
          <Pressable style={styles.primaryButton} onPress={handleCopy}>
            <Text style={styles.primaryButtonText}>Copy {activeLabel}</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleShare}>
            <Text style={styles.secondaryButtonText}>Share {activeLabel}</Text>
          </Pressable>
        </View>

        {statusMessage ? (
          <View style={styles.statusBand}>
            <Text style={styles.statusBandText}>{statusMessage}</Text>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard eyebrow={activeLabel.toUpperCase()} title="Live preview">
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>{activeContent}</Text>
        </View>
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

  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },

  modePill: {
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    backgroundColor: 'transparent',
    borderRadius: TOKENS.radius?.pill ?? 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
  },

  modePillActive: {
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
  },

  modePillText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
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

  statusBand: {
    marginTop: 10,
    backgroundColor: TOKENS.color?.goldSoft ?? 'rgba(184,138,42,0.16)',
    borderWidth: 1,
    borderColor: TOKENS.color?.gold ?? '#B88A2A',
    borderRadius: TOKENS.radius?.md ?? 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },

  statusBandText: {
    color: TOKENS.color?.ink ?? '#111111',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },

  previewBox: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: TOKENS.color?.rule ?? '#D8C8A6',
    borderRadius: 18,
    padding: 14,
  },

  previewText: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  bodyLine: {
    color: TOKENS.color?.inkMuted ?? '#4A463E',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 8,
  },
});