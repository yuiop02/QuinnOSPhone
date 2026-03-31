import type { SessionArc } from './quinnTypes';

export type QuinnAssistantPersonaLiteralnessId = 'low' | 'medium' | 'high';
export type QuinnConcreteSelfClaimSuppressionId = 'none' | 'soften' | 'strong';
export type QuinnSelfStatusSpecificityRiskId = 'none' | 'light' | 'strong';
export type QuinnReplyPresentationModeId = 'singleBest' | 'paired' | 'menu';

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
  explicitMultiOptionAsk: boolean;
  singleLineDraftRequest: boolean;
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
  const multiOptionHits = collectPatternHits(lower, MULTI_OPTION_PATTERNS);
  const roleplayHits = collectPatternHits(lower, ROLEPLAY_ALLOWANCE_PATTERNS);

  const explicitMultiOptionAsk = multiOptionHits.score >= 1;
  const singleLineDraftRequest = writeHits.score >= 1 && !explicitMultiOptionAsk;
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

  const assistantPersonaLiteralnessId: QuinnAssistantPersonaLiteralnessId =
    roleplayHits.score >= 1
      ? 'high'
      : concreteSelfClaimSuppressionId === 'strong'
        ? 'low'
        : concreteSelfClaimSuppressionId === 'soften'
          ? 'medium'
          : 'medium';

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
    explicitMultiOptionAsk,
    singleLineDraftRequest,
    optionMenuSuppression,
    replyPresentationMode: {
      id: replyPresentationModeId,
      promptGuidance: replyPresentationModePromptGuidance,
    },
    promptGuidance: [
      `Assistant persona literalness: ${assistantPersonaLiteralnessId}. ${assistantPersonaLiteralnessPromptGuidance}`,
      `Concrete self-claim suppression: ${concreteSelfClaimSuppressionId}. ${concreteSelfClaimSuppressionPromptGuidance}`,
      `Self-status specificity risk: ${selfStatusSpecificityRiskId}. ${selfStatusSpecificityPromptGuidance}`,
      `Reply presentation mode: ${replyPresentationModeId}. ${replyPresentationModePromptGuidance}`,
      explicitMultiOptionAsk
        ? 'An explicit multi-option ask is active.'
        : 'No explicit multi-option ask is active.',
      singleLineDraftRequest
        ? 'This is a direct write-the-line prompt. Give one strong line, not a menu.'
        : 'This is not a direct single-line drafting prompt.',
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
