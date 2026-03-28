import type {
  MemoryItem,
  MemoryResonanceItem,
  RunHistoryItem,
  SessionArc,
} from './quinnTypes';

export type CreateRunArtifactsArgs = {
  packetTitle: string;
  packetText: string;
  writtenResult: string;
  compressedSummary: string;
  timestamp: string;
  lensId?: string;
  memoryResonance?: MemoryResonanceItem[];
  sessionArc?: SessionArc | null;
};

export function createRunArtifacts({
  packetTitle,
  packetText,
  writtenResult,
  compressedSummary,
  timestamp,
  lensId = '',
  memoryResonance = [],
  sessionArc = null,
}: CreateRunArtifactsArgs): {
  runItem: RunHistoryItem;
  memoryItem: MemoryItem;
} {
  const safeTitle = String(packetTitle || '').trim() || 'Untitled packet';
  const safePacketText = String(packetText || '');
  const safeWrittenResult = String(writtenResult || '');
  const safeCompressedSummary = String(compressedSummary || '');
  const safeTimestamp = String(timestamp || '');
  const safeMemoryResonance = Array.isArray(memoryResonance)
    ? memoryResonance
        .map((item) => ({
          label: String(item?.label || '').trim(),
          preview: String(item?.preview || '').trim(),
        }))
        .filter((item) => item.label || item.preview)
    : [];

  return {
    runItem: {
      id: `run-${safeTimestamp}`,
      packetTitle: safeTitle,
      packetText: safePacketText,
      writtenResult: safeWrittenResult,
      compressedSummary: safeCompressedSummary,
      timestamp: safeTimestamp,
      lensId: String(lensId || '').trim() || undefined,
      memoryResonance: safeMemoryResonance,
      sessionArcId: String(sessionArc?.id || '').trim() || undefined,
      sessionArcTitle: String(sessionArc?.title || '').trim() || undefined,
      sessionArcStep:
        Number.isFinite(Number(sessionArc?.stepCount)) && Number(sessionArc?.stepCount) > 0
          ? Number(sessionArc?.stepCount)
          : undefined,
    },
    memoryItem: {
      id: `memory-${safeTimestamp}`,
      label: safeTitle,
      body: safeCompressedSummary || safeWrittenResult,
      source: 'run-summary',
      timestamp: safeTimestamp,
      pinned: false,
    },
  };
}
