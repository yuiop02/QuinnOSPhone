import type { QuinnCorrectionInference } from './quinnCorrectionState';
import type { QuinnReplyDisciplineInference } from './quinnReplyDisciplineState';
import type { QuinnThreadContinuityInference } from './quinnThreadContinuityState';
import type { QuinnTurnRoleInference } from './quinnTurnRoleState';

export type QuinnConversationalCoherencePriorityId = 'low' | 'medium' | 'high';
export type QuinnStyleOverrideRiskId = 'none' | 'light' | 'strong';
export type QuinnStalePatternPressureId = 'none' | 'light' | 'strong';
export type QuinnGroundedReplyModeId =
  | 'default'
  | 'corrective'
  | 'draft'
  | 'conversational';

type QuinnSignalBucket<T extends string> = {
  id: T;
  score: number;
  signals: string[];
  promptGuidance: string;
};

export type QuinnConversationalCoherenceInference = {
  latestTurnRelevanceScore: number;
  normalSocialInterpretationScore: number;
  conversationalCoherencePriority: QuinnSignalBucket<QuinnConversationalCoherencePriorityId>;
  styleOverrideRisk: QuinnSignalBucket<QuinnStyleOverrideRiskId>;
  stalePatternPressure: QuinnSignalBucket<QuinnStalePatternPressureId>;
  groundedReplyMode: {
    id: QuinnGroundedReplyModeId;
    promptGuidance: string;
  };
  promptGuidance: string[];
};

export const QUINN_CONVERSATIONAL_COHERENCE_TUNING = {
  priority: {
    mediumThreshold: 1.15,
    highThreshold: 2.2,
  },
  styleOverrideRisk: {
    lightThreshold: 0.95,
    strongThreshold: 1.85,
  },
  stalePatternPressure: {
    lightThreshold: 0.95,
    strongThreshold: 1.8,
  },
} as const;

function cleanText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function countWords(text: string) {
  return cleanText(text).split(/\s+/).filter(Boolean).length;
}

function uniqueItems(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

export function inferQuinnConversationalCoherence({
  packetText,
  correction,
  replyDiscipline,
  threadContinuity,
  turnRole,
}: {
  packetText: string;
  correction: QuinnCorrectionInference;
  replyDiscipline: QuinnReplyDisciplineInference;
  threadContinuity: QuinnThreadContinuityInference;
  turnRole: QuinnTurnRoleInference;
}): QuinnConversationalCoherenceInference {
  const wordCount = countWords(packetText);

  const latestTurnRelevanceScore =
    threadContinuity.liveSubjectDominance.score +
    (turnRole.turnRoleAnchor.id === 'userReply' ? 0.8 : 0) +
    (turnRole.turnRoleAnchor.id === 'userAsk' ? 0.72 : 0) +
    (turnRole.turnRoleAnchor.id === 'userClarification' ? 0.95 : 0) +
    (threadContinuity.directComplaintAboutConversation ? 1.15 : 0) +
    (replyDiscipline.singleLineDraftRequest ? 0.7 : 0) +
    (replyDiscipline.thirdPartyDraftMode ? 0.8 : 0) +
    (replyDiscipline.thirdPartyGreetingMode ? 0.95 : 0) +
    (correction.correctionLatch.id !== 'none' ? 0.65 : 0) +
    (correction.clarificationOverride.id !== 'none' ? 0.75 : 0) +
    (correction.constraintPriority.id !== 'none' ? 0.55 : 0) +
    (correction.frameRejection.id !== 'none' ? 0.7 : 0) +
    (correction.premiseChallenge.id !== 'none' ? 0.75 : 0);

  const normalSocialInterpretationScore =
    (replyDiscipline.thirdPartyGreetingMode ? 1.35 : 0) +
    (replyDiscipline.thirdPartyDraftMode ? 1.05 : 0) +
    (replyDiscipline.singleLineDraftRequest ? 0.85 : 0) +
    (turnRole.turnRoleAnchor.id === 'userReply' ? 1.0 : 0) +
    (turnRole.turnRoleAnchor.id === 'userAsk' ? 0.9 : 0) +
    (turnRole.turnRoleAnchor.id === 'userClarification' ? 1.0 : 0) +
    (threadContinuity.directComplaintAboutConversation ? 1.2 : 0) +
    (replyDiscipline.casualStatusRestraint.id === 'high' ? 0.7 : 0) +
    (replyDiscipline.casualStatusRestraint.id === 'medium' ? 0.3 : 0) +
    (turnRole.previousAssistantAskedQuestion && turnRole.turnRoleAnchor.id === 'userReply'
      ? 0.45
      : 0) +
    (wordCount > 0 && wordCount <= 18 ? 0.2 : 0);

  const styleOverrideRiskScore =
    (threadContinuity.suppressTemplateReuse ? 1.15 : 0) +
    (threadContinuity.staleTemplateInterrupt.id === 'hard' ? 1.05 : 0) +
    (threadContinuity.staleTemplateInterrupt.id === 'light' ? 0.45 : 0) +
    (threadContinuity.staleFrameRisk.id === 'strong' ? 0.85 : 0) +
    (threadContinuity.staleFrameRisk.id === 'light' ? 0.35 : 0) +
    (turnRole.shouldSuppressAssistantStatusPattern ? 0.75 : 0) +
    (correction.frameRejection.id !== 'none' ? 0.9 : 0) +
    (correction.socialFrameMode.id !== 'continue' ? 0.8 : 0) +
    (correction.suppressEscalatedBounceback ? 0.65 : 0) +
    (correction.premiseChallenge.id !== 'none' ? 0.8 : 0) +
    (correction.clarificationOverride.id !== 'none' ? 0.7 : 0) +
    (correction.clarificationOverride.interpretationReplacement ? 0.4 : 0) +
    (replyDiscipline.thirdPartyGreetingMode ? 1.0 : 0) +
    (replyDiscipline.thirdPartyDraftMode ? 0.7 : 0) +
    (replyDiscipline.recipientBoundaryRisk.id !== 'none' ? 0.7 : 0) +
    (replyDiscipline.recipientInviteLeakRisk.id !== 'none' ? 0.75 : 0) +
    (replyDiscipline.professionalToneGuard ? 0.45 : 0) -
    (replyDiscipline.explicitPlayfulInvite ? 0.3 : 0) -
    (replyDiscipline.explicitRecipientFlirtInvite ? 0.8 : 0) -
    (replyDiscipline.explicitInvitationAsk ? 0.8 : 0);

  const stalePatternPressureScore =
    (threadContinuity.suppressTemplateReuse ? 1.2 : 0) +
    (threadContinuity.staleTemplateInterrupt.id === 'hard' ? 0.95 : 0) +
    (threadContinuity.staleTemplateInterrupt.id === 'light' ? 0.45 : 0) +
    (threadContinuity.staleFrameRisk.id === 'strong' ? 0.85 : 0) +
    (threadContinuity.staleFrameRisk.id === 'light' ? 0.35 : 0) +
    (turnRole.shouldSuppressAssistantStatusPattern ? 0.8 : 0) +
    (correction.repeatGuard.id !== 'none' ? 0.65 : 0) +
    (threadContinuity.frameContinuation && threadContinuity.liveSubjectDominance.id === 'low'
      ? 0.35
      : 0);

  const groundedReplyModeId: QuinnGroundedReplyModeId =
    replyDiscipline.thirdPartyDraftMode || replyDiscipline.singleLineDraftRequest
      ? 'draft'
      : threadContinuity.directComplaintAboutConversation ||
          correction.correctionLatch.id !== 'none' ||
          correction.clarificationOverride.id !== 'none' ||
          correction.frameRejection.id !== 'none' ||
          correction.premiseChallenge.id !== 'none' ||
          correction.constraintPriority.id !== 'none' ||
          correction.repeatGuard.id !== 'none'
        ? 'corrective'
        : turnRole.turnRoleAnchor.id === 'userReply' ||
            turnRole.turnRoleAnchor.id === 'userAsk' ||
            replyDiscipline.casualStatusRestraint.id !== 'low'
          ? 'conversational'
          : 'default';

  const coherencePriorityScore =
    latestTurnRelevanceScore * 0.42 +
    normalSocialInterpretationScore * 0.7 +
    (groundedReplyModeId === 'corrective' ? 1.05 : 0) +
    (groundedReplyModeId === 'draft' ? 1.0 : 0) +
    (groundedReplyModeId === 'conversational' ? 0.45 : 0) +
    (styleOverrideRiskScore >=
    QUINN_CONVERSATIONAL_COHERENCE_TUNING.styleOverrideRisk.strongThreshold
      ? 0.7
      : styleOverrideRiskScore >=
            QUINN_CONVERSATIONAL_COHERENCE_TUNING.styleOverrideRisk.lightThreshold
        ? 0.25
        : 0) +
    (stalePatternPressureScore >=
    QUINN_CONVERSATIONAL_COHERENCE_TUNING.stalePatternPressure.strongThreshold
      ? 0.75
      : stalePatternPressureScore >=
            QUINN_CONVERSATIONAL_COHERENCE_TUNING.stalePatternPressure.lightThreshold
        ? 0.3
        : 0);

  const conversationalCoherencePriorityId: QuinnConversationalCoherencePriorityId =
    coherencePriorityScore >= QUINN_CONVERSATIONAL_COHERENCE_TUNING.priority.highThreshold
      ? 'high'
      : coherencePriorityScore >=
            QUINN_CONVERSATIONAL_COHERENCE_TUNING.priority.mediumThreshold
        ? 'medium'
        : 'low';

  const styleOverrideRiskId: QuinnStyleOverrideRiskId =
    styleOverrideRiskScore >=
    QUINN_CONVERSATIONAL_COHERENCE_TUNING.styleOverrideRisk.strongThreshold
      ? 'strong'
      : styleOverrideRiskScore >=
            QUINN_CONVERSATIONAL_COHERENCE_TUNING.styleOverrideRisk.lightThreshold
        ? 'light'
        : 'none';

  const stalePatternPressureId: QuinnStalePatternPressureId =
    stalePatternPressureScore >=
    QUINN_CONVERSATIONAL_COHERENCE_TUNING.stalePatternPressure.strongThreshold
      ? 'strong'
      : stalePatternPressureScore >=
            QUINN_CONVERSATIONAL_COHERENCE_TUNING.stalePatternPressure.lightThreshold
        ? 'light'
        : 'none';

  const groundedReplyModePromptGuidance =
    groundedReplyModeId === 'corrective'
      ? 'This turn wants grounded repair first. Answer the complaint, correction, contradiction, or clarified meaning before adding Quinn texture.'
      : groundedReplyModeId === 'draft'
        ? 'This turn wants usable wording first. Write the socially coherent line before adding any extra flavor.'
        : groundedReplyModeId === 'conversational'
          ? 'This turn wants normal conversation first. Start with the most ordinary coherent human reading of the latest turn, then let Quinn style color it.'
          : 'No special grounded-reply mode is active beyond baseline conversational coherence.';

  const coherencePromptGuidance =
    conversationalCoherencePriorityId === 'high'
      ? 'Conversational coherence is high-priority here. Start from the latest turn, answer the most socially coherent reading first, and only then let Quinn texture layer on top.'
      : conversationalCoherencePriorityId === 'medium'
        ? 'Give ordinary conversational coherence a little priority here. Relevance and social sense should beat ornamental style if they pull apart.'
        : 'No extra coherence prioritization is needed beyond normal judgment.';

  const styleOverrideRiskPromptGuidance =
    styleOverrideRiskId === 'strong'
      ? 'Style override risk is strong. If persona texture, thread momentum, or cleverness conflicts with coherence, coherence wins.'
      : styleOverrideRiskId === 'light'
        ? 'There is some style override risk. Keep the stylish move subordinate to the grounded one.'
        : 'No special style-override risk is active.';

  const stalePatternPressurePromptGuidance =
    stalePatternPressureId === 'strong'
      ? 'Stale pattern pressure is strong. Do not let the earlier answer shape, thread template, or familiar Quinn move reassert itself over the latest turn.'
      : stalePatternPressureId === 'light'
        ? 'There is some stale pattern pressure. Keep old patterns secondary unless the newest turn clearly wants them.'
        : 'No special stale-pattern pressure is active.';

  const prioritySignals = uniqueItems([
    ...(threadContinuity.liveSubjectDominance.id !== 'low'
      ? ['the latest turn has enough live material to stand on its own']
      : []),
    ...(turnRole.turnRoleAnchor.id === 'userReply'
      ? ['the user is replying inside an active exchange']
      : []),
    ...(turnRole.turnRoleAnchor.id === 'userAsk'
      ? ['the user is directly asking Quinn something']
      : []),
    ...(turnRole.turnRoleAnchor.id === 'userClarification'
      ? ['the user is clarifying meaning or intent']
      : []),
    ...(replyDiscipline.thirdPartyDraftMode
      ? ['the user wants wording for someone else']
      : []),
    ...(threadContinuity.directComplaintAboutConversation
      ? ['the user is explicitly challenging Quinn’s conversational fit']
      : []),
  ]);

  const styleRiskSignals = uniqueItems([
    ...(threadContinuity.suppressTemplateReuse
      ? ['stale template reuse could displace the live turn']
      : []),
    ...(threadContinuity.staleFrameRisk.id !== 'none'
      ? ['thread carryover could outrun common-sense relevance']
      : []),
    ...(turnRole.shouldSuppressAssistantStatusPattern
      ? ['the older assistant answer pattern could repeat itself']
      : []),
    ...(replyDiscipline.thirdPartyGreetingMode
      ? ['recipient-facing drafting should stay simpler than home-thread banter']
      : []),
  ]);

  const stalePatternSignals = uniqueItems([
    ...(threadContinuity.staleTemplateInterrupt.id !== 'none'
      ? ['a live interrupt signal is competing with thread-template inertia']
      : []),
    ...(threadContinuity.staleFrameRisk.id !== 'none'
      ? ['older thread patterns could still dominate if left unchecked']
      : []),
    ...(correction.repeatGuard.id !== 'none'
      ? ['recent local repetition pressure is active']
      : []),
  ]);

  return {
    latestTurnRelevanceScore,
    normalSocialInterpretationScore,
    conversationalCoherencePriority: {
      id: conversationalCoherencePriorityId,
      score: coherencePriorityScore,
      signals: prioritySignals,
      promptGuidance: coherencePromptGuidance,
    },
    styleOverrideRisk: {
      id: styleOverrideRiskId,
      score: styleOverrideRiskScore,
      signals: styleRiskSignals,
      promptGuidance: styleOverrideRiskPromptGuidance,
    },
    stalePatternPressure: {
      id: stalePatternPressureId,
      score: stalePatternPressureScore,
      signals: stalePatternSignals,
      promptGuidance: stalePatternPressurePromptGuidance,
    },
    groundedReplyMode: {
      id: groundedReplyModeId,
      promptGuidance: groundedReplyModePromptGuidance,
    },
    promptGuidance: [
      `Conversational coherence priority: ${conversationalCoherencePriorityId}. ${coherencePromptGuidance}`,
      `Grounded reply mode: ${groundedReplyModeId}. ${groundedReplyModePromptGuidance}`,
      `Style override risk: ${styleOverrideRiskId}. ${styleOverrideRiskPromptGuidance}`,
      `Stale pattern pressure: ${stalePatternPressureId}. ${stalePatternPressurePromptGuidance}`,
      `Latest-turn relevance score: ${Math.round(latestTurnRelevanceScore * 100) / 100}.`,
      `Normal-social-interpretation score: ${Math.round(normalSocialInterpretationScore * 100) / 100}.`,
    ],
  };
}
