import type { SessionArc } from './quinnTypes';
import { inferQuinnChallengeStance } from './quinnChallengeState';
import { inferQuinnEndingStyle } from './quinnEndingState';
import { inferQuinnEnergyState } from './quinnEnergyState';
import { inferQuinnRiffStance } from './quinnRiffState';

export type QuinnAskStanceId = 'ask' | 'optionalAsk' | 'noAsk';

export type QuinnAskProfile = {
  id: QuinnAskStanceId;
  label: string;
  questionAllowance: string;
  endingBehavior: string;
  promptGuidance: string;
};

export type QuinnAskInference = QuinnAskProfile & {
  score: number;
  scores: Record<QuinnAskStanceId, number>;
};

export const QUINN_ASK_KEYWORDS = {
  continuation: [
    'stay in this with me',
    'keep going with me',
    'do you get what i mean',
    'do you see it too',
    "i'm trying to explain this",
    'talk me through',
    'bounce this with me',
    'help me think',
    'pressure test this',
  ],
  clarify: [
    'what am i missing',
    'which is it',
    'what part feels true',
    'what else is this',
    'or is it',
    'am i wrong',
    'is that crazy',
    'does that track',
    'does that make sense',
  ],
  resolve: [
    'what should i do',
    'what do i do',
    'what now',
    'help me',
    'can you help',
    'give me options',
    'give me a plan',
    'next step',
    'what would you do',
    'should i',
    'how do i',
  ],
  casual: [
    'just saying',
    'just needed to say that',
    'venting',
    'ugh',
    'lol',
    'lmao',
    'wild',
    'anyway',
  ],
  exploratory: [
    "it's like",
    'what if',
    'something about',
    'wait',
    'hold on',
    'no because',
    'pattern',
    'the shape of it',
  ],
} as const;

export const QUINN_ASK_TUNING = {
  threshold: {
    ask: 3.3,
    optionalAsk: 1.95,
  },
  shortMessageWordCount: 14,
  momentumCarryWeight: 0.18,
  explicitQuestionPenalty: 0.12,
} as const;

const ASK_PROFILES: Record<QuinnAskStanceId, QuinnAskProfile> = {
  ask: {
    id: 'ask',
    label: 'ask',
    questionAllowance: 'one precise question is welcome',
    endingBehavior: 'ask only if it genuinely deepens or clarifies',
    promptGuidance:
      'A question is justified here, but only if it is specific, alive, and genuinely useful. Ask one real question at most. Do not use a generic thread-extender.',
  },
  optionalAsk: {
    id: 'optionalAsk',
    label: 'optional ask',
    questionAllowance: 'question allowed but not default',
    endingBehavior: 'statement first; question only if it improves the exchange',
    promptGuidance:
      'You may ask one question if it clearly deepens the thought or resolves a real ambiguity, but do not default to it. If the point lands better as a statement, let it stay a statement.',
  },
  noAsk: {
    id: 'noAsk',
    label: 'no ask',
    questionAllowance: 'do not end in a question',
    endingBehavior: 'land the point and let the moment breathe',
    promptGuidance:
      'Do not end in a follow-up question. Let the line land, let the moment breathe, and do not use a question mark as conversational life-support.',
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
  const continuationCount = countKeywordMatches(clean, QUINN_ASK_KEYWORDS.continuation);
  const clarifyCount = countKeywordMatches(clean, QUINN_ASK_KEYWORDS.clarify);
  const resolveCount = countKeywordMatches(clean, QUINN_ASK_KEYWORDS.resolve);
  const casualCount = countKeywordMatches(clean, QUINN_ASK_KEYWORDS.casual);
  const exploratoryCount = countKeywordMatches(clean, QUINN_ASK_KEYWORDS.exploratory);
  const questionCount = countRegex(clean, /\?/g);
  const directQuestionOpeners = countRegex(
    clean,
    /\b(?:what do you think|how does that sound|am i wrong|do you see it too|does that track)\b/gi
  );

  const scores: Record<QuinnAskStanceId, number> = {
    ask: 0,
    optionalAsk: 0,
    noAsk: 1.1,
  };

  scores.ask += continuationCount * 0.85;
  scores.ask += clarifyCount * 0.9;
  scores.ask += directQuestionOpeners * 0.5;
  scores.ask += lensMode === 'interpretation' ? 0.2 : 0;
  scores.ask -= resolveCount * 0.4;
  scores.ask -= casualCount * 0.35;

  scores.optionalAsk += continuationCount * 0.45;
  scores.optionalAsk += clarifyCount * 0.35;
  scores.optionalAsk += exploratoryCount * 0.32;
  scores.optionalAsk += directQuestionOpeners * 0.25;
  scores.optionalAsk += lensMode === 'adaptive' || lensMode === 'interpretation' ? 0.25 : 0;
  scores.optionalAsk -= resolveCount * 0.2;

  scores.noAsk += resolveCount * 0.95;
  scores.noAsk += casualCount * 0.85;
  scores.noAsk += exploratoryCount > 0 && continuationCount === 0 ? 0.28 : 0;
  scores.noAsk += wordCount > 0 && wordCount <= QUINN_ASK_TUNING.shortMessageWordCount ? 0.22 : 0;
  scores.noAsk += questionCount * QUINN_ASK_TUNING.explicitQuestionPenalty;

  return scores;
}

function applyMomentumCarry(
  scores: Record<QuinnAskStanceId, number>,
  packetText: string,
  sessionArc: SessionArc | null | undefined,
  lensMode: string
) {
  const wordCount = cleanText(packetText).split(/\s+/).filter(Boolean).length;

  if (wordCount > QUINN_ASK_TUNING.shortMessageWordCount) {
    return scores;
  }

  const momentumText = buildMomentumText(sessionArc);

  if (!momentumText) {
    return scores;
  }

  const momentumScores = baseScoresFromText(momentumText, lensMode);

  return {
    ask: scores.ask + momentumScores.ask * QUINN_ASK_TUNING.momentumCarryWeight,
    optionalAsk:
      scores.optionalAsk + momentumScores.optionalAsk * QUINN_ASK_TUNING.momentumCarryWeight,
    noAsk: scores.noAsk + momentumScores.noAsk * QUINN_ASK_TUNING.momentumCarryWeight,
  };
}

function applyContextualSignals(
  scores: Record<QuinnAskStanceId, number>,
  packetText: string,
  sessionArc: SessionArc | null | undefined,
  lensMode: string
) {
  const ending = inferQuinnEndingStyle({
    packetText,
    sessionArc,
    lensMode,
  });
  const riff = inferQuinnRiffStance({
    packetText,
    sessionArc,
    lensMode,
  });
  const challenge = inferQuinnChallengeStance({
    packetText,
    sessionArc,
  });
  const energy = inferQuinnEnergyState({
    packetText,
    sessionArc,
  });

  const next = { ...scores };

  if (ending.id === 'sharp') {
    next.noAsk += 1.1;
    next.ask -= 0.35;
  }

  if (ending.id === 'cleanStop') {
    next.noAsk += 0.95;
    next.optionalAsk -= 0.2;
  }

  if (ending.id === 'nudge') {
    next.optionalAsk += 0.55;
    next.ask += 0.25;
  }

  if (ending.id === 'softLanding') {
    next.noAsk += 0.28;
    next.optionalAsk += 0.12;
  }

  if (ending.id === 'open') {
    next.optionalAsk += 0.4;
    next.noAsk += 0.22;
  }

  if (riff.id === 'resolve') {
    next.noAsk += 0.48;
  }

  if (riff.id === 'coBuild') {
    next.optionalAsk += 0.45;
  }

  if (riff.id === 'deepRiff') {
    next.optionalAsk += 0.3;
    next.noAsk += 0.24;
    next.ask -= 0.1;
  }

  if (challenge.id === 'lightChallenge') {
    next.noAsk += 0.45;
    next.ask -= 0.15;
  }

  if (challenge.id === 'directChallenge') {
    next.noAsk += 1.05;
    next.optionalAsk -= 0.2;
    next.ask -= 0.45;
  }

  if (energy.id === 'tenderSoft') {
    next.noAsk += 0.8;
    next.ask -= 0.22;
  }

  if (energy.id === 'sleepyLow') {
    next.noAsk += 0.52;
  }

  if (energy.id === 'rawBlunt') {
    next.noAsk += 0.7;
    next.ask -= 0.18;
  }

  if (energy.id === 'playfulRiffy') {
    next.optionalAsk += 0.28;
  }

  if (energy.id === 'hypedIntense') {
    next.optionalAsk += 0.18;
    next.noAsk += 0.18;
  }

  return next;
}

function pickAskStance(scores: Record<QuinnAskStanceId, number>) {
  if (scores.ask >= QUINN_ASK_TUNING.threshold.ask && scores.ask > scores.noAsk) {
    return {
      id: 'ask' as QuinnAskStanceId,
      score: scores.ask,
    };
  }

  if (
    scores.optionalAsk >= QUINN_ASK_TUNING.threshold.optionalAsk &&
    scores.optionalAsk > scores.noAsk - 0.2
  ) {
    return {
      id: 'optionalAsk' as QuinnAskStanceId,
      score: scores.optionalAsk,
    };
  }

  return {
    id: 'noAsk' as QuinnAskStanceId,
    score: scores.noAsk,
  };
}

export function inferQuinnAskStance({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}): QuinnAskInference {
  const baseScores = baseScoresFromText(packetText, lensMode);
  const momentumScores = applyMomentumCarry(baseScores, packetText, sessionArc, lensMode);
  const scores = applyContextualSignals(momentumScores, packetText, sessionArc, lensMode);
  const winner = pickAskStance(scores);
  const profile = ASK_PROFILES[winner.id];

  return {
    ...profile,
    score: winner.score,
    scores,
  };
}

export function buildQuinnAskPacketContext({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}) {
  const ask = inferQuinnAskStance({
    packetText,
    sessionArc,
    lensMode,
  });

  return {
    ask,
    context: [
      `Question policy: ${ask.label}.`,
      ask.promptGuidance,
      `Question allowance: ${ask.questionAllowance}. Ending behavior: ${ask.endingBehavior}.`,
    ].join(' '),
  };
}
