import type { SessionArc } from './quinnTypes';
import { buildQuinnAskPacketContext } from './quinnAskState';
import { buildQuinnChallengePacketContext } from './quinnChallengeState';
import { buildQuinnConductorPacketContext } from './quinnConductorState';
import { buildQuinnCorrectionPacketContext } from './quinnCorrectionState';
import { buildQuinnEnergyPacketContext } from './quinnEnergyState';
import { buildQuinnEndingPacketContext } from './quinnEndingState';
import { buildQuinnMemoryExpressionPacketContext } from './quinnMemoryExpressionState';
import { buildQuinnPolishPacketContext } from './quinnPolishState';
import { buildQuinnRiffPacketContext } from './quinnRiffState';
import { buildQuinnTurnRolePacketContext } from './quinnTurnRoleState';
import { buildQuinnThreadContinuityPacketContext } from './quinnThreadContinuityState';
import { buildQuinnTexturePacketContext } from './quinnTextureState';
import { buildSessionArcPacketContext } from './quinnSessionArc';

export type QuinnLensId = 'open' | 'read' | 'strategy' | 'write' | 'reality';

export type QuinnLens = {
  id: QuinnLensId;
  label: string;
  blurb: string;
  mode: string;
  ask: string;
  output: string;
};

type QuinnFollowUpLike = {
  focusText?: string;
  form?: {
    mode?: string;
    ask?: string;
    output?: string;
  };
};

export const DEFAULT_QUINN_LENS_ID: QuinnLensId = 'open';

const QUINN_LENSES: QuinnLens[] = [
  {
    id: 'open',
    label: 'Open',
    blurb: 'Let Quinn decide the strongest shape.',
    mode: 'adaptive',
    ask: 'Text back the way I would when I already know what this really is. First decide whether this wants riffing, pressure-testing, honesty, or actual advice. React first. If the thought is still discovering itself, build with it instead of forcing closure. Do not tidy it into advice unless the note clearly wants that shape, and do not sneak a helpful ending in just because it sounds neat. If the note is dressing something up and the signal is strong, be willing to challenge the framing cleanly instead of rewarding it. Use known context as already-known terrain, not as callback bait.',
    output: 'A real reply with instinct and point of view. Exploratory when the thought is exploratory, structured only when it truly needs to be, and not quietly turned into guidance by the last line. Challenge spin when the note actually earns it, co-build the thought when it is still alive, let familiarity stay metabolized instead of quoted back, and let the same Quinn voice show a little more texture when the moment invites it.',
  },
  {
    id: 'read',
    label: 'Read',
    blurb: 'Interpret the real pattern underneath it.',
    mode: 'interpretation',
    ask: 'Say what is actually going on here without stepping outside it and turning it into distant analysis. If the tension matters more than the answer, name the tension instead of rushing to wrap it up or pivoting into what to do about it. If the thought is still forming, help name the shape in progress instead of pretending it is already settled. If the note is making something prettier, vaguer, or nobler than it is, say the plainer version.',
    output: 'The real subtext, said plainly and personally, without flattening the tension or automatically resolving it. More truth-contact than polish, and more pattern-building than forced closure when the thought is still moving.',
  },
  {
    id: 'strategy',
    label: 'Strategy',
    blurb: 'Get decisive moves instead of vibes.',
    mode: 'strategy',
    ask: 'If this clearly wants a move, say what I would actually do here. Keep it blunt and human. Only turn it into a plan if the move really needs to be laid out.',
    output: 'The real move, said naturally. A short plan only when action is actually the point.',
  },
  {
    id: 'write',
    label: 'Write',
    blurb: 'Turn it into wording Quinn can actually use.',
    mode: 'writing',
    ask: 'Write the message the way I would actually send it when I mean it.',
    output: 'A clean draft that sounds lived-in, human, and actually sendable.',
  },
  {
    id: 'reality',
    label: 'Reality check',
    blurb: 'Tell the truth cleanly, even if it stings.',
    mode: 'judgment',
    ask: 'Say the honest thing the way I would if I stopped softening it. Be real, not theatrical.',
    output: 'An honest read with bite and clarity, not a lecture.',
  },
];

function cleanPacketValue(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function listPacketSection(label: string, value: string) {
  const clean = String(value || '').trim();

  if (!clean) {
    return '';
  }

  return `${label}:\n${clean}`;
}

export function getQuinnLenses() {
  return QUINN_LENSES;
}

export function getQuinnLens(lensId: QuinnLensId = DEFAULT_QUINN_LENS_ID) {
  return QUINN_LENSES.find((lens) => lens.id === lensId) || QUINN_LENSES[0];
}

export function buildQuinnPacket({
  packetTitle,
  packetText,
  lensId = DEFAULT_QUINN_LENS_ID,
  sessionArc = null,
  previousAssistantReply = '',
}: {
  packetTitle: string;
  packetText: string;
  lensId?: QuinnLensId;
  sessionArc?: SessionArc | null;
  previousAssistantReply?: string;
}) {
  const lens = getQuinnLens(lensId);
  const safeTitle = cleanPacketValue(packetTitle) || 'Untitled packet';
  const safeText = String(packetText || '').trim();
  const safePreviousAssistantReply = String(previousAssistantReply || '').trim();
  const threadContinuityContext = buildQuinnThreadContinuityPacketContext({
    packetText: safeText,
    sessionArc,
  });
  const turnRoleContext = buildQuinnTurnRolePacketContext({
    packetText: safeText,
    previousAssistantReply: safePreviousAssistantReply,
  });
  const sessionArcContext = buildSessionArcPacketContext(
    sessionArc,
    threadContinuityContext.threadContinuity
  );
  const correctionContext = buildQuinnCorrectionPacketContext({
    packetText: safeText,
    sessionArc,
    previousAssistantReply: safePreviousAssistantReply,
  });
  const memoryExpressionContext = buildQuinnMemoryExpressionPacketContext({
    packetText: safeText,
    sessionArc,
    lensMode: lens.mode,
  });
  const textureContext = buildQuinnTexturePacketContext({
    packetText: safeText,
    sessionArc,
    lensMode: lens.mode,
  });
  const riffContext = buildQuinnRiffPacketContext({
    packetText: safeText,
    sessionArc,
    lensMode: lens.mode,
  });
  const endingContext = buildQuinnEndingPacketContext({
    packetText: safeText,
    sessionArc,
    lensMode: lens.mode,
  });
  const challengeContext = buildQuinnChallengePacketContext({
    packetText: safeText,
    sessionArc,
  });
  const conductorContext = buildQuinnConductorPacketContext({
    packetText: safeText,
    sessionArc,
    lensMode: lens.mode,
    previousAssistantReply: safePreviousAssistantReply,
  });
  const askContext = buildQuinnAskPacketContext({
    packetText: safeText,
    sessionArc,
    lensMode: lens.mode,
  });
  const polishContext = buildQuinnPolishPacketContext({
    packetText: safeText,
    sessionArc,
    lensMode: lens.mode,
  });
  const energyContext = buildQuinnEnergyPacketContext({
    packetText: safeText,
    sessionArc,
  });

  return [
    listPacketSection('TITLE', safeTitle),
    listPacketSection('MODE', lens.mode),
    listPacketSection('ASK', lens.ask),
    listPacketSection('OUTPUT', lens.output),
    listPacketSection(
      'CONTEXT',
      'Treat the packet below like the thing I just said out loud. Stay inside what is actually meant. First notice whether this is exploratory, conversational, or solution-seeking. React before you organize, and only bring structure in if the note clearly needs it. If the note is just talking, just talk back. If the thought is still forming, build with it before you try to settle it. Use already-known context as already-known and let it quietly shape what you assume, skip, or sharpen. Let the same Quinn voice show more surface texture when it fits the moment, without turning into a different persona. If the user is correcting the frame, rejecting the last move, or introducing a blocker, let that update override the older momentum quickly. If the user explicitly clarifies what they meant, trust that clarified meaning over the earlier guess and stop carrying the stale interpretation forward. If the user questions Quinn\'s literal reality or self-claims, repair the frame and stop treating the earlier bit as factual biography. If cues pull in different directions, let the conductor decide how much edge, space, question-restraint, structural noticing, and course-correction the reply actually needs. Let the polish cue handle final taste: candidate framings, repetition restraint, warmth precision, micro-turn handling, aftertaste, and bounded surprise. Do not tack on options, next steps, or what might help unless the note clearly asks for that. If a question would only decorate the ending or keep the thread moving, do not ask it.'
    ),
    listPacketSection('PREMISE CHALLENGE', correctionContext.correction.premiseChallenge.id),
    listPacketSection(
      'REALITY ANCHOR MODE',
      correctionContext.correction.realityAnchorMode.id
    ),
    listPacketSection(
      'ASSISTANT SELF-CLAIM RISK',
      correctionContext.correction.assistantSelfClaimRisk.id
    ),
    listPacketSection(
      'SUPPRESS CONCRETE SELF-STATUS',
      correctionContext.correction.suppressConcreteSelfStatus ? 'true' : 'false'
    ),
    listPacketSection('FRAME REJECTION', correctionContext.correction.frameRejection.id),
    listPacketSection(
      'SOCIAL FRAME MODE',
      correctionContext.correction.socialFrameMode.id
    ),
    listPacketSection(
      'USER REQUESTS REALIGNMENT',
      correctionContext.correction.userRequestsRealignment ? 'true' : 'false'
    ),
    listPacketSection(
      'SUPPRESS ESCALATED BOUNCEBACK',
      correctionContext.correction.suppressEscalatedBounceback ? 'true' : 'false'
    ),
    listPacketSection(
      'ASSISTANT PERSONA LITERALNESS',
      conductorContext.conductor.replyDiscipline.assistantPersonaLiteralness.id
    ),
    listPacketSection(
      'CONCRETE SELF-CLAIM SUPPRESSION',
      conductorContext.conductor.replyDiscipline.concreteSelfClaimSuppression.id
    ),
    listPacketSection(
      'SELF-STATUS SPECIFICITY RISK',
      conductorContext.conductor.replyDiscipline.selfStatusSpecificityRisk.id
    ),
    listPacketSection(
      'CASUAL STATUS RESTRAINT',
      conductorContext.conductor.replyDiscipline.casualStatusRestraint.id
    ),
    listPacketSection(
      'DRAFT COMMENTARY ALLOWANCE',
      conductorContext.conductor.replyDiscipline.draftCommentaryAllowance.id
    ),
    listPacketSection(
      'RECIPIENT ROLE',
      conductorContext.conductor.replyDiscipline.recipientRole.id
    ),
    listPacketSection(
      'FLIRT TRANSFER SUPPRESSION',
      conductorContext.conductor.replyDiscipline.flirtTransferSuppression.id
    ),
    listPacketSection(
      'RECIPIENT BOUNDARY RISK',
      conductorContext.conductor.replyDiscipline.recipientBoundaryRisk.id
    ),
    listPacketSection(
      'REPLY PRESENTATION MODE',
      conductorContext.conductor.replyDiscipline.replyPresentationMode.id
    ),
    listPacketSection(
      'EXPLICIT MULTI-OPTION ASK',
      conductorContext.conductor.replyDiscipline.explicitMultiOptionAsk ? 'true' : 'false'
    ),
    listPacketSection(
      'EXPLICIT PLAYFUL INVITE',
      conductorContext.conductor.replyDiscipline.explicitPlayfulInvite ? 'true' : 'false'
    ),
    listPacketSection(
      'EXPLICIT RECIPIENT FLIRT INVITE',
      conductorContext.conductor.replyDiscipline.explicitRecipientFlirtInvite ? 'true' : 'false'
    ),
    listPacketSection(
      'SINGLE-LINE DRAFT REQUEST',
      conductorContext.conductor.replyDiscipline.singleLineDraftRequest ? 'true' : 'false'
    ),
    listPacketSection(
      'THIRD-PARTY DRAFT MODE',
      conductorContext.conductor.replyDiscipline.thirdPartyDraftMode ? 'true' : 'false'
    ),
    listPacketSection(
      'PROFESSIONAL TONE GUARD',
      conductorContext.conductor.replyDiscipline.professionalToneGuard ? 'true' : 'false'
    ),
    listPacketSection(
      'OPTION MENU SUPPRESSION',
      conductorContext.conductor.replyDiscipline.optionMenuSuppression ? 'true' : 'false'
    ),
    listPacketSection(
      'CLARIFICATION OVERRIDE',
      correctionContext.correction.clarificationOverride.id
    ),
    listPacketSection(
      'INTERPRETATION REPLACEMENT',
      correctionContext.correction.clarificationOverride.interpretationReplacement
        ? 'true'
        : 'false'
    ),
    listPacketSection(
      'CLARIFICATION TYPE',
      correctionContext.correction.clarificationOverride.clarificationType
    ),
    listPacketSection(
      'CORRECTION LATCH',
      correctionContext.correction.correctionLatch.id
    ),
    listPacketSection(
      'CONSTRAINT PRIORITY',
      correctionContext.correction.constraintPriority.id
    ),
    listPacketSection(
      'REPEAT GUARD',
      correctionContext.correction.repeatGuard.id
    ),
    listPacketSection(
      'ACKNOWLEDGMENT STYLE',
      correctionContext.correction.acknowledgmentStyle.id
    ),
    listPacketSection(
      'ACTIVE THREAD CONTINUITY',
      threadContinuityContext.threadContinuity.hasActiveThread ? 'true' : 'false'
    ),
    listPacketSection(
      'LIVE SUBJECT DOMINANCE',
      threadContinuityContext.threadContinuity.liveSubjectDominance.id
    ),
    listPacketSection(
      'THREAD CARRYOVER MODE',
      threadContinuityContext.threadContinuity.threadCarryoverMode.id
    ),
    listPacketSection(
      'STALE FRAME RISK',
      threadContinuityContext.threadContinuity.staleFrameRisk.id
    ),
    listPacketSection(
      'FRAME CONTINUATION',
      threadContinuityContext.threadContinuity.frameContinuation ? 'true' : 'false'
    ),
    listPacketSection('TURN ROLE ANCHOR', turnRoleContext.turnRole.turnRoleAnchor.id),
    listPacketSection(
      'PREVIOUS ASSISTANT ASKED QUESTION',
      turnRoleContext.turnRole.previousAssistantAskedQuestion ? 'true' : 'false'
    ),
    listPacketSection('ADJACENCY MODE', turnRoleContext.turnRole.adjacencyMode.id),
    listPacketSection(
      'SUPPRESS ASSISTANT STATUS PATTERN',
      turnRoleContext.turnRole.shouldSuppressAssistantStatusPattern ? 'true' : 'false'
    ),
    listPacketSection('LOCAL COURSE CORRECTION', correctionContext.context),
    listPacketSection('THREAD CONTINUITY POLICY', threadContinuityContext.context),
    listPacketSection('TURN ROLE POLICY', turnRoleContext.context),
    listPacketSection('MEMORY EXPRESSION', memoryExpressionContext.context),
    listPacketSection('PERSONALITY TEXTURE', textureContext.context),
    listPacketSection('RIFF STANCE', riffContext.context),
    listPacketSection('CHALLENGE STANCE', challengeContext.context),
    listPacketSection('ASK POLICY', askContext.context),
    listPacketSection('ENERGY MATCH', energyContext.context),
    listPacketSection('ENDING SHAPE', endingContext.context),
    listPacketSection('CONDUCTOR', conductorContext.context),
    listPacketSection('POLISH', polishContext.context),
    sessionArcContext,
    listPacketSection('PACKET', safeText),
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export function inferQuinnLensFromFollowUp(
  followUp: QuinnFollowUpLike | null | undefined
): QuinnLensId {
  const combined = [
    String(followUp?.form?.mode || ''),
    String(followUp?.form?.ask || ''),
    String(followUp?.form?.output || ''),
    String(followUp?.focusText || ''),
  ]
    .join(' ')
    .toLowerCase();

  if (/write|draft|message|wording|note/.test(combined)) {
    return 'write';
  }

  if (/strategy|plan|next move|priority|tactic|sequence/.test(combined)) {
    return 'strategy';
  }

  if (/read|pattern|subtext|dynamic|what is going on/.test(combined)) {
    return 'read';
  }

  if (/truth|reality|real|stop romanticizing|judgment/.test(combined)) {
    return 'reality';
  }

  return DEFAULT_QUINN_LENS_ID;
}
