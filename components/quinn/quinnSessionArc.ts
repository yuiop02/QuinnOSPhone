import type { RunHistoryItem, SessionArc, SessionArcBeat } from './quinnTypes';
import type { QuinnThreadContinuityInference } from './quinnThreadContinuityState';

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

export function buildSessionArcPacketContext(
  sessionArc: SessionArc | null | undefined,
  threadContinuity: QuinnThreadContinuityInference | null = null
) {
  if (!sessionArc) {
    return '';
  }

  const beats = Array.isArray(sessionArc.beats) ? sessionArc.beats.slice(-3) : [];
  const recentFlow = beats
    .map((beat) => cleanArcText(beat.summary, 110))
    .filter(Boolean)
    .join('\n');
  const carryoverMode = threadContinuity?.threadCarryoverMode.id || 'soften';
  const recentFlowLabel =
    carryoverMode === 'keep'
      ? 'Carryover that still seems live'
      : carryoverMode === 'soften'
        ? 'Background thread carryover'
        : 'Background-only thread carryover';
  const continuityPolicy =
    carryoverMode === 'keep'
      ? 'This still looks like the same live subject. Carry the thread forward only as far as the newest note keeps it alive.'
      : carryoverMode === 'soften'
        ? 'This is the same thread, but continuity is background support rather than the main subject. Let the newest note decide what the reply is actually about.'
        : 'This is still the same thread, but the live subject has shifted. Do not keep extending the old scene, tone posture, or semantic frame.';

  return [
    `Same thread:\n${sessionArc.title}`,
    recentFlow ? `${recentFlowLabel}:\n${recentFlow}` : '',
    `Only carry it forward if it still fits:\nThis is turn ${sessionArc.stepCount}. ${continuityPolicy} If the thread is still exploratory, stay with the exploration instead of pushing it into a conclusion too early, ending on advice just to make it feel useful, or shrinking a live thought into a cleaner answer before it is ready. Let continuity show up as quicker understanding and better calibration more often than as named callbacks to the thread itself.`,
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
        ? 'Carryover available if it still fits.'
        : 'Thread just started.',
    beats: Array.isArray(sessionArc.beats) ? sessionArc.beats.slice(-3) : [],
  };
}
