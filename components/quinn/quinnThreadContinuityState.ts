import type { SessionArc } from './quinnTypes';

export type QuinnLiveSubjectDominanceId = 'low' | 'medium' | 'high';
export type QuinnThreadCarryoverModeId = 'keep' | 'soften' | 'drop';
export type QuinnStaleFrameRiskId = 'none' | 'light' | 'strong';

type QuinnSignalPattern = {
  pattern: RegExp;
  label: string;
  score: number;
};

type QuinnSignalBucket<T extends string> = {
  id: T;
  score: number;
  signals: string[];
  promptGuidance: string;
};

export type QuinnThreadContinuityInference = {
  hasActiveThread: boolean;
  frameContinuation: boolean;
  recentBeatSummary: string;
  liveSubjectDominance: QuinnSignalBucket<QuinnLiveSubjectDominanceId>;
  threadCarryoverMode: QuinnSignalBucket<QuinnThreadCarryoverModeId>;
  staleFrameRisk: QuinnSignalBucket<QuinnStaleFrameRiskId>;
  promptGuidance: string[];
};

export const QUINN_THREAD_CONTINUITY_TUNING = {
  liveSubjectDominance: {
    mediumThreshold: 1.05,
    highThreshold: 1.95,
  },
  staleFrameRisk: {
    lightThreshold: 0.95,
    strongThreshold: 1.8,
  },
  continuation: {
    keepThreshold: 1.4,
    overlapKeepThreshold: 0.38,
    overlapDropThreshold: 0.14,
    shortTurnMaxWords: 9,
  },
} as const;

const THREAD_CONTINUATION_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:keep going|go on|continue|what else|and then|same thing|same topic|same point)\b/i,
    label: 'the user is explicitly continuing the same thread',
    score: 1.25,
  },
  {
    pattern: /\b(?:still on that|still about that|still talking about that|back to that)\b/i,
    label: 'the note explicitly points back to the prior subject',
    score: 1.1,
  },
  {
    pattern: /\b(?:again|same vibe|same energy|same lane)\b/i,
    label: 'the note sounds like it wants the same lane again',
    score: 0.55,
  },
];

const FRESH_SUBJECT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:i(?:'m| am)\s+(?:okay|good|fine|tired|sleepy|heading|working|building|making|tweaking|trying|about to)|i(?:'m| am)\s+just)\b/i,
    label: 'the user is giving a fresh first-person status update',
    score: 0.95,
  },
  {
    pattern: /\b(?:right now|currently|at the moment|just now|anyway|either way)\b/i,
    label: 'the note marks a live present-tense shift',
    score: 0.55,
  },
  {
    pattern: /\b(?:heading to bed|going to bed|about to sleep|working on (?:my )?app|making adjustments|tweaking (?:my )?app|fixing (?:my )?app)\b/i,
    label: 'the note introduces a concrete new subject or activity',
    score: 1.15,
  },
  {
    pattern: /\b(?:at work|at starbucks|in the app|in the code|in the build)\b/i,
    label: 'the note names a concrete current setting',
    score: 0.75,
  },
];

const SUBJECT_PIVOT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:actually|anyway|either way|right now|for real)\b/i,
    label: 'the note contains a pivot marker',
    score: 0.4,
  },
  {
    pattern: /\b(?:just|currently|tonight|today)\b/i,
    label: 'the note is grounded in a specific live moment',
    score: 0.25,
  },
];

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'for',
  'from',
  'got',
  'had',
  'has',
  'have',
  'how',
  'i',
  'if',
  'im',
  'in',
  'is',
  'it',
  'its',
  'just',
  'like',
  'me',
  'my',
  'of',
  'oh',
  'ok',
  'okay',
  'on',
  'or',
  'so',
  'that',
  'the',
  'this',
  'to',
  'up',
  'was',
  'were',
  'what',
  'with',
  'you',
  'your',
]);

function cleanText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function clipText(value: string, maxLength = 92) {
  const clean = cleanText(value);

  if (!clean) {
    return '';
  }

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength - 3).trim()}...`;
}

function buildRecentBeatText(sessionArc: SessionArc | null | undefined) {
  return Array.isArray(sessionArc?.beats)
    ? sessionArc.beats
        .slice(-2)
        .map((beat) => cleanText(beat.summary))
        .filter(Boolean)
        .join(' ')
    : '';
}

function getLatestBeatSummary(sessionArc: SessionArc | null | undefined) {
  const latestBeat = Array.isArray(sessionArc?.beats)
    ? sessionArc.beats[sessionArc.beats.length - 1]
    : null;

  return clipText(latestBeat?.summary || '');
}

function collectPatternHits(text: string, patterns: readonly QuinnSignalPattern[]) {
  let score = 0;
  const signals: string[] = [];

  for (const { pattern, label, score: weight } of patterns) {
    if (!pattern.test(text)) {
      continue;
    }

    score += weight;
    signals.push(label);
  }

  return {
    score,
    signals,
  };
}

function uniqueItems(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function tokenizeSignificantTerms(text: string) {
  return cleanText(text)
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .map((token) => token.replace(/^'+|'+$/g, ''))
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function countTokenOverlapRatio(a: string[], b: string[]) {
  if (!a.length || !b.length) {
    return 0;
  }

  const aSet = new Set(a);
  const bSet = new Set(b);
  const overlap = [...aSet].filter((token) => bSet.has(token)).length;
  return overlap / Math.max(1, Math.min(aSet.size, bSet.size));
}

export function inferQuinnThreadContinuity({
  packetText,
  sessionArc = null,
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
}): QuinnThreadContinuityInference {
  const clean = cleanText(packetText);
  const hasActiveThread = Boolean(sessionArc?.id);
  const recentBeatText = buildRecentBeatText(sessionArc);
  const recentBeatSummary = getLatestBeatSummary(sessionArc);
  const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const shortTurn =
    wordCount > 0 &&
    wordCount <= QUINN_THREAD_CONTINUITY_TUNING.continuation.shortTurnMaxWords;
  const continuationHits = collectPatternHits(clean, THREAD_CONTINUATION_PATTERNS);
  const freshSubjectHits = collectPatternHits(clean, FRESH_SUBJECT_PATTERNS);
  const pivotHits = collectPatternHits(clean, SUBJECT_PIVOT_PATTERNS);
  const currentTokens = tokenizeSignificantTerms(clean);
  const priorTokens = tokenizeSignificantTerms(recentBeatText);
  const overlapRatio = countTokenOverlapRatio(currentTokens, priorTokens);

  let continuationScore = continuationHits.score;
  continuationScore +=
    hasActiveThread &&
    overlapRatio >= QUINN_THREAD_CONTINUITY_TUNING.continuation.overlapKeepThreshold
      ? 1
      : 0;
  continuationScore +=
    hasActiveThread &&
    shortTurn &&
    freshSubjectHits.score === 0 &&
    currentTokens.length > 0
      ? 0.45
      : 0;

  let liveSubjectScore = freshSubjectHits.score + pivotHits.score;
  liveSubjectScore += wordCount >= 10 ? 0.3 : 0;
  liveSubjectScore +=
    hasActiveThread &&
    overlapRatio <= QUINN_THREAD_CONTINUITY_TUNING.continuation.overlapDropThreshold &&
    currentTokens.length >= 3
      ? 0.95
      : 0;
  liveSubjectScore +=
    hasActiveThread && currentTokens.length >= 4 && priorTokens.length >= 4 && overlapRatio === 0
      ? 0.45
      : 0;
  liveSubjectScore -= continuationHits.score > 0 ? 0.35 : 0;

  let staleFrameRiskScore = hasActiveThread ? 0.15 : 0;
  staleFrameRiskScore +=
    hasActiveThread && liveSubjectScore > continuationScore ? 0.75 : 0;
  staleFrameRiskScore +=
    hasActiveThread &&
    overlapRatio <= QUINN_THREAD_CONTINUITY_TUNING.continuation.overlapDropThreshold &&
    liveSubjectScore > 0
      ? 0.7
      : 0;
  staleFrameRiskScore += pivotHits.score > 0 ? 0.3 : 0;
  staleFrameRiskScore -= continuationScore >= QUINN_THREAD_CONTINUITY_TUNING.continuation.keepThreshold ? 0.6 : 0;

  const liveSubjectDominanceId: QuinnLiveSubjectDominanceId =
    !hasActiveThread
      ? clean
        ? 'high'
        : 'low'
      : liveSubjectScore >= QUINN_THREAD_CONTINUITY_TUNING.liveSubjectDominance.highThreshold
        ? 'high'
        : liveSubjectScore >= QUINN_THREAD_CONTINUITY_TUNING.liveSubjectDominance.mediumThreshold
          ? 'medium'
          : 'low';

  const staleFrameRiskId: QuinnStaleFrameRiskId =
    !hasActiveThread
      ? 'none'
      : staleFrameRiskScore >= QUINN_THREAD_CONTINUITY_TUNING.staleFrameRisk.strongThreshold
        ? 'strong'
        : staleFrameRiskScore >= QUINN_THREAD_CONTINUITY_TUNING.staleFrameRisk.lightThreshold
          ? 'light'
          : 'none';

  const frameContinuation =
    hasActiveThread &&
    (continuationScore >= QUINN_THREAD_CONTINUITY_TUNING.continuation.keepThreshold ||
      (overlapRatio >= QUINN_THREAD_CONTINUITY_TUNING.continuation.overlapKeepThreshold &&
        liveSubjectDominanceId !== 'high'));

  const threadCarryoverModeId: QuinnThreadCarryoverModeId =
    !hasActiveThread
      ? 'keep'
      : frameContinuation && staleFrameRiskId === 'none'
        ? 'keep'
        : staleFrameRiskId === 'strong' || liveSubjectDominanceId === 'high'
          ? 'drop'
          : 'soften';

  const liveSubjectSignals = uniqueItems([
    ...freshSubjectHits.signals,
    ...(hasActiveThread &&
    overlapRatio <= QUINN_THREAD_CONTINUITY_TUNING.continuation.overlapDropThreshold &&
    currentTokens.length >= 3
      ? ['the current note has low lexical overlap with the recent thread beat']
      : []),
    ...(wordCount >= 10 ? ['the current note contains enough fresh material to stand on its own'] : []),
  ]);

  const carryoverSignals = uniqueItems([
    ...continuationHits.signals,
    ...(frameContinuation ? ['the current note still looks like the same live subject'] : []),
    ...(threadCarryoverModeId === 'soften'
      ? ['the same thread is active, but carryover should stay secondary']
      : []),
    ...(threadCarryoverModeId === 'drop'
      ? ['the thread continues, but the live subject has shifted']
      : []),
  ]);

  const staleFrameSignals = uniqueItems([
    ...(staleFrameRiskId !== 'none'
      ? ['older thread framing could overshadow the newest user turn if left unchecked']
      : []),
    ...(pivotHits.signals.length ? pivotHits.signals : []),
  ]);

  const liveSubjectPromptGuidance =
    liveSubjectDominanceId === 'high'
      ? 'The newest user turn clearly owns the live subject. Answer that directly and treat earlier thread material as background only.'
      : liveSubjectDominanceId === 'medium'
        ? 'The newest turn adds real live material. Let it lead, and keep thread callbacks light.'
        : 'The newest turn still looks close to the ongoing thread, so continuity can stay more active if it truly fits.';

  const carryoverPromptGuidance =
    threadCarryoverModeId === 'drop'
      ? 'Still the same thread, but not the same scene. Drop stale vibe, pet-name posture, and old semantic momentum. Respond to the live subject now.'
      : threadCarryoverModeId === 'soften'
        ? 'Same thread, but continuity is background support. Use it for calibration, not topic dominance.'
        : 'The thread still appears to be carrying the same live subject. Carry it forward only as far as the newest note keeps it alive.';

  const staleFramePromptGuidance =
    staleFrameRiskId === 'strong'
      ? 'Stale-frame risk is strong. Do not keep roleplaying the earlier scene or meaning if the user has moved on.'
      : staleFrameRiskId === 'light'
        ? 'There is some stale-frame risk. Keep the old thread light unless the new note clearly calls back to it.'
        : 'No special stale-frame suppression is needed beyond normal continuity judgment.';

  return {
    hasActiveThread,
    frameContinuation,
    recentBeatSummary,
    liveSubjectDominance: {
      id: liveSubjectDominanceId,
      score: liveSubjectScore,
      signals: liveSubjectSignals,
      promptGuidance: liveSubjectPromptGuidance,
    },
    threadCarryoverMode: {
      id: threadCarryoverModeId,
      score: continuationScore,
      signals: carryoverSignals,
      promptGuidance: carryoverPromptGuidance,
    },
    staleFrameRisk: {
      id: staleFrameRiskId,
      score: staleFrameRiskScore,
      signals: staleFrameSignals,
      promptGuidance: staleFramePromptGuidance,
    },
    promptGuidance: [
      `Live subject dominance: ${liveSubjectDominanceId}. ${liveSubjectPromptGuidance}`,
      `Thread carryover mode: ${threadCarryoverModeId}. ${carryoverPromptGuidance}`,
      `Stale frame risk: ${staleFrameRiskId}. ${staleFramePromptGuidance}`,
      frameContinuation
        ? 'Frame continuation: true. The current turn still appears to continue the same subject.'
        : 'Frame continuation: false. Do not assume the same thread means the same live subject.',
    ],
  };
}

export function buildQuinnThreadContinuityPacketContext({
  packetText,
  sessionArc = null,
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
}) {
  const threadContinuity = inferQuinnThreadContinuity({
    packetText,
    sessionArc,
  });

  return {
    threadContinuity,
    context: threadContinuity.hasActiveThread
      ? [
          threadContinuity.liveSubjectDominance.promptGuidance,
          threadContinuity.threadCarryoverMode.promptGuidance,
          threadContinuity.staleFrameRisk.promptGuidance,
        ]
          .filter(Boolean)
          .join(' ')
      : 'No active thread carryover is competing with the live note.',
  };
}
