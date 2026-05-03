import type { SessionArc } from './quinnTypes';

export type QuinnLiveSubjectDominanceId = 'low' | 'medium' | 'high';
export type QuinnThreadCarryoverModeId = 'keep' | 'soften' | 'drop';
export type QuinnStaleFrameRiskId = 'none' | 'light' | 'strong';
export type QuinnStaleTemplateInterruptId = 'none' | 'light' | 'hard';

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
  staleTemplateInterrupt: QuinnSignalBucket<QuinnStaleTemplateInterruptId>;
  directComplaintAboutConversation: boolean;
  suppressTemplateReuse: boolean;
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
  staleTemplateInterrupt: {
    lightThreshold: 0.95,
    hardThreshold: 1.85,
  },
  continuation: {
    keepThreshold: 1.4,
    overlapKeepThreshold: 0.38,
    overlapDropThreshold: 0.14,
    shortTurnMaxWords: 9,
  },
} as const;

const HARD_META_COMPLAINT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:that makes no sense|makes zero sense|out of context|not what (?:we(?:'re| are)|i(?:'m| am)) talking about|not having a normal human conversation|normal human conversation|what(?:'s| is) going on)\b/i,
    label: 'the user says Quinn is off-topic or making no sense',
    score: 1.35,
  },
  {
    pattern:
      /\b(?:you keep (?:just )?saying weird things|you(?:'re| are) being weird|i don['’]?t understand why you don['’]?t understand)\b/i,
    label: 'the user directly complains about Quinn’s conversational behavior',
    score: 1.3,
  },
];

const LIGHT_META_COMPLAINT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:that(?:'s| is) weird|that(?:'s| is) out of pocket|why are you being rude|be (?:so )?for real|i was testing (?:the )?app)\b/i,
    label: 'the user is pushing back on Quinn’s conversational framing',
    score: 0.95,
  },
  {
    pattern:
      /\b(?:that(?:'s| is) not what this is|all i said was|why are you saying that)\b/i,
    label: 'the user says Quinn is overreading or inventing the wrong scene',
    score: 0.85,
  },
];

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
    pattern: /\b(?:i(?:'m| am)\s+(?:okay|good|pretty good|fine|not bad|alright|tired|sleepy|heading|working|building|making|tweaking|trying|about to)|i(?:'m| am)\s+just)\b/i,
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

const EXPLICIT_TOPIC_PIVOT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:moving on|move on|different question|new question|new topic|on another note|another thing|separate thing|separate question|switching gears|changing subjects|unrelated question|unrelated topic)\b/i,
    label: 'the note explicitly says it is moving to a different subject',
    score: 1.2,
  },
];

const SAME_TOPIC_CONTINUATION_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:about the same|same work-life balance|same issue|same topic|same problem|same point|same thing|still on that)\b/i,
    label: 'the note explicitly says the subject is still the same',
    score: 1.45,
  },
];

const LIGHTWEIGHT_SOCIAL_THREAD_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:hows it going|how(?:'s| is) it going|what(?:'s| is) up|how are you|check-?in|quick check-?in|generic check-?in|casual check-?in|light(?:weight)? check-?in|status reply|status-reply posture|status question|greeting posture|same tempo)\b/i,
    label: 'the active thread is still centered on a lightweight social check-in',
    score: 1.2,
  },
];

const SUBSTANTIVE_ASK_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:how do you think|what do you think|be straight with me(?: about)?|be honest with me(?: about)?|tell me straight(?: about)?|how am i doing|how am i managing|am i managing|how am i handling|am i handling|what should i do first|what do you think i should do first|what should i do|what do i do first)\b/i,
    label: 'the newest turn is a substantive evaluative or advice-seeking ask',
    score: 1.15,
  },
  {
    pattern: /\b(?:work-?life balance|boundary|boundaries|burnout)\b/i,
    label: 'the newest turn introduces a concrete substantive topic',
    score: 0.65,
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

function buildThreadContextText(sessionArc: SessionArc | null | undefined) {
  return [cleanText(sessionArc?.title || ''), buildRecentBeatText(sessionArc)]
    .filter(Boolean)
    .join(' ');
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
  const threadContextText = buildThreadContextText(sessionArc);
  const recentBeatSummary = getLatestBeatSummary(sessionArc);
  const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const shortTurn =
    wordCount > 0 &&
    wordCount <= QUINN_THREAD_CONTINUITY_TUNING.continuation.shortTurnMaxWords;
  const continuationHits = collectPatternHits(clean, THREAD_CONTINUATION_PATTERNS);
  const freshSubjectHits = collectPatternHits(clean, FRESH_SUBJECT_PATTERNS);
  const explicitTopicPivotHits = collectPatternHits(clean, EXPLICIT_TOPIC_PIVOT_PATTERNS);
  const sameTopicContinuationHits = collectPatternHits(clean, SAME_TOPIC_CONTINUATION_PATTERNS);
  const lightweightSocialThreadHits = collectPatternHits(
    threadContextText,
    LIGHTWEIGHT_SOCIAL_THREAD_PATTERNS
  );
  const substantiveAskHits = collectPatternHits(clean, SUBSTANTIVE_ASK_PATTERNS);
  const pivotHits = collectPatternHits(clean, SUBJECT_PIVOT_PATTERNS);
  const hardMetaComplaintHits = collectPatternHits(clean, HARD_META_COMPLAINT_PATTERNS);
  const lightMetaComplaintHits = collectPatternHits(clean, LIGHT_META_COMPLAINT_PATTERNS);
  const currentTokens = tokenizeSignificantTerms(clean);
  const priorTokens = tokenizeSignificantTerms(recentBeatText);
  const overlapRatio = countTokenOverlapRatio(currentTokens, priorTokens);
  const metaComplaintScore = hardMetaComplaintHits.score + lightMetaComplaintHits.score;
  const directComplaintAboutConversation = metaComplaintScore >= 0.95;
  const explicitTopicPivotActive =
    explicitTopicPivotHits.score > 0 && sameTopicContinuationHits.score === 0;
  const substantiveAskShape =
    /\?\s*$/.test(clean) ||
    /\b(?:be straight with me|be honest with me|tell me straight)\b/i.test(clean);
  const substantiveAskDominanceActive =
    hasActiveThread &&
    !explicitTopicPivotActive &&
    lightweightSocialThreadHits.score >= 0.95 &&
    substantiveAskShape &&
    substantiveAskHits.score >= 1.15;
  const lightweightSocialContinuationActive =
    hasActiveThread &&
    !explicitTopicPivotActive &&
    !substantiveAskDominanceActive &&
    lightweightSocialThreadHits.score >= 0.95 &&
    freshSubjectHits.score > 0 &&
    !/\?\s*$/.test(clean);

  let continuationScore = continuationHits.score;
  continuationScore += sameTopicContinuationHits.score;
  continuationScore += lightweightSocialContinuationActive ? 1 : 0;
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
  continuationScore -= directComplaintAboutConversation ? 0.9 : 0;
  continuationScore -= explicitTopicPivotActive ? 0.45 : 0;
  continuationScore -= substantiveAskDominanceActive ? 0.65 : 0;

  let liveSubjectScore =
    freshSubjectHits.score +
    pivotHits.score +
    (explicitTopicPivotActive ? explicitTopicPivotHits.score : 0);
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
  liveSubjectScore += metaComplaintScore;
  liveSubjectScore += substantiveAskDominanceActive ? 1.05 : 0;
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
  staleFrameRiskScore += explicitTopicPivotActive ? 0.55 : 0;
  staleFrameRiskScore += substantiveAskDominanceActive ? 0.75 : 0;
  staleFrameRiskScore += directComplaintAboutConversation ? 0.95 : 0;
  staleFrameRiskScore -= continuationScore >= QUINN_THREAD_CONTINUITY_TUNING.continuation.keepThreshold ? 0.6 : 0;
  staleFrameRiskScore -= lightweightSocialContinuationActive ? 0.65 : 0;

  const staleTemplateInterruptScore =
    metaComplaintScore +
    (hasActiveThread ? 0.35 : 0) +
    (overlapRatio <= QUINN_THREAD_CONTINUITY_TUNING.continuation.overlapDropThreshold
      ? 0.25
      : 0) +
    (directComplaintAboutConversation && recentBeatText ? 0.25 : 0);
  const staleTemplateInterruptId: QuinnStaleTemplateInterruptId =
    !hasActiveThread
      ? 'none'
      : staleTemplateInterruptScore >=
            QUINN_THREAD_CONTINUITY_TUNING.staleTemplateInterrupt.hardThreshold
        ? 'hard'
        : staleTemplateInterruptScore >=
              QUINN_THREAD_CONTINUITY_TUNING.staleTemplateInterrupt.lightThreshold
          ? 'light'
          : 'none';

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
    staleTemplateInterruptId !== 'hard' &&
    !explicitTopicPivotActive &&
    !substantiveAskDominanceActive &&
    (lightweightSocialContinuationActive ||
      continuationScore >= QUINN_THREAD_CONTINUITY_TUNING.continuation.keepThreshold ||
      (overlapRatio >= QUINN_THREAD_CONTINUITY_TUNING.continuation.overlapKeepThreshold &&
        liveSubjectDominanceId !== 'high'));

  const threadCarryoverModeId: QuinnThreadCarryoverModeId =
    !hasActiveThread
      ? 'keep'
      : lightweightSocialContinuationActive
        ? staleFrameRiskId === 'none'
          ? 'keep'
          : 'soften'
      : frameContinuation && staleFrameRiskId === 'none'
        ? 'keep'
        : staleTemplateInterruptId === 'hard' ||
            staleFrameRiskId === 'strong' ||
            liveSubjectDominanceId === 'high'
          ? 'drop'
          : 'soften';
  const suppressTemplateReuse =
    hasActiveThread &&
    (staleTemplateInterruptId === 'hard' ||
      explicitTopicPivotActive ||
      substantiveAskDominanceActive ||
      (directComplaintAboutConversation &&
        (staleFrameRiskId !== 'none' || threadCarryoverModeId === 'drop')));

  const liveSubjectSignals = uniqueItems([
    ...freshSubjectHits.signals,
    ...(explicitTopicPivotActive ? explicitTopicPivotHits.signals : []),
    ...sameTopicContinuationHits.signals,
    ...(substantiveAskDominanceActive
      ? [
          ...lightweightSocialThreadHits.signals,
          ...substantiveAskHits.signals,
          'the newest substantive ask should outrank the older social posture',
        ]
      : []),
    ...(lightweightSocialContinuationActive
      ? [
          ...lightweightSocialThreadHits.signals,
          'the newest turn is still answering inside the same lightweight social lane',
        ]
      : []),
    ...(hasActiveThread &&
    overlapRatio <= QUINN_THREAD_CONTINUITY_TUNING.continuation.overlapDropThreshold &&
    currentTokens.length >= 3
      ? ['the current note has low lexical overlap with the recent thread beat']
      : []),
    ...(wordCount >= 10 ? ['the current note contains enough fresh material to stand on its own'] : []),
  ]);

  const carryoverSignals = uniqueItems([
    ...continuationHits.signals,
    ...sameTopicContinuationHits.signals,
    ...(frameContinuation ? ['the current note still looks like the same live subject'] : []),
    ...(threadCarryoverModeId === 'soften'
      ? ['the same thread is active, but carryover should stay secondary']
      : []),
    ...(threadCarryoverModeId === 'drop'
      ? ['the thread continues, but the live subject has shifted']
      : []),
    ...(substantiveAskDominanceActive
      ? ['the older lightweight check-in frame should not dominate the newer substantive ask']
      : []),
    ...(lightweightSocialContinuationActive
      ? ['the same lightweight social thread is still live, even though the user added fresh status detail']
      : []),
  ]);

  const staleFrameSignals = uniqueItems([
    ...(staleFrameRiskId !== 'none'
      ? ['older thread framing could overshadow the newest user turn if left unchecked']
      : []),
    ...hardMetaComplaintHits.signals,
    ...lightMetaComplaintHits.signals,
    ...(explicitTopicPivotActive ? explicitTopicPivotHits.signals : []),
    ...(pivotHits.signals.length ? pivotHits.signals : []),
    ...(substantiveAskDominanceActive
      ? [
          'a stale check-in or status posture could override the literal question if left unchecked',
        ]
      : []),
  ]);
  const staleTemplateInterruptSignals = uniqueItems([
    ...hardMetaComplaintHits.signals,
    ...lightMetaComplaintHits.signals,
    ...(staleTemplateInterruptId !== 'none'
      ? ['the newest turn is explicitly complaining about Quinn being off-topic or not making sense']
      : []),
  ]);

  const liveSubjectPromptGuidance =
    substantiveAskDominanceActive
      ? 'The newest user turn is a substantive evaluative ask inside a lightweight social thread. Answer the question itself, not the old check-in posture.'
      : lightweightSocialContinuationActive
        ? 'The newest turn is still a direct status follow-up inside the same lightweight social thread. Keep the reply casual and in-lane.'
      : liveSubjectDominanceId === 'high'
      ? 'The newest user turn clearly owns the live subject. Answer that directly and treat earlier thread material as background only.'
      : liveSubjectDominanceId === 'medium'
        ? 'The newest turn adds real live material. Let it lead, and keep thread callbacks light.'
        : 'The newest turn still looks close to the ongoing thread, so continuity can stay more active if it truly fits.';

  const carryoverPromptGuidance =
    substantiveAskDominanceActive
      ? 'The thread may still be active, but the old social posture does not get to dominate. Keep continuity only as background and answer the substantive ask directly.'
      : lightweightSocialContinuationActive
        ? 'This is still the same lightweight social exchange. Carry the casual lane forward instead of treating the user’s status update as a separate topic reset.'
      : threadCarryoverModeId === 'drop'
      ? 'Still the same thread, but not the same scene. Drop stale vibe, pet-name posture, and old semantic momentum. Respond to the live subject now.'
      : threadCarryoverModeId === 'soften'
        ? 'Same thread, but continuity is background support. Use it for calibration, not topic dominance.'
        : 'The thread still appears to be carrying the same live subject. Carry it forward only as far as the newest note keeps it alive.';

  const staleFramePromptGuidance =
    substantiveAskDominanceActive
      ? 'A lightweight check-in frame is still hanging around, but the newest turn is asking for a substantive read. Do not answer with another generic status beat.'
      : staleFrameRiskId === 'strong'
      ? 'Stale-frame risk is strong. Do not keep roleplaying the earlier scene or meaning if the user has moved on.'
      : staleFrameRiskId === 'light'
        ? 'There is some stale-frame risk. Keep the old thread light unless the new note clearly calls back to it.'
        : 'No special stale-frame suppression is needed beyond normal continuity judgment.';
  const staleTemplateInterruptPromptGuidance =
    staleTemplateInterruptId === 'hard'
      ? 'The user is directly complaining that Quinn is off-topic, weird, or not making sense. Treat that as a hard interrupt on stale template reuse and answer the complaint itself.'
      : staleTemplateInterruptId === 'light'
        ? 'There is a conversational complaint signal here. Do not reflexively reuse the earlier template or stale room/greeting pattern.'
        : 'No stale-template interrupt is active beyond normal thread continuity judgment.';

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
    staleTemplateInterrupt: {
      id: staleTemplateInterruptId,
      score: staleTemplateInterruptScore,
      signals: staleTemplateInterruptSignals,
      promptGuidance: staleTemplateInterruptPromptGuidance,
    },
    directComplaintAboutConversation,
    suppressTemplateReuse,
    promptGuidance: [
      `Live subject dominance: ${liveSubjectDominanceId}. ${liveSubjectPromptGuidance}`,
      `Thread carryover mode: ${threadCarryoverModeId}. ${carryoverPromptGuidance}`,
      `Stale frame risk: ${staleFrameRiskId}. ${staleFramePromptGuidance}`,
      `Stale template interrupt: ${staleTemplateInterruptId}. ${staleTemplateInterruptPromptGuidance}`,
      directComplaintAboutConversation
        ? 'Direct complaint about conversation: true. The newest turn is objecting to Quinn being weird, off-topic, or not making sense.'
        : 'Direct complaint about conversation: false.',
      suppressTemplateReuse
        ? 'Suppress template reuse: true. Do not give another version of the earlier thread template.'
        : 'Suppress template reuse: false.',
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
      ? threadContinuity.promptGuidance.filter(Boolean).join(' ')
      : 'No active thread carryover is competing with the live note.',
  };
}
