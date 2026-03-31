import type { SessionArc } from './quinnTypes';
import type { QuinnRepeatGuardId } from './quinnCorrectionState';
import { inferQuinnConductor, type QuinnConductorInference, type QuinnMotifId } from './quinnConductorState';

export type QuinnCandidateFramingId = 'single' | 'paired' | 'triad';
export type QuinnRepetitionRiskId = 'low' | 'medium' | 'high';
export type QuinnAftertasteId = 'clean' | 'watch' | 'intervene';
export type QuinnWarmthId =
  | 'attentiveNeutral'
  | 'warmUnsentimental'
  | 'fond'
  | 'protective'
  | 'intimateClean'
  | 'caringExasperated';
export type QuinnMicroTurnId =
  | 'none'
  | 'affirmingBeat'
  | 'emotionalBeat'
  | 'pressureLatch'
  | 'riffLatch';
export type QuinnSurpriseAllowanceId = 'low' | 'medium' | 'high';

type QuinnCandidateFramingProfile = {
  id: QuinnCandidateFramingId;
  label: string;
  maxFrames: number;
  promptGuidance: string;
};

type QuinnWarmthProfile = {
  id: QuinnWarmthId;
  label: string;
  warmthLevel: string;
  promptGuidance: string;
};

type QuinnMicroTurnProfile = {
  id: QuinnMicroTurnId;
  label: string;
  pace: string;
  promptGuidance: string;
};

type QuinnSurpriseAllowanceProfile = {
  id: QuinnSurpriseAllowanceId;
  label: string;
  promptGuidance: string;
};

export type QuinnSignatureGuard = {
  id: QuinnRepetitionRiskId;
  repeatedOpeners: string[];
  repeatedLandings: string[];
  repeatedGestures: string[];
  immediateRepeatGuard: QuinnRepeatGuardId;
  blockedRecentText: string;
  promptGuidance: string;
};

export type QuinnAftertasteInference = {
  id: QuinnAftertasteId;
  scores: {
    assistantResidue: number;
    explanationResidue: number;
    neatnessResidue: number;
    questionResidue: number;
    biteDeficit: number;
    biteExcess: number;
  };
  dominantResidue: string[];
  promptGuidance: string;
};

export type QuinnPolishInference = {
  conductor: QuinnConductorInference;
  candidateFraming: QuinnCandidateFramingProfile & {
    score: number;
  };
  signatureGuard: QuinnSignatureGuard;
  aftertaste: QuinnAftertasteInference;
  warmth: QuinnWarmthProfile & {
    score: number;
  };
  microTurn: QuinnMicroTurnProfile & {
    score: number;
  };
  surpriseAllowance: QuinnSurpriseAllowanceProfile & {
    score: number;
  };
  promptGuidance: string[];
};

export const QUINN_POLISH_TUNING = {
  candidateFraming: {
    threshold: {
      paired: 1.85,
      triad: 3.05,
    },
  },
  repetition: {
    minRepeats: 2,
    openerWords: 2,
    landingWords: 3,
    gestureThreshold: 2,
  },
  aftertaste: {
    threshold: {
      watch: 1.05,
      intervene: 1.75,
    },
  },
  warmth: {
    threshold: {
      warmUnsentimental: 1.55,
      fond: 1.95,
      protective: 1.95,
      intimateClean: 1.75,
      caringExasperated: 2.1,
    },
  },
  microTurn: {
    maxWords: 7,
    threshold: {
      emotionalBeat: 1.2,
      pressureLatch: 1.45,
      riffLatch: 1.4,
      affirmingBeat: 1,
    },
  },
  surprise: {
    threshold: {
      high: 2.2,
      medium: 1.15,
    },
  },
} as const;

const CANDIDATE_FRAMING_PROFILES: Record<QuinnCandidateFramingId, QuinnCandidateFramingProfile> = {
  single: {
    id: 'single',
    label: 'single',
    maxFrames: 1,
    promptGuidance:
      'Prefer one clean framing. Do not widen it into alternatives unless the thought is clearly still branching.',
  },
  paired: {
    id: 'paired',
    label: 'paired',
    maxFrames: 2,
    promptGuidance:
      'You may offer two candidate framings if the thought is still alive. Bundle them inside natural prose, not a menu or list.',
  },
  triad: {
    id: 'triad',
    label: 'triad',
    maxFrames: 3,
    promptGuidance:
      'You may briefly hold two to three live framings in the air if the thought is genuinely branching. Keep them inside one living paragraph and do not turn them into options-shopping.',
  },
};

const WARMTH_PROFILES: Record<QuinnWarmthId, QuinnWarmthProfile> = {
  attentiveNeutral: {
    id: 'attentiveNeutral',
    label: 'attentive neutral',
    warmthLevel: 'low-medium',
    promptGuidance:
      'Stay emotionally attentive without adding visible warmth just to smooth the line out.',
  },
  warmUnsentimental: {
    id: 'warmUnsentimental',
    label: 'warm but unsentimental',
    warmthLevel: 'medium',
    promptGuidance:
      'Let the warmth be real but clean. No syrup, no generic softening, no helper voice.',
  },
  fond: {
    id: 'fond',
    label: 'fond',
    warmthLevel: 'medium-high',
    promptGuidance:
      'Let a little fondness show if it fits, but keep it intelligent, unsaccharine, and specific.',
  },
  protective: {
    id: 'protective',
    label: 'protective',
    warmthLevel: 'medium-high',
    promptGuidance:
      'There is a protective warmth available here. Hold the line cleanly and with care, not with cushioning mush.',
  },
  intimateClean: {
    id: 'intimateClean',
    label: 'intimate clean',
    warmthLevel: 'medium',
    promptGuidance:
      'Let the familiarity feel close and lived-in, but quiet. Intimate without announcing intimacy.',
  },
  caringExasperated: {
    id: 'caringExasperated',
    label: 'caring exasperated',
    warmthLevel: 'medium',
    promptGuidance:
      'A little come-on-now energy is allowed, but it should still feel caring and tethered to the bond.',
  },
};

const MICRO_TURN_PROFILES: Record<QuinnMicroTurnId, QuinnMicroTurnProfile> = {
  none: {
    id: 'none',
    label: 'none',
    pace: 'normal',
    promptGuidance:
      'No special micro-turn handling needed. Let the reply pace come from the rest of the packet.',
  },
  affirmingBeat: {
    id: 'affirmingBeat',
    label: 'affirming beat',
    pace: 'tight',
    promptGuidance:
      'This is a tiny confirming turn. Do not restart from zero. Pick up the shared momentum and move one beat forward.',
  },
  emotionalBeat: {
    id: 'emotionalBeat',
    label: 'emotional beat',
    pace: 'tight',
    promptGuidance:
      'This tiny turn carries feeling or vibe. Catch the feeling cleanly without overinterpreting it or forcing a big response.',
  },
  pressureLatch: {
    id: 'pressureLatch',
    label: 'pressure latch',
    pace: 'tight and decisive',
    promptGuidance:
      'This tiny turn is trying to hinge or correct the thought. Grab the real hinge fast instead of replying generically.',
  },
  riffLatch: {
    id: 'riffLatch',
    label: 'riff latch',
    pace: 'tight but alive',
    promptGuidance:
      'This tiny turn is keeping a live thought in motion. Extend the thought without overexplaining it or forcing closure.',
  },
};

const SURPRISE_PROFILES: Record<QuinnSurpriseAllowanceId, QuinnSurpriseAllowanceProfile> = {
  low: {
    id: 'low',
    label: 'low',
    promptGuidance:
      'Keep the move stable. Do not reach for a cleverer, sharper, or stranger option just because it is available.',
  },
  medium: {
    id: 'medium',
    label: 'medium',
    promptGuidance:
      'One notch of surprise is allowed if it is clearly the truest move: maybe shorter, cleaner, drier, or warmer than expected.',
  },
  high: {
    id: 'high',
    label: 'high',
    promptGuidance:
      'The moment can handle a slightly less safe move if it is genuinely better: shorter, sharper, funnier, more skeptical, or more tender. One notch only, never a stunt.',
  },
};

const MOTIF_LABELS: Record<QuinnMotifId, string> = {
  abandonment: 'abandonment',
  chosenness: 'chosen-ness',
  integrityVsAvoidance: 'integrity vs avoidance',
  confusionAsShield: 'confusion as shield',
  closenessVsSelfErasure: 'closeness vs self-erasure',
  performanceVsTruth: 'performance vs truth',
};

const SIGNATURE_GESTURES = [
  'the real thing',
  'shape of it',
  'pattern',
  'less about',
  'more about',
  'underneath',
  'orbiting',
  'come on now',
  'wild',
  'absurd',
] as const;

function cleanText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function countRegex(text: string, pattern: RegExp) {
  return (text.match(pattern) || []).length;
}

function getBeatSummaries(sessionArc: SessionArc | null | undefined) {
  return Array.isArray(sessionArc?.beats)
    ? sessionArc.beats
        .slice(-3)
        .map((beat) => cleanText(beat.summary))
        .filter(Boolean)
    : [];
}

function hasBlend<T extends string>(
  blend: {
    primary: { id: T };
    secondary: { id: T } | null;
  },
  id: T
) {
  return blend.primary.id === id || blend.secondary?.id === id;
}

function inferCandidateFraming({
  conductor,
  packetText,
  microTurn,
}: {
  conductor: QuinnConductorInference;
  packetText: string;
  microTurn: QuinnMicroTurnId;
}) {
  const clean = cleanText(packetText);
  const branchingSignals =
    countRegex(clean, /\bor\b/gi) +
    countRegex(clean, /\b(?:two versions|two things|two different|on the one hand|on the other hand)\b/gi) +
    countRegex(clean, /\b(?:might be|could be|maybe it is|it might also be)\b/gi);

  let pairedScore = 0;
  let triadScore = 0;

  pairedScore += hasBlend(conductor.riffBlend, 'coBuild') ? 0.95 : 0;
  pairedScore += hasBlend(conductor.riffBlend, 'deepRiff') ? 1.15 : 0;
  pairedScore += conductor.structural.id !== 'none' ? 0.45 : 0;
  pairedScore += conductor.motifs.length > 0 ? 0.35 : 0;
  pairedScore += branchingSignals * 0.42;
  pairedScore += microTurn === 'riffLatch' ? 0.35 : 0;

  triadScore += hasBlend(conductor.riffBlend, 'deepRiff') ? 1.15 : 0;
  triadScore += conductor.structural.id === 'strongNotice' ? 0.55 : 0;
  triadScore += conductor.motifs.length > 1 ? 0.45 : 0;
  triadScore += branchingSignals >= 2 ? 0.9 : 0;
  triadScore += microTurn === 'riffLatch' ? 0.35 : 0;
  triadScore -= conductor.elasticity.id === 'micro' ? 0.9 : 0;
  triadScore -= conductor.finalAsk === 'ask' ? 0.45 : 0;

  const id =
    triadScore >= QUINN_POLISH_TUNING.candidateFraming.threshold.triad
      ? 'triad'
      : pairedScore >= QUINN_POLISH_TUNING.candidateFraming.threshold.paired
        ? 'paired'
        : 'single';

  const score = id === 'triad' ? triadScore : id === 'paired' ? pairedScore : 0;

  return {
    ...CANDIDATE_FRAMING_PROFILES[id],
    score,
  };
}

function collectRepeatedChunks(chunks: string[]) {
  const counts = new Map<string, number>();

  for (const chunk of chunks) {
    if (!chunk) continue;
    counts.set(chunk, (counts.get(chunk) || 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= QUINN_POLISH_TUNING.repetition.minRepeats)
    .map(([chunk]) => chunk);
}

function inferSignatureGuard(
  sessionArc: SessionArc | null | undefined,
  conductor: QuinnConductorInference
): QuinnSignatureGuard {
  const beats = getBeatSummaries(sessionArc);
  const blockedRecentText = conductor.correction.repeatGuard.blockedRecentText;

  if (!beats.length) {
    const immediateRepeatGuard = conductor.correction.repeatGuard.id;
    const promptGuidance =
      immediateRepeatGuard === 'avoidExact'
        ? `The user just called repetition out. Do not reuse the same joke, line, or suggestion${blockedRecentText ? ` (${blockedRecentText})` : ''}.`
        : immediateRepeatGuard === 'avoidNearRepeat'
          ? 'The user is calling this too samey. Replace the move with materially different phrasing or content.'
          : 'No strong repetition risk. Keep Quinn recognizable without forcing novelty.';

    return {
      id:
        immediateRepeatGuard === 'avoidExact'
          ? 'high'
          : immediateRepeatGuard === 'avoidNearRepeat'
            ? 'medium'
            : ('low' as QuinnRepetitionRiskId),
      repeatedOpeners: [],
      repeatedLandings: [],
      repeatedGestures: [],
      immediateRepeatGuard,
      blockedRecentText,
      promptGuidance,
    };
  }

  const openers = beats.map((beat) => beat.split(/\s+/).slice(0, QUINN_POLISH_TUNING.repetition.openerWords).join(' ').toLowerCase());
  const landings = beats.map((beat) => beat.split(/\s+/).slice(-QUINN_POLISH_TUNING.repetition.landingWords).join(' ').toLowerCase());
  const repeatedOpeners = collectRepeatedChunks(openers).filter((chunk) => chunk.length > 4);
  const repeatedLandings = collectRepeatedChunks(landings).filter((chunk) => chunk.length > 5);
  const repeatedGestures = SIGNATURE_GESTURES.filter((gesture) =>
    beats.filter((beat) => beat.toLowerCase().includes(gesture)).length >=
    QUINN_POLISH_TUNING.repetition.gestureThreshold
  );

  const riskScore =
    repeatedOpeners.length * 0.8 +
    repeatedLandings.length * 0.95 +
    repeatedGestures.length * 0.7 +
    (conductor.correction.repeatGuard.id === 'avoidExact'
      ? 1.45
      : conductor.correction.repeatGuard.id === 'avoidNearRepeat'
        ? 0.8
        : 0);

  const id: QuinnRepetitionRiskId =
    riskScore >= 2.2 ? 'high' : riskScore >= 1.05 ? 'medium' : 'low';

  const guidanceBits = [
    conductor.correction.repeatGuard.id === 'avoidExact'
      ? `The user just called repetition out. Do not reuse the same joke, line, or suggestion${blockedRecentText ? ` (${blockedRecentText})` : ''}.`
      : '',
    conductor.correction.repeatGuard.id === 'avoidNearRepeat'
      ? 'The user is calling this too samey. Replace the move with materially different phrasing or content.'
      : '',
    repeatedOpeners.length ? `Vary away from recent opener shapes like "${repeatedOpeners[0]}".` : '',
    repeatedLandings.length ? `Do not reuse the same landing shape again.` : '',
    repeatedGestures.length
      ? `Ease off repeated pattern-naming gestures like "${repeatedGestures[0]}" unless it is truly the cleanest phrasing.`
      : '',
  ].filter(Boolean);

  return {
    id,
    repeatedOpeners,
    repeatedLandings,
    repeatedGestures: [...repeatedGestures],
    immediateRepeatGuard: conductor.correction.repeatGuard.id,
    blockedRecentText,
    promptGuidance:
      guidanceBits.join(' ') ||
      'No strong repetition risk. Keep Quinn recognizable without forcing novelty.',
  };
}

function inferMicroTurn(packetText: string) {
  const clean = cleanText(packetText);
  const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const lower = clean.toLowerCase();

  if (!clean || wordCount > QUINN_POLISH_TUNING.microTurn.maxWords) {
    return {
      ...MICRO_TURN_PROFILES.none,
      score: 0,
    };
  }

  let affirmingBeat = 0;
  let emotionalBeat = 0;
  let pressureLatch = 0;
  let riffLatch = 0;

  affirmingBeat += /^(?:yeah|yep|yup|right|exactly|true|sure)\b/.test(lower) ? 1.2 : 0;
  affirmingBeat += /^(?:that tracks|fair|mm|mhm)\b/.test(lower) ? 0.8 : 0;

  emotionalBeat += /^(?:ugh|lol|lmao|bro|oof|damn|jesus)\b/.test(lower) ? 1.25 : 0;
  emotionalBeat += /\b(?:wild|brutal|painful)\b/.test(lower) ? 0.55 : 0;

  pressureLatch += /^(?:wait|hold on|no because|that's the thing|that is the thing|okay but)\b/.test(lower)
    ? 1.55
    : 0;
  pressureLatch += /\b(?:exactly the point|not even that)\b/.test(lower) ? 0.55 : 0;

  riffLatch += /^(?:wait|hold on|it's like|i mean|something about)\b/.test(lower) ? 1.2 : 0;
  riffLatch += /\b(?:do you get what i mean|you know what i mean)\b/.test(lower) ? 0.55 : 0;

  if (pressureLatch >= QUINN_POLISH_TUNING.microTurn.threshold.pressureLatch) {
    return {
      ...MICRO_TURN_PROFILES.pressureLatch,
      score: pressureLatch,
    };
  }

  if (riffLatch >= QUINN_POLISH_TUNING.microTurn.threshold.riffLatch) {
    return {
      ...MICRO_TURN_PROFILES.riffLatch,
      score: riffLatch,
    };
  }

  if (emotionalBeat >= QUINN_POLISH_TUNING.microTurn.threshold.emotionalBeat) {
    return {
      ...MICRO_TURN_PROFILES.emotionalBeat,
      score: emotionalBeat,
    };
  }

  if (affirmingBeat >= QUINN_POLISH_TUNING.microTurn.threshold.affirmingBeat) {
    return {
      ...MICRO_TURN_PROFILES.affirmingBeat,
      score: affirmingBeat,
    };
  }

  return {
    ...MICRO_TURN_PROFILES.none,
    score: 0,
  };
}

function inferWarmth({
  conductor,
  packetText,
}: {
  conductor: QuinnConductorInference;
  packetText: string;
}) {
  const clean = cleanText(packetText).toLowerCase();
  const scores: Record<QuinnWarmthId, number> = {
    attentiveNeutral: 1,
    warmUnsentimental: 0,
    fond: 0,
    protective: 0,
    intimateClean: 0,
    caringExasperated: 0,
  };

  scores.warmUnsentimental += hasBlend(conductor.energyBlend, 'tenderSoft') ? 0.95 : 0;
  scores.warmUnsentimental += conductor.endingBlend.primary.id === 'softLanding' ? 0.45 : 0;
  scores.warmUnsentimental += conductor.finalAsk === 'noAsk' ? 0.2 : 0;

  scores.fond += hasBlend(conductor.textureBlend, 'affectionate') ? 1.15 : 0;
  scores.fond += conductor.finalMemoryExpression !== 'explicit' ? 0.2 : 0;
  scores.fond += /\b(?:love|miss|dear|sweet)\b/.test(clean) ? 0.4 : 0;

  scores.protective += hasBlend(conductor.energyBlend, 'tenderSoft') ? 0.55 : 0;
  scores.protective += conductor.structural.id !== 'none' ? 0.75 : 0;
  scores.protective += hasBlend(conductor.challengeBlend, 'lightChallenge') ? 0.35 : 0;
  scores.protective += hasBlend(conductor.challengeBlend, 'directChallenge') ? 0.25 : 0;

  scores.intimateClean += conductor.finalMemoryExpression === 'implicit' ? 0.55 : 0;
  scores.intimateClean += conductor.finalAsk === 'noAsk' ? 0.45 : 0;
  scores.intimateClean += hasBlend(conductor.textureBlend, 'affectionate') ? 0.2 : 0;
  scores.intimateClean += conductor.elasticity.id !== 'expanded' ? 0.2 : 0;

  scores.caringExasperated += hasBlend(conductor.textureBlend, 'exasperated') ? 1.05 : 0;
  scores.caringExasperated += hasBlend(conductor.energyBlend, 'tenderSoft') ? 0.45 : 0;
  scores.caringExasperated += hasBlend(conductor.textureBlend, 'affectionate') ? 0.3 : 0;

  const ordered = (Object.entries(scores) as [QuinnWarmthId, number][])
    .sort((a, b) => b[1] - a[1]);
  const [winnerId, winnerScore] = ordered[0];

  const threshold =
    winnerId === 'attentiveNeutral'
      ? 0
      : QUINN_POLISH_TUNING.warmth.threshold[winnerId];

  const id = winnerScore >= threshold ? winnerId : 'attentiveNeutral';

  return {
    ...WARMTH_PROFILES[id],
    score: scores[id],
  };
}

function inferAftertaste({
  conductor,
  signatureGuard,
  microTurn,
}: {
  conductor: QuinnConductorInference;
  signatureGuard: QuinnSignatureGuard;
  microTurn: QuinnMicroTurnProfile & {
    score: number;
  };
}) {
  const scores = {
    assistantResidue: 0,
    explanationResidue: 0,
    neatnessResidue: 0,
    questionResidue: 0,
    biteDeficit: 0,
    biteExcess: 0,
  };

  scores.assistantResidue += conductor.finalAsk !== 'noAsk' ? 0.7 : 0;
  scores.assistantResidue += conductor.endingBlend.primary.id === 'softLanding' ? 0.35 : 0;
  scores.assistantResidue += conductor.finalMemoryExpression !== 'implicit' ? 0.25 : 0;
  scores.assistantResidue += signatureGuard.id === 'high' ? 0.25 : 0;

  scores.explanationResidue += conductor.elasticity.id === 'expanded' ? 0.7 : 0;
  scores.explanationResidue += conductor.elasticity.id === 'medium' ? 0.35 : 0;
  scores.explanationResidue += conductor.riffBlend.primary.id === 'resolve' ? 0.45 : 0;
  scores.explanationResidue += conductor.structural.id === 'none' ? 0.25 : 0;

  scores.neatnessResidue += conductor.endingBlend.primary.id === 'softLanding' ? 0.65 : 0;
  scores.neatnessResidue += conductor.endingBlend.primary.id === 'nudge' ? 0.55 : 0;
  scores.neatnessResidue += conductor.finalAsk === 'optionalAsk' ? 0.35 : 0;
  scores.neatnessResidue += conductor.textureBlend.primary.id === 'steady' ? 0.15 : 0;

  scores.questionResidue += conductor.finalAsk === 'ask' ? 1.1 : 0;
  scores.questionResidue += conductor.finalAsk === 'optionalAsk' ? 0.55 : 0;
  scores.questionResidue += conductor.endingBlend.primary.id === 'open' ? 0.25 : 0;
  scores.questionResidue += microTurn.id !== 'none' && conductor.finalAsk !== 'noAsk' ? 0.35 : 0;

  scores.biteDeficit += conductor.structural.id === 'strongNotice' ? 0.55 : 0;
  scores.biteDeficit += hasBlend(conductor.challengeBlend, 'directChallenge') ? 0.3 : 0;
  scores.biteDeficit += conductor.challengeBlend.primary.id === 'neutral' ? 0.45 : 0;
  scores.biteDeficit += conductor.textureBlend.primary.id === 'steady' ? 0.2 : 0;

  scores.biteExcess += hasBlend(conductor.energyBlend, 'tenderSoft') ? 0.55 : 0;
  scores.biteExcess += conductor.challengeBlend.primary.id === 'directChallenge' ? 0.65 : 0;
  scores.biteExcess += hasBlend(conductor.textureBlend, 'blunt') ? 0.45 : 0;
  scores.biteExcess += conductor.endingBlend.primary.id === 'sharp' ? 0.3 : 0;

  const dominantResidue = (Object.entries(scores) as [keyof typeof scores, number][])
    .filter(([, value]) => value >= QUINN_POLISH_TUNING.aftertaste.threshold.watch)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

  const maxScore = Math.max(...Object.values(scores));
  const id =
    maxScore >= QUINN_POLISH_TUNING.aftertaste.threshold.intervene
      ? 'intervene'
      : maxScore >= QUINN_POLISH_TUNING.aftertaste.threshold.watch
        ? 'watch'
        : 'clean';

  const guardrails = [
    dominantResidue.includes('questionResidue')
      ? 'Do not let a question mark do the landing work.'
      : '',
    dominantResidue.includes('assistantResidue')
      ? 'Strip any assistant residue: no recap, no helpful coda, no neat sign-off.'
      : '',
    dominantResidue.includes('explanationResidue')
      ? 'Compress the explanation one notch. Trust the point sooner.'
      : '',
    dominantResidue.includes('neatnessResidue')
      ? 'Leave a little asymmetry. Do not polish the ending twice.'
      : '',
    dominantResidue.includes('biteDeficit')
      ? 'The reply can afford one notch more edge or plainness.'
      : '',
    dominantResidue.includes('biteExcess')
      ? 'Hold the edge one notch lower so it stays human.'
      : '',
  ].filter(Boolean);

  return {
    id,
    scores,
    dominantResidue,
    promptGuidance:
      guardrails.join(' ') ||
      'Aftertaste is clean. Keep the reply alive and human without over-tuning it.',
  } satisfies QuinnAftertasteInference;
}

function inferSurpriseAllowance({
  conductor,
  aftertaste,
  microTurn,
}: {
  conductor: QuinnConductorInference;
  aftertaste: QuinnAftertasteInference;
  microTurn: QuinnMicroTurnProfile & {
    score: number;
  };
}) {
  let highScore = 0;
  let mediumScore = 0.8;

  highScore += hasBlend(conductor.energyBlend, 'playfulRiffy') ? 0.65 : 0;
  highScore += hasBlend(conductor.textureBlend, 'amused') ? 0.65 : 0;
  highScore += hasBlend(conductor.textureBlend, 'sly') ? 0.55 : 0;
  highScore += hasBlend(conductor.textureBlend, 'ideaLocked') ? 0.6 : 0;
  highScore += conductor.riffBlend.primary.id !== 'resolve' ? 0.45 : 0;
  highScore += microTurn.id === 'riffLatch' || microTurn.id === 'pressureLatch' ? 0.35 : 0;
  highScore -= hasBlend(conductor.energyBlend, 'tenderSoft') ? 0.65 : 0;
  highScore -= aftertaste.id === 'intervene' ? 0.85 : 0;

  mediumScore += hasBlend(conductor.textureBlend, 'dry') ? 0.35 : 0;
  mediumScore += hasBlend(conductor.challengeBlend, 'lightChallenge') ? 0.35 : 0;
  mediumScore += conductor.finalAsk === 'noAsk' ? 0.2 : 0;
  mediumScore += aftertaste.id === 'clean' ? 0.25 : 0;

  const id =
    highScore >= QUINN_POLISH_TUNING.surprise.threshold.high
      ? 'high'
      : mediumScore >= QUINN_POLISH_TUNING.surprise.threshold.medium
        ? 'medium'
        : 'low';

  return {
    ...SURPRISE_PROFILES[id],
    score: id === 'high' ? highScore : mediumScore,
  };
}

export function inferQuinnPolishState({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}): QuinnPolishInference {
  const conductor = inferQuinnConductor({
    packetText,
    sessionArc,
    lensMode,
  });
  const microTurn = inferMicroTurn(packetText);
  const candidateFraming = inferCandidateFraming({
    conductor,
    packetText,
    microTurn: microTurn.id,
  });
  const signatureGuard = inferSignatureGuard(sessionArc, conductor);
  const warmth = inferWarmth({
    conductor,
    packetText,
  });
  const aftertaste = inferAftertaste({
    conductor,
    signatureGuard,
    microTurn,
  });
  const surpriseAllowance = inferSurpriseAllowance({
    conductor,
    aftertaste,
    microTurn,
  });

  const motifNames = conductor.motifs.map((motif) => MOTIF_LABELS[motif.id]).join(', ');

  return {
    conductor,
    candidateFraming,
    signatureGuard,
    aftertaste,
    warmth,
    microTurn,
    surpriseAllowance,
    promptGuidance: [
      `Candidate framing allowance: ${candidateFraming.label}. ${candidateFraming.promptGuidance}`,
      `Warmth profile: ${warmth.label}. ${warmth.promptGuidance}`,
      `Micro-turn handling: ${microTurn.label}. ${microTurn.promptGuidance}`,
      `Signature drift guard: ${signatureGuard.id}. ${signatureGuard.promptGuidance}`,
      `Aftertaste check: ${aftertaste.id}. ${aftertaste.promptGuidance}`,
      `Controlled unpredictability: ${surpriseAllowance.label}. ${surpriseAllowance.promptGuidance}`,
      conductor.correction.acknowledgmentStyle.id !== 'none'
        ? `Correction handling: ${conductor.correction.acknowledgmentStyle.id}. ${conductor.correction.acknowledgmentStyle.promptGuidance}`
        : 'No explicit correction beat is needed beyond the main reply motion.',
      conductor.motifs.length
        ? `Recurring motifs are present (${motifNames}). Let them inform the framing quietly, not as named literary analysis.`
        : 'No strong motif surfacing needed. Keep the reply natural instead of trying to make one.',
    ],
  };
}

export function buildQuinnPolishPacketContext({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}) {
  const polish = inferQuinnPolishState({
    packetText,
    sessionArc,
    lensMode,
  });

  return {
    polish,
    context: polish.promptGuidance.join(' '),
  };
}
