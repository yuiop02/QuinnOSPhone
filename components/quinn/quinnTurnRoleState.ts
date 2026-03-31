export type QuinnTurnRoleAnchorId =
  | 'userReply'
  | 'userAsk'
  | 'userClarification'
  | 'userPivot'
  | 'unknown';

export type QuinnAdjacencyModeId =
  | 'answerUserReply'
  | 'answerUserAsk'
  | 'clarify'
  | 'pivot'
  | 'continueAnsweringUser';

type QuinnTurnRoleSignalPattern = {
  pattern: RegExp;
  label: string;
  score: number;
};

type QuinnTurnRoleBucket<T extends string> = {
  id: T;
  score: number;
  signals: string[];
  promptGuidance: string;
};

export type QuinnTurnRoleInference = {
  previousAssistantAskedQuestion: boolean;
  turnRoleAnchor: QuinnTurnRoleBucket<QuinnTurnRoleAnchorId>;
  adjacencyMode: QuinnTurnRoleBucket<QuinnAdjacencyModeId>;
  shouldSuppressAssistantStatusPattern: boolean;
  promptGuidance: string[];
};

export const QUINN_TURN_ROLE_TUNING = {
  userReply: {
    threshold: 1.25,
    shortAnswerWordMax: 14,
  },
  userAsk: {
    threshold: 1.15,
  },
  userClarification: {
    threshold: 1.1,
  },
  userPivot: {
    threshold: 0.95,
  },
} as const;

const PREVIOUS_ASSISTANT_QUESTION_PATTERNS: readonly QuinnTurnRoleSignalPattern[] = [
  {
    pattern: /\byou\?\s*$/i,
    label: 'the previous assistant turn ended by throwing the turn back to the user',
    score: 1.3,
  },
  {
    pattern: /\b(?:and you|how about you|what about you)\??\s*$/i,
    label: "the previous assistant turn asked for the user's side",
    score: 1.15,
  },
  {
    pattern: /\b(?:how(?:'s| is) it going|what(?:'s| is) up|how are you)\b[^.]*\?\s*$/i,
    label: 'the previous assistant turn asked a status question',
    score: 1.05,
  },
];

const USER_REPLY_PATTERNS: readonly QuinnTurnRoleSignalPattern[] = [
  {
    pattern: /^(?:pretty good|good|fine|okay|ok|alright|not bad|tired|sleepy|busy|scattered)\b/i,
    label: 'the newest turn opens like a direct answer to a status question',
    score: 1.0,
  },
  {
    pattern: /\b(?:i(?:'m| am)\s+(?:good|fine|okay|ok|alright|pretty good|not bad|tired|sleepy|busy|scattered)|i(?:'m| am)\s+just)\b/i,
    label: 'the newest turn gives a first-person status update',
    score: 0.9,
  },
  {
    pattern: /\b(?:just eating|eating breakfast|heading to bed|working on|tweaking|making|fixing|building)\b/i,
    label: 'the newest turn adds concrete current-life detail',
    score: 0.7,
  },
];

const USER_ASK_PATTERNS: readonly QuinnTurnRoleSignalPattern[] = [
  {
    pattern: /\?\s*$/i,
    label: 'the newest turn ends as a direct question',
    score: 0.85,
  },
  {
    pattern: /\b(?:what|why|how|when|where|who|can you|would you|should i|do you)\b/i,
    label: 'the newest turn reads like a new question for Quinn',
    score: 0.55,
  },
];

const USER_CLARIFICATION_PATTERNS: readonly QuinnTurnRoleSignalPattern[] = [
  {
    pattern: /\b(?:that'?s not what i meant|that is not what i meant|i meant|i was using that as|i used that as|the subject was you|not as the topic)\b/i,
    label: 'the newest turn is explicitly clarifying meaning',
    score: 1.2,
  },
  {
    pattern: /\b(?:i was saying|i was calling you|i meant it as|not that, this)\b/i,
    label: 'the newest turn is replacing the old read with the intended one',
    score: 0.85,
  },
];

const USER_PIVOT_PATTERNS: readonly QuinnTurnRoleSignalPattern[] = [
  {
    pattern: /\b(?:anyway|either way|right now|for real|actually)\b/i,
    label: 'the newest turn marks a conversational pivot',
    score: 0.45,
  },
  {
    pattern: /\b(?:just|currently|tonight|today)\b/i,
    label: 'the newest turn is grounded in a current moment',
    score: 0.25,
  },
];

function cleanText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function uniqueItems(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function countWords(text: string) {
  return cleanText(text).split(/\s+/).filter(Boolean).length;
}

function collectPatternHits(
  text: string,
  patterns: readonly QuinnTurnRoleSignalPattern[]
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

export function inferQuinnTurnRoleState({
  packetText,
  previousAssistantReply = '',
}: {
  packetText: string;
  previousAssistantReply?: string;
}): QuinnTurnRoleInference {
  const cleanPacket = cleanText(packetText);
  const cleanPreviousAssistantReply = cleanText(previousAssistantReply);
  const packetWordCount = countWords(cleanPacket);
  const previousQuestionHits = collectPatternHits(
    cleanPreviousAssistantReply,
    PREVIOUS_ASSISTANT_QUESTION_PATTERNS
  );
  const userReplyHits = collectPatternHits(cleanPacket, USER_REPLY_PATTERNS);
  const userAskHits = collectPatternHits(cleanPacket, USER_ASK_PATTERNS);
  const userClarificationHits = collectPatternHits(cleanPacket, USER_CLARIFICATION_PATTERNS);
  const userPivotHits = collectPatternHits(cleanPacket, USER_PIVOT_PATTERNS);
  const previousAssistantAskedQuestion =
    previousQuestionHits.score >= 0.9 ||
    /\?\s*$/.test(cleanPreviousAssistantReply);

  let userReplyScore = userReplyHits.score;
  userReplyScore += previousAssistantAskedQuestion ? 0.7 : 0;
  userReplyScore +=
    packetWordCount > 0 &&
    packetWordCount <= QUINN_TURN_ROLE_TUNING.userReply.shortAnswerWordMax &&
    userAskHits.score < 0.85
      ? 0.25
      : 0;
  userReplyScore -= userClarificationHits.score > 0 ? 0.35 : 0;

  let userAskScore = userAskHits.score;
  userAskScore += !previousAssistantAskedQuestion && /\?\s*$/.test(cleanPacket) ? 0.35 : 0;
  userAskScore -= userReplyHits.score > 0 ? 0.2 : 0;

  const userClarificationScore = userClarificationHits.score;
  let userPivotScore = userPivotHits.score;
  userPivotScore +=
    !previousAssistantAskedQuestion && userReplyHits.score > 0 && packetWordCount >= 8 ? 0.35 : 0;

  let turnRoleAnchorId: QuinnTurnRoleAnchorId = 'unknown';
  let turnRoleScore = 0;

  if (userClarificationScore >= QUINN_TURN_ROLE_TUNING.userClarification.threshold) {
    turnRoleAnchorId = 'userClarification';
    turnRoleScore = userClarificationScore;
  } else if (
    previousAssistantAskedQuestion &&
    userReplyScore >= QUINN_TURN_ROLE_TUNING.userReply.threshold &&
    userAskScore < userReplyScore
  ) {
    turnRoleAnchorId = 'userReply';
    turnRoleScore = userReplyScore;
  } else if (userAskScore >= QUINN_TURN_ROLE_TUNING.userAsk.threshold) {
    turnRoleAnchorId = 'userAsk';
    turnRoleScore = userAskScore;
  } else if (userPivotScore >= QUINN_TURN_ROLE_TUNING.userPivot.threshold) {
    turnRoleAnchorId = 'userPivot';
    turnRoleScore = userPivotScore;
  }

  const adjacencyModeId: QuinnAdjacencyModeId =
    turnRoleAnchorId === 'userReply'
      ? 'answerUserReply'
      : turnRoleAnchorId === 'userAsk'
        ? 'answerUserAsk'
        : turnRoleAnchorId === 'userClarification'
          ? 'clarify'
          : turnRoleAnchorId === 'userPivot'
            ? 'pivot'
            : 'continueAnsweringUser';

  const shouldSuppressAssistantStatusPattern =
    turnRoleAnchorId === 'userReply' && previousAssistantAskedQuestion;

  const turnRoleSignals = uniqueItems([
    ...(turnRoleAnchorId === 'userReply' ? previousQuestionHits.signals : []),
    ...(turnRoleAnchorId === 'userReply' ? userReplyHits.signals : []),
    ...(turnRoleAnchorId === 'userAsk' ? userAskHits.signals : []),
    ...(turnRoleAnchorId === 'userClarification' ? userClarificationHits.signals : []),
    ...(turnRoleAnchorId === 'userPivot' ? userPivotHits.signals : []),
  ]);

  const turnRolePromptGuidance =
    turnRoleAnchorId === 'userReply'
      ? "The newest user turn is answering Quinn's previous question. Respond to the user's update directly. Do not restate Quinn's own earlier status or throw the same question back again."
      : turnRoleAnchorId === 'userAsk'
        ? 'The newest user turn is asking Quinn something new. Answer that question directly instead of leaning on prior thread posture.'
        : turnRoleAnchorId === 'userClarification'
          ? 'The newest user turn is clarifying meaning or reference. Replace the older read and answer from the clarified sense.'
          : turnRoleAnchorId === 'userPivot'
            ? 'The newest user turn is pivoting the exchange. Let the new turn function lead without overcommitting to the old conversational lane.'
            : 'No special turn-role override is active beyond normal conversation flow.';

  const adjacencyPromptGuidance =
    adjacencyModeId === 'answerUserReply'
      ? "Adjacency mode: answer the user's reply. Treat the latest note as a response to Quinn, not as a repeat of Quinn's own earlier stance."
      : adjacencyModeId === 'answerUserAsk'
        ? "Adjacency mode: answer the user's question."
        : adjacencyModeId === 'clarify'
          ? 'Adjacency mode: clarify. Briefly register the correction, then answer from the corrected meaning.'
          : adjacencyModeId === 'pivot'
            ? 'Adjacency mode: pivot. Follow the new live move instead of replaying the earlier scene.'
            : 'Adjacency mode: continue answering the user from the live note.';

  return {
    previousAssistantAskedQuestion,
    turnRoleAnchor: {
      id: turnRoleAnchorId,
      score: turnRoleScore,
      signals: turnRoleSignals,
      promptGuidance: turnRolePromptGuidance,
    },
    adjacencyMode: {
      id: adjacencyModeId,
      score:
        adjacencyModeId === 'answerUserReply'
          ? userReplyScore
          : adjacencyModeId === 'answerUserAsk'
            ? userAskScore
            : adjacencyModeId === 'clarify'
              ? userClarificationScore
              : userPivotScore,
      signals: turnRoleSignals,
      promptGuidance: adjacencyPromptGuidance,
    },
    shouldSuppressAssistantStatusPattern,
    promptGuidance: [
      `Turn role anchor: ${turnRoleAnchorId}. ${turnRolePromptGuidance}`,
      `Previous assistant asked question: ${previousAssistantAskedQuestion ? 'true' : 'false'}.`,
      adjacencyPromptGuidance,
      shouldSuppressAssistantStatusPattern
        ? 'Suppress stale assistant-status continuation. The user just answered Quinn.'
        : 'No special stale assistant-status suppression is active.',
    ],
  };
}

export function buildQuinnTurnRolePacketContext({
  packetText,
  previousAssistantReply = '',
}: {
  packetText: string;
  previousAssistantReply?: string;
}) {
  const turnRole = inferQuinnTurnRoleState({
    packetText,
    previousAssistantReply,
  });

  return {
    turnRole,
    context: turnRole.promptGuidance.join(' '),
  };
}
