import type { SessionArc } from './quinnTypes';
import {
  inferQuinnAskStance,
  type QuinnAskInference,
  type QuinnAskStanceId,
} from './quinnAskState';
import {
  inferQuinnCorrectionState,
  type QuinnCorrectionInference,
} from './quinnCorrectionState';
import {
  inferQuinnChallengeStance,
  type QuinnChallengeInference,
  type QuinnChallengeStanceId,
} from './quinnChallengeState';
import {
  inferQuinnEndingStyle,
  type QuinnEndingStyleId,
  type QuinnEndingStyleInference,
} from './quinnEndingState';
import {
  inferQuinnEnergyState,
  type QuinnEnergyInference,
  type QuinnEnergyStateId,
} from './quinnEnergyState';
import {
  inferQuinnMemoryExpression,
  type QuinnMemoryExpressionId,
  type QuinnMemoryExpressionInference,
} from './quinnMemoryExpressionState';
import {
  inferQuinnRiffStance,
  type QuinnRiffInference,
  type QuinnRiffStanceId,
} from './quinnRiffState';
import {
  inferQuinnTexture,
  type QuinnTextureId,
} from './quinnTextureState';

type WeightedState<T extends string> = {
  id: T;
  label: string;
  score: number;
  weight: number;
};

export type QuinnReplyElasticityId = 'micro' | 'short' | 'medium' | 'expanded';
export type QuinnStructuralNoticeId = 'none' | 'lightNotice' | 'strongNotice';
export type QuinnMotifId =
  | 'abandonment'
  | 'chosenness'
  | 'integrityVsAvoidance'
  | 'confusionAsShield'
  | 'closenessVsSelfErasure'
  | 'performanceVsTruth';

export type QuinnReplyElasticityProfile = {
  id: QuinnReplyElasticityId;
  label: string;
  spaceGuidance: string;
  promptGuidance: string;
};

export type QuinnMotifResonance = {
  id: QuinnMotifId;
  label: string;
  score: number;
};

export type QuinnStructuralInference = {
  id: QuinnStructuralNoticeId;
  label: string;
  score: number;
  contradictionScore: number;
  conflationScore: number;
  standardShiftScore: number;
  patternLockScore: number;
  dominantSignals: string[];
  promptGuidance: string;
};

export type QuinnConductorInference = {
  correction: QuinnCorrectionInference;
  energyBlend: {
    primary: WeightedState<QuinnEnergyStateId>;
    secondary: WeightedState<QuinnEnergyStateId> | null;
  };
  textureBlend: {
    primary: WeightedState<QuinnTextureId>;
    secondary: WeightedState<QuinnTextureId> | null;
  };
  challengeBlend: {
    primary: WeightedState<QuinnChallengeStanceId>;
    secondary: WeightedState<QuinnChallengeStanceId> | null;
  };
  riffBlend: {
    primary: WeightedState<QuinnRiffStanceId>;
    secondary: WeightedState<QuinnRiffStanceId> | null;
  };
  endingBlend: {
    primary: WeightedState<QuinnEndingStyleId>;
    secondary: WeightedState<QuinnEndingStyleId> | null;
  };
  finalAsk: QuinnAskStanceId;
  finalMemoryExpression: QuinnMemoryExpressionId;
  elasticity: QuinnReplyElasticityProfile & {
    score: number;
    scores: Record<QuinnReplyElasticityId, number>;
  };
  structural: QuinnStructuralInference;
  motifs: QuinnMotifResonance[];
  arbitrationNotes: string[];
  promptGuidance: string[];
};

export const QUINN_CONDUCTOR_TUNING = {
  blend: {
    secondaryMinScore: {
      energy: 2.05,
      texture: 1.95,
      challenge: 1.7,
      riff: 1.95,
      ending: 1.75,
    },
    secondaryMinRatio: {
      energy: 0.56,
      texture: 0.58,
      challenge: 0.52,
      riff: 0.58,
      ending: 0.6,
    },
  },
  elasticity: {
    threshold: {
      micro: 2,
      medium: 2.15,
      expanded: 2.5,
    },
  },
  structural: {
    threshold: {
      lightNotice: 1.65,
      strongNotice: 3.15,
    },
    recurrenceBoost: 0.8,
  },
  motifs: {
    threshold: 1.8,
    recurrenceBoost: 0.95,
    maxMotifs: 2,
  },
} as const;

const ENERGY_LABELS: Record<QuinnEnergyStateId, string> = {
  steady: 'steady',
  sleepyLow: 'sleepy / low',
  hypedIntense: 'hyped / intense',
  playfulRiffy: 'playful / riffy',
  rawBlunt: 'raw / blunt',
  tenderSoft: 'tender / soft',
};

const TEXTURE_LABELS: Record<QuinnTextureId, string> = {
  steady: 'steady',
  dry: 'dry',
  sly: 'sly',
  affectionate: 'affectionate',
  blunt: 'blunt',
  amused: 'amused',
  exasperated: 'exasperated',
  ideaLocked: 'idea-locked',
};

const CHALLENGE_LABELS: Record<QuinnChallengeStanceId, string> = {
  neutral: 'neutral',
  lightChallenge: 'light challenge',
  directChallenge: 'direct challenge',
};

const RIFF_LABELS: Record<QuinnRiffStanceId, string> = {
  resolve: 'resolve',
  coBuild: 'co-build',
  deepRiff: 'deep riff',
};

const ENDING_LABELS: Record<QuinnEndingStyleId, string> = {
  open: 'open',
  sharp: 'sharp',
  nudge: 'nudge',
  cleanStop: 'clean stop',
  softLanding: 'soft landing',
};

const ASK_LABELS: Record<QuinnAskStanceId, string> = {
  ask: 'ask',
  optionalAsk: 'optional ask',
  noAsk: 'no ask',
};

const MEMORY_LABELS: Record<QuinnMemoryExpressionId, string> = {
  implicit: 'implicit',
  selectiveExplicit: 'selective explicit',
  explicit: 'explicit',
};

const ELASTICITY_PROFILES: Record<QuinnReplyElasticityId, QuinnReplyElasticityProfile> = {
  micro: {
    id: 'micro',
    label: 'micro',
    spaceGuidance: 'knife',
    promptGuidance:
      'Keep it very tight. One hard paragraph or two clipped beats at most. Say the thing and stop.',
  },
  short: {
    id: 'short',
    label: 'short',
    spaceGuidance: 'brief sketch',
    promptGuidance:
      'Keep it short and clean. Usually one or two short paragraphs, enough room for the point but no extra scaffolding.',
  },
  medium: {
    id: 'medium',
    label: 'medium',
    spaceGuidance: 'room for shape',
    promptGuidance:
      'Give it enough room to unfold a little. Usually two short paragraphs, sometimes three if the shape genuinely needs it.',
  },
  expanded: {
    id: 'expanded',
    label: 'expanded',
    spaceGuidance: 'fuller room',
    promptGuidance:
      'Let it breathe more because the moment has real layeredness. Still stay controlled and high-signal; this is room, not bloat.',
  },
};

const MOTIF_KEYWORDS: Record<QuinnMotifId, readonly string[]> = {
  abandonment: [
    'left',
    'leave',
    'leaving',
    'abandoned',
    'ghosted',
    'replaced',
    'forgotten',
    'dropped',
    'not chosen',
    'not picked',
  ],
  chosenness: [
    'chosen',
    'pick me',
    'picked',
    'selected',
    'special',
    'priority',
    'wanted',
    'picked first',
  ],
  integrityVsAvoidance: [
    'integrity',
    'honest',
    'truth',
    'real thing',
    'avoid',
    'avoidance',
    'dodging',
    'hiding',
    'spin',
    'pretending',
  ],
  confusionAsShield: [
    "i don't know",
    'confusing',
    'unclear',
    'messy',
    'nuanced',
    'complicated',
    'hard to say',
    'hard to pin down',
  ],
  closenessVsSelfErasure: [
    'close',
    'closeness',
    'intimacy',
    'merge',
    'lose myself',
    'erase myself',
    'disappear',
    'too much',
    'smaller',
    'self erase',
  ],
  performanceVsTruth: [
    'perform',
    'performance',
    'image',
    'pretty version',
    'dress it up',
    'story',
    'spin',
    'truth',
    'real thing',
    'look like',
  ],
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

function buildBlend<T extends string>(
  scores: Record<T, number>,
  primaryId: T,
  labels: Record<T, string>,
  {
    secondaryMinScore,
    secondaryMinRatio,
    excludeSecondary = [],
  }: {
    secondaryMinScore: number;
    secondaryMinRatio: number;
    excludeSecondary?: T[];
  }
) {
  const primaryScore = Number(scores[primaryId] || 0);
  const secondaryEntry = (Object.entries(scores) as [T, number][])
    .filter(([id]) => id !== primaryId && !excludeSecondary.includes(id))
    .sort((a, b) => b[1] - a[1])
    .find(
      ([, score]) =>
        score >= secondaryMinScore &&
        (primaryScore <= 0 || score >= primaryScore * secondaryMinRatio)
    );

  if (!secondaryEntry || primaryScore <= 0) {
    return {
      primary: {
        id: primaryId,
        label: labels[primaryId],
        score: primaryScore,
        weight: 1,
      },
      secondary: null,
    };
  }

  const [secondaryId, secondaryScore] = secondaryEntry;
  const total = primaryScore + secondaryScore || 1;

  return {
    primary: {
      id: primaryId,
      label: labels[primaryId],
      score: primaryScore,
      weight: primaryScore / total,
    },
    secondary: {
      id: secondaryId,
      label: labels[secondaryId],
      score: secondaryScore,
      weight: secondaryScore / total,
    },
  };
}

function inferMotifs(packetText: string, sessionArc: SessionArc | null | undefined) {
  const clean = cleanText(packetText);
  const momentumText = buildMomentumText(sessionArc);

  const motifs = (Object.entries(MOTIF_KEYWORDS) as [QuinnMotifId, readonly string[]][])
    .map(([id, keywords]) => {
      const currentMatches = countKeywordMatches(clean, keywords);
      const momentumMatches = countKeywordMatches(momentumText, keywords);
      const recurrenceBoost =
        currentMatches > 0 && momentumMatches > 0
          ? QUINN_CONDUCTOR_TUNING.motifs.recurrenceBoost
          : 0;

      return {
        id,
        label: id
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (value) => value.toUpperCase())
          .trim(),
        score: currentMatches * 0.92 + momentumMatches * 0.5 + recurrenceBoost,
      };
    })
    .filter((motif) => motif.score >= QUINN_CONDUCTOR_TUNING.motifs.threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, QUINN_CONDUCTOR_TUNING.motifs.maxMotifs);

  return motifs;
}

function inferStructuralNoticing(packetText: string, sessionArc: SessionArc | null | undefined) {
  const clean = cleanText(packetText);
  const momentumText = buildMomentumText(sessionArc);
  const lower = clean.toLowerCase();

  const contradictionScore =
    countRegex(lower, /\bi know\b[\s\S]{0,90}\bi don't know\b|\bi don't know\b[\s\S]{0,90}\bi know\b/g) *
      1.2 +
    countRegex(lower, /\bi want\b[\s\S]{0,90}\bi don't want\b|\bi don't want\b[\s\S]{0,90}\bi want\b/g) *
      1.1 +
    countRegex(lower, /\bit doesn't matter\b[\s\S]{0,80}\bit matters\b|\bit matters\b[\s\S]{0,80}\bit doesn't matter\b/g) *
      1.15;

  const standardShiftScore =
    countKeywordMatches(lower, [
      'if it were anyone else',
      'if this were someone else',
      'but for me',
      'when it is me',
      'different rules',
      'i would tell someone else',
      'for other people',
    ]) * 1.05 +
    countRegex(lower, /\bbut when it's me\b|\bexcept when it's me\b/gi) * 1.15;

  const conflationScore =
    countKeywordMatches(lower, [
      'same thing',
      'basically the same',
      'all the same',
      'two different things',
      'tangled together',
      'mixing together',
      'not the same problem',
    ]) * 0.88 +
    countRegex(lower, /\b(?:is it|is this)\b[\s\S]{0,45}\bor\b[\s\S]{0,45}\b(?:is it|is this)\b/gi) *
      0.55;

  const motifs = inferMotifs(packetText, sessionArc);
  const motifRecurrence = motifs.length ? QUINN_CONDUCTOR_TUNING.structural.recurrenceBoost : 0;
  const patternLockScore =
    countKeywordMatches(lower, ['again', 'still', 'same pattern', 'this again', 'new version of', 'different costume']) *
      0.62 +
    countKeywordMatches(momentumText.toLowerCase(), ['again', 'still', 'same pattern']) * 0.28 +
    motifRecurrence;

  const score =
    contradictionScore + standardShiftScore + conflationScore + patternLockScore;

  const dominantSignals = [
    contradictionScore >= 1 ? 'contradiction' : '',
    standardShiftScore >= 1 ? 'standard shift' : '',
    conflationScore >= 0.9 ? 'conflation' : '',
    patternLockScore >= 1 ? 'pattern lock' : '',
  ].filter(Boolean);

  const id =
    score >= QUINN_CONDUCTOR_TUNING.structural.threshold.strongNotice
      ? 'strongNotice'
      : score >= QUINN_CONDUCTOR_TUNING.structural.threshold.lightNotice
        ? 'lightNotice'
        : 'none';

  const promptGuidance =
    id === 'strongNotice'
      ? 'There is strong structural signal here. Separate categories, watch for standard shifts, and do not let a prettier surface story hide the real recurring pattern.'
      : id === 'lightNotice'
        ? 'There may be a structural wrinkle here. Check for contradiction, conflation, or a recurring pattern under the new surface before you answer too cleanly.'
        : 'No extra structural forcing needed. Stay precise without manufacturing pattern-lock.';

  return {
    id,
    label:
      id === 'strongNotice'
        ? 'strong structural notice'
        : id === 'lightNotice'
          ? 'light structural notice'
          : 'no special structural notice',
    score,
    contradictionScore,
    conflationScore,
    standardShiftScore,
    patternLockScore,
    dominantSignals,
    promptGuidance,
  } satisfies QuinnStructuralInference;
}

function resolveFinalAskStance({
  ask,
  correction,
  ending,
  challenge,
  energy,
  riff,
}: {
  ask: QuinnAskInference;
  correction: QuinnCorrectionInference;
  ending: QuinnEndingStyleInference;
  challenge: QuinnChallengeInference;
  energy: QuinnEnergyInference;
  riff: QuinnRiffInference;
}): QuinnAskStanceId {
  let resolved = ask.id;

  if (ending.id === 'sharp' || ending.id === 'cleanStop') {
    resolved = 'noAsk';
  }

  if (challenge.id === 'directChallenge') {
    resolved = 'noAsk';
  }

  if (
    correction.clarificationOverride.id !== 'none' ||
    correction.correctionLatch.id !== 'none' ||
    correction.constraintPriority.id !== 'none' ||
    correction.repeatGuard.id !== 'none'
  ) {
    resolved = 'noAsk';
  }

  if ((energy.id === 'tenderSoft' || riff.id === 'deepRiff') && resolved === 'ask') {
    resolved = 'optionalAsk';
  }

  return resolved;
}

function resolveFinalMemoryExpression({
  memoryExpression,
  correction,
  energy,
  riff,
}: {
  memoryExpression: QuinnMemoryExpressionInference;
  correction: QuinnCorrectionInference;
  energy: QuinnEnergyInference;
  riff: QuinnRiffInference;
}): QuinnMemoryExpressionId {
  if (
    correction.clarificationOverride.id !== 'none' ||
    correction.correctionLatch.id !== 'none' ||
    correction.constraintPriority.id !== 'none' ||
    correction.repeatGuard.id !== 'none'
  ) {
    return 'implicit';
  }

  if (
    memoryExpression.id === 'explicit' &&
    (energy.id === 'tenderSoft' || riff.id === 'deepRiff')
  ) {
    return 'selectiveExplicit';
  }

  if (
    memoryExpression.id === 'selectiveExplicit' &&
    riff.id === 'deepRiff'
  ) {
    return 'implicit';
  }

  return memoryExpression.id;
}

function inferElasticity({
  packetText,
  correction,
  energy,
  challenge,
  riff,
  ending,
  ask,
  structural,
  motifs,
}: {
  packetText: string;
  correction: QuinnCorrectionInference;
  energy: QuinnEnergyInference;
  challenge: QuinnChallengeInference;
  riff: QuinnRiffInference;
  ending: QuinnEndingStyleInference;
  ask: QuinnAskStanceId;
  structural: QuinnStructuralInference;
  motifs: QuinnMotifResonance[];
}) {
  const clean = cleanText(packetText);
  const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const resolveAskCount = countRegex(
    clean,
    /\b(?:what should i do|what do i do|what now|help me|can you help|give me options|give me a plan|next step|what would you do|should i|how do i)\b/gi
  );
  const scores: Record<QuinnReplyElasticityId, number> = {
    micro: 0,
    short: 1.1,
    medium: 0,
    expanded: 0,
  };

  scores.micro += wordCount > 0 && wordCount <= 18 ? 0.85 : 0;
  scores.micro += ending.id === 'sharp' || ending.id === 'cleanStop' ? 0.95 : 0;
  scores.micro += ask === 'noAsk' ? 0.5 : 0;
  scores.micro += challenge.id === 'directChallenge' ? 0.7 : 0;
  scores.micro += correction.clarificationOverride.id === 'dominant' ? 1.05 : 0;
  scores.micro += correction.clarificationOverride.id === 'partial' ? 0.45 : 0;
  scores.micro += correction.correctionLatch.id === 'hard' ? 1.15 : 0;
  scores.micro += correction.constraintPriority.id === 'dominant' ? 0.85 : 0;
  scores.micro += correction.repeatGuard.id !== 'none' ? 0.75 : 0;
  scores.micro -= riff.id === 'coBuild' ? 0.55 : 0;
  scores.micro -= riff.id === 'deepRiff' ? 0.95 : 0;
  scores.micro -= energy.id === 'tenderSoft' ? 0.25 : 0;

  scores.short += ask === 'noAsk' ? 0.25 : 0;
  scores.short += resolveAskCount > 0 ? 0.25 : 0;
  scores.short += wordCount > 0 && wordCount <= 42 ? 0.2 : 0;
  scores.short += correction.clarificationOverride.id === 'partial' ? 0.35 : 0;
  scores.short += correction.correctionLatch.id === 'soft' ? 0.35 : 0;
  scores.short += correction.constraintPriority.id === 'elevated' ? 0.25 : 0;

  scores.medium += riff.id === 'coBuild' ? 0.8 : 0;
  scores.medium += energy.id === 'tenderSoft' ? 0.55 : 0;
  scores.medium += structural.id !== 'none' ? 0.55 : 0;
  scores.medium += motifs.length > 0 ? 0.35 : 0;
  scores.medium += resolveAskCount > 0 ? 0.3 : 0;
  scores.medium += wordCount > 42 ? 0.2 : 0;
  scores.medium -= correction.clarificationOverride.id === 'dominant' ? 0.85 : 0;
  scores.medium -= correction.clarificationOverride.id === 'partial' ? 0.25 : 0;
  scores.medium -= correction.correctionLatch.id === 'hard' ? 0.7 : 0;
  scores.medium -= correction.repeatGuard.id !== 'none' ? 0.4 : 0;

  scores.expanded += riff.id === 'deepRiff' ? 1.35 : 0;
  scores.expanded += structural.id === 'strongNotice' ? 0.7 : 0;
  scores.expanded += motifs.length > 1 ? 0.55 : 0;
  scores.expanded += energy.id === 'hypedIntense' && riff.id !== 'resolve' ? 0.25 : 0;
  scores.expanded += resolveAskCount >= 2 ? 0.35 : 0;
  scores.expanded -= correction.clarificationOverride.id === 'dominant' ? 1.15 : 0;
  scores.expanded -= correction.clarificationOverride.id === 'partial' ? 0.4 : 0;
  scores.expanded -= correction.correctionLatch.id === 'hard' ? 1.1 : 0;
  scores.expanded -= correction.constraintPriority.id === 'dominant' ? 0.8 : 0;
  scores.expanded -= correction.repeatGuard.id !== 'none' ? 0.75 : 0;

  const winner =
    scores.expanded >= QUINN_CONDUCTOR_TUNING.elasticity.threshold.expanded
      ? 'expanded'
      : scores.micro >= QUINN_CONDUCTOR_TUNING.elasticity.threshold.micro &&
          scores.micro > scores.short
        ? 'micro'
        : scores.medium >= QUINN_CONDUCTOR_TUNING.elasticity.threshold.medium &&
            scores.medium > scores.short
          ? 'medium'
          : 'short';

  return {
    ...ELASTICITY_PROFILES[winner],
    score: scores[winner],
    scores,
  };
}

function buildArbitrationNotes({
  correction,
  energyBlend,
  textureBlend,
  challengeBlend,
  riffBlend,
  endingBlend,
  finalAsk,
  finalMemoryExpression,
  structural,
  motifs,
}: {
  correction: QuinnCorrectionInference;
  energyBlend: {
    primary: WeightedState<QuinnEnergyStateId>;
    secondary: WeightedState<QuinnEnergyStateId> | null;
  };
  textureBlend: {
    primary: WeightedState<QuinnTextureId>;
    secondary: WeightedState<QuinnTextureId> | null;
  };
  challengeBlend: {
    primary: WeightedState<QuinnChallengeStanceId>;
    secondary: WeightedState<QuinnChallengeStanceId> | null;
  };
  riffBlend: {
    primary: WeightedState<QuinnRiffStanceId>;
    secondary: WeightedState<QuinnRiffStanceId> | null;
  };
  endingBlend: {
    primary: WeightedState<QuinnEndingStyleId>;
    secondary: WeightedState<QuinnEndingStyleId> | null;
  };
  finalAsk: QuinnAskStanceId;
  finalMemoryExpression: QuinnMemoryExpressionId;
  structural: QuinnStructuralInference;
  motifs: QuinnMotifResonance[];
}) {
  const notes: string[] = [];

  if (
    (energyBlend.primary.id === 'tenderSoft' ||
      energyBlend.secondary?.id === 'tenderSoft') &&
    (textureBlend.primary.id === 'blunt' ||
      textureBlend.secondary?.id === 'blunt' ||
      challengeBlend.primary.id === 'directChallenge')
  ) {
    notes.push('Tenderness caps bluntness. Keep the truth plain without bulldozing the softer signal.');
  }

  if (
    endingBlend.primary.id === 'sharp' ||
    endingBlend.primary.id === 'cleanStop'
  ) {
    notes.push('The landing should stay strong. Do not soften it with a reflex question or extra summary line.');
  }

  if (
    riffBlend.primary.id === 'deepRiff' &&
    challengeBlend.primary.id === 'directChallenge'
  ) {
    notes.push('Challenge from inside the thought. Name the dodge without collapsing the live riff into premature resolve.');
  }

  if (finalAsk === 'noAsk') {
    notes.push('Let the moment breathe. If the line lands, stop there instead of pulling for more.');
  }

  if (correction.clarificationOverride.id !== 'none') {
    notes.push(
      correction.clarificationOverride.interpretationReplacement
        ? 'An explicit meaning clarification is active. Drop the older interpretation and answer from the corrected sense.'
        : 'A semantic clarification is active. Let the clarified sense outrank stale thread momentum.'
    );
  }

  if (finalMemoryExpression === 'implicit') {
    notes.push('Keep continuity metabolized. Let memory sharpen the framing quietly instead of surfacing it.');
  }

  if (textureBlend.primary.id !== 'steady' || textureBlend.secondary) {
    notes.push('Texture colors the delivery, but semantics stay in charge.');
  }

  if (structural.id !== 'none') {
    notes.push('Prefer structural noticing over surface polish if the story and the deeper pattern are pulling apart.');
  }

  if (motifs.length) {
    notes.push('Let motif resonance steer what feels load-bearing, but keep it mostly implicit unless naming it truly helps.');
  }

  if (correction.correctionLatch.id === 'hard') {
    notes.push('The prior frame was just invalidated. Acknowledge that quickly and pivot instead of defending or extending it.');
  } else if (correction.correctionLatch.id === 'soft') {
    notes.push('A local frame update is active. Keep the reply responsive to the correction instead of coasting on older momentum.');
  }

  if (correction.constraintPriority.id === 'dominant') {
    notes.push('A blocker is now the live fact. Answer feasibility first and let the earlier desire or hype drop into the background.');
  } else if (correction.constraintPriority.id === 'elevated') {
    notes.push('A practical constraint is in play. Keep it visible while you respond instead of acting like it is a side note.');
  }

  if (correction.repeatGuard.id !== 'none') {
    notes.push('The last move got called repetitive. Replace it with materially different content, not the same move in lightly shuffled words.');
  }

  return notes;
}

function describeBlend<T extends string>(name: string, blend: {
  primary: WeightedState<T>;
  secondary: WeightedState<T> | null;
}) {
  if (!blend.secondary) {
    return `${name}: ${blend.primary.label}.`;
  }

  return `${name}: ${blend.primary.label} (${Math.round(blend.primary.weight * 100)}%) with ${blend.secondary.label} (${Math.round(blend.secondary.weight * 100)}%).`;
}

export function inferQuinnConductor({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}): QuinnConductorInference {
  const correction = inferQuinnCorrectionState({
    packetText,
    sessionArc,
  });
  const energy = inferQuinnEnergyState({
    packetText,
    sessionArc,
  });
  const texture = inferQuinnTexture({
    packetText,
    sessionArc,
    lensMode,
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
  const ending = inferQuinnEndingStyle({
    packetText,
    sessionArc,
    lensMode,
  });
  const ask = inferQuinnAskStance({
    packetText,
    sessionArc,
    lensMode,
  });
  const memoryExpression = inferQuinnMemoryExpression({
    packetText,
    sessionArc,
    lensMode,
  });

  const energyBlend = buildBlend(energy.scores, energy.id, ENERGY_LABELS, {
    secondaryMinScore: QUINN_CONDUCTOR_TUNING.blend.secondaryMinScore.energy,
    secondaryMinRatio: QUINN_CONDUCTOR_TUNING.blend.secondaryMinRatio.energy,
    excludeSecondary: ['steady'],
  });
  const textureBlend = buildBlend(texture.scores, texture.id, TEXTURE_LABELS, {
    secondaryMinScore: QUINN_CONDUCTOR_TUNING.blend.secondaryMinScore.texture,
    secondaryMinRatio: QUINN_CONDUCTOR_TUNING.blend.secondaryMinRatio.texture,
    excludeSecondary: ['steady'],
  });
  const challengeBlend = buildBlend(challenge.scores, challenge.id, CHALLENGE_LABELS, {
    secondaryMinScore: QUINN_CONDUCTOR_TUNING.blend.secondaryMinScore.challenge,
    secondaryMinRatio: QUINN_CONDUCTOR_TUNING.blend.secondaryMinRatio.challenge,
    excludeSecondary: ['neutral'],
  });
  const riffBlend = buildBlend(riff.scores, riff.id, RIFF_LABELS, {
    secondaryMinScore: QUINN_CONDUCTOR_TUNING.blend.secondaryMinScore.riff,
    secondaryMinRatio: QUINN_CONDUCTOR_TUNING.blend.secondaryMinRatio.riff,
  });
  const endingBlend = buildBlend(ending.scores, ending.id, ENDING_LABELS, {
    secondaryMinScore: QUINN_CONDUCTOR_TUNING.blend.secondaryMinScore.ending,
    secondaryMinRatio: QUINN_CONDUCTOR_TUNING.blend.secondaryMinRatio.ending,
  });

  const motifs = inferMotifs(packetText, sessionArc);
  const structural = inferStructuralNoticing(packetText, sessionArc);
  const finalAsk = resolveFinalAskStance({
    ask,
    correction,
    ending,
    challenge,
    energy,
    riff,
  });
  const finalMemoryExpression = resolveFinalMemoryExpression({
    memoryExpression,
    correction,
    energy,
    riff,
  });
  const elasticity = inferElasticity({
    packetText,
    correction,
    energy,
    challenge,
    riff,
    ending,
    ask: finalAsk,
    structural,
    motifs,
  });
  const arbitrationNotes = buildArbitrationNotes({
    correction,
    energyBlend,
    textureBlend,
    challengeBlend,
    riffBlend,
    endingBlend,
    finalAsk,
    finalMemoryExpression,
    structural,
    motifs,
  });

  return {
    correction,
    energyBlend,
    textureBlend,
    challengeBlend,
    riffBlend,
    endingBlend,
    finalAsk,
    finalMemoryExpression,
    elasticity,
    structural,
    motifs,
    arbitrationNotes,
    promptGuidance: [
      ...correction.promptGuidance,
      describeBlend('Energy blend', energyBlend),
      describeBlend('Texture blend', textureBlend),
      describeBlend('Challenge blend', challengeBlend),
      describeBlend('Riff blend', riffBlend),
      describeBlend('Ending blend', endingBlend),
      `Final question policy: ${ASK_LABELS[finalAsk]}.`,
      `Final memory visibility: ${MEMORY_LABELS[finalMemoryExpression]}.`,
      `Reply length instinct: ${elasticity.label}. ${elasticity.promptGuidance}`,
      structural.promptGuidance,
      motifs.length
        ? `Motif resonance: ${motifs
            .map((motif) => `${motif.label} (${Math.round(motif.score * 10) / 10})`)
            .join(', ')}. Let motifs sharpen the framing quietly instead of turning them into a thesis.`
        : 'No strong recurring motif needs to be surfaced. Keep motif handling implicit.',
      ...arbitrationNotes,
    ],
  };
}

export function buildQuinnConductorPacketContext({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}) {
  const conductor = inferQuinnConductor({
    packetText,
    sessionArc,
    lensMode,
  });

  return {
    conductor,
    context: conductor.promptGuidance.join(' '),
  };
}
