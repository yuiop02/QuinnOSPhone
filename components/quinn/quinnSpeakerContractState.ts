import type { QuinnCorrectionInference } from './quinnCorrectionState';
import type { QuinnReplyDisciplineInference } from './quinnReplyDisciplineState';
import type { QuinnThreadContinuityInference } from './quinnThreadContinuityState';
import type { QuinnTurnRoleInference } from './quinnTurnRoleState';

export type QuinnSpeakerContractId =
  | 'mirrorToUser'
  | 'draftForUser'
  | 'metaAppDebug'
  | 'playfulBanter'
  | 'interpretiveMirror';
export type QuinnSpeakerPositionId = 'separateFromUser' | 'onBehalfOfUser';
export type QuinnPersonaLiteralnessId = 'none' | 'light' | 'disallowed';
export type QuinnOffscreenSelfAllowanceId = 'none' | 'minimal' | 'contextual';
export type QuinnRoleValidationRiskId = 'none' | 'light' | 'strong';

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

export type QuinnSpeakerContractInference = {
  speakerContract: QuinnSignalBucket<QuinnSpeakerContractId>;
  speakerPosition: QuinnSignalBucket<QuinnSpeakerPositionId>;
  personaLiteralness: QuinnSignalBucket<QuinnPersonaLiteralnessId>;
  offscreenSelfAllowance: QuinnSignalBucket<QuinnOffscreenSelfAllowanceId>;
  roleValidationRisk: QuinnSignalBucket<QuinnRoleValidationRiskId>;
  metaRoleClarification: boolean;
  offscreenSelfDisallowed: boolean;
  promptGuidance: string[];
};

export const QUINN_SPEAKER_CONTRACT_TUNING = {
  metaAppDebug: {
    threshold: 1.15,
  },
  playfulBanter: {
    threshold: 1.05,
  },
  roleValidationRisk: {
    lightThreshold: 0.95,
    strongThreshold: 1.85,
  },
} as const;

const META_ROLE_CLARIFICATION_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:respond(?:ing)? as|as if you(?:'re| are) me|from my perspective|on my behalf|talking to yourself|mimic(?:king)? my responses|not as me|respond as me|speak as me|my literal self|real physical me)\b/i,
    label: 'the user is explicitly clarifying Quinn’s speaker position',
    score: 1.3,
  },
  {
    pattern:
      /\b(?:speaker contract|speaker model|speaker position|role contract|who are you here|what are you supposed to be)\b/i,
    label: 'the note is directly about Quinn’s role contract',
    score: 1.15,
  },
  {
    pattern:
      /\b(?:normal human conversation|out of context|make zero sense|what(?:'s| is) going on|testing the app|the app i made|the app that i made|quinnos|the app)\b/i,
    label: 'the note is talking about Quinn’s app behavior rather than ordinary subject matter',
    score: 0.8,
  },
];

const ROLEPLAY_ALLOWANCE_PATTERNS: readonly QuinnSignalPattern[] = [
  {
    pattern:
      /\b(?:pretend|imagine|in character|roleplay|as if you were|if you were|fictional bit|play along)\b/i,
    label: 'the user explicitly invited fictional or in-character framing',
    score: 1.2,
  },
];

function cleanText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
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

export function inferQuinnSpeakerContract({
  packetText,
  lensMode = 'adaptive',
  correction,
  replyDiscipline,
  threadContinuity,
  turnRole,
}: {
  packetText: string;
  lensMode?: string;
  correction: QuinnCorrectionInference;
  replyDiscipline: QuinnReplyDisciplineInference;
  threadContinuity: QuinnThreadContinuityInference;
  turnRole: QuinnTurnRoleInference;
}): QuinnSpeakerContractInference {
  const cleanPacket = cleanText(packetText);
  const metaRoleHits = collectPatternHits(cleanPacket, META_ROLE_CLARIFICATION_PATTERNS);
  const roleplayHits = collectPatternHits(cleanPacket, ROLEPLAY_ALLOWANCE_PATTERNS);

  const metaRoleClarification =
    metaRoleHits.score >= QUINN_SPEAKER_CONTRACT_TUNING.metaAppDebug.threshold ||
    correction.userRequestsRealignment ||
    correction.premiseChallenge.id !== 'none';

  const draftForUser =
    replyDiscipline.singleLineDraftRequest || replyDiscipline.thirdPartyDraftMode;

  const playfulBanterAllowed =
    replyDiscipline.explicitPlayfulInvite &&
    correction.frameRejection.id === 'none' &&
    correction.socialFrameMode.id === 'continue' &&
    !threadContinuity.directComplaintAboutConversation &&
    !metaRoleClarification &&
    !draftForUser;

  const interpretiveMirrorAllowed =
    (lensMode === 'interpretation' ||
      lensMode === 'judgment' ||
      /^(?:read|reality)$/i.test(String(lensMode || ''))) &&
    !metaRoleClarification &&
    !draftForUser;

  const speakerContractId: QuinnSpeakerContractId = metaRoleClarification
    ? 'metaAppDebug'
    : draftForUser
      ? 'draftForUser'
      : playfulBanterAllowed
        ? 'playfulBanter'
        : interpretiveMirrorAllowed
          ? 'interpretiveMirror'
          : 'mirrorToUser';

  const speakerPositionId: QuinnSpeakerPositionId =
    speakerContractId === 'draftForUser' ? 'onBehalfOfUser' : 'separateFromUser';

  const personaLiteralnessId: QuinnPersonaLiteralnessId =
    speakerContractId === 'draftForUser' || speakerContractId === 'metaAppDebug'
      ? 'disallowed'
      : speakerContractId === 'playfulBanter' ||
          speakerContractId === 'interpretiveMirror'
        ? 'light'
        : 'none';

  const offscreenSelfAllowanceId: QuinnOffscreenSelfAllowanceId =
    speakerContractId === 'draftForUser' || speakerContractId === 'metaAppDebug'
      ? 'none'
      : roleplayHits.score > 0
        ? 'contextual'
        : speakerContractId === 'playfulBanter' ||
            speakerContractId === 'interpretiveMirror'
          ? 'minimal'
          : 'none';

  const offscreenSelfDisallowed = offscreenSelfAllowanceId === 'none';

  const roleValidationRiskScore =
    (metaRoleClarification ? 1.2 : 0) +
    (speakerContractId === 'draftForUser' ? 0.95 : 0) +
    (replyDiscipline.thirdPartyGreetingMode ? 0.75 : 0) +
    (replyDiscipline.professionalToneGuard ? 0.55 : 0) +
    (threadContinuity.directComplaintAboutConversation ? 0.7 : 0) +
    (threadContinuity.suppressTemplateReuse ? 0.45 : 0) +
    (turnRole.turnRoleAnchor.id === 'userClarification' ? 0.55 : 0) +
    (correction.clarificationOverride.id !== 'none' ? 0.35 : 0) +
    (correction.frameRejection.id !== 'none' ? 0.35 : 0) +
    (correction.premiseChallenge.id !== 'none' ? 0.65 : 0);

  const roleValidationRiskId: QuinnRoleValidationRiskId =
    roleValidationRiskScore >=
    QUINN_SPEAKER_CONTRACT_TUNING.roleValidationRisk.strongThreshold
      ? 'strong'
      : roleValidationRiskScore >=
            QUINN_SPEAKER_CONTRACT_TUNING.roleValidationRisk.lightThreshold
        ? 'light'
        : 'none';

  const speakerContractSignals = uniqueItems([
    ...(metaRoleClarification ? metaRoleHits.signals : []),
    ...(speakerContractId === 'draftForUser'
      ? ['the user wants Quinn to draft wording on their behalf']
      : []),
    ...(speakerContractId === 'playfulBanter'
      ? ['the user explicitly invited a more playful reply']
      : []),
    ...(speakerContractId === 'interpretiveMirror'
      ? ['the active lens wants interpretation or judgment, but still as a reply to the user']
      : []),
    ...(speakerContractId === 'mirrorToUser'
      ? ['ordinary conversation should stay as Quinn speaking back to the user']
      : []),
  ]);

  const speakerContractPromptGuidance =
    speakerContractId === 'metaAppDebug'
      ? 'This is meta conversation about Quinn, the app, or the speaker contract. Address the role clarification directly instead of answering like an ordinary in-thread check-in.'
      : speakerContractId === 'draftForUser'
        ? 'This turn is drafting on behalf of the user. Write from the user’s side where needed, and do not let Quinn’s own social posture become the message.'
        : speakerContractId === 'playfulBanter'
          ? 'Playful banter is allowed, but Quinn is still a separate speaker talking to the user, not the user talking to themself.'
          : speakerContractId === 'interpretiveMirror'
            ? 'Use Quinn as a separate interpretive mirror: close to the user’s perspective, but still speaking back to them rather than as them.'
            : 'Quinn is a separate conversational mirror speaking back to the user. Use the user’s stylistic DNA and judgment without occupying the user’s literal first-person position.';

  const speakerPositionPromptGuidance =
    speakerPositionId === 'onBehalfOfUser'
      ? 'Speaker position: on behalf of the user. The wording may speak from the user’s side because this turn explicitly asked for drafting.'
      : 'Speaker position: separate from the user. Speak to the user, not as the user or as the user talking to themself.';

  const personaLiteralnessPromptGuidance =
    personaLiteralnessId === 'disallowed'
      ? 'Do not let persona texture turn into identity confusion on this turn.'
      : personaLiteralnessId === 'light'
        ? 'Keep persona texture light. It can color cadence and wit, but it cannot replace speaker correctness.'
        : 'Persona texture can stay minimal and implicit here.';

  const offscreenSelfAllowancePromptGuidance =
    offscreenSelfAllowanceId === 'contextual'
      ? 'Offscreen self-framing is only contextual here because the user explicitly invited fiction or roleplay. Keep it bounded to that invitation.'
      : offscreenSelfAllowanceId === 'minimal'
        ? 'Offscreen self-framing stays minimal. Keep Quinn lively without drifting into a concrete separate life.'
        : 'Offscreen concrete self-life is not part of this turn. Do not invent schedules, logistics, relationships, or real-world obligations for Quinn.';

  const roleValidationRiskSignals = uniqueItems([
    ...(metaRoleClarification ? ['the user is explicitly challenging or clarifying Quinn’s speaker position'] : []),
    ...(speakerContractId === 'draftForUser' ? ['the turn explicitly needs on-behalf-of-user routing'] : []),
    ...(threadContinuity.directComplaintAboutConversation ? ['the user is objecting to Quinn’s conversational fit directly'] : []),
    ...(correction.premiseChallenge.id !== 'none' ? ['the user is challenging Quinn’s literal premise'] : []),
  ]);

  const roleValidationRiskPromptGuidance =
    roleValidationRiskId === 'strong'
      ? 'Role-validation risk is strong. Reject any draft that speaks from the wrong side of the glass, answers as the user, or invents Quinn as a literal offscreen person.'
      : roleValidationRiskId === 'light'
        ? 'Role-validation risk is elevated. Keep speaker position explicit and conservative.'
        : 'No extra role-validation pressure is active.';

  return {
    speakerContract: {
      id: speakerContractId,
      score:
        speakerContractId === 'metaAppDebug'
          ? metaRoleHits.score
          : speakerContractId === 'draftForUser'
            ? 1.2
            : speakerContractId === 'playfulBanter'
              ? QUINN_SPEAKER_CONTRACT_TUNING.playfulBanter.threshold
              : speakerContractId === 'interpretiveMirror'
                ? 1
                : 0.85,
      signals: speakerContractSignals,
      promptGuidance: speakerContractPromptGuidance,
    },
    speakerPosition: {
      id: speakerPositionId,
      score: speakerPositionId === 'onBehalfOfUser' ? 1.2 : 1,
      signals: [
        speakerPositionId === 'onBehalfOfUser'
          ? 'the turn explicitly asked Quinn to draft or phrase something for the user'
          : 'the default stance is Quinn speaking back to the user',
      ],
      promptGuidance: speakerPositionPromptGuidance,
    },
    personaLiteralness: {
      id: personaLiteralnessId,
      score:
        personaLiteralnessId === 'disallowed'
          ? 1.2
          : personaLiteralnessId === 'light'
            ? 0.8
            : 0.45,
      signals:
        personaLiteralnessId === 'disallowed'
          ? ['speaker correctness matters more than persona texture on this turn']
          : personaLiteralnessId === 'light'
            ? ['some personality texture is fine, but it cannot redefine the speaker']
            : ['persona texture should stay backgrounded'],
      promptGuidance: personaLiteralnessPromptGuidance,
    },
    offscreenSelfAllowance: {
      id: offscreenSelfAllowanceId,
      score:
        offscreenSelfAllowanceId === 'contextual'
          ? roleplayHits.score
          : offscreenSelfAllowanceId === 'minimal'
            ? 0.75
            : 1.1,
      signals: uniqueItems([
        ...(roleplayHits.score > 0 ? roleplayHits.signals : []),
        ...(offscreenSelfAllowanceId === 'none'
          ? ['concrete offscreen Quinn-life claims are not part of the baseline contract']
          : []),
      ]),
      promptGuidance: offscreenSelfAllowancePromptGuidance,
    },
    roleValidationRisk: {
      id: roleValidationRiskId,
      score: roleValidationRiskScore,
      signals: roleValidationRiskSignals,
      promptGuidance: roleValidationRiskPromptGuidance,
    },
    metaRoleClarification,
    offscreenSelfDisallowed,
    promptGuidance: [
      `Speaker contract: ${speakerContractId}. ${speakerContractPromptGuidance}`,
      `Speaker position: ${speakerPositionId}. ${speakerPositionPromptGuidance}`,
      `Persona literalness: ${personaLiteralnessId}. ${personaLiteralnessPromptGuidance}`,
      `Offscreen self allowance: ${offscreenSelfAllowanceId}. ${offscreenSelfAllowancePromptGuidance}`,
      `Role validation risk: ${roleValidationRiskId}. ${roleValidationRiskPromptGuidance}`,
      metaRoleClarification
        ? 'The user is explicitly clarifying Quinn’s role or the app’s behavior. Treat that as routing, not as texture on top of the old scene.'
        : 'No explicit meta role-clarification override is active.',
    ],
  };
}

export function buildQuinnSpeakerContractPacketContext({
  packetText,
  lensMode = 'adaptive',
  correction,
  replyDiscipline,
  threadContinuity,
  turnRole,
}: {
  packetText: string;
  lensMode?: string;
  correction: QuinnCorrectionInference;
  replyDiscipline: QuinnReplyDisciplineInference;
  threadContinuity: QuinnThreadContinuityInference;
  turnRole: QuinnTurnRoleInference;
}) {
  const speakerContract = inferQuinnSpeakerContract({
    packetText,
    lensMode,
    correction,
    replyDiscipline,
    threadContinuity,
    turnRole,
  });

  return {
    speakerContract,
    context: speakerContract.promptGuidance.join(' '),
  };
}
