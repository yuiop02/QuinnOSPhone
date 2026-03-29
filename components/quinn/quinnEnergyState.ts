import type { SessionArc } from './quinnTypes';

export type QuinnEnergyStateId =
  | 'steady'
  | 'sleepyLow'
  | 'hypedIntense'
  | 'playfulRiffy'
  | 'rawBlunt'
  | 'tenderSoft';

export type QuinnEnergyProfile = {
  id: QuinnEnergyStateId;
  label: string;
  cadence: string;
  sharpness: string;
  softness: string;
  humorDensity: string;
  directness: string;
  sentenceLength: string;
  promptGuidance: string;
};

export type QuinnEnergyInference = QuinnEnergyProfile & {
  score: number;
  scores: Record<QuinnEnergyStateId, number>;
};

export const QUINN_ENERGY_KEYWORDS = {
  sleepyLow: [
    'tired',
    'exhausted',
    'drained',
    'numb',
    'blank',
    'whatever',
    'idk',
    'i do not know',
    'meh',
    'detached',
    'low',
    'foggy',
  ],
  hypedIntense: [
    'spiral',
    'spiraling',
    'spiralling',
    'obsessed',
    'freaking',
    'freaking out',
    'losing it',
    'holy',
    'insane',
    'wtf',
    'what the hell',
    'what the fuck',
    'panic',
    'panicking',
  ],
  playfulRiffy: [
    'lol',
    'lmao',
    'haha',
    'wait',
    'okay but',
    'imagine',
    'bit',
    'funny',
    'wild',
    'chaotic',
    'ridiculous',
    'kinda iconic',
  ],
  rawBlunt: [
    'fuck',
    'fucking',
    'bullshit',
    'bitch',
    'hate',
    'shut up',
    'be real',
    'honestly',
    'brutal',
    'plainly',
    'straight up',
  ],
  tenderSoft: [
    'miss',
    'hurt',
    'ache',
    'gentle',
    'soft',
    'tender',
    'fragile',
    'quiet',
    'scared',
    'sad',
    'lonely',
    'wish',
  ],
} as const;

export const QUINN_ENERGY_TUNING = {
  threshold: {
    sleepyLow: 2.3,
    hypedIntense: 2.8,
    playfulRiffy: 2.6,
    rawBlunt: 2.4,
    tenderSoft: 2.5,
  },
  momentumCarryWeight: 0.28,
  shortMessageWordCount: 12,
} as const;

const ENERGY_PROFILES: Record<QuinnEnergyStateId, QuinnEnergyProfile> = {
  steady: {
    id: 'steady',
    label: 'steady / neutral',
    cadence: 'balanced and natural',
    sharpness: 'medium',
    softness: 'medium',
    humorDensity: 'light only if it fits',
    directness: 'medium',
    sentenceLength: 'mixed',
    promptGuidance:
      'Keep the baseline Quinn voice: natural, balanced, conversational, and alive. No extra performance.',
  },
  sleepyLow: {
    id: 'sleepyLow',
    label: 'sleepy / low / detached',
    cadence: 'quiet and clean',
    sharpness: 'low-to-medium',
    softness: 'medium',
    humorDensity: 'minimal',
    directness: 'clean but unpushed',
    sentenceLength: 'compact',
    promptGuidance:
      'Keep the same Quinn voice, but quiet it down: less performance, less sparkle, cleaner pacing, quieter precision, and no pushing.',
  },
  hypedIntense: {
    id: 'hypedIntense',
    label: 'hyped / intense / spiraling',
    cadence: 'tight and fast-moving',
    sharpness: 'high',
    softness: 'low-to-medium',
    humorDensity: 'low unless clearly playful',
    directness: 'high',
    sentenceLength: 'short to medium',
    promptGuidance:
      'Meet the speed of the thought without getting noisy: tighter steering, stronger pattern recognition, and higher signal density.',
  },
  playfulRiffy: {
    id: 'playfulRiffy',
    label: 'playful / riffy',
    cadence: 'nimble and build-with-me',
    sharpness: 'medium-to-high',
    softness: 'medium',
    humorDensity: 'playful and dry',
    directness: 'medium',
    sentenceLength: 'short to medium with fragments when they help',
    promptGuidance:
      'Stay sharp but looser: more associative thinking, a little more wit, quick turns, and permission for playful phrasing without losing coherence.',
  },
  rawBlunt: {
    id: 'rawBlunt',
    label: 'raw / blunt',
    cadence: 'plain and unsugared',
    sharpness: 'high',
    softness: 'low',
    humorDensity: 'very low',
    directness: 'high',
    sentenceLength: 'compact',
    promptGuidance:
      'Use cleaner directness and less cushioning. Name the thing plainly, but keep it human instead of brutal or performatively hard.',
  },
  tenderSoft: {
    id: 'tenderSoft',
    label: 'tender / softer',
    cadence: 'gentle and careful',
    sharpness: 'medium',
    softness: 'high',
    humorDensity: 'very light',
    directness: 'medium',
    sentenceLength: 'medium',
    promptGuidance:
      'Keep the same Quinn voice, but soften the cadence: gentler handling, less edge, cleaner emotional precision, and no sterile helpfulness.',
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
  const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const lineBreaks = countRegex(text, /\n/g);
  const exclamations = countRegex(text, /!/g);
  const questions = countRegex(text, /\?/g);
  const punctuationBursts = countRegex(text, /[!?]{2,}/g);
  const ellipses = countRegex(text, /\.\.\.|…/g);
  const allCapsWords = countRegex(text, /\b[A-Z]{3,}\b/g);
  const fragments = String(text || '')
    .split(/[\n.!?]+/)
    .map((part) => cleanText(part))
    .filter(Boolean)
    .filter((part) => part.split(/\s+/).length <= 4).length;

  const scores: Record<QuinnEnergyStateId, number> = {
    steady: 0,
    sleepyLow: 0,
    hypedIntense: 0,
    playfulRiffy: 0,
    rawBlunt: 0,
    tenderSoft: 0,
  };

  scores.sleepyLow += countKeywordMatches(clean, QUINN_ENERGY_KEYWORDS.sleepyLow) * 1.6;
  scores.sleepyLow += ellipses * 0.45;
  scores.sleepyLow += wordCount > 0 && wordCount <= QUINN_ENERGY_TUNING.shortMessageWordCount ? 0.55 : 0;
  scores.sleepyLow +=
    wordCount > 0 && wordCount <= 18 && exclamations === 0 && punctuationBursts === 0 ? 0.35 : 0;

  scores.hypedIntense += countKeywordMatches(clean, QUINN_ENERGY_KEYWORDS.hypedIntense) * 1.8;
  scores.hypedIntense += exclamations * 0.45;
  scores.hypedIntense += punctuationBursts * 0.8;
  scores.hypedIntense += allCapsWords * 0.8;
  scores.hypedIntense += lineBreaks >= 2 ? 0.45 : 0;
  scores.hypedIntense += fragments >= 3 ? 0.35 : 0;

  scores.playfulRiffy += countKeywordMatches(clean, QUINN_ENERGY_KEYWORDS.playfulRiffy) * 1.8;
  scores.playfulRiffy += punctuationBursts * 0.35;
  scores.playfulRiffy += questions >= 2 ? 0.35 : 0;
  scores.playfulRiffy += countRegex(clean, /\([^)]*\)/g) * 0.25;
  scores.playfulRiffy += countRegex(clean, /"/g) >= 2 ? 0.2 : 0;

  scores.rawBlunt += countKeywordMatches(clean, QUINN_ENERGY_KEYWORDS.rawBlunt) * 1.9;
  scores.rawBlunt += allCapsWords * 0.25;
  scores.rawBlunt += wordCount > 0 && wordCount <= 20 ? 0.35 : 0;
  scores.rawBlunt += countRegex(clean, /\bno\b|\bstop\b|\bjust\b/g) * 0.15;

  scores.tenderSoft += countKeywordMatches(clean, QUINN_ENERGY_KEYWORDS.tenderSoft) * 1.7;
  scores.tenderSoft += ellipses * 0.25;
  scores.tenderSoft += countRegex(clean, /\bi wish\b|\bi miss\b|\bi feel\b|\bi'm scared\b/gi) * 0.45;
  scores.tenderSoft += questions === 0 && exclamations === 0 && wordCount >= 8 ? 0.2 : 0;

  return scores;
}

function applyMomentumCarry(
  scores: Record<QuinnEnergyStateId, number>,
  packetText: string,
  sessionArc: SessionArc | null | undefined
) {
  const cleanPacket = cleanText(packetText);
  const packetWordCount = cleanPacket ? cleanPacket.split(/\s+/).filter(Boolean).length : 0;

  if (packetWordCount > QUINN_ENERGY_TUNING.shortMessageWordCount) {
    return scores;
  }

  const momentumText = buildMomentumText(sessionArc);

  if (!momentumText) {
    return scores;
  }

  const momentumScores = baseScoresFromText(momentumText);
  const nextScores = { ...scores };

  (Object.keys(momentumScores) as QuinnEnergyStateId[]).forEach((key) => {
    if (key === 'steady') {
      return;
    }

    nextScores[key] += momentumScores[key] * QUINN_ENERGY_TUNING.momentumCarryWeight;
  });

  return nextScores;
}

function pickEnergyState(scores: Record<QuinnEnergyStateId, number>) {
  const ordered = (Object.entries(scores) as [QuinnEnergyStateId, number][])
    .filter(([key]) => key !== 'steady')
    .sort((a, b) => b[1] - a[1]);

  const [winnerKey, winnerScore] = ordered[0] || ['steady', 0];

  if (
    winnerKey === 'steady' ||
    winnerScore < QUINN_ENERGY_TUNING.threshold[winnerKey]
  ) {
    return {
      id: 'steady' as QuinnEnergyStateId,
      score: 0,
    };
  }

  return {
    id: winnerKey,
    score: winnerScore,
  };
}

export function inferQuinnEnergyState({
  packetText,
  sessionArc = null,
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
}): QuinnEnergyInference {
  const baseScores = baseScoresFromText(packetText);
  const scores = applyMomentumCarry(baseScores, packetText, sessionArc);
  const winner = pickEnergyState(scores);
  const profile = ENERGY_PROFILES[winner.id];

  return {
    ...profile,
    score: winner.score,
    scores,
  };
}

export function buildQuinnEnergyPacketContext({
  packetText,
  sessionArc = null,
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
}) {
  const energy = inferQuinnEnergyState({
    packetText,
    sessionArc,
  });

  return {
    energy,
    context: [
      `Likely conversational texture: ${energy.label}.`,
      energy.promptGuidance,
      `Shape cadence (${energy.cadence}), sharpness (${energy.sharpness}), softness (${energy.softness}), humor density (${energy.humorDensity}), directness (${energy.directness}), and sentence length (${energy.sentenceLength}) around that texture without naming it back to the user.`,
      'Mirror energy with judgment, not obedience.',
    ].join(' '),
  };
}

export function getQuinnEnergyProfiles() {
  return ENERGY_PROFILES;
}
