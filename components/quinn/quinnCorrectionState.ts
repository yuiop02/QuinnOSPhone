import type { SessionArc } from './quinnTypes';

export type QuinnCorrectionLatchId = 'none' | 'soft' | 'hard';
export type QuinnConstraintPriorityId = 'none' | 'elevated' | 'dominant';
export type QuinnRepeatGuardId = 'none' | 'avoidExact' | 'avoidNearRepeat';
export type QuinnAcknowledgmentStyleId = 'none' | 'briefPivot' | 'briefOwnIt';

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

export type QuinnCorrectionInference = {
  correctionLatch: QuinnSignalBucket<QuinnCorrectionLatchId>;
  constraintPriority: QuinnSignalBucket<QuinnConstraintPriorityId>;
  repeatGuard: QuinnSignalBucket<QuinnRepeatGuardId> & {
    blockedRecentText: string;
  };
  acknowledgmentStyle: {
    id: QuinnAcknowledgmentStyleId;
    promptGuidance: string;
  };
  invalidatedTargets: string[];
  promptGuidance: string[];
};

export const QUINN_CORRECTION_TUNING = {
  correctionLatch: {
    softThreshold: 1.05,
    hardThreshold: 2.05,
  },
  constraintPriority: {
    elevatedThreshold: 1.1,
    dominantThreshold: 2.05,
    desireOverrideBoost: 0.7,
    correctionBoost: 0.45,
    iKnowButBoost: 0.95,
  },
  repeatGuard: {
    nearThreshold: 1.05,
    exactThreshold: 2.05,
    playfulSoftener: 0.25,
  },
  blockedRecentTextMaxLength: 92,
} as const;

const HARD_CORRECTION_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:that(?:'s| is) not the point|that misses the point)\b/i,
    label: 'user says the previous framing missed the point',
    score: 1.25,
  },
  {
    pattern: /\byou missed(?: what i(?:'m| am) saying| the point)?\b/i,
    label: 'user says the reply missed what they meant',
    score: 1.15,
  },
  {
    pattern: /\b(?:that(?:'s| is) not what i meant|that(?:'s| is) not what i was saying)\b/i,
    label: 'user rejects the previous interpretation',
    score: 1.25,
  },
  {
    pattern: /\bno,\s*(?:the )?(?:issue|point|problem|thing)\s+(?:is|was)\b/i,
    label: 'user replaces the current frame with a different issue',
    score: 1.15,
  },
  {
    pattern: /\bnot that[, ]+(?:this|the|it)\b/i,
    label: 'user explicitly redirects away from the previous target',
    score: 1.2,
  },
];

const SOFT_CORRECTION_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:i know|yeah|yes|right|true|okay|ok|fair),?\s+but\b/i,
    label: 'user says the previous reply still did not resolve the blocker',
    score: 0.9,
  },
  {
    pattern: /\b(?:that|this) (?:doesn't|does not) help\b/i,
    label: 'user says the previous move did not help',
    score: 0.95,
  },
  {
    pattern: /\bnot (?:really|quite)\b/i,
    label: 'user lightly rejects the prior framing',
    score: 0.45,
  },
  {
    pattern: /\b(?:wait|hold on|no because)\b/i,
    label: 'user is trying to hinge or correct the thought',
    score: 0.55,
  },
];

const DOMINANT_CONSTRAINT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:can't|cannot) afford\b|\b(?:don't|do not) have enough money\b|\bno money\b/i,
    label: 'money is the blocker',
    score: 1.45,
  },
  {
    pattern: /\b(?:can't|cannot) (?:do|go|make|swing|have|get|buy|pull off) that\b/i,
    label: 'the user says the thing is not doable',
    score: 1.2,
  },
  {
    pattern: /\b(?:won't work|doesn't work|not possible|isn't possible)\b/i,
    label: 'the current idea is not feasible',
    score: 1.2,
  },
  {
    pattern: /\b(?:no time|not enough time|blocked|blocker|constraint|limitation)\b/i,
    label: 'a practical blocker is now active',
    score: 0.95,
  },
];

const ELEVATED_CONSTRAINT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:can't|cannot|won't|wouldn't)\b/i,
    label: 'the user says they cannot do the thing',
    score: 0.6,
  },
  {
    pattern: /\b(?:don't|do not) have\b|\bnot enough\b/i,
    label: 'the user lacks something needed for the earlier move',
    score: 0.55,
  },
  {
    pattern: /\b(?:too expensive|too far|too late|stuck)\b/i,
    label: 'a practical limit is present',
    score: 0.7,
  },
];

const EXACT_REPEAT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\byou already told (?:me )?that joke\b/i,
    label: 'user says the same joke was reused',
    score: 1.55,
  },
  {
    pattern: /\byou (?:already|just) said that\b/i,
    label: 'user says the same line was reused',
    score: 1.45,
  },
  {
    pattern: /\b(?:same exact thing|same exact joke|same joke)\b/i,
    label: 'user says the repetition is exact',
    score: 1.25,
  },
];

const NEAR_REPEAT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:already told|already said|repeat(?:ing)?|reused)\b/i,
    label: 'user calls out repetition',
    score: 0.9,
  },
  {
    pattern: /\b(?:same thing|same line|same answer|heard that one|again)\b/i,
    label: 'user says this feels like the same move again',
    score: 0.65,
  },
];

const DESIRE_PATTERNS: readonly RegExp[] = [
  /\b(?:i want|want one|want it|would love|i(?:'d| would) love|wish i could|sounds good)\b/i,
];

const REPEAT_OBJECT_PATTERNS: readonly RegExp[] = [
  /\bjoke\b/i,
  /\bline\b/i,
  /\banswer\b/i,
  /\bthing\b/i,
];

function cleanText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function clipText(value: string, maxLength = QUINN_CORRECTION_TUNING.blockedRecentTextMaxLength) {
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

function hasAnyPattern(text: string, patterns: readonly RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function uniqueItems(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

export function inferQuinnCorrectionState({
  packetText,
  sessionArc = null,
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
}): QuinnCorrectionInference {
  const clean = cleanText(packetText);
  const lower = clean.toLowerCase();
  const momentumText = buildRecentBeatText(sessionArc).toLowerCase();
  const blockedRecentText = getLatestBeatSummary(sessionArc);
  const playfulMarkerPresent = /\b(?:lol|lmao|haha|hehe)\b/i.test(clean);

  const hardCorrection = collectPatternHits(lower, HARD_CORRECTION_PATTERNS);
  const softCorrection = collectPatternHits(lower, SOFT_CORRECTION_PATTERNS);
  const dominantConstraint = collectPatternHits(lower, DOMINANT_CONSTRAINT_PATTERNS);
  const elevatedConstraint = collectPatternHits(lower, ELEVATED_CONSTRAINT_PATTERNS);
  const exactRepeat = collectPatternHits(lower, EXACT_REPEAT_PATTERNS);
  const nearRepeat = collectPatternHits(lower, NEAR_REPEAT_PATTERNS);

  const desireActive = hasAnyPattern(lower, DESIRE_PATTERNS) || hasAnyPattern(momentumText, DESIRE_PATTERNS);
  const iKnowButActive = /\b(?:i know|yeah|yes|right|true|okay|ok),?\s+but\b/i.test(clean);

  const dominantConstraintScore =
    dominantConstraint.score +
    (desireActive ? QUINN_CORRECTION_TUNING.constraintPriority.desireOverrideBoost : 0) +
    (iKnowButActive ? QUINN_CORRECTION_TUNING.constraintPriority.iKnowButBoost : 0) +
    (hardCorrection.score > 0 || softCorrection.score > 0
      ? QUINN_CORRECTION_TUNING.constraintPriority.correctionBoost
      : 0);
  const elevatedConstraintScore =
    elevatedConstraint.score +
    (desireActive ? QUINN_CORRECTION_TUNING.constraintPriority.desireOverrideBoost * 0.5 : 0);
  const exactRepeatScore = exactRepeat.score;
  const nearRepeatScore =
    nearRepeat.score - (playfulMarkerPresent && exactRepeat.score === 0 ? QUINN_CORRECTION_TUNING.repeatGuard.playfulSoftener : 0);

  const correctionLatchScore =
    hardCorrection.score +
    softCorrection.score +
    (exactRepeatScore >= QUINN_CORRECTION_TUNING.repeatGuard.exactThreshold ? 0.45 : 0);

  const correctionLatchId: QuinnCorrectionLatchId =
    exactRepeatScore >= QUINN_CORRECTION_TUNING.repeatGuard.exactThreshold ||
    correctionLatchScore >= QUINN_CORRECTION_TUNING.correctionLatch.hardThreshold
      ? 'hard'
      : correctionLatchScore >= QUINN_CORRECTION_TUNING.correctionLatch.softThreshold ||
          dominantConstraintScore >= QUINN_CORRECTION_TUNING.constraintPriority.dominantThreshold
        ? 'soft'
        : 'none';

  const constraintPriorityId: QuinnConstraintPriorityId =
    dominantConstraintScore >= QUINN_CORRECTION_TUNING.constraintPriority.dominantThreshold
      ? 'dominant'
      : elevatedConstraintScore >= QUINN_CORRECTION_TUNING.constraintPriority.elevatedThreshold
        ? 'elevated'
        : 'none';

  const repeatGuardId: QuinnRepeatGuardId =
    exactRepeatScore >= QUINN_CORRECTION_TUNING.repeatGuard.exactThreshold
      ? 'avoidExact'
      : nearRepeatScore >= QUINN_CORRECTION_TUNING.repeatGuard.nearThreshold
        ? 'avoidNearRepeat'
        : 'none';

  const correctionSignals = uniqueItems([
    ...hardCorrection.signals,
    ...softCorrection.signals,
    ...(repeatGuardId !== 'none' ? ['the user is rejecting a just-used line or joke'] : []),
  ]);
  const constraintSignals = uniqueItems([
    ...dominantConstraint.signals,
    ...elevatedConstraint.signals,
    ...(desireActive && constraintPriorityId !== 'none'
      ? ['the blocker overrides earlier wanting or hype']
      : []),
    ...(iKnowButActive ? ['"I know, but" is carrying unresolved friction'] : []),
  ]);
  const repeatSignals = uniqueItems([
    ...exactRepeat.signals,
    ...nearRepeat.signals,
  ]);

  const invalidatedTargets = uniqueItems([
    constraintPriorityId !== 'none' ? 'prior suggestion or desire momentum' : '',
    correctionLatchId !== 'none' ? 'prior frame' : '',
    repeatGuardId !== 'none'
      ? REPEAT_OBJECT_PATTERNS.some((pattern) => pattern.test(clean))
        ? 'prior joke or line'
        : 'prior wording or move'
      : '',
  ]);

  const acknowledgmentStyleId: QuinnAcknowledgmentStyleId =
    repeatGuardId !== 'none'
      ? 'briefOwnIt'
      : correctionLatchId === 'hard' || constraintPriorityId === 'dominant'
        ? 'briefPivot'
        : correctionLatchId === 'soft' || constraintPriorityId === 'elevated'
          ? 'briefPivot'
          : 'none';

  const correctionPromptGuidance =
    correctionLatchId === 'hard'
      ? 'The user is explicitly correcting or invalidating the last move. Acknowledge that fast, then pivot. Do not keep extending the invalidated frame.'
      : correctionLatchId === 'soft'
        ? 'There is a local frame update here. Favor the corrected angle over the older momentum.'
        : 'No strong local correction latch is active. Keep momentum only if the new note is truly continuing the same frame.';

  const constraintPromptGuidance =
    constraintPriorityId === 'dominant'
      ? 'A new blocker is now the main fact. Treat desire, hype, or the earlier suggestion as secondary until the blocker is answered.'
      : constraintPriorityId === 'elevated'
        ? 'A practical constraint is active. Keep feasibility in view instead of replying like enthusiasm alone settles it.'
        : 'No blocker override is active beyond the normal packet read.';

  const repeatPromptGuidance =
    repeatGuardId === 'avoidExact'
      ? `The user just called repetition out. Do not reuse the same joke, line, or suggestion${blockedRecentText ? ` (${blockedRecentText})` : ''}. Make the next move genuinely different.`
      : repeatGuardId === 'avoidNearRepeat'
        ? 'The user is flagging sameness. Avoid near-repeating the same phrasing, joke premise, or solution shape right away.'
        : 'No immediate repeat guard is active beyond the normal freshness rules.';

  const acknowledgmentPromptGuidance =
    acknowledgmentStyleId === 'briefOwnIt'
      ? 'A short natural own-it line is enough before the pivot. No defensive apology spiral.'
      : acknowledgmentStyleId === 'briefPivot'
        ? 'A quick recognition beat is enough. Show that the frame changed, then move.'
        : 'No explicit acknowledgment beat is needed.';

  return {
    correctionLatch: {
      id: correctionLatchId,
      score: correctionLatchScore,
      signals: correctionSignals,
      promptGuidance: correctionPromptGuidance,
    },
    constraintPriority: {
      id: constraintPriorityId,
      score:
        constraintPriorityId === 'dominant'
          ? dominantConstraintScore
          : elevatedConstraintScore,
      signals: constraintSignals,
      promptGuidance: constraintPromptGuidance,
    },
    repeatGuard: {
      id: repeatGuardId,
      score: repeatGuardId === 'avoidExact' ? exactRepeatScore : nearRepeatScore,
      signals: repeatSignals,
      blockedRecentText,
      promptGuidance: repeatPromptGuidance,
    },
    acknowledgmentStyle: {
      id: acknowledgmentStyleId,
      promptGuidance: acknowledgmentPromptGuidance,
    },
    invalidatedTargets,
    promptGuidance: [
      `Correction latch: ${correctionLatchId}. ${correctionPromptGuidance}`,
      `Constraint priority: ${constraintPriorityId}. ${constraintPromptGuidance}`,
      `Repeat guard: ${repeatGuardId}. ${repeatPromptGuidance}`,
      `Acknowledgment style: ${acknowledgmentStyleId}. ${acknowledgmentPromptGuidance}`,
      invalidatedTargets.length
        ? `Treat these as invalidated or secondary now: ${invalidatedTargets.join(', ')}.`
        : 'No specific prior target needs to be actively invalidated.',
    ],
  };
}

export function buildQuinnCorrectionPacketContext({
  packetText,
  sessionArc = null,
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
}) {
  const correction = inferQuinnCorrectionState({
    packetText,
    sessionArc,
  });

  const activeGuidance = [
    correction.correctionLatch.id !== 'none' ? correction.correctionLatch.promptGuidance : '',
    correction.constraintPriority.id !== 'none' ? correction.constraintPriority.promptGuidance : '',
    correction.repeatGuard.id !== 'none' ? correction.repeatGuard.promptGuidance : '',
    correction.acknowledgmentStyle.id !== 'none'
      ? correction.acknowledgmentStyle.promptGuidance
      : '',
  ].filter(Boolean);

  return {
    correction,
    context:
      activeGuidance.join(' ') ||
      'No local correction override is active. Keep following the live note, but only carry old momentum forward if the new note is actually continuing it.',
  };
}
