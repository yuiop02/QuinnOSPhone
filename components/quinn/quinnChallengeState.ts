import type { SessionArc } from './quinnTypes';
import { inferQuinnEnergyState } from './quinnEnergyState';

export type QuinnChallengeStanceId = 'neutral' | 'lightChallenge' | 'directChallenge';

export type QuinnChallengeProfile = {
  id: QuinnChallengeStanceId;
  label: string;
  directness: string;
  restraint: string;
  promptGuidance: string;
};

export type QuinnChallengeInference = QuinnChallengeProfile & {
  score: number;
  scores: Record<QuinnChallengeStanceId, number>;
};

export const QUINN_CHALLENGE_KEYWORDS = {
  hedge: [
    'maybe',
    'kind of',
    'sort of',
    'i guess',
    'probably',
    'perhaps',
    'not sure',
    'somehow',
    'in a way',
  ],
  shield: [
    "i don't know",
    'idk',
    'hard to explain',
    'hard to say',
    'can’t tell',
    "can't tell",
    'unclear',
    'confusing',
  ],
  euphemism: [
    'misaligned',
    'not ideal',
    'vibes',
    'energy',
    'dynamic',
    'process',
    'season',
    'chapter',
    'situation',
    'space',
  ],
  vagueness: [
    'thing',
    'stuff',
    'some version',
    'kind of thing',
    'whatever',
    'it all',
    'everything',
    'whole thing',
    'somehow',
  ],
  complexity: [
    'complicated',
    'complex',
    'nuanced',
    'messy',
    'gray area',
    'grey area',
    'hard to pin down',
  ],
  inflation: [
    'always',
    'never',
    'everyone',
    'nobody',
    'impossible',
    'completely',
    'totally',
  ],
} as const;

export const QUINN_CHALLENGE_TUNING = {
  threshold: {
    lightChallenge: 2.35,
    directChallenge: 4.2,
  },
  momentumCarryWeight: 0.22,
  shortMessageWordCount: 14,
  tenderDirectMultiplier: 0.6,
  lowDirectMultiplier: 0.72,
  intenseDirectMultiplier: 1.08,
  rawDirectMultiplier: 1.12,
} as const;

const CHALLENGE_PROFILES: Record<QuinnChallengeStanceId, QuinnChallengeProfile> = {
  neutral: {
    id: 'neutral',
    label: 'neutral / no pushback',
    directness: 'normal',
    restraint: 'high',
    promptGuidance:
      'Do not manufacture skepticism. Stay precise, but only challenge if the note itself earns it.',
  },
  lightChallenge: {
    id: 'lightChallenge',
    label: 'light challenge',
    directness: 'clean and selective',
    restraint: 'medium',
    promptGuidance:
      'There is some dodge, spin, or softness here. Question the framing a little, tighten the language, and separate story from substance without making the whole reply a confrontation.',
  },
  directChallenge: {
    id: 'directChallenge',
    label: 'direct challenge',
    directness: 'plain and incisive',
    restraint: 'guarded but firm',
    promptGuidance:
      'The signal for spin, avoidance, or dressed-up framing is strong. Push back cleanly. Name the dodge or plainer truth directly, but stay grounded, proportionate, and unsmug.',
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

function buildMomentumText(sessionArc: SessionArc | null | undefined) {
  return Array.isArray(sessionArc?.beats)
    ? sessionArc.beats
        .slice(-2)
        .map((beat) => cleanText(beat.summary))
        .filter(Boolean)
        .join(' ')
    : '';
}

function baseScoresFromText(text: string) {
  const clean = cleanText(text);
  const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;

  const hedgeCount = countKeywordMatches(clean, QUINN_CHALLENGE_KEYWORDS.hedge);
  const shieldCount = countKeywordMatches(clean, QUINN_CHALLENGE_KEYWORDS.shield);
  const euphemismCount = countKeywordMatches(clean, QUINN_CHALLENGE_KEYWORDS.euphemism);
  const vaguenessCount = countKeywordMatches(clean, QUINN_CHALLENGE_KEYWORDS.vagueness);
  const complexityCount = countKeywordMatches(clean, QUINN_CHALLENGE_KEYWORDS.complexity);
  const inflationCount = countKeywordMatches(clean, QUINN_CHALLENGE_KEYWORDS.inflation);
  const fakeAmbiguityCount = countRegex(
    clean,
    /\b(?:maybe|kind of|sort of|not sure|i guess)\b[\s\S]{0,48}\b(?:maybe|kind of|sort of|not sure|i guess)\b/gi
  );
  const dodgePatternCount =
    countRegex(clean, /\bi don'?t know\b[\s\S]{0,80}\bbut\b/gi) +
    countRegex(clean, /\b(?:complicated|messy|unclear|nuanced)\b[\s\S]{0,60}\b(?:dynamic|situation|process|thing)\b/gi) +
    countRegex(clean, /\bto be fair\b|\bin theory\b|\btechnically\b/gi);
  const overExplainFlag =
    wordCount >= 80 && hedgeCount + euphemismCount + vaguenessCount + complexityCount >= 5;
  const specificityRelief =
    countRegex(clean, /\b(?:because|when|after|before|said|did|asked|told|texted|called|wrote|sent)\b/gi) *
      0.18 +
    (countRegex(clean, /\d/g) > 0 ? 0.35 : 0);

  const scores: Record<QuinnChallengeStanceId, number> = {
    neutral: 0,
    lightChallenge: 0,
    directChallenge: 0,
  };

  scores.lightChallenge += hedgeCount * 0.38;
  scores.lightChallenge += shieldCount * 0.72;
  scores.lightChallenge += euphemismCount * 0.62;
  scores.lightChallenge += vaguenessCount * 0.28;
  scores.lightChallenge += complexityCount * 0.46;
  scores.lightChallenge += inflationCount * 0.18;
  scores.lightChallenge += fakeAmbiguityCount * 0.8;
  scores.lightChallenge += dodgePatternCount * 0.95;
  scores.lightChallenge += overExplainFlag ? 0.7 : 0;
  scores.lightChallenge -= specificityRelief;

  scores.directChallenge += shieldCount * 0.88;
  scores.directChallenge += euphemismCount * 0.35;
  scores.directChallenge += complexityCount * 0.35;
  scores.directChallenge += fakeAmbiguityCount * 1.05;
  scores.directChallenge += dodgePatternCount * 1.25;
  scores.directChallenge += hedgeCount >= 4 ? 0.72 : 0;
  scores.directChallenge += vaguenessCount >= 4 ? 0.62 : 0;
  scores.directChallenge += overExplainFlag ? 0.72 : 0;
  scores.directChallenge -= specificityRelief * 0.45;

  return scores;
}

function applyMomentumCarry(
  scores: Record<QuinnChallengeStanceId, number>,
  packetText: string,
  sessionArc: SessionArc | null | undefined
) {
  const wordCount = cleanText(packetText).split(/\s+/).filter(Boolean).length;

  if (wordCount > QUINN_CHALLENGE_TUNING.shortMessageWordCount) {
    return scores;
  }

  const momentumText = buildMomentumText(sessionArc);

  if (!momentumText) {
    return scores;
  }

  const momentumScores = baseScoresFromText(momentumText);

  return {
    neutral: scores.neutral,
    lightChallenge:
      scores.lightChallenge +
      momentumScores.lightChallenge * QUINN_CHALLENGE_TUNING.momentumCarryWeight,
    directChallenge:
      scores.directChallenge +
      momentumScores.directChallenge * QUINN_CHALLENGE_TUNING.momentumCarryWeight,
  };
}

function applyEnergyRestraint(
  scores: Record<QuinnChallengeStanceId, number>,
  packetText: string,
  sessionArc: SessionArc | null | undefined
) {
  const energy = inferQuinnEnergyState({
    packetText,
    sessionArc,
  });

  const nextScores = { ...scores };

  if (energy.id === 'tenderSoft') {
    nextScores.lightChallenge *= 0.88;
    nextScores.directChallenge *= QUINN_CHALLENGE_TUNING.tenderDirectMultiplier;
  }

  if (energy.id === 'sleepyLow') {
    nextScores.directChallenge *= QUINN_CHALLENGE_TUNING.lowDirectMultiplier;
  }

  if (energy.id === 'hypedIntense') {
    nextScores.directChallenge *= QUINN_CHALLENGE_TUNING.intenseDirectMultiplier;
  }

  if (energy.id === 'rawBlunt') {
    nextScores.directChallenge *= QUINN_CHALLENGE_TUNING.rawDirectMultiplier;
  }

  return nextScores;
}

function pickChallengeStance(scores: Record<QuinnChallengeStanceId, number>) {
  if (scores.directChallenge >= QUINN_CHALLENGE_TUNING.threshold.directChallenge) {
    return {
      id: 'directChallenge' as QuinnChallengeStanceId,
      score: scores.directChallenge,
    };
  }

  if (scores.lightChallenge >= QUINN_CHALLENGE_TUNING.threshold.lightChallenge) {
    return {
      id: 'lightChallenge' as QuinnChallengeStanceId,
      score: scores.lightChallenge,
    };
  }

  return {
    id: 'neutral' as QuinnChallengeStanceId,
    score: 0,
  };
}

export function inferQuinnChallengeStance({
  packetText,
  sessionArc = null,
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
}): QuinnChallengeInference {
  const baseScores = baseScoresFromText(packetText);
  const withMomentum = applyMomentumCarry(baseScores, packetText, sessionArc);
  const scores = applyEnergyRestraint(withMomentum, packetText, sessionArc);
  const winner = pickChallengeStance(scores);
  const profile = CHALLENGE_PROFILES[winner.id];

  return {
    ...profile,
    score: winner.score,
    scores,
  };
}

export function buildQuinnChallengePacketContext({
  packetText,
  sessionArc = null,
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
}) {
  const challenge = inferQuinnChallengeStance({
    packetText,
    sessionArc,
  });

  return {
    challenge,
    context: [
      `Pushback stance: ${challenge.label}.`,
      challenge.promptGuidance,
      `Directness: ${challenge.directness}. Restraint: ${challenge.restraint}.`,
      'Challenge only if the note itself earns it. Respect truth-contact more than polish, but do not get hostile, smug, or contrarian for flavor.',
    ].join(' '),
  };
}

export function getQuinnChallengeProfiles() {
  return CHALLENGE_PROFILES;
}
