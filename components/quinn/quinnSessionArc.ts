import type { RunHistoryItem, SessionArc, SessionArcBeat } from './quinnTypes';

const MAX_SESSION_ARC_BEATS = 3;
const GENERIC_TITLES = new Set(['quinn thread', 'quinnos sprint 2', 'untitled packet', 'next move']);

function cleanArcText(value: string, maxLength = 120) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();

  if (!clean) {
    return '';
  }

  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3).trim()}...` : clean;
}

function extractArcTitleFromPacket(packetText: string) {
  const clean = cleanArcText(packetText, 240);

  if (!clean) {
    return '';
  }

  const sentence = clean.match(/[^.!?]+[.!?]?/)?.[0] || clean;
  return cleanArcText(sentence, 48);
}

function createArcBeat({
  summary,
  timestamp,
  lensLabel,
}: {
  summary: string;
  timestamp: string;
  lensLabel: string;
}): SessionArcBeat {
  return {
    id: `arc-beat-${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
    summary: cleanArcText(summary, 92),
    timestamp: String(timestamp || ''),
    lensLabel: cleanArcText(lensLabel, 24) || 'Open',
  };
}

export function deriveSessionArcTitle(packetTitle: string, packetText: string) {
  const safeTitle = cleanArcText(packetTitle, 48);

  if (safeTitle && !GENERIC_TITLES.has(safeTitle.toLowerCase())) {
    return safeTitle;
  }

  const derived = extractArcTitleFromPacket(packetText);

  if (derived) {
    return derived;
  }

  return 'Current thread';
}

export function startSessionArc({
  packetTitle,
  packetText,
  compressedSummary,
  timestamp,
  lensLabel,
}: {
  packetTitle: string;
  packetText: string;
  compressedSummary: string;
  timestamp: string;
  lensLabel: string;
}): SessionArc {
  const safeTimestamp = String(timestamp || new Date().toISOString());

  return {
    id: `arc-${safeTimestamp}`,
    title: deriveSessionArcTitle(packetTitle, packetText),
    createdAt: safeTimestamp,
    updatedAt: safeTimestamp,
    stepCount: 1,
    beats: [
      createArcBeat({
        summary: compressedSummary || packetText,
        timestamp: safeTimestamp,
        lensLabel,
      }),
    ],
  };
}

export function advanceSessionArc(
  currentArc: SessionArc | null | undefined,
  {
    packetTitle,
    packetText,
    compressedSummary,
    timestamp,
    lensLabel,
  }: {
    packetTitle: string;
    packetText: string;
    compressedSummary: string;
    timestamp: string;
    lensLabel: string;
  }
): SessionArc {
  if (!currentArc) {
    return startSessionArc({
      packetTitle,
      packetText,
      compressedSummary,
      timestamp,
      lensLabel,
    });
  }

  const nextBeat = createArcBeat({
    summary: compressedSummary || packetText,
    timestamp,
    lensLabel,
  });

  return {
    ...currentArc,
    title: currentArc.title || deriveSessionArcTitle(packetTitle, packetText),
    updatedAt: String(timestamp || currentArc.updatedAt),
    stepCount: Number(currentArc.stepCount || 0) + 1,
    beats: [...(Array.isArray(currentArc.beats) ? currentArc.beats : []), nextBeat].slice(
      -MAX_SESSION_ARC_BEATS
    ),
  };
}

export function resumeSessionArcFromRun(run: RunHistoryItem): SessionArc | null {
  const arcId = String(run?.sessionArcId || '').trim();
  const arcTitle = String(run?.sessionArcTitle || '').trim();
  const timestamp = String(run?.timestamp || '').trim();

  if (!arcId || !arcTitle || !timestamp) {
    return null;
  }

  const step = Number(run?.sessionArcStep || 1);

  return {
    id: arcId,
    title: arcTitle,
    createdAt: timestamp,
    updatedAt: timestamp,
    stepCount: Number.isFinite(step) && step > 0 ? step : 1,
    beats: [
      createArcBeat({
        summary: run.compressedSummary || run.packetText || run.writtenResult,
        timestamp,
        lensLabel: 'Open',
      }),
    ],
  };
}

export function buildSessionArcPacketContext(sessionArc: SessionArc | null | undefined) {
  if (!sessionArc) {
    return '';
  }

  const beats = Array.isArray(sessionArc.beats) ? sessionArc.beats.slice(-3) : [];
  const recentFlow = beats
    .map((beat) => cleanArcText(beat.summary, 110))
    .filter(Boolean)
    .join('\n');

  return [
    `This is still the same thread:\n${sessionArc.title}`,
    recentFlow ? `What we were just circling:\n${recentFlow}` : '',
    `Only carry it forward if it still fits:\nThis is turn ${sessionArc.stepCount}. If the new note has clearly shifted, answer the new thing instead of forcing the old thread. If the thread is still exploratory, stay with the exploration instead of pushing it into a conclusion too early or ending on advice just to make it feel useful.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildSessionArcMeta(sessionArc: SessionArc | null | undefined) {
  if (!sessionArc) {
    return {
      stepLabel: '',
      continuityLabel: '',
      beats: [] as SessionArcBeat[],
    };
  }

  return {
    stepLabel: `Step ${sessionArc.stepCount}`,
    continuityLabel:
      sessionArc.stepCount > 1
        ? 'This thought is still carrying forward.'
        : 'This thread just started.',
    beats: Array.isArray(sessionArc.beats) ? sessionArc.beats.slice(-3) : [],
  };
}
