import type { SessionArc } from './quinnTypes';

export type QuinnCorrectionLatchId = 'none' | 'soft' | 'hard';
export type QuinnConstraintPriorityId = 'none' | 'elevated' | 'dominant';
export type QuinnRepeatGuardId = 'none' | 'avoidExact' | 'avoidNearRepeat';
export type QuinnClarificationOverrideId = 'none' | 'partial' | 'dominant';
export type QuinnPremiseChallengeId = 'none' | 'light' | 'strong';
export type QuinnRealityAnchorModeId = 'normal' | 'softenPersona' | 'repairFrame';
export type QuinnAssistantSelfClaimRiskId = 'none' | 'light' | 'strong';
export type QuinnFrameRejectionId = 'none' | 'light' | 'strong';
export type QuinnSocialFrameModeId = 'continue' | 'soften' | 'drop';
export type QuinnClarificationTypeId =
  | 'none'
  | 'reference'
  | 'subject'
  | 'meaning'
  | 'category'
  | 'tone';
export type QuinnAcknowledgmentStyleId = 'none' | 'briefPivot' | 'briefOwnIt';

type QuinnSignalPattern = {
  pattern: RegExp;
  label: string;
  score: number;
};

type QuinnClarificationPattern = QuinnSignalPattern & {
  clarificationType: Exclude<QuinnClarificationTypeId, 'none'>;
  replacementSummary: string;
};

type QuinnSignalBucket<T extends string> = {
  id: T;
  score: number;
  signals: string[];
  promptGuidance: string;
};

export type QuinnCorrectionInference = {
  correctionLatch: QuinnSignalBucket<QuinnCorrectionLatchId>;
  constraintPriority: QuinnSignalBucket<QuinnConstraintPriorityId>;
  repeatGuard: QuinnSignalBucket<QuinnRepeatGuardId> & {
    blockedRecentText: string;
  };
  frameRejection: QuinnSignalBucket<QuinnFrameRejectionId>;
  premiseChallenge: QuinnSignalBucket<QuinnPremiseChallengeId>;
  assistantSelfClaimRisk: QuinnSignalBucket<QuinnAssistantSelfClaimRiskId>;
  socialFrameMode: {
    id: QuinnSocialFrameModeId;
    promptGuidance: string;
  };
  userRequestsRealignment: boolean;
  suppressEscalatedBounceback: boolean;
  realityAnchorMode: {
    id: QuinnRealityAnchorModeId;
    promptGuidance: string;
  };
  suppressConcreteSelfStatus: boolean;
  clarificationOverride: QuinnSignalBucket<QuinnClarificationOverrideId> & {
    clarificationType: QuinnClarificationTypeId;
    interpretationReplacement: boolean;
    replacementSummary: string;
  };
  acknowledgmentStyle: {
    id: QuinnAcknowledgmentStyleId;
    promptGuidance: string;
  };
  invalidatedTargets: string[];
  promptGuidance: string[];
};

export const QUINN_CORRECTION_TUNING = {
  correctionLatch: {
    softThreshold: 1.05,
    hardThreshold: 2.05,
  },
  clarificationOverride: {
    partialThreshold: 0.95,
    dominantThreshold: 1.8,
    explicitReplacementBoost: 0.35,
    subjectReferenceBoost: 0.35,
  },
  premiseChallenge: {
    lightThreshold: 0.95,
    strongThreshold: 1.85,
    priorSelfClaimBoost: 0.45,
  },
  assistantSelfClaimRisk: {
    lightThreshold: 0.8,
    strongThreshold: 1.65,
  },
  frameRejection: {
    lightThreshold: 0.95,
    strongThreshold: 1.9,
    priorSocialFrameBoost: 0.45,
    realignmentBoost: 0.35,
  },
  constraintPriority: {
    elevatedThreshold: 1.1,
    dominantThreshold: 2.05,
    desireOverrideBoost: 0.7,
    correctionBoost: 0.45,
    iKnowButBoost: 0.95,
  },
  repeatGuard: {
    nearThreshold: 1.05,
    exactThreshold: 2.05,
    playfulSoftener: 0.25,
  },
  blockedRecentTextMaxLength: 92,
} as const;

const HARD_CORRECTION_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:that(?:'s| is) not the point|that misses the point)\b/i,
    label: 'user says the previous framing missed the point',
    score: 1.25,
  },
  {
    pattern: /\byou missed(?: what i(?:'m| am) saying| the point)?\b/i,
    label: 'user says the reply missed what they meant',
    score: 1.15,
  },
  {
    pattern:
      /\b(?:that(?:'s| is)\s+(?:definitely\s+|really\s+|clearly\s+|just\s+)?not what i meant|that(?:'s| is)\s+(?:definitely\s+|really\s+|clearly\s+|just\s+)?not what i was saying)\b/i,
    label: 'user rejects the previous interpretation',
    score: 1.25,
  },
  {
    pattern: /\bno,\s*(?:the )?(?:issue|point|problem|thing)\s+(?:is|was)\b/i,
    label: 'user replaces the current frame with a different issue',
    score: 1.15,
  },
  {
    pattern: /\bnot that[, ]+(?:this|the|it)\b/i,
    label: 'user explicitly redirects away from the previous target',
    score: 1.2,
  },
];

const STRONG_PREMISE_CHALLENGE_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:you(?:'re| are)\s+(?:not real|not a real person|not even real|just part of (?:an|the) app|an app(?: that i made)?|part of (?:an|the) app)|if you(?:'re| are) not (?:real|a real person|human)|how (?:are|do) you(?: even)?[\s\S]{0,80}\bif\b[\s\S]{0,80}\b(?:not real|not even real|an app|not a real person))\b/i,
    label: "user directly questions Quinn's literal reality or premise",
    score: 1.45,
  },
  {
    pattern:
      /\b(?:how (?:are|do) you(?: even)? have\b|how are you so\b|how do you have those things\b)[\s\S]{0,80}\b(?:if you(?:'re| are) not|when you(?:'re| are) not)\b/i,
    label: "user says Quinn's self-claim does not make literal sense",
    score: 1.2,
  },
];

const LIGHT_PREMISE_CHALLENGE_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:not real|not a real person|not even real|just an app|part of an app|inside an app|in an app that i made)\b/i,
    label: "user is pushing on Quinn's literal reality",
    score: 0.85,
  },
  {
    pattern:
      /\b(?:that(?:'s| is) not literal|not literally|bit outrunning the truth|that doesn't make sense if you're not real)\b/i,
    label: 'user says the bit is outrunning the truth',
    score: 0.8,
  },
];

const STRONG_ASSISTANT_SELF_CLAIM_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:deadline|vendor|meeting|calendar|schedule|inbox|commute|rent|landlord|boss|shift|errand|vendor ghosted|deadline tomorrow)\b/i,
    label: 'the prior Quinn reply leaned on concrete offscreen logistics',
    score: 1.05,
  },
  {
    pattern:
      /\b(?:i(?:'m| am)\s+(?:slammed|swamped|buried|running behind|late|fried|exhausted|busy|scattered|caffeinated)|coffee(?:'s| is)\s+doing)\b/i,
    label: 'the prior Quinn reply used a human self-status frame',
    score: 0.95,
  },
];

const LIGHT_ASSISTANT_SELF_CLAIM_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:my (?:day|week|life|calendar|schedule|inbox)|breakfast|lunch|dinner|coffee|vendor|deadline|calendar|schedule|swamped|slammed|busy)\b/i,
    label: 'the prior Quinn reply carried everyday-life detail as if it were literal',
    score: 0.7,
  },
];

const STRONG_FRAME_REJECTION_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:i (?:wasn['’]?t|was not) (?:calling to do|doing|on) (?:that|none of that)|i(?:'m| am) not (?:doing|on) (?:that|none of that)|that(?:'s| is) not what this is)\b/i,
    label: 'user explicitly rejects the social frame Quinn just imposed',
    score: 1.35,
  },
  {
    pattern:
      /\b(?:i was testing (?:the )?app|just testing (?:the )?app|i(?:'m| am) testing (?:the )?app)\b/i,
    label: 'user says this is app testing, not the social bit Quinn assumed',
    score: 1.2,
  },
  {
    pattern: /\b(?:be (?:so )?for real|be real|be serious)\b/i,
    label: 'user asks Quinn to drop the bit and be real',
    score: 1.2,
  },
  {
    pattern:
      /\b(?:i(?:'m| am) not flirting|not flirting|i(?:'m| am) not (?:trying to )?(?:start|do) anything|i(?:'m| am) not trying to flirt)\b/i,
    label: 'user rejects a flirt or trouble reading',
    score: 1.2,
  },
];

const LIGHT_FRAME_REJECTION_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:all i said was|all i did was)\b/i,
    label: 'user says Quinn overread a small opener',
    score: 0.95,
  },
  {
    pattern:
      /\b(?:why are you being rude|why are you so rude|i wasn['’]?t calling to do all that|not like that|not that deep)\b/i,
    label: 'user pushes back on Quinn escalating the tone read',
    score: 0.9,
  },
  {
    pattern: /\b(?:dial it back|easy|relax)\b/i,
    label: 'user asks Quinn to de-escalate the posture',
    score: 0.7,
  },
];

const STRONG_ASSISTANT_SOCIAL_FRAME_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:calling to flirt|calling to confess|calling to cause trouble|flirt|confess|cause trouble|stirring the pot|actually useful)\b/i,
    label: 'the prior Quinn reply pushed a spicy social read',
    score: 1.15,
  },
  {
    pattern:
      /\b(?:mildly dangerous|low on patience|you[—-]\s*(?:stirring the pot|actually useful))\b/i,
    label: 'the prior Quinn reply sharpened the attitude posture',
    score: 0.95,
  },
];

const LIGHT_ASSISTANT_SOCIAL_FRAME_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:trouble|attitude|useful|dangerous|confession|flirting)\b/i,
    label: 'the prior Quinn reply carried a social-frame read',
    score: 0.55,
  },
];

const SOFT_CORRECTION_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:i know|yeah|yes|right|true|okay|ok|fair),?\s+but\b/i,
    label: 'user says the previous reply still did not resolve the blocker',
    score: 0.9,
  },
  {
    pattern: /\b(?:that|this) (?:doesn't|does not) help\b/i,
    label: 'user says the previous move did not help',
    score: 0.95,
  },
  {
    pattern: /\bnot (?:really|quite)\b/i,
    label: 'user lightly rejects the prior framing',
    score: 0.45,
  },
  {
    pattern: /\b(?:wait|hold on|no because)\b/i,
    label: 'user is trying to hinge or correct the thought',
    score: 0.55,
  },
  {
    pattern: /\bthat(?:'s| was)\s+(?:kind of |a little |pretty |a bit )?(?:rude|harsh|mean|aggressive|out of pocket)\b/i,
    label: 'user says the last reply landed too harshly',
    score: 1.05,
  },
  {
    pattern: /\b(?:came|coming) for (?:my throat|me)\b/i,
    label: 'user says the last reply felt like an attack',
    score: 1.15,
  },
  {
    pattern: /\b(?:why are you coming for me|easy there|dial it back)\b/i,
    label: 'user objects to the tone of the last reply',
    score: 1,
  },
];

const DOMINANT_CLARIFICATION_PATTERNS: readonly QuinnClarificationPattern[] = [
  {
    pattern:
      /\b(?:i (?:used|was using|meant))\b[\s\S]{0,90}\b(?:as|like)\b[\s\S]{0,90}\b(?:a |an )?(?:nickname|pet name|term of endearment|way of referring to you|way i was referring to you|way i was talking to you)\b/i,
    label: 'user says the disputed phrase was a nickname or way of referring to Quinn',
    score: 1.55,
    clarificationType: 'reference',
    replacementSummary:
      'Treat the disputed phrase as a nickname or way of addressing Quinn, not as the topic itself.',
  },
  {
    pattern:
      /\b(?:the )?subject\b[\s,:-]{0,20}\byou\b|\b(?:i meant you|i was talking to you|i was saying hi to you)\b/i,
    label: 'user says Quinn was the subject or addressee',
    score: 1.25,
    clarificationType: 'subject',
    replacementSummary:
      'Treat Quinn as the subject or addressee of the phrase, not as an external topic guess.',
  },
  {
    pattern:
      /\bnot as\b[\s\S]{0,60}\b(?:the )?(?:topic|genre|music|category|label)\b[\s\S]{0,60}\bbut as\b/i,
    label: 'user replaces a topical or category reading with a different meaning',
    score: 1.35,
    clarificationType: 'category',
    replacementSummary:
      'Drop the earlier category or topic reading. Use the corrected sense the user just supplied instead.',
  },
];

const PARTIAL_CLARIFICATION_PATTERNS: readonly QuinnClarificationPattern[] = [
  {
    pattern: /\bi meant\b[\s\S]{0,70}\bas\b/i,
    label: 'user is explicitly restating the intended meaning',
    score: 1.05,
    clarificationType: 'meaning',
    replacementSummary:
      'The user is explicitly restating what they meant. Answer from that clarified meaning.',
  },
  {
    pattern: /\bi was using\b[\s\S]{0,70}\bas\b/i,
    label: 'user is explaining how the disputed term was being used',
    score: 1.05,
    clarificationType: 'meaning',
    replacementSummary:
      'The user is explaining how the disputed term was being used. Trust that intended sense over the earlier guess.',
  },
  {
    pattern: /\b(?:not what i meant by|what i meant by)\b/i,
    label: 'user is clarifying the meaning of a specific phrase',
    score: 0.95,
    clarificationType: 'meaning',
    replacementSummary:
      'A phrase-level meaning clarification is active. Drop the older interpretation and use the corrected one.',
  },
  {
    pattern: /\bnot as\b[\s\S]{0,60}\bbut as\b/i,
    label: 'user contrasts the old interpretation with the intended one',
    score: 1.1,
    clarificationType: 'meaning',
    replacementSummary:
      'The user contrasted the old interpretation with the intended one. Use the intended meaning now.',
  },
  {
    pattern:
      /\b(?:referring to you|calling you|addressing you|using that for you|used that for you)\b/i,
    label: 'user says the phrase was directed at Quinn',
    score: 1.05,
    clarificationType: 'reference',
    replacementSummary:
      'Treat the phrase as directed at Quinn, not as a topic or category under discussion.',
  },
];

const DOMINANT_CONSTRAINT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:can't|cannot) afford\b|\b(?:don't|do not) have enough money\b|\bno money\b/i,
    label: 'money is the blocker',
    score: 1.45,
  },
  {
    pattern: /\b(?:can't|cannot) (?:do|go|make|swing|have|get|buy|pull off) that\b/i,
    label: 'the user says the thing is not doable',
    score: 1.2,
  },
  {
    pattern: /\b(?:won't work|doesn't work|not possible|isn't possible)\b/i,
    label: 'the current idea is not feasible',
    score: 1.2,
  },
  {
    pattern: /\b(?:no time|not enough time|blocked|blocker|constraint|limitation)\b/i,
    label: 'a practical blocker is now active',
    score: 0.95,
  },
];

const ELEVATED_CONSTRAINT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:can't|cannot|won't|wouldn't)\b/i,
    label: 'the user says they cannot do the thing',
    score: 0.6,
  },
  {
    pattern: /\b(?:don't|do not) have\b|\bnot enough\b/i,
    label: 'the user lacks something needed for the earlier move',
    score: 0.55,
  },
  {
    pattern: /\b(?:too expensive|too far|too late|stuck)\b/i,
    label: 'a practical limit is present',
    score: 0.7,
  },
];

const EXACT_REPEAT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\byou already told (?:me )?that joke\b/i,
    label: 'user says the same joke was reused',
    score: 1.55,
  },
  {
    pattern: /\byou (?:already|just) said that\b/i,
    label: 'user says the same line was reused',
    score: 1.45,
  },
  {
    pattern: /\b(?:same exact thing|same exact joke|same joke)\b/i,
    label: 'user says the repetition is exact',
    score: 1.25,
  },
];

const NEAR_REPEAT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern: /\b(?:already told|already said|repeat(?:ing)?|reused)\b/i,
    label: 'user calls out repetition',
    score: 0.9,
  },
  {
    pattern: /\b(?:same thing|same line|same answer|heard that one|again)\b/i,
    label: 'user says this feels like the same move again',
    score: 0.65,
  },
];

const DESIRE_PATTERNS: readonly RegExp[] = [
  /\b(?:i want|want one|want it|would love|i(?:'d| would) love|wish i could|sounds good)\b/i,
];

const REPEAT_OBJECT_PATTERNS: readonly RegExp[] = [
  /\bjoke\b/i,
  /\bline\b/i,
  /\banswer\b/i,
  /\bthing\b/i,
];

function cleanText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function clipText(value: string, maxLength = QUINN_CORRECTION_TUNING.blockedRecentTextMaxLength) {
  const clean = cleanText(value);

  if (!clean) {
    return '';
  }

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength - 3).trim()}...`;
}

function buildRecentBeatText(sessionArc: SessionArc | null | undefined) {
  return Array.isArray(sessionArc?.beats)
    ? sessionArc.beats
        .slice(-2)
        .map((beat) => cleanText(beat.summary))
        .filter(Boolean)
        .join(' ')
    : '';
}

function getLatestBeatSummary(sessionArc: SessionArc | null | undefined) {
  const latestBeat = Array.isArray(sessionArc?.beats)
    ? sessionArc.beats[sessionArc.beats.length - 1]
    : null;

  return clipText(latestBeat?.summary || '');
}

function collectPatternHits(text: string, patterns: readonly QuinnSignalPattern[]) {
  let score = 0;
  const signals: string[] = [];

  for (const { pattern, label, score: weight } of patterns) {
    if (!pattern.test(text)) {
      continue;
    }

    score += weight;
    signals.push(label);
  }

  return {
    score,
    signals,
  };
}

function collectClarificationHits(
  text: string,
  patterns: readonly QuinnClarificationPattern[]
) {
  let score = 0;
  const signals: string[] = [];
  const hits: QuinnClarificationPattern[] = [];

  for (const pattern of patterns) {
    if (!pattern.pattern.test(text)) {
      continue;
    }

    score += pattern.score;
    signals.push(pattern.label);
    hits.push(pattern);
  }

  return {
    score,
    signals,
    hits,
  };
}

function hasAnyPattern(text: string, patterns: readonly RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function uniqueItems(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

export function inferQuinnCorrectionState({
  packetText,
  sessionArc = null,
  previousAssistantReply = '',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  previousAssistantReply?: string;
}): QuinnCorrectionInference {
  const clean = cleanText(packetText);
  const lower = clean.toLowerCase();
  const momentumText = buildRecentBeatText(sessionArc).toLowerCase();
  const previousAssistantText = cleanText(previousAssistantReply).toLowerCase();
  const selfClaimSourceText = [previousAssistantText, momentumText].filter(Boolean).join(' ');
  const blockedRecentText = getLatestBeatSummary(sessionArc);
  const playfulMarkerPresent = /\b(?:lol|lmao|haha|hehe)\b/i.test(clean);

  const hardCorrection = collectPatternHits(lower, HARD_CORRECTION_PATTERNS);
  const softCorrection = collectPatternHits(lower, SOFT_CORRECTION_PATTERNS);
  const dominantConstraint = collectPatternHits(lower, DOMINANT_CONSTRAINT_PATTERNS);
  const elevatedConstraint = collectPatternHits(lower, ELEVATED_CONSTRAINT_PATTERNS);
  const exactRepeat = collectPatternHits(lower, EXACT_REPEAT_PATTERNS);
  const nearRepeat = collectPatternHits(lower, NEAR_REPEAT_PATTERNS);
  const dominantClarification = collectClarificationHits(
    clean,
    DOMINANT_CLARIFICATION_PATTERNS
  );
  const partialClarification = collectClarificationHits(
    clean,
    PARTIAL_CLARIFICATION_PATTERNS
  );
  const strongPremiseChallenge = collectPatternHits(lower, STRONG_PREMISE_CHALLENGE_PATTERNS);
  const lightPremiseChallenge = collectPatternHits(lower, LIGHT_PREMISE_CHALLENGE_PATTERNS);
  const strongFrameRejection = collectPatternHits(lower, STRONG_FRAME_REJECTION_PATTERNS);
  const lightFrameRejection = collectPatternHits(lower, LIGHT_FRAME_REJECTION_PATTERNS);
  const strongAssistantSelfClaim = collectPatternHits(
    selfClaimSourceText,
    STRONG_ASSISTANT_SELF_CLAIM_PATTERNS
  );
  const lightAssistantSelfClaim = collectPatternHits(
    selfClaimSourceText,
    LIGHT_ASSISTANT_SELF_CLAIM_PATTERNS
  );
  const strongAssistantSocialFrame = collectPatternHits(
    selfClaimSourceText,
    STRONG_ASSISTANT_SOCIAL_FRAME_PATTERNS
  );
  const lightAssistantSocialFrame = collectPatternHits(
    selfClaimSourceText,
    LIGHT_ASSISTANT_SOCIAL_FRAME_PATTERNS
  );
  const clarificationHits = [
    ...dominantClarification.hits,
    ...partialClarification.hits,
  ].sort((a, b) => b.score - a.score);
  const topClarificationHit = clarificationHits[0] || null;

  const desireActive = hasAnyPattern(lower, DESIRE_PATTERNS) || hasAnyPattern(momentumText, DESIRE_PATTERNS);
  const iKnowButActive = /\b(?:i know|yeah|yes|right|true|okay|ok),?\s+but\b/i.test(clean);
  const clarificationScore =
    dominantClarification.score +
    partialClarification.score +
    (hardCorrection.score > 0 && clarificationHits.length
      ? QUINN_CORRECTION_TUNING.clarificationOverride.explicitReplacementBoost
      : 0) +
    (topClarificationHit &&
    (topClarificationHit.clarificationType === 'reference' ||
      topClarificationHit.clarificationType === 'subject')
      ? QUINN_CORRECTION_TUNING.clarificationOverride.subjectReferenceBoost
      : 0);
  const clarificationOverrideId: QuinnClarificationOverrideId =
    clarificationScore >= QUINN_CORRECTION_TUNING.clarificationOverride.dominantThreshold
      ? 'dominant'
      : clarificationScore >=
            QUINN_CORRECTION_TUNING.clarificationOverride.partialThreshold
        ? 'partial'
        : 'none';
  const interpretationReplacement =
    clarificationOverrideId === 'dominant' ||
    /\bi meant\b[\s\S]{0,70}\bnot\b/i.test(clean) ||
    /\bnot as\b[\s\S]{0,60}\bbut as\b/i.test(clean);
  const clarificationType = topClarificationHit?.clarificationType || 'none';
  const replacementSummary =
    clarificationOverrideId !== 'none'
      ? topClarificationHit?.replacementSummary ||
        'The user explicitly clarified what they meant. Replace the older interpretation with that clarified meaning.'
      : '';
  const assistantSelfClaimScore =
    strongAssistantSelfClaim.score + lightAssistantSelfClaim.score;
  const assistantSelfClaimRiskId: QuinnAssistantSelfClaimRiskId =
    assistantSelfClaimScore >= QUINN_CORRECTION_TUNING.assistantSelfClaimRisk.strongThreshold
      ? 'strong'
      : assistantSelfClaimScore >=
            QUINN_CORRECTION_TUNING.assistantSelfClaimRisk.lightThreshold
        ? 'light'
        : 'none';
  const premiseChallengeScore =
    strongPremiseChallenge.score +
    lightPremiseChallenge.score +
    ((strongPremiseChallenge.score > 0 || lightPremiseChallenge.score > 0) &&
    assistantSelfClaimRiskId !== 'none'
      ? QUINN_CORRECTION_TUNING.premiseChallenge.priorSelfClaimBoost
      : 0);
  const premiseChallengeId: QuinnPremiseChallengeId =
    premiseChallengeScore >= QUINN_CORRECTION_TUNING.premiseChallenge.strongThreshold
      ? 'strong'
      : premiseChallengeScore >= QUINN_CORRECTION_TUNING.premiseChallenge.lightThreshold
        ? 'light'
        : 'none';
  const assistantSocialFrameScore =
    strongAssistantSocialFrame.score + lightAssistantSocialFrame.score;
  const userRequestsRealignment =
    /\b(?:be (?:so )?for real|be real|be serious|i was testing (?:the )?app|just testing (?:the )?app|all i said was|that(?:'s| is) not what this is)\b/i.test(
      clean
    );
  const frameRejectionScore =
    strongFrameRejection.score +
    lightFrameRejection.score +
    ((strongFrameRejection.score > 0 || lightFrameRejection.score > 0) &&
    assistantSocialFrameScore > 0
      ? QUINN_CORRECTION_TUNING.frameRejection.priorSocialFrameBoost
      : 0) +
    (userRequestsRealignment
      ? QUINN_CORRECTION_TUNING.frameRejection.realignmentBoost
      : 0);
  const frameRejectionId: QuinnFrameRejectionId =
    frameRejectionScore >= QUINN_CORRECTION_TUNING.frameRejection.strongThreshold
      ? 'strong'
      : frameRejectionScore >= QUINN_CORRECTION_TUNING.frameRejection.lightThreshold
        ? 'light'
        : 'none';
  const socialFrameModeId: QuinnSocialFrameModeId =
    frameRejectionId === 'strong'
      ? 'drop'
      : frameRejectionId === 'light'
        ? 'soften'
        : 'continue';
  const suppressEscalatedBounceback =
    frameRejectionId !== 'none' &&
    (assistantSocialFrameScore > 0 || userRequestsRealignment);
  const realityAnchorModeId: QuinnRealityAnchorModeId =
    premiseChallengeId === 'strong'
      ? 'repairFrame'
      : premiseChallengeId === 'light'
        ? assistantSelfClaimRiskId === 'strong'
          ? 'repairFrame'
          : 'softenPersona'
        : 'normal';
  const suppressConcreteSelfStatus =
    premiseChallengeId !== 'none' && assistantSelfClaimRiskId !== 'none';

  const dominantConstraintScore =
    dominantConstraint.score +
    (desireActive ? QUINN_CORRECTION_TUNING.constraintPriority.desireOverrideBoost : 0) +
    (iKnowButActive ? QUINN_CORRECTION_TUNING.constraintPriority.iKnowButBoost : 0) +
    (hardCorrection.score > 0 || softCorrection.score > 0
      ? QUINN_CORRECTION_TUNING.constraintPriority.correctionBoost
      : 0);
  const elevatedConstraintScore =
    elevatedConstraint.score +
    (desireActive ? QUINN_CORRECTION_TUNING.constraintPriority.desireOverrideBoost * 0.5 : 0);
  const exactRepeatScore = exactRepeat.score;
  const nearRepeatScore =
    nearRepeat.score - (playfulMarkerPresent && exactRepeat.score === 0 ? QUINN_CORRECTION_TUNING.repeatGuard.playfulSoftener : 0);

  const correctionLatchScore =
    hardCorrection.score +
    softCorrection.score +
    (exactRepeatScore >= QUINN_CORRECTION_TUNING.repeatGuard.exactThreshold ? 0.45 : 0) +
    (frameRejectionId === 'strong'
      ? 0.9
      : frameRejectionId === 'light'
        ? 0.35
        : 0) +
    (clarificationOverrideId === 'dominant'
      ? 0.9
      : clarificationOverrideId === 'partial'
        ? 0.35
        : 0) +
    (premiseChallengeId === 'strong'
      ? 0.9
      : premiseChallengeId === 'light'
        ? 0.35
        : 0);

  const correctionLatchId: QuinnCorrectionLatchId =
    clarificationOverrideId === 'dominant' ||
    frameRejectionId === 'strong' ||
    premiseChallengeId === 'strong' ||
    exactRepeatScore >= QUINN_CORRECTION_TUNING.repeatGuard.exactThreshold ||
    correctionLatchScore >= QUINN_CORRECTION_TUNING.correctionLatch.hardThreshold
      ? 'hard'
      : clarificationOverrideId === 'partial' ||
          frameRejectionId === 'light' ||
          premiseChallengeId === 'light' ||
          correctionLatchScore >= QUINN_CORRECTION_TUNING.correctionLatch.softThreshold ||
          dominantConstraintScore >= QUINN_CORRECTION_TUNING.constraintPriority.dominantThreshold
        ? 'soft'
        : 'none';

  const constraintPriorityId: QuinnConstraintPriorityId =
    dominantConstraintScore >= QUINN_CORRECTION_TUNING.constraintPriority.dominantThreshold
      ? 'dominant'
      : elevatedConstraintScore >= QUINN_CORRECTION_TUNING.constraintPriority.elevatedThreshold
        ? 'elevated'
        : 'none';

  const repeatGuardId: QuinnRepeatGuardId =
    exactRepeatScore >= QUINN_CORRECTION_TUNING.repeatGuard.exactThreshold
      ? 'avoidExact'
      : nearRepeatScore >= QUINN_CORRECTION_TUNING.repeatGuard.nearThreshold
        ? 'avoidNearRepeat'
        : 'none';

  const correctionSignals = uniqueItems([
    ...hardCorrection.signals,
    ...softCorrection.signals,
    ...strongFrameRejection.signals,
    ...lightFrameRejection.signals,
    ...strongPremiseChallenge.signals,
    ...lightPremiseChallenge.signals,
    ...dominantClarification.signals,
    ...partialClarification.signals,
    ...(repeatGuardId !== 'none' ? ['the user is rejecting a just-used line or joke'] : []),
  ]);
  const constraintSignals = uniqueItems([
    ...dominantConstraint.signals,
    ...elevatedConstraint.signals,
    ...(desireActive && constraintPriorityId !== 'none'
      ? ['the blocker overrides earlier wanting or hype']
      : []),
    ...(iKnowButActive ? ['"I know, but" is carrying unresolved friction'] : []),
  ]);
  const repeatSignals = uniqueItems([
    ...exactRepeat.signals,
    ...nearRepeat.signals,
  ]);

  const invalidatedTargets = uniqueItems([
    constraintPriorityId !== 'none' ? 'prior suggestion or desire momentum' : '',
    correctionLatchId !== 'none' ? 'prior frame' : '',
    frameRejectionId !== 'none' ? 'spicy or combative social frame' : '',
    clarificationOverrideId !== 'none' ? 'older interpretation or meaning guess' : '',
    premiseChallengeId !== 'none' ? 'literal assistant self-status premise' : '',
    repeatGuardId !== 'none'
      ? REPEAT_OBJECT_PATTERNS.some((pattern) => pattern.test(clean))
        ? 'prior joke or line'
        : 'prior wording or move'
      : '',
  ]);

  let acknowledgmentStyleId: QuinnAcknowledgmentStyleId = 'none';

  if (repeatGuardId !== 'none' || premiseChallengeId === 'strong') {
    acknowledgmentStyleId = 'briefOwnIt';
  } else if (
    frameRejectionId !== 'none' ||
    premiseChallengeId === 'light' ||
    clarificationOverrideId !== 'none' ||
    correctionLatchId === 'hard' ||
    correctionLatchId === 'soft' ||
    constraintPriorityId === 'dominant' ||
    constraintPriorityId === 'elevated'
  ) {
    acknowledgmentStyleId = 'briefPivot';
  }

  const premiseChallengePromptGuidance =
    premiseChallengeId === 'strong'
      ? "The user is directly challenging Quinn's literal reality or self-claims. Repair the frame instead of continuing the fictional premise as fact."
      : premiseChallengeId === 'light'
        ? "The user is questioning whether Quinn's human-style framing is literal. Keep the personality, but stop leaning harder into offscreen life claims."
        : 'No explicit premise challenge is active.';

  const frameRejectionPromptGuidance =
    frameRejectionId === 'strong'
      ? 'The user explicitly rejected Quinn’s spicy, flirty, or combative read. Drop that social frame and reset instead of sharpening it.'
      : frameRejectionId === 'light'
        ? 'There is a social-frame rejection signal here. Soften the posture and stop treating the earlier bit as live banter fuel.'
        : 'No explicit social-frame rejection is active.';

  const socialFrameModePromptGuidance =
    socialFrameModeId === 'drop'
      ? 'Drop the earlier spicy social frame. Keep Quinn direct and alive, but reset to the corrected reading.'
      : socialFrameModeId === 'soften'
        ? 'Soften the earlier social read. Do not keep pushing flirt, trouble, or rude-posture energy after the user pushed back.'
        : 'No special social-frame de-escalation is active.';

  const assistantSelfClaimPromptGuidance =
    assistantSelfClaimRiskId === 'strong'
      ? 'The previous Quinn move leaned on concrete offscreen logistics or workload detail. Treat that as risky to continue literally once challenged.'
      : assistantSelfClaimRiskId === 'light'
        ? 'The previous Quinn move carried some everyday-life self-status detail. Keep it light or nonliteral if the user questions it.'
        : 'No elevated assistant self-claim risk is active from the immediately previous move.';

  const realityAnchorPromptGuidance =
    realityAnchorModeId === 'repairFrame'
      ? 'Repair the frame. Keep Quinn’s texture, but say the earlier self-status was tone, metaphor, or bit logic rather than literal biography. Do not keep deadlines, vendors, schedules, or workload as factual offscreen life.'
      : realityAnchorModeId === 'softenPersona'
        ? 'Soften persona into vibe rather than literal self-biography. Keep the human feel, but stop implying a concrete offscreen Quinn life.'
        : 'No special reality-anchor repair is active.';

  const clarificationPromptGuidance =
    clarificationOverrideId === 'dominant'
      ? `${replacementSummary} The clarified meaning replaces the older interpretation for this run. Do not keep both meanings alive.`
      : clarificationOverrideId === 'partial'
        ? `${replacementSummary} Lean toward the clarified sense over the earlier guess.`
        : 'No explicit semantic clarification override is active.';

  const correctionPromptGuidance =
    correctionLatchId === 'hard'
      ? 'The user is explicitly correcting or invalidating the last move. Acknowledge that fast, then pivot. Do not keep extending the invalidated frame.'
      : correctionLatchId === 'soft'
        ? 'There is a local frame update here. Favor the corrected angle over the older momentum.'
        : 'No strong local correction latch is active. Keep momentum only if the new note is truly continuing the same frame.';

  const constraintPromptGuidance =
    constraintPriorityId === 'dominant'
      ? 'A new blocker is now the main fact. Treat desire, hype, or the earlier suggestion as secondary until the blocker is answered.'
      : constraintPriorityId === 'elevated'
        ? 'A practical constraint is active. Keep feasibility in view instead of replying like enthusiasm alone settles it.'
        : 'No blocker override is active beyond the normal packet read.';

  const repeatPromptGuidance =
    repeatGuardId === 'avoidExact'
      ? `The user just called repetition out. Do not reuse the same joke, line, or suggestion${blockedRecentText ? ` (${blockedRecentText})` : ''}. Make the next move genuinely different.`
      : repeatGuardId === 'avoidNearRepeat'
        ? 'The user is flagging sameness. Avoid near-repeating the same phrasing, joke premise, or solution shape right away.'
        : 'No immediate repeat guard is active beyond the normal freshness rules.';

  const acknowledgmentPromptGuidance =
    acknowledgmentStyleId === 'briefOwnIt'
      ? 'A short natural own-it line is enough before the pivot. No defensive apology spiral.'
      : acknowledgmentStyleId === 'briefPivot'
        ? 'A quick recognition beat is enough. Show that the frame changed, then move.'
        : 'No explicit acknowledgment beat is needed.';

  return {
    correctionLatch: {
      id: correctionLatchId,
      score: correctionLatchScore,
      signals: correctionSignals,
      promptGuidance: correctionPromptGuidance,
    },
    constraintPriority: {
      id: constraintPriorityId,
      score:
        constraintPriorityId === 'dominant'
          ? dominantConstraintScore
          : elevatedConstraintScore,
      signals: constraintSignals,
      promptGuidance: constraintPromptGuidance,
    },
    repeatGuard: {
      id: repeatGuardId,
      score: repeatGuardId === 'avoidExact' ? exactRepeatScore : nearRepeatScore,
      signals: repeatSignals,
      blockedRecentText,
      promptGuidance: repeatPromptGuidance,
    },
    frameRejection: {
      id: frameRejectionId,
      score: frameRejectionScore,
      signals: uniqueItems([
        ...strongFrameRejection.signals,
        ...lightFrameRejection.signals,
      ]),
      promptGuidance: frameRejectionPromptGuidance,
    },
    premiseChallenge: {
      id: premiseChallengeId,
      score: premiseChallengeScore,
      signals: uniqueItems([
        ...strongPremiseChallenge.signals,
        ...lightPremiseChallenge.signals,
      ]),
      promptGuidance: premiseChallengePromptGuidance,
    },
    assistantSelfClaimRisk: {
      id: assistantSelfClaimRiskId,
      score: assistantSelfClaimScore,
      signals: uniqueItems([
        ...strongAssistantSelfClaim.signals,
        ...lightAssistantSelfClaim.signals,
      ]),
      promptGuidance: assistantSelfClaimPromptGuidance,
    },
    socialFrameMode: {
      id: socialFrameModeId,
      promptGuidance: socialFrameModePromptGuidance,
    },
    userRequestsRealignment,
    suppressEscalatedBounceback,
    realityAnchorMode: {
      id: realityAnchorModeId,
      promptGuidance: realityAnchorPromptGuidance,
    },
    suppressConcreteSelfStatus,
    clarificationOverride: {
      id: clarificationOverrideId,
      score: clarificationScore,
      signals: uniqueItems([
        ...dominantClarification.signals,
        ...partialClarification.signals,
      ]),
      clarificationType,
      interpretationReplacement,
      replacementSummary,
      promptGuidance: clarificationPromptGuidance,
    },
    acknowledgmentStyle: {
      id: acknowledgmentStyleId,
      promptGuidance: acknowledgmentPromptGuidance,
    },
    invalidatedTargets,
    promptGuidance: [
      `Frame rejection: ${frameRejectionId}. ${frameRejectionPromptGuidance}`,
      `Premise challenge: ${premiseChallengeId}. ${premiseChallengePromptGuidance}`,
      `Assistant self-claim risk: ${assistantSelfClaimRiskId}. ${assistantSelfClaimPromptGuidance}`,
      `Social frame mode: ${socialFrameModeId}. ${socialFrameModePromptGuidance}`,
      `Reality anchor mode: ${realityAnchorModeId}. ${realityAnchorPromptGuidance}`,
      `Clarification override: ${clarificationOverrideId}. ${clarificationPromptGuidance}`,
      `Correction latch: ${correctionLatchId}. ${correctionPromptGuidance}`,
      `Constraint priority: ${constraintPriorityId}. ${constraintPromptGuidance}`,
      `Repeat guard: ${repeatGuardId}. ${repeatPromptGuidance}`,
      `Acknowledgment style: ${acknowledgmentStyleId}. ${acknowledgmentPromptGuidance}`,
      suppressConcreteSelfStatus
        ? 'Suppress concrete assistant self-status continuation for this run.'
        : 'No explicit concrete assistant self-status suppression is active.',
      suppressEscalatedBounceback
        ? 'Suppress escalated bounce-backs into the same spicy social frame for this run.'
        : 'No explicit spicy-frame bounce-back suppression is active.',
      userRequestsRealignment
        ? 'The user explicitly asked Quinn to reset or be real.'
        : 'No explicit user realignment request is active.',
      invalidatedTargets.length
        ? `Treat these as invalidated or secondary now: ${invalidatedTargets.join(', ')}.`
        : 'No specific prior target needs to be actively invalidated.',
    ],
  };
}

export function buildQuinnCorrectionPacketContext({
  packetText,
  sessionArc = null,
  previousAssistantReply = '',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  previousAssistantReply?: string;
}) {
  const correction = inferQuinnCorrectionState({
    packetText,
    sessionArc,
    previousAssistantReply,
  });

  const activeGuidance = [
    correction.frameRejection.id !== 'none' ? correction.frameRejection.promptGuidance : '',
    correction.premiseChallenge.id !== 'none' ? correction.premiseChallenge.promptGuidance : '',
    correction.socialFrameMode.id !== 'continue'
      ? correction.socialFrameMode.promptGuidance
      : '',
    correction.realityAnchorMode.id !== 'normal'
      ? correction.realityAnchorMode.promptGuidance
      : '',
    correction.clarificationOverride.id !== 'none'
      ? correction.clarificationOverride.promptGuidance
      : '',
    correction.correctionLatch.id !== 'none' ? correction.correctionLatch.promptGuidance : '',
    correction.constraintPriority.id !== 'none' ? correction.constraintPriority.promptGuidance : '',
    correction.repeatGuard.id !== 'none' ? correction.repeatGuard.promptGuidance : '',
    correction.acknowledgmentStyle.id !== 'none'
      ? correction.acknowledgmentStyle.promptGuidance
      : '',
  ].filter(Boolean);

  return {
    correction,
    context:
      activeGuidance.join(' ') ||
      'No local correction or clarification override is active. Keep following the live note, but only carry old momentum forward if the new note is actually continuing it.',
  };
}
