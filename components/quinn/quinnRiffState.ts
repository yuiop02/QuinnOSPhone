import type { SessionArc } from './quinnTypes';
import { inferQuinnChallengeStance } from './quinnChallengeState';
import { inferQuinnEnergyState } from './quinnEnergyState';

export type QuinnRiffStanceId = 'resolve' | 'coBuild' | 'deepRiff';

export type QuinnRiffProfile = {
  id: QuinnRiffStanceId;
  label: string;
  resolutionPressure: string;
  patternNaming: string;
  ambiguityTolerance: string;
  promptGuidance: string;
};

export type QuinnRiffInference = QuinnRiffProfile & {
  score: number;
  scores: Record<QuinnRiffStanceId, number>;
};

export const QUINN_RIFF_KEYWORDS = {
  exploratory: [
    "it's like",
    'i feel like',
    'wait',
    'hold on',
    'no because',
    'what if',
    'something about',
    "i think the real thing is",
    "i'm trying to explain this",
    'do you get what i mean',
    'trying to figure out',
    'trying to explain',
    'there is something about',
  ],
  pattern: [
    'pattern',
    'shape',
    'orbiting',
    'tangled',
    'two different things',
    'part of it',
    'the real thing',
    'underneath',
    'less x and more y',
    'less about',
    'more about',
  ],
  deep: [
    'stay in this with me',
    "i'm not done thinking it",
    "i don't think i'm done",
    'half-baked',
    'unfinished thought',
    'theory spiral',
    'live theory',
    'keep going with me',
    'wait no',
    'not fully this',
    'not exactly this',
  ],
  resolve: [
    'what should i do',
    'what do i do',
    'what now',
    'help me',
    'can you help',
    'give me a plan',
    'give me options',
    'next step',
    'what would you do',
    'how do i',
    'should i',
  ],
} as const;

export const QUINN_RIFF_TUNING = {
  threshold: {
    resolve: 1.85,
    coBuild: 2.1,
    deepRiff: 4.05,
  },
  momentumCarryWeight: 0.24,
  shortMessageWordCount: 16,
  resolveTieBias: 0.35,
} as const;

const RIFF_PROFILES: Record<QuinnRiffStanceId, QuinnRiffProfile> = {
  resolve: {
    id: 'resolve',
    label: 'resolve',
    resolutionPressure: 'normal',
    patternNaming: 'supporting only',
    ambiguityTolerance: 'lower',
    promptGuidance:
      'The note seems to want an answer, direct help, or a clearer move. Resolve it cleanly, but keep Quinn conversational.',
  },
  coBuild: {
    id: 'coBuild',
    label: 'co-build',
    resolutionPressure: 'reduced',
    patternNaming: 'high',
    ambiguityTolerance: 'medium-high',
    promptGuidance:
      'The note is still discovering itself. Build with it instead of jumping to the answer. Name patterns in motion, offer candidate framings, and keep the thought alive long enough to clarify itself.',
  },
  deepRiff: {
    id: 'deepRiff',
    label: 'deep riff',
    resolutionPressure: 'very low',
    patternNaming: 'very high',
    ambiguityTolerance: 'high',
    promptGuidance:
      'The note is clearly in live theory / unfinished-thought mode. Stay inside it. Follow the associative jumps, tolerate partialness longer, and do not reward yourself for being useful by collapsing it into a smaller cleaner answer.',
  },
};

function cleanText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function countKeywordMatches(text: string, keywords: readonly string[]) {
  const lower = text.toLowerCase();
  return keywords.reduce((count, keyword) => count + (lower.includes(keyword) ? 1 : 0), 0);
}

function countRegex(text: string, pattern: RegExp) {
  return (text.match(pattern) || []).length;
}

function hasRegex(text: string, pattern: RegExp) {
  return pattern.test(text);
}

function buildMomentumText(sessionArc: SessionArc | null | undefined) {
  return Array.isArray(sessionArc?.beats)
    ? sessionArc.beats
        .slice(-2)
        .map((beat) => cleanText(beat.summary))
        .filter(Boolean)
        .join(' ')
    : '';
}

function baseScoresFromText(text: string, lensMode: string) {
  const clean = cleanText(text);
  const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const clauseStack = countRegex(clean, /[,;:—-]/g);
  const questionCount = countRegex(clean, /\?/g);
  const lineBreaks = countRegex(text, /\n/g);
  const ellipses = countRegex(clean, /\.\.\.|…/g);
  const fragments = String(text || '')
    .split(/[\n.!?]+/)
    .map((part) => cleanText(part))
    .filter(Boolean)
    .filter((part) => part.split(/\s+/).length <= 5).length;
  const exploratoryCount = countKeywordMatches(clean, QUINN_RIFF_KEYWORDS.exploratory);
  const patternCount = countKeywordMatches(clean, QUINN_RIFF_KEYWORDS.pattern);
  const deepCount = countKeywordMatches(clean, QUINN_RIFF_KEYWORDS.deep);
  const resolveCount = countKeywordMatches(clean, QUINN_RIFF_KEYWORDS.resolve);
  const directAsk =
    countRegex(clean, /\b(?:can you|could you|would you|should i|what should|how should)\b/gi) +
    countRegex(clean, /\b(?:tell me|give me|show me)\b/gi);
  const unfinishedTail = hasRegex(clean, /\b(?:because|but|and|or)\s*$/i) ? 1 : 0;

  const scores: Record<QuinnRiffStanceId, number> = {
    resolve: 0,
    coBuild: 0,
    deepRiff: 0,
  };

  scores.resolve += resolveCount * 1.45;
  scores.resolve += directAsk * 0.75;
  scores.resolve += lensMode === 'strategy' ? 1.15 : 0;
  scores.resolve += lensMode === 'writing' ? 0.55 : 0;
  scores.resolve += questionCount === 1 && exploratoryCount === 0 ? 0.25 : 0;

  scores.coBuild += exploratoryCount * 0.85;
  scores.coBuild += patternCount * 0.8;
  scores.coBuild += fragments >= 2 ? 0.45 : 0;
  scores.coBuild += clauseStack >= 3 ? 0.35 : 0;
  scores.coBuild += lineBreaks >= 1 ? 0.2 : 0;
  scores.coBuild += ellipses > 0 ? 0.25 : 0;
  scores.coBuild += lensMode === 'adaptive' || lensMode === 'interpretation' ? 0.35 : 0;
  scores.coBuild -= resolveCount * 0.35;

  scores.deepRiff += deepCount * 1.2;
  scores.deepRiff += exploratoryCount * 0.45;
  scores.deepRiff += patternCount * 0.4;
  scores.deepRiff += fragments >= 4 ? 0.75 : 0;
  scores.deepRiff += clauseStack >= 5 ? 0.55 : 0;
  scores.deepRiff += lineBreaks >= 2 ? 0.35 : 0;
  scores.deepRiff += ellipses * 0.35;
  scores.deepRiff += unfinishedTail ? 0.7 : 0;
  scores.deepRiff += wordCount > 0 && wordCount <= 45 && exploratoryCount >= 2 ? 0.4 : 0;
  scores.deepRiff -= resolveCount * 0.45;
  scores.deepRiff -= directAsk * 0.35;

  return scores;
}

function applyMomentumCarry(
  scores: Record<QuinnRiffStanceId, number>,
  packetText: string,
  sessionArc: SessionArc | null | undefined,
  lensMode: string
) {
  const wordCount = cleanText(packetText).split(/\s+/).filter(Boolean).length;

  if (wordCount > QUINN_RIFF_TUNING.shortMessageWordCount) {
    return scores;
  }

  const momentumText = buildMomentumText(sessionArc);

  if (!momentumText) {
    return scores;
  }

  const momentumScores = baseScoresFromText(momentumText, lensMode);

  return {
    resolve:
      scores.resolve +
      momentumScores.resolve * QUINN_RIFF_TUNING.momentumCarryWeight * 0.8,
    coBuild:
      scores.coBuild +
      momentumScores.coBuild * QUINN_RIFF_TUNING.momentumCarryWeight,
    deepRiff:
      scores.deepRiff +
      momentumScores.deepRiff * QUINN_RIFF_TUNING.momentumCarryWeight,
  };
}

function applyEnergyAndChallenge(
  scores: Record<QuinnRiffStanceId, number>,
  packetText: string,
  sessionArc: SessionArc | null | undefined
) {
  const energy = inferQuinnEnergyState({
    packetText,
    sessionArc,
  });
  const challenge = inferQuinnChallengeStance({
    packetText,
    sessionArc,
  });
  const next = { ...scores };

  if (energy.id === 'playfulRiffy') {
    next.coBuild += 0.7;
    next.deepRiff += 0.35;
  }

  if (energy.id === 'hypedIntense') {
    next.coBuild += 0.35;
    next.deepRiff += 0.45;
  }

  if (energy.id === 'tenderSoft') {
    next.coBuild += 0.4;
    next.deepRiff += 0.2;
  }

  if (energy.id === 'sleepyLow') {
    next.coBuild += 0.28;
    next.resolve -= 0.15;
  }

  if (challenge.id === 'lightChallenge') {
    next.coBuild += 0.18;
  }

  if (challenge.id === 'directChallenge') {
    next.coBuild += 0.22;
    next.deepRiff += 0.18;
  }

  return next;
}

function pickRiffStance(scores: Record<QuinnRiffStanceId, number>) {
  if (
    scores.deepRiff >= QUINN_RIFF_TUNING.threshold.deepRiff &&
    scores.deepRiff >= scores.resolve - QUINN_RIFF_TUNING.resolveTieBias
  ) {
    return {
      id: 'deepRiff' as QuinnRiffStanceId,
      score: scores.deepRiff,
    };
  }

  if (
    scores.coBuild >= QUINN_RIFF_TUNING.threshold.coBuild &&
    scores.coBuild >= scores.resolve - QUINN_RIFF_TUNING.resolveTieBias
  ) {
    return {
      id: 'coBuild' as QuinnRiffStanceId,
      score: scores.coBuild,
    };
  }

  return {
    id: 'resolve' as QuinnRiffStanceId,
    score: scores.resolve,
  };
}

export function inferQuinnRiffStance({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}): QuinnRiffInference {
  const baseScores = baseScoresFromText(packetText, lensMode);
  const withMomentum = applyMomentumCarry(baseScores, packetText, sessionArc, lensMode);
  const scores = applyEnergyAndChallenge(withMomentum, packetText, sessionArc);
  const winner = pickRiffStance(scores);
  const profile = RIFF_PROFILES[winner.id];

  return {
    ...profile,
    score: winner.score,
    scores,
  };
}

export function buildQuinnRiffPacketContext({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}) {
  const riff = inferQuinnRiffStance({
    packetText,
    sessionArc,
    lensMode,
  });

  return {
    riff,
    context: [
      `Exploration stance: ${riff.label}.`,
      riff.promptGuidance,
      `Resolution pressure: ${riff.resolutionPressure}. Pattern naming: ${riff.patternNaming}. Ambiguity tolerance: ${riff.ambiguityTolerance}.`,
      'When there is a tie, protect the live exploratory thread instead of collapsing it into a neater answer too early.',
    ].join(' '),
  };
}

export function getQuinnRiffProfiles() {
  return RIFF_PROFILES;
}
