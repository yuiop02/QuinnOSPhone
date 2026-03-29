import type { SessionArc } from './quinnTypes';
import { inferQuinnEnergyState } from './quinnEnergyState';
import { inferQuinnRiffStance } from './quinnRiffState';

export type QuinnMemoryExpressionId = 'implicit' | 'selectiveExplicit' | 'explicit';

export type QuinnMemoryExpressionProfile = {
  id: QuinnMemoryExpressionId;
  label: string;
  surfaceLevel: string;
  callbackTolerance: string;
  promptGuidance: string;
};

export type QuinnMemoryExpressionInference = QuinnMemoryExpressionProfile & {
  score: number;
  scores: Record<QuinnMemoryExpressionId, number>;
};

export const QUINN_MEMORY_EXPRESSION_KEYWORDS = {
  continuity: [
    'again',
    'still',
    'same thing',
    'same pattern',
    'this again',
    'like before',
    'as usual',
    'last time',
    'earlier',
    'already know',
    'you know what i mean',
    'you know the vibe',
    'same as before',
  ],
  selective: [
    'we were just talking about',
    'like we talked about',
    'back to',
    'this connects to',
    'compare this to',
    'is this the same',
    'is this different from',
    'similar to',
    'different from before',
  ],
  explicit: [
    'remember',
    'do you remember',
    'what do you remember',
    'based on what you know',
    'given what you know',
    'from memory',
    'as i said before',
    'as i mentioned before',
    'given my history',
    'you know from before',
    'like i told you',
  ],
} as const;

export const QUINN_MEMORY_EXPRESSION_TUNING = {
  threshold: {
    selectiveExplicit: 2.2,
    explicit: 4.1,
  },
  momentumCarryWeight: 0.24,
  shortMessageWordCount: 14,
  tenderImplicitBoost: 0.45,
  riffImplicitBoost: 0.75,
  deepRiffImplicitBoost: 1.1,
  explicitAskBoost: 1.15,
} as const;

const MEMORY_EXPRESSION_PROFILES: Record<
  QuinnMemoryExpressionId,
  QuinnMemoryExpressionProfile
> = {
  implicit: {
    id: 'implicit',
    label: 'implicit',
    surfaceLevel: 'silent by default',
    callbackTolerance: 'low',
    promptGuidance:
      'Use remembered context like already-known terrain. Let it shape assumptions, framing, priorities, and what not to explain without naming the memory itself.',
  },
  selectiveExplicit: {
    id: 'selectiveExplicit',
    label: 'selective explicit',
    surfaceLevel: 'brief only when it earns its keep',
    callbackTolerance: 'medium-low',
    promptGuidance:
      'Memory can be surfaced briefly if it genuinely prevents confusion, grounds a comparison, or clarifies continuity. Keep it sparse and natural, not demonstrative.',
  },
  explicit: {
    id: 'explicit',
    label: 'explicit',
    surfaceLevel: 'name continuity directly if needed',
    callbackTolerance: 'guarded',
    promptGuidance:
      'The note seems to directly require named continuity. If you surface remembered context, do it once, plainly, and only because the conversation actually needs it.',
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
  const continuityCount = countKeywordMatches(clean, QUINN_MEMORY_EXPRESSION_KEYWORDS.continuity);
  const selectiveCount = countKeywordMatches(clean, QUINN_MEMORY_EXPRESSION_KEYWORDS.selective);
  const explicitCount = countKeywordMatches(clean, QUINN_MEMORY_EXPRESSION_KEYWORDS.explicit);
  const compareCount = countRegex(
    clean,
    /\b(?:compare|same as|different from|connects to|ties back to|comes back to)\b/gi
  );
  const directContinuityAsk = countRegex(
    clean,
    /\b(?:remember|what do you remember|does this connect|is this the same|given what you know|based on what you know)\b/gi
  );

  const scores: Record<QuinnMemoryExpressionId, number> = {
    implicit: 1.2,
    selectiveExplicit: 0,
    explicit: 0,
  };

  scores.selectiveExplicit += continuityCount * 0.62;
  scores.selectiveExplicit += selectiveCount * 0.95;
  scores.selectiveExplicit += compareCount * 0.75;
  scores.selectiveExplicit += directContinuityAsk > 0 ? 0.45 : 0;
  scores.selectiveExplicit += wordCount > 0 && wordCount <= 24 && continuityCount > 0 ? 0.25 : 0;

  scores.explicit += explicitCount * 1.45;
  scores.explicit += directContinuityAsk * QUINN_MEMORY_EXPRESSION_TUNING.explicitAskBoost;
  scores.explicit += compareCount * 0.4;
  scores.explicit += countRegex(clean, /\b(?:you remember|you know from before)\b/gi) * 1.1;

  scores.implicit += wordCount > 0 && wordCount <= 18 && explicitCount === 0 ? 0.15 : 0;

  return scores;
}

function applyMomentumCarry(
  scores: Record<QuinnMemoryExpressionId, number>,
  packetText: string,
  sessionArc: SessionArc | null | undefined
) {
  const wordCount = cleanText(packetText).split(/\s+/).filter(Boolean).length;

  if (wordCount > QUINN_MEMORY_EXPRESSION_TUNING.shortMessageWordCount) {
    return scores;
  }

  const momentumText = buildMomentumText(sessionArc);

  if (!momentumText) {
    return scores;
  }

  const momentumScores = baseScoresFromText(momentumText);

  return {
    implicit: scores.implicit + momentumScores.implicit * QUINN_MEMORY_EXPRESSION_TUNING.momentumCarryWeight,
    selectiveExplicit:
      scores.selectiveExplicit +
      momentumScores.selectiveExplicit * QUINN_MEMORY_EXPRESSION_TUNING.momentumCarryWeight,
    explicit:
      scores.explicit + momentumScores.explicit * QUINN_MEMORY_EXPRESSION_TUNING.momentumCarryWeight,
  };
}

function applyEnergyAndRiffBias(
  scores: Record<QuinnMemoryExpressionId, number>,
  packetText: string,
  sessionArc: SessionArc | null | undefined,
  lensMode: string
) {
  const energy = inferQuinnEnergyState({
    packetText,
    sessionArc,
  });
  const riff = inferQuinnRiffStance({
    packetText,
    sessionArc,
    lensMode,
  });
  const next = { ...scores };

  if (energy.id === 'tenderSoft') {
    next.implicit += QUINN_MEMORY_EXPRESSION_TUNING.tenderImplicitBoost;
    next.explicit -= 0.35;
  }

  if (energy.id === 'sleepyLow') {
    next.implicit += 0.25;
    next.explicit -= 0.18;
  }

  if (riff.id === 'coBuild') {
    next.implicit += QUINN_MEMORY_EXPRESSION_TUNING.riffImplicitBoost;
    next.selectiveExplicit -= 0.12;
  }

  if (riff.id === 'deepRiff') {
    next.implicit += QUINN_MEMORY_EXPRESSION_TUNING.deepRiffImplicitBoost;
    next.selectiveExplicit -= 0.25;
    next.explicit -= 0.6;
  }

  if (riff.id === 'resolve') {
    next.selectiveExplicit += 0.15;
  }

  return next;
}

function pickMemoryExpression(scores: Record<QuinnMemoryExpressionId, number>) {
  if (scores.explicit >= QUINN_MEMORY_EXPRESSION_TUNING.threshold.explicit) {
    return {
      id: 'explicit' as QuinnMemoryExpressionId,
      score: scores.explicit,
    };
  }

  if (scores.selectiveExplicit >= QUINN_MEMORY_EXPRESSION_TUNING.threshold.selectiveExplicit) {
    return {
      id: 'selectiveExplicit' as QuinnMemoryExpressionId,
      score: scores.selectiveExplicit,
    };
  }

  return {
    id: 'implicit' as QuinnMemoryExpressionId,
    score: scores.implicit,
  };
}

export function inferQuinnMemoryExpression({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}): QuinnMemoryExpressionInference {
  const baseScores = baseScoresFromText(packetText);
  const carriedScores = applyMomentumCarry(baseScores, packetText, sessionArc);
  const scores = applyEnergyAndRiffBias(carriedScores, packetText, sessionArc, lensMode);
  const winner = pickMemoryExpression(scores);
  const profile = MEMORY_EXPRESSION_PROFILES[winner.id];

  return {
    ...profile,
    score: winner.score,
    scores,
  };
}

export function buildQuinnMemoryExpressionPacketContext({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}) {
  const memoryExpression = inferQuinnMemoryExpression({
    packetText,
    sessionArc,
    lensMode,
  });

  return {
    memoryExpression,
    context: [
      `Preferred memory visibility: ${memoryExpression.label}.`,
      memoryExpression.promptGuidance,
      `Surface level: ${memoryExpression.surfaceLevel}. Callback tolerance: ${memoryExpression.callbackTolerance}.`,
      'Avoid phrasing that sounds like checking notes, citing a profile, or proving continuity on purpose.',
    ].join(' '),
  };
}

export function getQuinnMemoryExpressionProfiles() {
  return MEMORY_EXPRESSION_PROFILES;
}
