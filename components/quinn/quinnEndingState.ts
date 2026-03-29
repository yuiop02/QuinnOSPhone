import type { SessionArc } from './quinnTypes';
import { inferQuinnChallengeStance } from './quinnChallengeState';
import { inferQuinnEnergyState } from './quinnEnergyState';

export type QuinnEndingStyleId =
  | 'open'
  | 'sharp'
  | 'nudge'
  | 'cleanStop'
  | 'softLanding';

export type QuinnEndingStyleProfile = {
  id: QuinnEndingStyleId;
  label: string;
  questionPolicy: string;
  landing: string;
  promptGuidance: string;
};

export type QuinnEndingStyleInference = QuinnEndingStyleProfile & {
  score: number;
  scores: Record<QuinnEndingStyleId, number>;
};

export const QUINN_ENDING_STYLE_TUNING = {
  threshold: {
    open: 1.8,
    sharp: 2.1,
    nudge: 2.35,
    cleanStop: 1.9,
    softLanding: 1.9,
  },
  compactWordCount: 32,
  explicitAskBoost: 1.35,
  reflectiveBoost: 0.9,
} as const;

const ENDING_PROFILES: Record<QuinnEndingStyleId, QuinnEndingStyleProfile> = {
  open: {
    id: 'open',
    label: 'open',
    questionPolicy: 'no reflex question',
    landing: 'leave some air in the room',
    promptGuidance:
      'Let the ending stay open. No recap, no moral, no thread-extender question unless it feels truly native to the moment.',
  },
  sharp: {
    id: 'sharp',
    label: 'sharp',
    questionPolicy: 'avoid questions',
    landing: 'end on the strongest observation',
    promptGuidance:
      'Let the strongest line land and stop there. No cushioning sentence after it.',
  },
  nudge: {
    id: 'nudge',
    label: 'nudge',
    questionPolicy: 'question only if it is the nudge',
    landing: 'one small directional push',
    promptGuidance:
      'End with one small directional push if it genuinely helps. Do not turn the ending into a plan, recap, or advice block.',
  },
  cleanStop: {
    id: 'cleanStop',
    label: 'clean stop',
    questionPolicy: 'no closing question',
    landing: 'stop because the point already landed',
    promptGuidance:
      'End cleanly and stop. No extra sentence just to make it feel complete.',
  },
  softLanding: {
    id: 'softLanding',
    label: 'soft landing',
    questionPolicy: 'use questions sparingly',
    landing: 'warm but unsentimental',
    promptGuidance:
      'End with warmth or gentleness if it fits, but without sounding like an assistant summary or polite sign-off.',
  },
};

function cleanText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function countRegex(text: string, pattern: RegExp) {
  return (text.match(pattern) || []).length;
}

function hasRegex(text: string, pattern: RegExp) {
  return pattern.test(text);
}

function baseScoresFromText(text: string, lensMode: string) {
  const clean = cleanText(text);
  const wordCount = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const explicitAdviceAsk = countRegex(
    clean,
    /\b(?:what do i do|what now|should i|how do i|help me|can you help|give me|options?|plan|next step|what would you do)\b/gi
  );
  const exploratorySignal = countRegex(
    clean,
    /\b(?:thinking out loud|just talking|just saying|venting|riffing|rambling|i keep thinking|i keep coming back|weirdly|honestly|trying to figure out)\b/gi
  );
  const questionCount = countRegex(clean, /\?/g);
  const ellipses = countRegex(clean, /\.\.\.|…/g);
  const directAsk = hasRegex(clean, /\b(?:can you|could you|would you|should i|what should|how should)\b/gi);
  const scores: Record<QuinnEndingStyleId, number> = {
    open: 0,
    sharp: 0,
    nudge: 0,
    cleanStop: 0,
    softLanding: 0,
  };

  scores.nudge += explicitAdviceAsk * QUINN_ENDING_STYLE_TUNING.explicitAskBoost;
  scores.nudge += directAsk ? 0.85 : 0;
  scores.nudge += lensMode === 'strategy' ? 1.05 : 0;
  scores.nudge += lensMode === 'writing' ? 0.3 : 0;

  scores.open += exploratorySignal * QUINN_ENDING_STYLE_TUNING.reflectiveBoost;
  scores.open += ellipses > 0 ? 0.35 : 0;
  scores.open += questionCount === 0 ? 0.2 : 0;

  scores.cleanStop += wordCount > 0 && wordCount <= QUINN_ENDING_STYLE_TUNING.compactWordCount ? 0.85 : 0;
  scores.cleanStop += explicitAdviceAsk === 0 ? 0.35 : 0;
  scores.cleanStop += questionCount === 0 ? 0.25 : 0;
  scores.cleanStop += lensMode === 'reality' ? 0.65 : 0;

  scores.softLanding += exploratorySignal > 0 ? 0.4 : 0;
  scores.softLanding += wordCount > QUINN_ENDING_STYLE_TUNING.compactWordCount ? 0.25 : 0;
  scores.softLanding += explicitAdviceAsk === 0 ? 0.2 : 0;

  scores.sharp += lensMode === 'reality' ? 0.8 : 0;
  scores.sharp += lensMode === 'read' ? 0.3 : 0;
  scores.sharp += wordCount <= QUINN_ENDING_STYLE_TUNING.compactWordCount ? 0.3 : 0;

  return scores;
}

function applyEnergyAndChallenge(
  scores: Record<QuinnEndingStyleId, number>,
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

  if (energy.id === 'sleepyLow') {
    next.open += 0.55;
    next.softLanding += 0.45;
    next.nudge -= 0.25;
  }

  if (energy.id === 'tenderSoft') {
    next.softLanding += 0.9;
    next.open += 0.25;
    next.sharp -= 0.25;
  }

  if (energy.id === 'playfulRiffy') {
    next.open += 0.55;
    next.cleanStop += 0.2;
  }

  if (energy.id === 'hypedIntense') {
    next.sharp += 0.45;
    next.cleanStop += 0.3;
    next.softLanding -= 0.2;
  }

  if (energy.id === 'rawBlunt') {
    next.sharp += 0.85;
    next.cleanStop += 0.45;
    next.softLanding -= 0.3;
  }

  if (challenge.id === 'lightChallenge') {
    next.sharp += 0.55;
    next.cleanStop += 0.2;
    next.softLanding -= 0.15;
  }

  if (challenge.id === 'directChallenge') {
    next.sharp += 1.15;
    next.cleanStop += 0.55;
    next.nudge -= 0.35;
    next.softLanding -= 0.35;
  }

  return next;
}

function pickEndingStyle(scores: Record<QuinnEndingStyleId, number>) {
  const ordered = (Object.entries(scores) as [QuinnEndingStyleId, number][])
    .sort((a, b) => b[1] - a[1]);

  const [winnerKey, winnerScore] = ordered[0];

  if (!winnerKey || winnerScore < QUINN_ENDING_STYLE_TUNING.threshold[winnerKey]) {
    return {
      id: 'cleanStop' as QuinnEndingStyleId,
      score: 0,
    };
  }

  return {
    id: winnerKey,
    score: winnerScore,
  };
}

export function inferQuinnEndingStyle({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}): QuinnEndingStyleInference {
  const baseScores = baseScoresFromText(packetText, lensMode);
  const scores = applyEnergyAndChallenge(baseScores, packetText, sessionArc);
  const winner = pickEndingStyle(scores);
  const profile = ENDING_PROFILES[winner.id];

  return {
    ...profile,
    score: winner.score,
    scores,
  };
}

export function buildQuinnEndingPacketContext({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}) {
  const ending = inferQuinnEndingStyle({
    packetText,
    sessionArc,
    lensMode,
  });

  return {
    ending,
    context: [
      `Preferred ending shape: ${ending.label}.`,
      ending.promptGuidance,
      `Question policy: ${ending.questionPolicy}. Landing feel: ${ending.landing}.`,
      'A reply does not need to sound finished. It needs to stop where the point actually lands.',
    ].join(' '),
  };
}

export function getQuinnEndingProfiles() {
  return ENDING_PROFILES;
}
