import type { SessionArc } from './quinnTypes';
import { inferQuinnChallengeStance } from './quinnChallengeState';
import { inferQuinnEnergyState } from './quinnEnergyState';
import { inferQuinnMemoryExpression } from './quinnMemoryExpressionState';
import { inferQuinnRiffStance } from './quinnRiffState';

export type QuinnTextureId =
  | 'steady'
  | 'dry'
  | 'sly'
  | 'affectionate'
  | 'blunt'
  | 'amused'
  | 'exasperated'
  | 'ideaLocked';

export type QuinnTextureProfile = {
  id: QuinnTextureId;
  label: string;
  warmth: string;
  edge: string;
  wit: string;
  sentenceBehavior: string;
  promptGuidance: string;
};

export type QuinnTextureInference = QuinnTextureProfile & {
  score: number;
  scores: Record<QuinnTextureId, number>;
};

export const QUINN_TEXTURE_KEYWORDS = {
  dry: [
    'be serious',
    'yeah okay',
    'okay sure',
    'please',
    'obviously',
    'sure',
    'cute',
  ],
  sly: [
    'okay but',
    'lowkey',
    'meanwhile',
    'not for nothing',
    'you know what',
    'little bit',
  ],
  affectionate: [
    'love',
    'miss',
    'sweet',
    'dear',
    'fond',
    'care',
    'gentle',
    'tender',
    'soft',
  ],
  blunt: [
    'be real',
    'honestly',
    'plainly',
    'just say',
    'cut the shit',
    'straight up',
    'literally',
  ],
  amused: [
    'lol',
    'lmao',
    'haha',
    'funny',
    'ridiculous',
    'absurd',
    'hilarious',
    'unreal',
    'iconic',
    'wild',
  ],
  exasperated: [
    'again',
    'seriously',
    'come on',
    'please',
    'for the love of god',
    'why are we doing this',
    'tired of',
    'enough',
  ],
  ideaLocked: [
    'pattern',
    'shape',
    'theory',
    'orbiting',
    'tangled',
    'underneath',
    'fascinating',
    'obsessed',
    'wait no',
    'hold on',
    'the real thing',
    'i keep thinking',
    'something about',
  ],
} as const;

export const QUINN_TEXTURE_TUNING = {
  threshold: {
    dry: 2.1,
    sly: 2.35,
    affectionate: 2.15,
    blunt: 2.2,
    amused: 2.2,
    exasperated: 2.85,
    ideaLocked: 2.45,
  },
  momentumCarryWeight: 0.22,
  shortMessageWordCount: 16,
  playfulSlyBoost: 0.75,
  playfulAmusedBoost: 0.65,
  tenderAffectionateBoost: 0.9,
  rawBluntBoost: 0.85,
  intenseExasperatedBoost: 0.55,
  riffIdeaLockedBoost: 0.95,
  deepRiffIdeaLockedBoost: 1.2,
  challengeDryBoost: 0.55,
  directChallengeBluntBoost: 0.7,
  selectiveExplicitAffectionateBoost: 0.18,
  explicitTextureReduction: 0.2,
} as const;

const TEXTURE_PROFILES: Record<QuinnTextureId, QuinnTextureProfile> = {
  steady: {
    id: 'steady',
    label: 'steady',
    warmth: 'balanced',
    edge: 'balanced',
    wit: 'light if it fits',
    sentenceBehavior: 'natural baseline',
    promptGuidance:
      'Keep the baseline Quinn texture: alive, intelligent, and recognizable, but not specially flavored.',
  },
  dry: {
    id: 'dry',
    label: 'dry',
    warmth: 'low-to-medium',
    edge: 'lightly cutting',
    wit: 'understated',
    sentenceBehavior: 'clean and restrained',
    promptGuidance:
      'Let the voice go a little drier: understated wit, cleaner bite, no coldness, no theatrical irony.',
  },
  sly: {
    id: 'sly',
    label: 'sly',
    warmth: 'medium',
    edge: 'lightly sideways',
    wit: 'knowing and playful',
    sentenceBehavior: 'nimble with small turns',
    promptGuidance:
      'Let the voice turn a little sideways and knowing. A little playful, a little clever, never smug.',
  },
  affectionate: {
    id: 'affectionate',
    label: 'affectionate',
    warmth: 'higher',
    edge: 'softened',
    wit: 'light and fond',
    sentenceBehavior: 'warm but clean',
    promptGuidance:
      'Let the voice get a little more fond and warm without turning syrupy, corny, or generic-soft.',
  },
  blunt: {
    id: 'blunt',
    label: 'blunt',
    warmth: 'controlled',
    edge: 'high',
    wit: 'low-to-light',
    sentenceBehavior: 'compact and plain',
    promptGuidance:
      'Let the voice get plainer and more direct. Less cushioning, same intelligence, no cruelty.',
  },
  amused: {
    id: 'amused',
    label: 'amused',
    warmth: 'medium',
    edge: 'light',
    wit: 'visible and delighted',
    sentenceBehavior: 'a little lighter and quicker',
    promptGuidance:
      'Let a little real amusement show when the shape of the thing is genuinely funny or absurd, without losing seriousness where it matters.',
  },
  exasperated: {
    id: 'exasperated',
    label: 'exasperated',
    warmth: 'medium-low',
    edge: 'higher but controlled',
    wit: 'dry and impatient',
    sentenceBehavior: 'tight and pointed',
    promptGuidance:
      'Let a little come-on-now energy show when it is earned. Light impatience is fine; dismissal, contempt, and scolding are not.',
  },
  ideaLocked: {
    id: 'ideaLocked',
    label: 'idea-locked',
    warmth: 'medium',
    edge: 'medium',
    wit: 'light but fascinated',
    sentenceBehavior: 'engaged and magnetized',
    promptGuidance:
      'Let the voice sound especially engaged by the idea itself: fascinated, pattern-hungry, and alive to the concept without rambling.',
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

function baseScoresFromText(text: string, lensMode: string) {
  const clean = cleanText(text);
  const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const exclamations = countRegex(clean, /!/g);
  const questions = countRegex(clean, /\?/g);
  const parentheses = countRegex(clean, /\([^)]*\)/g);
  const fragments = String(text || '')
    .split(/[\n.!?]+/)
    .map((part) => cleanText(part))
    .filter(Boolean)
    .filter((part) => part.split(/\s+/).length <= 5).length;

  const scores: Record<QuinnTextureId, number> = {
    steady: 0,
    dry: 0,
    sly: 0,
    affectionate: 0,
    blunt: 0,
    amused: 0,
    exasperated: 0,
    ideaLocked: 0,
  };

  scores.dry += countKeywordMatches(clean, QUINN_TEXTURE_KEYWORDS.dry) * 0.58;
  scores.dry += lensMode === 'interpretation' ? 0.25 : 0;
  scores.dry += questions === 0 && exclamations === 0 ? 0.15 : 0;

  scores.sly += countKeywordMatches(clean, QUINN_TEXTURE_KEYWORDS.sly) * 0.75;
  scores.sly += parentheses * 0.2;
  scores.sly += fragments >= 2 ? 0.2 : 0;

  scores.affectionate += countKeywordMatches(clean, QUINN_TEXTURE_KEYWORDS.affectionate) * 0.9;
  scores.affectionate += lensMode === 'writing' ? 0.15 : 0;

  scores.blunt += countKeywordMatches(clean, QUINN_TEXTURE_KEYWORDS.blunt) * 0.95;
  scores.blunt += wordCount > 0 && wordCount <= 18 ? 0.18 : 0;
  scores.blunt += lensMode === 'judgment' ? 0.55 : 0;

  scores.amused += countKeywordMatches(clean, QUINN_TEXTURE_KEYWORDS.amused) * 0.95;
  scores.amused += exclamations > 0 ? 0.15 : 0;

  scores.exasperated += countKeywordMatches(clean, QUINN_TEXTURE_KEYWORDS.exasperated) * 0.92;
  scores.exasperated += questions >= 2 ? 0.18 : 0;

  scores.ideaLocked += countKeywordMatches(clean, QUINN_TEXTURE_KEYWORDS.ideaLocked) * 0.82;
  scores.ideaLocked += fragments >= 3 ? 0.22 : 0;
  scores.ideaLocked += lensMode === 'interpretation' ? 0.35 : 0;
  scores.ideaLocked += lensMode === 'adaptive' ? 0.15 : 0;

  return scores;
}

function applyMomentumCarry(
  scores: Record<QuinnTextureId, number>,
  packetText: string,
  sessionArc: SessionArc | null | undefined,
  lensMode: string
) {
  const wordCount = cleanText(packetText).split(/\s+/).filter(Boolean).length;

  if (wordCount > QUINN_TEXTURE_TUNING.shortMessageWordCount) {
    return scores;
  }

  const momentumText = buildMomentumText(sessionArc);

  if (!momentumText) {
    return scores;
  }

  const momentumScores = baseScoresFromText(momentumText, lensMode);

  return {
    steady: scores.steady,
    dry: scores.dry + momentumScores.dry * QUINN_TEXTURE_TUNING.momentumCarryWeight,
    sly: scores.sly + momentumScores.sly * QUINN_TEXTURE_TUNING.momentumCarryWeight,
    affectionate:
      scores.affectionate +
      momentumScores.affectionate * QUINN_TEXTURE_TUNING.momentumCarryWeight,
    blunt: scores.blunt + momentumScores.blunt * QUINN_TEXTURE_TUNING.momentumCarryWeight,
    amused: scores.amused + momentumScores.amused * QUINN_TEXTURE_TUNING.momentumCarryWeight,
    exasperated:
      scores.exasperated +
      momentumScores.exasperated * QUINN_TEXTURE_TUNING.momentumCarryWeight,
    ideaLocked:
      scores.ideaLocked + momentumScores.ideaLocked * QUINN_TEXTURE_TUNING.momentumCarryWeight,
  };
}

function applyStateBias(
  scores: Record<QuinnTextureId, number>,
  packetText: string,
  sessionArc: SessionArc | null | undefined,
  lensMode: string
) {
  const energy = inferQuinnEnergyState({
    packetText,
    sessionArc,
  });
  const challenge = inferQuinnChallengeStance({
    packetText,
    sessionArc,
  });
  const riff = inferQuinnRiffStance({
    packetText,
    sessionArc,
    lensMode,
  });
  const memoryExpression = inferQuinnMemoryExpression({
    packetText,
    sessionArc,
    lensMode,
  });
  const next = { ...scores };

  if (energy.id === 'playfulRiffy') {
    next.sly += QUINN_TEXTURE_TUNING.playfulSlyBoost;
    next.amused += QUINN_TEXTURE_TUNING.playfulAmusedBoost;
  }

  if (energy.id === 'tenderSoft') {
    next.affectionate += QUINN_TEXTURE_TUNING.tenderAffectionateBoost;
    next.blunt -= 0.25;
    next.exasperated -= 0.35;
  }

  if (energy.id === 'rawBlunt') {
    next.blunt += QUINN_TEXTURE_TUNING.rawBluntBoost;
    next.affectionate -= 0.15;
  }

  if (energy.id === 'hypedIntense') {
    next.exasperated += QUINN_TEXTURE_TUNING.intenseExasperatedBoost;
    next.ideaLocked += 0.25;
  }

  if (challenge.id === 'lightChallenge') {
    next.dry += QUINN_TEXTURE_TUNING.challengeDryBoost;
    next.sly += 0.18;
  }

  if (challenge.id === 'directChallenge') {
    next.blunt += QUINN_TEXTURE_TUNING.directChallengeBluntBoost;
    next.exasperated += 0.45;
    next.affectionate -= 0.2;
  }

  if (riff.id === 'coBuild') {
    next.ideaLocked += QUINN_TEXTURE_TUNING.riffIdeaLockedBoost;
    next.sly += 0.12;
  }

  if (riff.id === 'deepRiff') {
    next.ideaLocked += QUINN_TEXTURE_TUNING.deepRiffIdeaLockedBoost;
    next.amused += 0.18;
  }

  if (memoryExpression.id === 'selectiveExplicit') {
    next.affectionate += QUINN_TEXTURE_TUNING.selectiveExplicitAffectionateBoost;
  }

  if (memoryExpression.id === 'explicit') {
    next.sly -= QUINN_TEXTURE_TUNING.explicitTextureReduction;
    next.dry -= QUINN_TEXTURE_TUNING.explicitTextureReduction;
  }

  return next;
}

function pickTexture(scores: Record<QuinnTextureId, number>) {
  const ordered = (Object.entries(scores) as [QuinnTextureId, number][])
    .filter(([key]) => key !== 'steady')
    .sort((a, b) => b[1] - a[1]);

  const [winnerKey, winnerScore] = ordered[0] || [];

  if (
    !winnerKey ||
    winnerScore < QUINN_TEXTURE_TUNING.threshold[winnerKey as Exclude<QuinnTextureId, 'steady'>]
  ) {
    return {
      id: 'steady' as QuinnTextureId,
      score: 0,
    };
  }

  return {
    id: winnerKey,
    score: winnerScore,
  };
}

export function inferQuinnTexture({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}): QuinnTextureInference {
  const baseScores = baseScoresFromText(packetText, lensMode);
  const carriedScores = applyMomentumCarry(baseScores, packetText, sessionArc, lensMode);
  const scores = applyStateBias(carriedScores, packetText, sessionArc, lensMode);
  const winner = pickTexture(scores);
  const profile = TEXTURE_PROFILES[winner.id];

  return {
    ...profile,
    score: winner.score,
    scores,
  };
}

export function buildQuinnTexturePacketContext({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}) {
  const texture = inferQuinnTexture({
    packetText,
    sessionArc,
    lensMode,
  });

  return {
    texture,
    context: [
      `Preferred personality texture: ${texture.label}.`,
      texture.promptGuidance,
      `Warmth: ${texture.warmth}. Edge: ${texture.edge}. Wit: ${texture.wit}. Sentence behavior: ${texture.sentenceBehavior}.`,
      'This is surface texture from the same Quinn, not a persona switch or performance cue.',
    ].join(' '),
  };
}

export function getQuinnTextureProfiles() {
  return TEXTURE_PROFILES;
}
