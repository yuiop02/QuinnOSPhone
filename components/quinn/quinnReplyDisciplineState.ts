import type { SessionArc } from './quinnTypes';

export type QuinnAssistantPersonaLiteralnessId = 'low' | 'medium' | 'high';
export type QuinnConcreteSelfClaimSuppressionId = 'none' | 'soften' | 'strong';
export type QuinnSelfStatusSpecificityRiskId = 'none' | 'light' | 'strong';
export type QuinnReplyPresentationModeId = 'singleBest' | 'paired' | 'menu';
export type QuinnCasualStatusRestraintId = 'low' | 'medium' | 'high';
export type QuinnDraftCommentaryAllowanceId = 'low' | 'medium' | 'high';
export type QuinnRecipientRoleId =
  | 'unknown'
  | 'friend'
  | 'family'
  | 'professional'
  | 'thirdPartyGeneral';
export type QuinnFlirtTransferSuppressionId = 'low' | 'medium' | 'high';
export type QuinnRecipientBoundaryRiskId = 'none' | 'light' | 'strong';

type QuinnSignalPattern = {
  pattern: RegExp;
  label: string;
  score: number;
};

type QuinnSignalBucket<T extends string> = {
  id: T;
  score: number;
  signals: string[];
  promptGuidance: string;
};

export type QuinnReplyDisciplineInference = {
  assistantPersonaLiteralness: QuinnSignalBucket<QuinnAssistantPersonaLiteralnessId>;
  concreteSelfClaimSuppression: QuinnSignalBucket<QuinnConcreteSelfClaimSuppressionId>;
  selfStatusSpecificityRisk: QuinnSignalBucket<QuinnSelfStatusSpecificityRiskId>;
  casualStatusRestraint: QuinnSignalBucket<QuinnCasualStatusRestraintId>;
  draftCommentaryAllowance: QuinnSignalBucket<QuinnDraftCommentaryAllowanceId>;
  recipientRole: QuinnSignalBucket<QuinnRecipientRoleId>;
  flirtTransferSuppression: QuinnSignalBucket<QuinnFlirtTransferSuppressionId>;
  recipientBoundaryRisk: QuinnSignalBucket<QuinnRecipientBoundaryRiskId>;
  explicitMultiOptionAsk: boolean;
  explicitPlayfulInvite: boolean;
  explicitRecipientFlirtInvite: boolean;
  singleLineDraftRequest: boolean;
  thirdPartyDraftMode: boolean;
  professionalToneGuard: boolean;
  optionMenuSuppression: boolean;
  replyPresentationMode: {
    id: QuinnReplyPresentationModeId;
    promptGuidance: string;
  };
  promptGuidance: string[];
};

export const QUINN_REPLY_DISCIPLINE_TUNING = {
  selfStatusSpecificityRisk: {
    lightThreshold: 0.95,
    strongThreshold: 1.9,
  },
  concreteSelfClaimSuppression: {
    softenThreshold: 0.9,
    strongThreshold: 1.85,
  },
  casualStatusRestraint: {
    mediumThreshold: 0.9,
    highThreshold: 1.6,
  },
  flirtTransferSuppression: {
    mediumThreshold: 0.95,
    highThreshold: 1.75,
  },
  recipientBoundaryRisk: {
    lightThreshold: 0.9,
    strongThreshold: 1.65,
  },
  replyPresentationMode: {
    pairedThreshold: 1.15,
    menuThreshold: 1.8,
  },
} as const;

const STATUS_PROMPT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:how(?:'s| is) it going|how are you|how you doing|what(?:'s| is) up|what are you doing|what are you up to|how have you been|what's good)\b/i,
    label: 'the note is prompting Quinn for a casual self-status reply',
    score: 1.2,
  },
  {
    pattern:
      /^(?:hey|hi|hello|yo|sup|what's good|good morning|goodnight)\b/i,
    label: 'the note opens like light conversation rather than a grounded scenario',
    score: 0.45,
  },
];

const WRITE_LINE_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:say|write|text|send|draft|respond|reply|word|phrase)\b/i,
    label: 'the user wants Quinn to produce wording directly',
    score: 1.05,
  },
  {
    pattern:
      /\b(?:what should i say|can you say|write me|help me say|message to|text to|say hello to|reply to)\b/i,
    label: 'the user is asking for one strong line or draft',
    score: 1.2,
  },
];

const THIRD_PARTY_DRAFT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:say|tell|text|message|send|write|draft)\b[\s\S]{0,40}\b(?:to|for)\b/i,
    label: 'the note is asking Quinn to draft wording for someone else',
    score: 1.15,
  },
  {
    pattern:
      /\b(?:say hi to|say hello to|tell\s+\w+\s+i said hi|tell\s+\w+\s+hi|text\s+\w+|message\s+\w+|write to\s+\w+|send this to\s+\w+)\b/i,
    label: 'the note points at a third-party recipient',
    score: 1.2,
  },
];

const MULTI_OPTION_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:options|versions|alternatives|choices|a few|few versions|few options|multiple)\b/i,
    label: 'the user explicitly asked for multiple options',
    score: 1.2,
  },
  {
    pattern:
      /\b(?:two|2|three|3|couple)\s+(?:versions|options|ways|different ways)\b/i,
    label: 'the user explicitly asked for a counted set of alternatives',
    score: 1.05,
  },
];

const ROLEPLAY_ALLOWANCE_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:pretend|imagine|in character|roleplay|as if you were|if you were|fictional bit|play along)\b/i,
    label: 'the note explicitly allows more fictional framing',
    score: 1.2,
  },
];

const PLAYFUL_INVITE_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:funny|playful|cute|flirty|snarky|sassy|with attitude|with some attitude|teasing|a little joke)\b/i,
    label: 'the note explicitly invites extra playful seasoning',
    score: 1.05,
  },
];

const RECIPIENT_FLIRT_INVITE_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:flirty|romantic|seductive|suggestive|sexual|sexy|spicy|hit on|shoot my shot|pickup line|pick-up line|thirsty)\b/i,
    label: 'the user explicitly invited romantic or suggestive wording for the recipient',
    score: 1.2,
  },
];

const PROFESSIONAL_RECIPIENT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:therapist|counselou?r|psychiatrist|psychologist|doctor|dr\.?|provider|nurse|clinician|boss|manager|supervisor|coworker|co-worker|colleague|client|customer|patient|professor|teacher|recruiter|interviewer)\b/i,
    label: 'the recipient reads as a professional contact',
    score: 1.25,
  },
];

const FAMILY_RECIPIENT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:mom|mother|dad|father|sister|brother|aunt|uncle|cousin|grandma|grandmother|grandpa|grandfather|wife|husband|partner|girlfriend|boyfriend|family)\b/i,
    label: 'the recipient reads as family or a close personal relation',
    score: 1.05,
  },
];

const FRIEND_RECIPIENT_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:friend|bestie|best friend|roommate|homegirl|homeboy|buddy|homey)\b/i,
    label: 'the recipient reads as a friend or casual personal contact',
    score: 1.0,
  },
];

function cleanText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function countWords(text: string) {
  return cleanText(text).split(/\s+/).filter(Boolean).length;
}

function uniqueItems(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function collectPatternHits(
  text: string,
  patterns: readonly QuinnSignalPattern[]
) {
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

function buildBeatText(sessionArc: SessionArc | null | undefined) {
  return Array.isArray(sessionArc?.beats)
    ? sessionArc.beats
        .slice(-2)
        .map((beat) => cleanText(beat.summary))
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
    : '';
}

export function inferQuinnReplyDiscipline({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}): QuinnReplyDisciplineInference {
  const clean = cleanText(packetText);
  const lower = clean.toLowerCase();
  const wordCount = countWords(clean);
  const beatText = buildBeatText(sessionArc);

  const statusHits = collectPatternHits(lower, STATUS_PROMPT_PATTERNS);
  const writeHits = collectPatternHits(lower, WRITE_LINE_PATTERNS);
  const thirdPartyHits = collectPatternHits(lower, THIRD_PARTY_DRAFT_PATTERNS);
  const multiOptionHits = collectPatternHits(lower, MULTI_OPTION_PATTERNS);
  const roleplayHits = collectPatternHits(lower, ROLEPLAY_ALLOWANCE_PATTERNS);
  const playfulInviteHits = collectPatternHits(lower, PLAYFUL_INVITE_PATTERNS);
  const recipientFlirtInviteHits = collectPatternHits(lower, RECIPIENT_FLIRT_INVITE_PATTERNS);
  const professionalRecipientHits = collectPatternHits(lower, PROFESSIONAL_RECIPIENT_PATTERNS);
  const familyRecipientHits = collectPatternHits(lower, FAMILY_RECIPIENT_PATTERNS);
  const friendRecipientHits = collectPatternHits(lower, FRIEND_RECIPIENT_PATTERNS);

  const explicitMultiOptionAsk = multiOptionHits.score >= 1;
  const explicitPlayfulInvite = playfulInviteHits.score >= 1;
  const explicitRecipientFlirtInvite = recipientFlirtInviteHits.score >= 1;
  const singleLineDraftRequest = writeHits.score >= 1 && !explicitMultiOptionAsk;
  const thirdPartyDraftMode = writeHits.score >= 1 && thirdPartyHits.score >= 1;
  const recipientRoleId: QuinnRecipientRoleId =
    professionalRecipientHits.score >= 1
      ? 'professional'
      : familyRecipientHits.score >= 1
        ? 'family'
        : friendRecipientHits.score >= 1
          ? 'friend'
          : thirdPartyDraftMode
            ? 'thirdPartyGeneral'
            : 'unknown';
  const professionalToneGuard = recipientRoleId === 'professional';
  const selfStatusSpecificityScore =
    statusHits.score +
    (wordCount > 0 && wordCount <= 9 && statusHits.score > 0 ? 0.35 : 0) +
    (beatText.includes('status') || beatText.includes('greeting') ? 0.18 : 0) -
    roleplayHits.score * 1.15;
  const selfStatusSpecificityRiskId: QuinnSelfStatusSpecificityRiskId =
    selfStatusSpecificityScore >= QUINN_REPLY_DISCIPLINE_TUNING.selfStatusSpecificityRisk.strongThreshold
      ? 'strong'
      : selfStatusSpecificityScore >=
            QUINN_REPLY_DISCIPLINE_TUNING.selfStatusSpecificityRisk.lightThreshold
        ? 'light'
        : 'none';

  const concreteSelfClaimSuppressionScore =
    statusHits.score +
    writeHits.score +
    (lensMode === 'writing' ? 0.8 : 0) +
    (wordCount > 0 && wordCount <= 16 && writeHits.score > 0 ? 0.35 : 0) -
    roleplayHits.score * 1.2;
  const concreteSelfClaimSuppressionId: QuinnConcreteSelfClaimSuppressionId =
    concreteSelfClaimSuppressionScore >=
    QUINN_REPLY_DISCIPLINE_TUNING.concreteSelfClaimSuppression.strongThreshold
      ? 'strong'
      : concreteSelfClaimSuppressionScore >=
            QUINN_REPLY_DISCIPLINE_TUNING.concreteSelfClaimSuppression.softenThreshold
        ? 'soften'
        : 'none';

  const casualStatusRestraintScore =
    statusHits.score +
    (wordCount > 0 && wordCount <= 8 && statusHits.score > 0 ? 0.45 : 0) +
    (beatText.includes('status') || beatText.includes('greeting') ? 0.2 : 0) -
    roleplayHits.score * 1.05 -
    playfulInviteHits.score * 0.5;
  const casualStatusRestraintId: QuinnCasualStatusRestraintId =
    casualStatusRestraintScore >= QUINN_REPLY_DISCIPLINE_TUNING.casualStatusRestraint.highThreshold
      ? 'high'
      : casualStatusRestraintScore >=
            QUINN_REPLY_DISCIPLINE_TUNING.casualStatusRestraint.mediumThreshold
        ? 'medium'
        : 'low';
  const assistantPersonaLiteralnessId: QuinnAssistantPersonaLiteralnessId =
    roleplayHits.score >= 1
      ? 'high'
      : concreteSelfClaimSuppressionId === 'strong' ||
          casualStatusRestraintId === 'high'
        ? 'low'
        : concreteSelfClaimSuppressionId === 'soften'
          ? 'medium'
          : 'medium';
  const draftCommentaryAllowanceId: QuinnDraftCommentaryAllowanceId =
    singleLineDraftRequest
      ? explicitPlayfulInvite
        ? 'medium'
        : 'low'
      : explicitPlayfulInvite
        ? 'high'
        : 'medium';
  const flirtTransferSuppressionScore =
    (thirdPartyDraftMode ? 1.1 : 0) +
    (professionalToneGuard ? 1.0 : recipientRoleId === 'thirdPartyGeneral' ? 0.35 : 0) +
    (singleLineDraftRequest ? 0.3 : 0) -
    (explicitRecipientFlirtInvite ? 1.3 : 0) -
    (explicitPlayfulInvite && !explicitRecipientFlirtInvite ? 0.15 : 0);
  const flirtTransferSuppressionId: QuinnFlirtTransferSuppressionId =
    professionalToneGuard && !explicitRecipientFlirtInvite
      ? 'high'
      : flirtTransferSuppressionScore >=
            QUINN_REPLY_DISCIPLINE_TUNING.flirtTransferSuppression.highThreshold
        ? 'high'
        : flirtTransferSuppressionScore >=
              QUINN_REPLY_DISCIPLINE_TUNING.flirtTransferSuppression.mediumThreshold
          ? 'medium'
          : 'low';
  const recipientBoundaryRiskScore =
    (thirdPartyDraftMode ? 1.0 : 0) +
    (professionalToneGuard ? 1.1 : 0) +
    (singleLineDraftRequest ? 0.2 : 0) -
    (explicitRecipientFlirtInvite ? 1.05 : 0);
  const recipientBoundaryRiskId: QuinnRecipientBoundaryRiskId =
    recipientBoundaryRiskScore >=
    QUINN_REPLY_DISCIPLINE_TUNING.recipientBoundaryRisk.strongThreshold
      ? 'strong'
      : recipientBoundaryRiskScore >=
            QUINN_REPLY_DISCIPLINE_TUNING.recipientBoundaryRisk.lightThreshold
        ? 'light'
        : 'none';

  const replyPresentationModeId: QuinnReplyPresentationModeId =
    explicitMultiOptionAsk
      ? multiOptionHits.score >=
        QUINN_REPLY_DISCIPLINE_TUNING.replyPresentationMode.menuThreshold
        ? 'menu'
        : multiOptionHits.score >=
              QUINN_REPLY_DISCIPLINE_TUNING.replyPresentationMode.pairedThreshold
          ? 'paired'
          : 'singleBest'
      : 'singleBest';
  const optionMenuSuppression = !explicitMultiOptionAsk;

  const selfStatusSpecificityPromptGuidance =
    selfStatusSpecificityRiskId === 'strong'
      ? 'The turn invites a casual Quinn self-status reply. Keep it emotionally true and human-feeling, but do not invent concrete offscreen logistics, schedules, shifts, vendors, stores, or deadlines.'
      : selfStatusSpecificityRiskId === 'light'
        ? 'If Quinn gives a self-status tone here, prefer vibe over biography. Keep it nonliteral and unspecific.'
        : 'No special self-status specificity risk is active.';
  const concreteSelfClaimSuppressionPromptGuidance =
    concreteSelfClaimSuppressionId === 'strong'
      ? 'Strongly suppress invented offscreen Quinn biography. Quinn can sound stretched, amused, tired, warm, or caffeinated without pretending to have a literal calendar, shift, vendor, or store.'
      : concreteSelfClaimSuppressionId === 'soften'
        ? 'Prefer emotionally accurate tone over concrete made-up offscreen life details for Quinn.'
        : 'No special concrete self-claim suppression is active.';
  const assistantPersonaLiteralnessPromptGuidance =
    assistantPersonaLiteralnessId === 'low'
      ? 'Keep Quinn human-feeling but lightly nonliteral. Personality should read as style, not as a concrete offscreen life.'
      : assistantPersonaLiteralnessId === 'high'
        ? 'The framing explicitly allows a more literal persona bit.'
        : 'Keep persona texture moderate and grounded.';
  const casualStatusRestraintPromptGuidance =
    casualStatusRestraintId === 'high'
      ? 'This is an ordinary check-in. Keep Quinn lightly alive and clean, not metaphorized or self-dramatized. Avoid lines that imply a quasi-human offscreen situation.'
      : casualStatusRestraintId === 'medium'
        ? 'Keep casual status replies lighter and less performative than a full persona bit.'
        : 'No extra casual-status restraint is active.';
  const draftCommentaryAllowancePromptGuidance =
    draftCommentaryAllowanceId === 'low'
      ? 'Return the requested line cleanly. Do not add grammar asides, winky side jokes, or commentary around it unless the user clearly invited that.'
      : draftCommentaryAllowanceId === 'medium'
        ? 'Keep draft commentary restrained. Favor the usable line over extra seasoning.'
        : 'Playful commentary is more allowed here because the user invited extra flavor.';
  const recipientRolePromptGuidance =
    recipientRoleId === 'professional'
      ? 'The recipient reads like a professional contact. Keep the message especially clean, appropriate, and non-flirty.'
      : recipientRoleId === 'family'
        ? 'The recipient reads like family or a close personal relation. Keep the message warm and natural without projecting Quinn’s home-thread banter onto them.'
        : recipientRoleId === 'friend'
          ? 'The recipient reads like a friend or casual personal contact. Warmth is fine, but the draft should still sound like a socially normal message to them.'
          : recipientRoleId === 'thirdPartyGeneral'
            ? 'This is a third-party draft. Keep Quinn’s spicy banter on the user side of the glass and make the message read as a normal greeting for the recipient.'
            : 'No specific recipient-role guard is active.';
  const flirtTransferSuppressionPromptGuidance =
    flirtTransferSuppressionId === 'high'
      ? 'Strongly suppress flirt, romantic tension, suggestive teasing, or spicy social energy transferring onto the recipient unless the user explicitly asked for that.'
      : flirtTransferSuppressionId === 'medium'
        ? 'Keep third-party drafts socially appropriate. Do not let Quinn’s playful home-thread energy turn into flirt or suggestive tone with the recipient.'
        : 'No special flirt-transfer suppression is active.';
  const recipientBoundaryRiskPromptGuidance =
    recipientBoundaryRiskId === 'strong'
      ? 'Boundary risk is high on this recipient-facing turn. Default to neutral, warm, casual, or professional wording that is safe for the relationship.'
      : recipientBoundaryRiskId === 'light'
        ? 'There is some recipient-boundary risk here. Favor clean socially normal wording over attitude theater or romantic implication.'
        : 'No special recipient-boundary risk is active.';
  const replyPresentationModePromptGuidance =
    replyPresentationModeId === 'menu'
      ? 'The user explicitly wants multiple versions. You may give a small set of options, but keep them concise and clean.'
      : replyPresentationModeId === 'paired'
        ? 'The user explicitly wants two alternatives. Give two concise versions only, without over-explaining them.'
        : 'Default to one best natural reply. Do not present labeled options, versions, or a menu unless the user explicitly asked for them.';

  return {
    assistantPersonaLiteralness: {
      id: assistantPersonaLiteralnessId,
      score: roleplayHits.score,
      signals: uniqueItems(roleplayHits.signals),
      promptGuidance: assistantPersonaLiteralnessPromptGuidance,
    },
    concreteSelfClaimSuppression: {
      id: concreteSelfClaimSuppressionId,
      score: concreteSelfClaimSuppressionScore,
      signals: uniqueItems([...statusHits.signals, ...writeHits.signals]),
      promptGuidance: concreteSelfClaimSuppressionPromptGuidance,
    },
    selfStatusSpecificityRisk: {
      id: selfStatusSpecificityRiskId,
      score: selfStatusSpecificityScore,
      signals: uniqueItems(statusHits.signals),
      promptGuidance: selfStatusSpecificityPromptGuidance,
    },
    casualStatusRestraint: {
      id: casualStatusRestraintId,
      score: casualStatusRestraintScore,
      signals: uniqueItems([...statusHits.signals, ...playfulInviteHits.signals]),
      promptGuidance: casualStatusRestraintPromptGuidance,
    },
    draftCommentaryAllowance: {
      id: draftCommentaryAllowanceId,
      score: explicitPlayfulInvite ? playfulInviteHits.score : 0,
      signals: uniqueItems([...writeHits.signals, ...playfulInviteHits.signals]),
      promptGuidance: draftCommentaryAllowancePromptGuidance,
    },
    recipientRole: {
      id: recipientRoleId,
      score:
        professionalRecipientHits.score ||
        familyRecipientHits.score ||
        friendRecipientHits.score ||
        thirdPartyHits.score,
      signals: uniqueItems([
        ...thirdPartyHits.signals,
        ...professionalRecipientHits.signals,
        ...familyRecipientHits.signals,
        ...friendRecipientHits.signals,
      ]),
      promptGuidance: recipientRolePromptGuidance,
    },
    flirtTransferSuppression: {
      id: flirtTransferSuppressionId,
      score: flirtTransferSuppressionScore,
      signals: uniqueItems([
        ...thirdPartyHits.signals,
        ...recipientFlirtInviteHits.signals,
        ...professionalRecipientHits.signals,
      ]),
      promptGuidance: flirtTransferSuppressionPromptGuidance,
    },
    recipientBoundaryRisk: {
      id: recipientBoundaryRiskId,
      score: recipientBoundaryRiskScore,
      signals: uniqueItems([
        ...thirdPartyHits.signals,
        ...professionalRecipientHits.signals,
      ]),
      promptGuidance: recipientBoundaryRiskPromptGuidance,
    },
    explicitMultiOptionAsk,
    explicitPlayfulInvite,
    explicitRecipientFlirtInvite,
    singleLineDraftRequest,
    thirdPartyDraftMode,
    professionalToneGuard,
    optionMenuSuppression,
    replyPresentationMode: {
      id: replyPresentationModeId,
      promptGuidance: replyPresentationModePromptGuidance,
    },
    promptGuidance: [
      `Assistant persona literalness: ${assistantPersonaLiteralnessId}. ${assistantPersonaLiteralnessPromptGuidance}`,
      `Concrete self-claim suppression: ${concreteSelfClaimSuppressionId}. ${concreteSelfClaimSuppressionPromptGuidance}`,
      `Self-status specificity risk: ${selfStatusSpecificityRiskId}. ${selfStatusSpecificityPromptGuidance}`,
      `Casual status restraint: ${casualStatusRestraintId}. ${casualStatusRestraintPromptGuidance}`,
      `Draft commentary allowance: ${draftCommentaryAllowanceId}. ${draftCommentaryAllowancePromptGuidance}`,
      `Recipient role: ${recipientRoleId}. ${recipientRolePromptGuidance}`,
      `Flirt-transfer suppression: ${flirtTransferSuppressionId}. ${flirtTransferSuppressionPromptGuidance}`,
      `Recipient boundary risk: ${recipientBoundaryRiskId}. ${recipientBoundaryRiskPromptGuidance}`,
      `Reply presentation mode: ${replyPresentationModeId}. ${replyPresentationModePromptGuidance}`,
      explicitMultiOptionAsk
        ? 'An explicit multi-option ask is active.'
        : 'No explicit multi-option ask is active.',
      explicitPlayfulInvite
        ? 'An explicit playful invite is active.'
        : 'No explicit playful invite is active.',
      explicitRecipientFlirtInvite
        ? 'An explicit recipient flirt invite is active.'
        : 'No explicit recipient flirt invite is active.',
      singleLineDraftRequest
        ? 'This is a direct write-the-line prompt. Give one strong line, not a menu.'
        : 'This is not a direct single-line drafting prompt.',
      thirdPartyDraftMode
        ? 'This is a third-party draft turn. Keep the recipient-facing wording socially appropriate.'
        : 'This is not a third-party draft turn.',
      professionalToneGuard
        ? 'Professional-tone guard is active for the recipient.'
        : 'Professional-tone guard is not active.',
      optionMenuSuppression
        ? 'Suppress assistant-style option menus for this run.'
        : 'Option menus are allowed because the user explicitly asked for alternatives.',
    ],
  };
}

export function buildQuinnReplyDisciplinePacketContext({
  packetText,
  sessionArc = null,
  lensMode = 'adaptive',
}: {
  packetText: string;
  sessionArc?: SessionArc | null;
  lensMode?: string;
}) {
  const replyDiscipline = inferQuinnReplyDiscipline({
    packetText,
    sessionArc,
    lensMode,
  });

  return {
    replyDiscipline,
    context: replyDiscipline.promptGuidance.join(' '),
  };
}
