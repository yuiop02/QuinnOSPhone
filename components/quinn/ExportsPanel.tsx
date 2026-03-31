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
import QuinnSurfaceShell from './QuinnSurfaceShell';
import SectionCard from './SectionCard';
import { SURFACE_THEME } from './quinnSurfaceTheme';
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
      <QuinnSurfaceShell
        eyebrow="EXPORT STUDIO"
        title="Exports, ready to travel."
        description="These live bundle previews keep the current QuinnOS state intact. Choose the cleanest format for sharing, saving, or handing the work off."
        onBack={onBack}
        actions={[
          { label: `${recentRunsCount} runs in bundle`, tone: 'secondary' },
          { label: `${memoryCount} memory items`, tone: 'ghost' },
          { label: `Format: ${activeLabel}`, tone: 'primary' },
        ]}
      />

      <SectionCard
        eyebrow="SNAPSHOT"
        title={exportBundle.title.trim() || packetTitle.trim() || 'QuinnOS Export'}
      >
        <Text style={styles.bodyLine}>Generated: {formatTimestamp(exportBundle.generatedAt)}</Text>
        <Text style={styles.bodyLine}>
          Composer: {exportBundle.snapshot.currentComposer.isBlank ? 'blank' : 'draft staged'}
        </Text>
        <Text style={styles.bodyLine}>
          Active thread:{' '}
          {exportBundle.snapshot.activeThread.hasActiveThread
            ? exportBundle.snapshot.activeThread.title || 'Untitled thread'
            : 'none'}
        </Text>
        <Text style={styles.bodyLine}>
          Latest completed run:{' '}
          {exportBundle.snapshot.latestCompletedRun
            ? formatTimestamp(exportBundle.snapshot.latestCompletedRun.timestamp)
            : 'none'}
        </Text>
        <Text style={styles.bodyLine}>Runs included: {recentRunsCount}</Text>
        <Text style={styles.bodyLine}>Memory items included: {memoryCount}</Text>

        <View style={styles.quickRow}>
          <Pressable style={styles.quickPill} onPress={onOpenCanvas}>
            <Text style={styles.quickPillText}>Open Quinn</Text>
          </Pressable>
        </View>
      </SectionCard>

      <SectionCard eyebrow="FORMAT" title="Choose a format">
        <Text style={styles.bodyLine}>
          Markdown reads best, plain text stays lean, and JSON keeps the full structure.
        </Text>
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

      <SectionCard eyebrow={activeLabel.toUpperCase()} title="Preview before you send it">
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>{activeContent}</Text>
        </View>
      </SectionCard>
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

  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },

  modePill: {
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    backgroundColor: SURFACE_THEME.panelSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
  },

  modePillActive: {
    backgroundColor: SURFACE_THEME.plumSoft,
    borderColor: SURFACE_THEME.borderStrong,
  },

  modePillText: {
    color: SURFACE_THEME.text,
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

  statusBand: {
    marginTop: 10,
    backgroundColor: SURFACE_THEME.panelSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },

  statusBandText: {
    color: SURFACE_THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },

  previewBox: {
    backgroundColor: SURFACE_THEME.panelInset,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 18,
    padding: 14,
  },

  previewText: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  bodyLine: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 8,
  },
});
