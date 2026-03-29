import type { SessionArc } from './quinnTypes';
import { inferQuinnConductor } from './quinnConductorState';
import { inferQuinnPolishState } from './quinnPolishState';

export type QuinnVoiceProsodyId =
  | 'neutralBalanced'
  | 'heldSoft'
  | 'tightFirm'
  | 'lightCurl'
  | 'magnetized'
  | 'settledWarm';

export type QuinnVoiceTtsHint = {
  profile: QuinnVoiceProsodyId;
  speed: number;
  pace: 'held' | 'balanced' | 'quick';
  landing: 'soft' | 'balanced' | 'firm';
  smoothness: 'smooth' | 'balanced' | 'crisp';
  contour: 'settled' | 'lightLift' | 'alive';
};

export type QuinnVoiceProsodyProfile = {
  id: QuinnVoiceProsodyId;
  label: string;
  pace: QuinnVoiceTtsHint['pace'];
  landing: QuinnVoiceTtsHint['landing'];
  smoothness: QuinnVoiceTtsHint['smoothness'];
  contour: QuinnVoiceTtsHint['contour'];
  speed: number;
  chunkMaxChars: number;
  firstChunkMaxChars: number;
  promptGuidance: string;
};

export type QuinnVoiceProsodyInference = QuinnVoiceProsodyProfile & {
  score: number;
  scores: Record<QuinnVoiceProsodyId, number>;
  ttsHint: QuinnVoiceTtsHint;
};

export const QUINN_VOICE_PROSODY_TUNING = {
  speed: {
    neutralBalanced: 1.04,
    heldSoft: 1.01,
    tightFirm: 1.06,
    lightCurl: 1.05,
    magnetized: 1.07,
    settledWarm: 1.02,
  },
  chunking: {
    neutralBalanced: { max: 205, first: 160 },
    heldSoft: { max: 220, first: 168 },
    tightFirm: { max: 188, first: 148 },
    lightCurl: { max: 210, first: 160 },
    magnetized: { max: 214, first: 156 },
    settledWarm: { max: 214, first: 166 },
  },
  threshold: {
    heldSoft: 1.8,
    tightFirm: 1.85,
    lightCurl: 1.85,
    magnetized: 2.2,
    settledWarm: 1.85,
  },
} as const;

const QUINN_VOICE_PROSODY_PROFILES: Record<QuinnVoiceProsodyId, Omit<QuinnVoiceProsodyProfile, 'score' | 'scores' | 'ttsHint'>> = {
  neutralBalanced: {
    id: 'neutralBalanced',
    label: 'neutral balanced',
    pace: 'balanced',
    landing: 'balanced',
    smoothness: 'balanced',
    contour: 'settled',
    speed: QUINN_VOICE_PROSODY_TUNING.speed.neutralBalanced,
    chunkMaxChars: QUINN_VOICE_PROSODY_TUNING.chunking.neutralBalanced.max,
    firstChunkMaxChars: QUINN_VOICE_PROSODY_TUNING.chunking.neutralBalanced.first,
    promptGuidance:
      'Keep the voice natural and stable. No extra directing beyond quiet Quinn baseline pacing.',
  },
  heldSoft: {
    id: 'heldSoft',
    label: 'held soft',
    pace: 'held',
    landing: 'soft',
    smoothness: 'smooth',
    contour: 'settled',
    speed: QUINN_VOICE_PROSODY_TUNING.speed.heldSoft,
    chunkMaxChars: QUINN_VOICE_PROSODY_TUNING.chunking.heldSoft.max,
    firstChunkMaxChars: QUINN_VOICE_PROSODY_TUNING.chunking.heldSoft.first,
    promptGuidance:
      'Let the cadence feel more held and smooth. Slightly slower, gently connected, with a softer landing.',
  },
  tightFirm: {
    id: 'tightFirm',
    label: 'tight firm',
    pace: 'quick',
    landing: 'firm',
    smoothness: 'crisp',
    contour: 'settled',
    speed: QUINN_VOICE_PROSODY_TUNING.speed.tightFirm,
    chunkMaxChars: QUINN_VOICE_PROSODY_TUNING.chunking.tightFirm.max,
    firstChunkMaxChars: QUINN_VOICE_PROSODY_TUNING.chunking.tightFirm.first,
    promptGuidance:
      'Keep the delivery tighter and firmer, with less glide and a cleaner stop on the last line.',
  },
  lightCurl: {
    id: 'lightCurl',
    label: 'light curl',
    pace: 'balanced',
    landing: 'balanced',
    smoothness: 'balanced',
    contour: 'lightLift',
    speed: QUINN_VOICE_PROSODY_TUNING.speed.lightCurl,
    chunkMaxChars: QUINN_VOICE_PROSODY_TUNING.chunking.lightCurl.max,
    firstChunkMaxChars: QUINN_VOICE_PROSODY_TUNING.chunking.lightCurl.first,
    promptGuidance:
      'Give the rhythm a lighter curl: a little more lift and nimbleness, never smug or sing-song.',
  },
  magnetized: {
    id: 'magnetized',
    label: 'magnetized',
    pace: 'quick',
    landing: 'balanced',
    smoothness: 'balanced',
    contour: 'alive',
    speed: QUINN_VOICE_PROSODY_TUNING.speed.magnetized,
    chunkMaxChars: QUINN_VOICE_PROSODY_TUNING.chunking.magnetized.max,
    firstChunkMaxChars: QUINN_VOICE_PROSODY_TUNING.chunking.magnetized.first,
    promptGuidance:
      'Let the delivery feel a little more magnetized by the idea: quicker, more alive, but still controlled.',
  },
  settledWarm: {
    id: 'settledWarm',
    label: 'settled warm',
    pace: 'held',
    landing: 'soft',
    smoothness: 'smooth',
    contour: 'settled',
    speed: QUINN_VOICE_PROSODY_TUNING.speed.settledWarm,
    chunkMaxChars: QUINN_VOICE_PROSODY_TUNING.chunking.settledWarm.max,
    firstChunkMaxChars: QUINN_VOICE_PROSODY_TUNING.chunking.settledWarm.first,
    promptGuidance:
      'Let the tone feel more familiar and settled. Warm without syrup, close without overperforming closeness.',
  },
};

function clampSpeed(value: number) {
  return Math.min(1.08, Math.max(0.98, Math.round(value * 100) / 100));
}

function pickWinningProfile(scores: Record<QuinnVoiceProsodyId, number>) {
  const ordered = (Object.entries(scores) as [QuinnVoiceProsodyId, number][])
    .sort((a, b) => b[1] - a[1]);
  const [winnerId, winnerScore] = ordered[0];

  if (!winnerId) {
    return {
      id: 'neutralBalanced' as QuinnVoiceProsodyId,
      score: 0,
    };
  }

  if (
    winnerId !== 'neutralBalanced' &&
    winnerScore < QUINN_VOICE_PROSODY_TUNING.threshold[winnerId]
  ) {
    return {
      id: 'neutralBalanced' as QuinnVoiceProsodyId,
      score: 0,
    };
  }

  return {
    id: winnerId,
    score: winnerScore,
  };
}

export function inferQuinnVoiceProsody({
  spokenText,
  stateSeedText = '',
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  spokenText: string;
  stateSeedText?: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}): QuinnVoiceProsodyInference {
  const seed = String(stateSeedText || spokenText || '').trim();
  const conductor = inferQuinnConductor({
    packetText: seed,
    sessionArc,
    lensMode,
  });
  const polish = inferQuinnPolishState({
    packetText: seed,
    sessionArc,
    lensMode,
  });

  const scores: Record<QuinnVoiceProsodyId, number> = {
    neutralBalanced: 1,
    heldSoft: 0,
    tightFirm: 0,
    lightCurl: 0,
    magnetized: 0,
    settledWarm: 0,
  };

  scores.heldSoft += conductor.energyBlend.primary.id === 'tenderSoft' ? 1.1 : 0;
  scores.heldSoft += conductor.endingBlend.primary.id === 'softLanding' ? 0.95 : 0;
  scores.heldSoft += conductor.endingBlend.secondary?.id === 'softLanding' ? 0.35 : 0;
  scores.heldSoft += polish.warmth.id === 'warmUnsentimental' ? 0.55 : 0;
  scores.heldSoft += polish.warmth.id === 'protective' ? 0.35 : 0;

  scores.tightFirm += conductor.textureBlend.primary.id === 'blunt' ? 1.05 : 0;
  scores.tightFirm += conductor.textureBlend.secondary?.id === 'blunt' ? 0.4 : 0;
  scores.tightFirm += conductor.challengeBlend.primary.id === 'directChallenge' ? 0.85 : 0;
  scores.tightFirm += conductor.endingBlend.primary.id === 'sharp' ? 0.75 : 0;
  scores.tightFirm += conductor.endingBlend.primary.id === 'cleanStop' ? 0.65 : 0;
  scores.tightFirm += conductor.finalAsk === 'noAsk' ? 0.2 : 0;

  scores.lightCurl += conductor.textureBlend.primary.id === 'amused' ? 0.8 : 0;
  scores.lightCurl += conductor.textureBlend.primary.id === 'sly' ? 0.95 : 0;
  scores.lightCurl += conductor.textureBlend.secondary?.id === 'amused' ? 0.3 : 0;
  scores.lightCurl += conductor.textureBlend.secondary?.id === 'sly' ? 0.35 : 0;
  scores.lightCurl += conductor.energyBlend.primary.id === 'playfulRiffy' ? 0.65 : 0;
  scores.lightCurl += polish.surpriseAllowance.id === 'medium' ? 0.2 : 0;

  scores.magnetized += conductor.textureBlend.primary.id === 'ideaLocked' ? 1.15 : 0;
  scores.magnetized += conductor.textureBlend.secondary?.id === 'ideaLocked' ? 0.4 : 0;
  scores.magnetized += conductor.riffBlend.primary.id === 'deepRiff' ? 1.1 : 0;
  scores.magnetized += conductor.riffBlend.primary.id === 'coBuild' ? 0.55 : 0;
  scores.magnetized += conductor.energyBlend.primary.id === 'hypedIntense' ? 0.45 : 0;
  scores.magnetized += polish.microTurn.id === 'riffLatch' ? 0.35 : 0;

  scores.settledWarm += conductor.textureBlend.primary.id === 'affectionate' ? 1.1 : 0;
  scores.settledWarm += conductor.textureBlend.secondary?.id === 'affectionate' ? 0.35 : 0;
  scores.settledWarm += conductor.finalMemoryExpression === 'implicit' ? 0.5 : 0;
  scores.settledWarm += polish.warmth.id === 'fond' ? 0.75 : 0;
  scores.settledWarm += polish.warmth.id === 'intimateClean' ? 0.85 : 0;
  scores.settledWarm += polish.warmth.id === 'warmUnsentimental' ? 0.45 : 0;

  const winner = pickWinningProfile(scores);
  const profile = QUINN_VOICE_PROSODY_PROFILES[winner.id];
  const ttsHint: QuinnVoiceTtsHint = {
    profile: profile.id,
    speed: clampSpeed(profile.speed),
    pace: profile.pace,
    landing: profile.landing,
    smoothness: profile.smoothness,
    contour: profile.contour,
  };

  return {
    ...profile,
    score: winner.score,
    scores,
    ttsHint,
  };
}

