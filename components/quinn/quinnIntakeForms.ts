import type { ComponentProps } from 'react';

import type Feather from '@expo/vector-icons/Feather';

export type QuinnIntakeFormIconName = ComponentProps<typeof Feather>['name'];

export type QuinnIntakeFormId =
  | 'intake-compass'
  | 'decision-intake'
  | 'feeling-intake'
  | 'body-nervous-system-intake'
  | 'grief-wave-intake'
  | 'work-situation-intake'
  | 'relationship-read-intake'
  | 'creative-idea-intake'
  | 'memory-capture-intake'
  | 'therapy-packet-intake'
  | 'default-map'
  | 'outcome-log';

export type QuinnPacketKindId =
  | QuinnIntakeFormId
  | 'draft-pattern-card'
  | 'pattern-card-save-intent'
  | 'pattern-card-application'
  | 'saved-pattern-card-review'
  | 'saved-card-shelf-review'
  | 'release-readiness-audit'
  | 'manual-field-test-checklist'
  | 'memory-hygiene-review';

export type QuinnIntakeFormDefinition = {
  id: QuinnIntakeFormId;
  label: string;
  icon: QuinnIntakeFormIconName;
  template: string[];
};

export type QuinnIntakeFormPacketKind = {
  id: QuinnPacketKindId;
  label: string;
  icon: QuinnIntakeFormIconName;
  marker: string;
  isOutcomeLog: boolean;
};

export const QUINNOS_RESPONSE_PROTOCOL = [
  '',
  'QUINNOS RESPONSE PROTOCOL',
  '',
  'REN OUTPUT STRUCTURE:',
  'Use the completed intake above as the source material. Do not flatten it into generic advice, perform certainty, or turn it into obedience machinery.',
  '',
  'CLEAN READ:',
  '[The cleanest read of what is happening.]',
  '',
  'CORE PATTERN OR SIGNAL:',
  '[The pattern, signal, hidden function, or material type QuinnOS should notice.]',
  '',
  'PROTECTED NEED:',
  '[The valid need that deserves care or protection.]',
  '',
  'RISK / DISTORTION / UNCERTAINTY:',
  '[What may be biased, incomplete, body-driven, old-wound-driven, high-cost, or genuinely uncertain.]',
  '',
  'MOST PROBABLE NEXT BEST MOVE:',
  '[The move most likely to protect Future Quinn while honoring the real signal.]',
  '',
  'TINY VERSION:',
  '[The smallest version Quinn can do if capacity is low.]',
  '',
  'RETURN PATH:',
  '[If Quinn falls off, spirals, avoids, overdoes it, or cannot act, name the smallest way back.]',
  '',
  'CONFIDENCE LEVEL:',
  '[Low / medium / high, with one sentence about why.]',
  '',
  'WHAT WOULD CHANGE THE ANSWER:',
  '[The missing information, outcome, state change, or real-world signal that would recalibrate this read.]',
];

export function buildQuinnIntakeFormPacket(form: QuinnIntakeFormDefinition) {
  return [...form.template, ...QUINNOS_RESPONSE_PROTOCOL].join('\n');
}

export type QuinnOutcomeLogPrefillSource = {
  packetText?: string | null;
  writtenResult?: string | null;
};

export type QuinnOutcomeLogMinimumCaptureField =
  | 'WHAT I ACTUALLY DID:'
  | 'IT CAUSED:'
  | 'DID IT HELP?';

export type QuinnOutcomeLogMinimumCaptureStatus = {
  isOutcomeLog: boolean;
  hasMinimumData: boolean;
  missingRequiredFields: QuinnOutcomeLogMinimumCaptureField[];
};

export type QuinnOutcomeLogHistoryPreview = {
  actuallyDid: string;
  itCaused: string;
  didItHelp: string;
};

export type QuinnPatternCandidatePreview = {
  actuallyDid: string;
  itCaused: string;
  didItHelp: string;
  whatWorked: string;
  whatMissed: string;
  whatQuinnosShouldRemember: string;
  candidateLine: string;
  evidenceLine: string;
};

export type QuinnDraftPatternCardHistoryPreview = {
  candidate: string;
  evidence: string;
  confidence: string;
  shouldMatter: string;
  shouldNotMatter: string;
  mightRemember: string;
};

export type QuinnDraftPatternCardResultPreview = {
  possiblePattern: string;
  evidence: string;
  overgeneralizationRisk: string;
  beforeStoringDecision: string;
};

export type QuinnPatternCardSaveIntentPacketPreview = {
  possiblePattern: string;
  evidence: string;
  sourceRunId: string;
};

export type QuinnPatternCardSaveIntentResultPreview = {
  saveReadiness: string;
  shouldPreserveLater: string;
  clarifyBeforeStorage: string;
  storageRisk: string;
  nextBestMove: string;
};

export type QuinnPatternCardApplicationPacketPreview = {
  savedPattern: string;
  evidence: string;
  currentSituation: string;
};

export type QuinnPatternCardApplicationResultPreview = {
  applies: string;
  supportingEvidence: string;
  limitsMisfit: string;
  overuseRisk: string;
  nextBestMove: string;
};

export type QuinnSavedPatternCardReviewPacketPreview = {
  savedPattern: string;
  evidence: string;
  savedAt: string;
  pinnedAt: string;
  retiredAt: string;
};

export type QuinnSavedPatternCardReviewResultPreview = {
  lifecycleRead: string;
  keepReviseRetireRestore: string;
  why: string;
  riskIfKeptAsIs: string;
  nextBestCardAction: string;
};

export type QuinnSavedCardShelfReviewPacketPreview = {
  activeSavedCount: number | null;
  retiredSavedCount: number | null;
  pinnedSavedCount: number | null;
  withSaveIntentReviewCount: number | null;
  withApplicationCheckCount: number | null;
  withLifecycleReviewCount: number | null;
  filter: string;
  search: string;
  sort: string;
};

export type QuinnSavedCardShelfReviewResultPreview = {
  shelfRead: string;
  mostUsefulActiveCards: string;
  staleRiskyOverfitCards: string;
  missingOrUndertestedAreas: string;
  nextBestManualCardAction: string;
};

export type QuinnDraftPatternCardSource = QuinnPatternCandidatePreview;

export type QuinnSessionPatternCardDraftSource = {
  possiblePattern: string;
  evidence: string;
  overgeneralizationRisk: string;
  beforeStoringDecision: string;
  createdAt?: string;
  sourceRunId?: string;
};

export type QuinnPatternCardSaveIntentSource = QuinnSessionPatternCardDraftSource;

export type QuinnPatternCardApplicationSource = QuinnSessionPatternCardDraftSource & {
  savedAt?: string;
  saveIntentReview?: QuinnPatternCardSaveIntentResultPreview | null;
};

export type QuinnSavedPatternCardReviewSource = QuinnPatternCardApplicationSource & {
  pinnedAt?: string | null;
  retiredAt?: string | null;
  retiredReason?: string | null;
  applicationReview?: QuinnPatternCardApplicationResultPreview | null;
  lifecycleReview?: QuinnSavedPatternCardReviewResultPreview | null;
};

export type QuinnSavedCardShelfReviewCard = {
  possiblePattern: string;
  savedAt: string;
  pinnedAt?: string | null;
  retiredAt?: string | null;
  retiredReason?: string | null;
  evidence: string;
  overgeneralizationRisk: string;
  saveIntentReview?: QuinnPatternCardSaveIntentResultPreview | null;
  applicationReview?: QuinnPatternCardApplicationResultPreview | null;
  lifecycleReview?: QuinnSavedPatternCardReviewResultPreview | null;
};

export type QuinnSavedCardShelfReviewSource = {
  counts: {
    activeSavedCards: number;
    retiredSavedCards: number;
    pinnedSavedCards: number;
    withSaveIntentReview: number;
    withApplicationCheck: number;
    withLifecycleReview: number;
    sessionCards?: number;
  };
  currentView: {
    filter: string;
    search: string;
    sort: string;
  };
  activeSavedCards: QuinnSavedCardShelfReviewCard[];
  retiredSavedCards: QuinnSavedCardShelfReviewCard[];
};

export type QuinnReleaseReadinessAuditSource = {
  counts: {
    recentRuns: number;
    memories: number;
    notifications: number;
    sessionCards: number;
    savedCards: number;
    retiredSavedCards: number;
    pinnedSavedCards: number;
    savedCardsWithSaveIntentReview: number;
    savedCardsWithApplicationCheck: number;
    savedCardsWithLifecycleReview: number;
    shelfReviews: number;
  };
  composerState: 'blank' | 'staged';
  activeThreadTitle?: string | null;
  settings?: {
    reduceMotion?: boolean;
    quietNotifications?: boolean;
    focusMode?: boolean;
  } | null;
  voiceSettings?: {
    autoSpeakPreview?: boolean;
    saveRecordingsLocally?: boolean;
    transcriptionProvider?: string | null;
  } | null;
};

export type QuinnManualFieldTestChecklistSource = QuinnReleaseReadinessAuditSource;

export type QuinnMemoryHygieneReviewSampleItem = {
  label?: string | null;
  title?: string | null;
  body?: string | null;
  summary?: string | null;
  preview?: string | null;
  timestamp?: string | null;
  source?: string | null;
  pinned?: boolean | null;
  target?: string | null;
  tone?: string | null;
  read?: boolean | null;
};

export type QuinnMemoryHygieneReviewSource = {
  counts: {
    recentRuns: number;
    memories: number;
    notifications: number;
    pinnedMemories?: number | null;
    savedCards: number;
    shelfReviews: number;
  };
  activeThread?: {
    title?: string | null;
    latestSummary?: string | null;
  } | null;
  memoryResonance?: QuinnMemoryHygieneReviewSampleItem[];
  recentRuns?: QuinnMemoryHygieneReviewSampleItem[];
  memories?: QuinnMemoryHygieneReviewSampleItem[];
  notifications?: QuinnMemoryHygieneReviewSampleItem[];
};

const QUINN_OUTCOME_LOG_MARKER = 'QUINNOS OUTCOME LOG';
const QUINN_DRAFT_PATTERN_CARD_MARKER = 'QUINNOS DRAFT PATTERN CARD';
const QUINN_PATTERN_CARD_SAVE_INTENT_MARKER = 'QUINNOS PATTERN CARD SAVE INTENT';
const QUINN_PATTERN_CARD_APPLICATION_MARKER = 'QUINNOS PATTERN CARD APPLICATION';
const QUINN_SAVED_PATTERN_CARD_REVIEW_MARKER = 'QUINNOS SAVED PATTERN CARD REVIEW';
const QUINN_SAVED_CARD_SHELF_REVIEW_MARKER = 'QUINNOS SAVED CARD SHELF REVIEW';
const QUINN_RELEASE_READINESS_AUDIT_MARKER = 'QUINNOS RELEASE READINESS AUDIT';
const QUINN_MANUAL_FIELD_TEST_CHECKLIST_MARKER = 'QUINNOS MANUAL FIELD TEST CHECKLIST';
const QUINN_MEMORY_HYGIENE_REVIEW_MARKER = 'QUINNOS MEMORY HYGIENE REVIEW';
const QUINN_PATTERN_CARD_APPLICATION_NEED =
  'Use this saved card as a possible lens, not as automatic truth. Tell me whether it applies, where it does not apply, what evidence supports or weakens it, and the most useful next move.';
const QUINN_PATTERN_CARD_APPLICATION_PARTIAL_FRAGMENT =
  'what i need from ren: use this saved card as a p';
const QUINN_APPLICATION_FALLBACK_CAPTURE_MARKER =
  '[Fallback capture from unstructured Application output]';
const QUINN_LIFECYCLE_FALLBACK_CAPTURE_MARKER =
  '[Fallback capture from unstructured Lifecycle output]';
const QUINN_SHELF_REVIEW_FALLBACK_CAPTURE_MARKER =
  '[Fallback capture from unstructured Shelf Review output]';
const QUINN_PACKET_KNOWN_SECTION_HEADINGS = [
  'WHAT I ACTUALLY DID:',
  'IT CAUSED:',
  'DID IT HELP?',
  'WHAT WORKED:',
  'WHAT MISSED:',
  'WHAT QUINNOS SHOULD REMEMBER:',
  'CANDIDATE:',
  'CONFIDENCE:',
  'WHEN THIS PATTERN SHOULD MATTER:',
  'WHEN THIS PATTERN SHOULD NOT MATTER:',
  'WHAT QUINNOS MIGHT REMEMBER:',
  'POSSIBLE PATTERN:',
  'SAVED PATTERN:',
  'EVIDENCE:',
  'CURRENT SITUATION:',
  'APPLIES?',
  'APPLIES:',
  'SUPPORTING EVIDENCE:',
  'LIMITS / MISFIT:',
  'LIMITS/MISFIT:',
  'LIMITS OR MISFIT:',
  'RISK OF OVERUSING THIS PATTERN:',
  'RISK OF OVERUSE:',
  'OVERUSE RISK:',
  'NEXT BEST MOVE:',
  'LIFECYCLE READ:',
  'KEEP / REVISE / RETIRE / RESTORE:',
  'KEEP/REVISE/RETIRE/RESTORE:',
  'WHY:',
  'RISK IF KEPT AS-IS:',
  'RISK IF KEPT AS IS:',
  'NEXT BEST CARD ACTION:',
  'SAVE READINESS:',
  'SHOULD PRESERVE LATER:',
  'CLARIFY BEFORE STORAGE:',
  'STORAGE RISK:',
  'SHELF READ:',
  'MOST USEFUL ACTIVE CARDS:',
  'STALE / RISKY / OVERFIT CARDS:',
  'MISSING OR UNDERTESTED AREAS:',
  'NEXT BEST MANUAL CARD ACTION:',
  'Saved:',
  'Pinned:',
  'Retired:',
] as const;

const QUINN_OUTCOME_LOG_MINIMUM_CAPTURE_FIELDS: {
  heading: QuinnOutcomeLogMinimumCaptureField;
  placeholder: string;
}[] = [
  {
    heading: 'WHAT I ACTUALLY DID:',
    placeholder: '[What happened in real life?]',
  },
  {
    heading: 'IT CAUSED:',
    placeholder: '[What changed afterward?]',
  },
  {
    heading: 'DID IT HELP?',
    placeholder: '[yes / no / mixed / too soon to tell]',
  },
];

function escapeQuinnPacketHeadingRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeQuinnPacketHeadingLine(value: string) {
  return String(value || '')
    .trim()
    .replace(/^#{1,6}\s+/, '')
    .replace(/^[-*•]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .trim();
}

function getQuinnPacketHeadingMatch(line: string, heading: string) {
  const cleanLine = normalizeQuinnPacketHeadingLine(line);
  const normalizedHeading = normalizeQuinnPacketHeadingLine(heading);
  const cleanHeading = normalizedHeading.replace(/:$/, '').trim();
  const separatorPattern = normalizedHeading.endsWith(':')
    ? '\\s*:(?:\\s+|$)'
    : '\\s*:?(?:\\s+|$)';

  if (!cleanLine || !cleanHeading) {
    return {
      matches: false,
      value: '',
    };
  }

  const headingPattern = new RegExp(
    `^${escapeQuinnPacketHeadingRegex(cleanHeading)}${separatorPattern}([\\s\\S]*)$`,
    'i'
  );
  const match = cleanLine.match(headingPattern);

  return {
    matches: Boolean(match),
    value: match?.[1]?.trim() || '',
  };
}

function isQuinnPacketSectionHeading(line: string) {
  const clean = normalizeQuinnPacketHeadingLine(line);

  if (!clean) {
    return false;
  }

  if (QUINN_PACKET_KNOWN_SECTION_HEADINGS.some((heading) => getQuinnPacketHeadingMatch(clean, heading).matches)) {
    return true;
  }

  const colonIndex = clean.indexOf(':');
  const headingOnly = colonIndex >= 0 ? clean.slice(0, colonIndex + 1).trim() : clean;

  return Boolean(
    headingOnly &&
      headingOnly === headingOnly.toUpperCase() &&
      /^[A-Z0-9 /?,'-]+:?$/.test(headingOnly)
  );
}

function getQuinnPacketSectionValue(lines: string[], heading: string) {
  const headingIndex = lines.findIndex(
    (line) => getQuinnPacketHeadingMatch(line, heading).matches
  );

  if (headingIndex < 0) {
    return '';
  }

  const sameLineValue = getQuinnPacketHeadingMatch(lines[headingIndex], heading).value;
  const nextHeadingIndex = lines.findIndex(
    (line, index) => index > headingIndex && isQuinnPacketSectionHeading(line)
  );
  const blockValue = lines
    .slice(headingIndex + 1, nextHeadingIndex < 0 ? undefined : nextHeadingIndex)
    .join('\n')
    .trim();

  return [sameLineValue, blockValue]
    .filter(Boolean)
    .join('\n')
    .trim();
}

function getQuinnPacketSectionValueFromHeadings(lines: string[], headings: string[]) {
  for (const heading of headings) {
    const value = getQuinnPacketSectionValue(lines, heading);

    if (value) {
      return value;
    }
  }

  return '';
}

function getQuinnPacketLabeledLineValue(lines: string[], label: string) {
  const cleanLabel = label.trim().toLowerCase();
  const line = lines.find((item) => item.trim().toLowerCase().startsWith(cleanLabel));

  if (!line) {
    return '';
  }

  return line.trim().slice(label.length).trim();
}

function getQuinnPacketLabeledBlockValue(lines: string[], label: string) {
  const cleanLabel = label.trim().toLowerCase();
  const labelIndex = lines.findIndex((item) => {
    const cleanItem = normalizeQuinnPacketHeadingLine(item).toLowerCase();
    return cleanItem.startsWith(cleanLabel);
  });

  if (labelIndex < 0) {
    return '';
  }

  const headingMatch = getQuinnPacketHeadingMatch(lines[labelIndex], label);
  const sameLineValue =
    headingMatch.value || normalizeQuinnPacketHeadingLine(lines[labelIndex]).slice(label.length).trim();

  if (sameLineValue) {
    return sameLineValue;
  }

  const valueLine = lines.slice(labelIndex + 1).find((item) => item.trim());
  const cleanValueLine = valueLine?.trim() || '';

  return isQuinnPacketSectionHeading(cleanValueLine) ? '' : cleanValueLine;
}

function cleanQuinnOutcomeHistoryValue(value: string) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();

  if (!clean || /^\[[\s\S]*\]$/.test(clean)) {
    return '';
  }

  return clean.length > 180 ? `${clean.slice(0, 177).trim()}...` : clean;
}

function cleanQuinnFallbackText(value: string, maxLength = 180) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();

  if (!clean) {
    return '';
  }

  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3).trim()}...` : clean;
}

function getQuinnFallbackSentences(value: string) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();

  if (!clean) {
    return [];
  }

  const sentences = clean.match(/[^.!?]+[.!?]?/g) || [clean];
  return sentences
    .map((sentence) => cleanQuinnFallbackText(sentence, 180))
    .filter(Boolean);
}

function findQuinnFallbackSentence(value: string, patterns: RegExp[], fallback = '') {
  const sentences = getQuinnFallbackSentences(value);
  const match = sentences.find((sentence) => patterns.some((pattern) => pattern.test(sentence)));

  return match || cleanQuinnFallbackText(fallback || sentences[0] || '', 180);
}

function markQuinnFallbackCapture(marker: string, value: string) {
  const clean = cleanQuinnFallbackText(value, 180);

  return `${marker} ${clean || 'Manual review needed.'}`;
}

function cleanQuinnPatternCardStateValue(value: string) {
  const clean = cleanQuinnOutcomeHistoryValue(value);

  return clean.toLowerCase() === 'none' ? '' : clean;
}

function parseQuinnShelfReviewCount(value: string) {
  const clean = String(value || '').trim();

  if (!clean) {
    return null;
  }

  const count = Number.parseInt(clean, 10);
  return Number.isFinite(count) ? count : null;
}

export function getQuinnOutcomeLogMinimumCaptureStatus(
  packetText: string
): QuinnOutcomeLogMinimumCaptureStatus {
  const text = String(packetText || '');
  const isOutcomeLog = text.includes(QUINN_OUTCOME_LOG_MARKER);

  if (!isOutcomeLog) {
    return {
      isOutcomeLog: false,
      hasMinimumData: true,
      missingRequiredFields: [],
    };
  }

  const lines = text.split(/\r?\n/);
  const missingRequiredFields = QUINN_OUTCOME_LOG_MINIMUM_CAPTURE_FIELDS.filter(
    ({ heading, placeholder }) => {
      const value = getQuinnPacketSectionValue(lines, heading);
      return !value || value.includes(placeholder);
    }
  ).map(({ heading }) => heading);

  return {
    isOutcomeLog: true,
    hasMinimumData: missingRequiredFields.length === 0,
    missingRequiredFields,
  };
}

export function getQuinnOutcomeLogHistoryPreview(
  packetText: string
): QuinnOutcomeLogHistoryPreview | null {
  const text = String(packetText || '');

  if (!text.includes(QUINN_OUTCOME_LOG_MARKER)) {
    return null;
  }

  const lines = text.split(/\r?\n/);

  return {
    actuallyDid: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'WHAT I ACTUALLY DID:')
    ),
    itCaused: cleanQuinnOutcomeHistoryValue(getQuinnPacketSectionValue(lines, 'IT CAUSED:')),
    didItHelp: cleanQuinnOutcomeHistoryValue(getQuinnPacketSectionValue(lines, 'DID IT HELP?')),
  };
}

function isQuinnPatternCandidateHelpValue(value: string) {
  const clean = String(value || '').toLowerCase().trim();

  return /\bno\b/.test(clean) || /\bmixed\b/.test(clean) || clean.includes('too soon');
}

export function getQuinnPatternCandidatePreview(
  packetText: string
): QuinnPatternCandidatePreview | null {
  const text = String(packetText || '');

  if (!text.includes(QUINN_OUTCOME_LOG_MARKER)) {
    return null;
  }

  const lines = text.split(/\r?\n/);
  const actuallyDid = cleanQuinnOutcomeHistoryValue(
    getQuinnPacketSectionValue(lines, 'WHAT I ACTUALLY DID:')
  );
  const itCaused = cleanQuinnOutcomeHistoryValue(
    getQuinnPacketSectionValue(lines, 'IT CAUSED:')
  );
  const didItHelp = cleanQuinnOutcomeHistoryValue(
    getQuinnPacketSectionValue(lines, 'DID IT HELP?')
  );
  const whatWorked = cleanQuinnOutcomeHistoryValue(
    getQuinnPacketSectionValue(lines, 'WHAT WORKED:')
  );
  const whatMissed = cleanQuinnOutcomeHistoryValue(
    getQuinnPacketSectionValue(lines, 'WHAT MISSED:')
  );
  const whatQuinnosShouldRemember = cleanQuinnOutcomeHistoryValue(
    getQuinnPacketSectionValue(lines, 'WHAT QUINNOS SHOULD REMEMBER:')
  );
  const isCandidate = Boolean(
    whatQuinnosShouldRemember ||
      whatMissed ||
      isQuinnPatternCandidateHelpValue(didItHelp) ||
      (actuallyDid && itCaused)
  );

  if (!isCandidate) {
    return null;
  }

  return {
    actuallyDid,
    itCaused,
    didItHelp,
    whatWorked,
    whatMissed,
    whatQuinnosShouldRemember,
    candidateLine: whatQuinnosShouldRemember || actuallyDid,
    evidenceLine: whatMissed || itCaused || whatWorked,
  };
}

function formatQuinnDraftPatternCardValue(value: string, fallback: string) {
  const clean = String(value || '').trim();

  return clean || fallback;
}

function formatQuinnShelfReviewValue(value: string, fallback: string, maxLength = 180) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();

  if (!clean) {
    return fallback;
  }

  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3).trim()}...` : clean;
}

function formatQuinnShelfReviewBoolean(value: unknown) {
  return value ? 'yes' : 'no';
}

function formatQuinnReleaseAuditToggle(value: boolean | undefined) {
  return value ? 'on' : 'off';
}

function buildQuinnSavedCardShelfReviewList(
  cards: QuinnSavedCardShelfReviewCard[],
  limit: number
) {
  if (!cards.length) {
    return ['(none yet)'];
  }

  const visibleCards = cards.slice(0, limit);
  const omittedCount = Math.max(0, cards.length - visibleCards.length);
  const lines = visibleCards.flatMap((card, index) => {
    const retiredAt = String(card.retiredAt || '').trim();
    const retiredReason = String(card.retiredReason || '').trim();
    const pinnedAt = String(card.pinnedAt || '').trim();

    return [
      `${index + 1}. ${formatQuinnShelfReviewValue(
        card.possiblePattern,
        'Untitled saved pattern card',
        120
      )}`,
      `   - Saved: ${formatQuinnShelfReviewValue(card.savedAt, 'unknown', 90)}`,
      ...(pinnedAt
        ? [`   - Pinned: ${formatQuinnShelfReviewValue(pinnedAt, 'unknown', 90)}`]
        : []),
      ...(retiredAt
        ? [`   - Retired: ${formatQuinnShelfReviewValue(retiredAt, 'unknown', 90)}`]
        : []),
      ...(retiredReason
        ? [`   - Retired reason: ${formatQuinnShelfReviewValue(retiredReason, 'none', 120)}`]
        : []),
      `   - Evidence: ${formatQuinnShelfReviewValue(card.evidence, 'none captured')}`,
      `   - Risk: ${formatQuinnShelfReviewValue(
        card.overgeneralizationRisk,
        'none captured'
      )}`,
      `   - Has Save Intent review: ${formatQuinnShelfReviewBoolean(card.saveIntentReview)}`,
      `   - Has Application check: ${formatQuinnShelfReviewBoolean(card.applicationReview)}`,
      `   - Has Lifecycle review: ${formatQuinnShelfReviewBoolean(card.lifecycleReview)}`,
    ];
  });

  if (omittedCount) {
    lines.push(`(${omittedCount} more saved cards omitted from this compact packet.)`);
  }

  return lines;
}

function getQuinnMemoryHygieneSampleText(item: QuinnMemoryHygieneReviewSampleItem) {
  return (
    String(item.summary || '').trim() ||
    String(item.body || '').trim() ||
    String(item.preview || '').trim()
  );
}

function buildQuinnMemoryHygieneResonanceList(
  items: QuinnMemoryHygieneReviewSampleItem[],
  limit: number
) {
  const visibleItems = Array.isArray(items) ? items.slice(0, limit) : [];

  if (!visibleItems.length) {
    return ['(none currently active)'];
  }

  const lines = visibleItems.map((item, index) => {
    const label = formatQuinnShelfReviewValue(
      String(item.label || item.title || ''),
      'Untitled resonance signal',
      40
    );
    const preview = formatQuinnShelfReviewValue(
      getQuinnMemoryHygieneSampleText(item),
      'no preview captured',
      72
    );

    return `${index + 1}. ${label}: ${preview}`;
  });

  return lines;
}

function buildQuinnMemoryHygieneRunList(
  items: QuinnMemoryHygieneReviewSampleItem[],
  limit: number
) {
  const visibleItems = Array.isArray(items) ? items.slice(0, limit) : [];

  if (!visibleItems.length) {
    return ['(none yet)'];
  }

  const lines = visibleItems.map((item, index) => {
    const title = formatQuinnShelfReviewValue(
      String(item.title || item.label || ''),
      'Untitled run',
      40
    );
    const summary = formatQuinnShelfReviewValue(
      getQuinnMemoryHygieneSampleText(item),
      'no summary captured',
      72
    );

    return `${index + 1}. ${title}: ${summary}`;
  });

  return lines;
}

function buildQuinnMemoryHygieneMemoryList(
  items: QuinnMemoryHygieneReviewSampleItem[],
  limit: number
) {
  const visibleItems = Array.isArray(items) ? items.slice(0, limit) : [];

  if (!visibleItems.length) {
    return ['(none yet)'];
  }

  const lines = visibleItems.map((item, index) => {
    const label = formatQuinnShelfReviewValue(
      String(item.label || item.title || ''),
      'Untitled memory',
      40
    );
    const body = formatQuinnShelfReviewValue(
      getQuinnMemoryHygieneSampleText(item),
      'no body captured',
      72
    );
    const pinned = item.pinned ? 'pinned' : '';

    return `${index + 1}. ${label}: ${body}${pinned ? ` (${pinned})` : ''}`;
  });

  return lines;
}

function buildQuinnMemoryHygieneNotificationList(
  items: QuinnMemoryHygieneReviewSampleItem[],
  limit: number
) {
  const visibleItems = Array.isArray(items) ? items.slice(0, limit) : [];

  if (!visibleItems.length) {
    return ['(none yet)'];
  }

  const lines = visibleItems.map((item, index) => {
    const title = formatQuinnShelfReviewValue(
      String(item.title || item.label || ''),
      'Untitled notification',
      40
    );
    const body = formatQuinnShelfReviewValue(
      getQuinnMemoryHygieneSampleText(item),
      'no body captured',
      64
    );
    const readState = item.read ? 'read' : 'unread';

    return `${index + 1}. ${title}: ${body} (${readState})`;
  });

  return lines;
}

export function buildQuinnDraftPatternCardPacket(candidate: QuinnDraftPatternCardSource) {
  return [
    'QUINNOS DRAFT PATTERN CARD',
    '',
    'PURPOSE:',
    'Turn this local pattern candidate into a reviewable draft. Do not store it as truth yet.',
    '',
    'CANDIDATE:',
    formatQuinnDraftPatternCardValue(candidate.candidateLine, '[No candidate line captured.]'),
    '',
    'EVIDENCE:',
    formatQuinnDraftPatternCardValue(candidate.evidenceLine, '[No evidence captured.]'),
    '',
    'SOURCE OUTCOME:',
    'What I actually did:',
    formatQuinnDraftPatternCardValue(candidate.actuallyDid, '[No action captured.]'),
    '',
    'It caused:',
    formatQuinnDraftPatternCardValue(candidate.itCaused, '[No effect captured.]'),
    '',
    'Did it help?',
    formatQuinnDraftPatternCardValue(candidate.didItHelp, '[unknown]'),
    '',
    'WHAT WORKED:',
    formatQuinnDraftPatternCardValue(candidate.whatWorked, '[No useful part captured.]'),
    '',
    'WHAT MISSED:',
    formatQuinnDraftPatternCardValue(candidate.whatMissed, '[No miss captured.]'),
    '',
    'WHAT QUINNOS MIGHT REMEMBER:',
    formatQuinnDraftPatternCardValue(
      candidate.whatQuinnosShouldRemember,
      '[No memory candidate captured.]'
    ),
    '',
    'CONFIDENCE:',
    '[draft / low / medium / high — Quinn chooses]',
    '',
    'WHEN THIS PATTERN SHOULD MATTER:',
    '[When should Future Quinn use this?]',
    '',
    'WHEN THIS PATTERN SHOULD NOT MATTER:',
    '[What would make this misleading, too broad, old-wound-driven, or not applicable?]',
    '',
    'VISIBLE OUTPUT REQUIREMENT:',
    'Return visible text. Do not return blank, metadata only, reasoning only, or an empty response. If the evidence is thin, still return the compact draft shape below.',
    '',
    'DRAFT OUTPUT SHAPE:',
    'Return exactly these sections:',
    'POSSIBLE PATTERN:',
    'EVIDENCE:',
    'OVERGENERALIZATION RISK:',
    'BEFORE STORING, QUINN SHOULD DECIDE:',
    '',
    'OUTPUT I NEED FROM REN:',
    'Turn this into a draft pattern card only. Use the DRAFT OUTPUT SHAPE. Name the possible pattern, the evidence, the risk of overgeneralizing, and what Quinn should decide before storing it. Do not treat this as permanent memory yet. Return visible text even if the evidence is thin.',
    ...QUINNOS_RESPONSE_PROTOCOL,
  ].join('\n');
}

export function buildQuinnDraftPatternCardPacketFromSessionCard(
  card: QuinnSessionPatternCardDraftSource
) {
  return [
    'QUINNOS DRAFT PATTERN CARD',
    '',
    'PURPOSE:',
    'Revise this approved-for-now session Pattern Card without treating it as permanent memory yet.',
    '',
    'CANDIDATE:',
    formatQuinnDraftPatternCardValue(card.possiblePattern, '[No possible pattern captured.]'),
    '',
    'EVIDENCE:',
    formatQuinnDraftPatternCardValue(card.evidence, '[No evidence captured.]'),
    '',
    'SOURCE CARD:',
    'Source run:',
    formatQuinnDraftPatternCardValue(card.sourceRunId || '', '[No source run captured.]'),
    '',
    'Approved:',
    formatQuinnDraftPatternCardValue(card.createdAt || '', '[No approval time captured.]'),
    '',
    'OVERGENERALIZATION RISK:',
    formatQuinnDraftPatternCardValue(
      card.overgeneralizationRisk,
      '[No overgeneralization risk captured.]'
    ),
    '',
    'BEFORE STORING, QUINN SHOULD DECIDE:',
    formatQuinnDraftPatternCardValue(
      card.beforeStoringDecision,
      '[No before-storing decision captured.]'
    ),
    '',
    'CONFIDENCE:',
    '[draft / low / medium / high — Quinn chooses]',
    '',
    'WHEN THIS PATTERN SHOULD MATTER:',
    '[When should Future Quinn use this?]',
    '',
    'WHEN THIS PATTERN SHOULD NOT MATTER:',
    '[What would make this misleading, too broad, old-wound-driven, or not applicable?]',
    '',
    'VISIBLE OUTPUT REQUIREMENT:',
    'Return visible text. Do not return blank, metadata only, reasoning only, or an empty response. If the evidence is thin, still return the compact draft shape below.',
    '',
    'DRAFT OUTPUT SHAPE:',
    'Return exactly these sections:',
    'POSSIBLE PATTERN:',
    'EVIDENCE:',
    'OVERGENERALIZATION RISK:',
    'BEFORE STORING, QUINN SHOULD DECIDE:',
    '',
    'OUTPUT I NEED FROM REN:',
    'Turn this into a revised draft pattern card only. Use the DRAFT OUTPUT SHAPE. Name the possible pattern, the evidence, the risk of overgeneralizing, and what Quinn should decide before storing it. Do not treat this as permanent memory yet. Return visible text even if the evidence is thin.',
    ...QUINNOS_RESPONSE_PROTOCOL,
  ].join('\n');
}

export function buildQuinnPatternCardSaveIntentPacket(
  card: QuinnPatternCardSaveIntentSource
) {
  return [
    'QUINNOS PATTERN CARD SAVE INTENT',
    '',
    'PURPOSE:',
    'Review whether this approved-for-now session Pattern Card is specific, safe, useful, and consent-worthy enough to become durable later. Do not store it yet.',
    '',
    'POSSIBLE PATTERN:',
    formatQuinnDraftPatternCardValue(card.possiblePattern, '[No possible pattern captured.]'),
    '',
    'EVIDENCE:',
    formatQuinnDraftPatternCardValue(card.evidence, '[No evidence captured.]'),
    '',
    'OVERGENERALIZATION RISK:',
    formatQuinnDraftPatternCardValue(
      card.overgeneralizationRisk,
      '[No overgeneralization risk captured.]'
    ),
    '',
    'BEFORE STORING DECISION:',
    formatQuinnDraftPatternCardValue(
      card.beforeStoringDecision,
      '[No before-storing decision captured.]'
    ),
    '',
    'SOURCE:',
    'Created:',
    formatQuinnDraftPatternCardValue(card.createdAt || '', '[No created time captured.]'),
    '',
    'Source run:',
    formatQuinnDraftPatternCardValue(card.sourceRunId || '', '[No source run captured.]'),
    '',
    'WHY THIS MIGHT DESERVE DURABILITY:',
    '[Quinn fills this in.]',
    '',
    'WHY THIS MIGHT NOT DESERVE DURABILITY:',
    '[Quinn fills this in.]',
    '',
    'WHAT FUTURE QUINN WOULD NEED FROM THIS CARD:',
    '[Quinn fills this in.]',
    '',
    'VISIBLE OUTPUT REQUIREMENT:',
    'Return visible text. Do not return blank, metadata only, reasoning only, or an empty response.',
    '',
    'SAVE INTENT OUTPUT SHAPE:',
    'Return exactly these sections:',
    'SAVE READINESS:',
    'SHOULD PRESERVE LATER:',
    'CLARIFY BEFORE STORAGE:',
    'STORAGE RISK:',
    'NEXT BEST MOVE:',
    '',
    'OUTPUT I NEED FROM REN:',
    'Use the SAVE INTENT OUTPUT SHAPE. Evaluate this as a save-intent review only. Do not treat it as stored memory. Say whether this card seems specific enough, useful enough, and safe enough to preserve later. Name what should be clarified before storage. Return visible text.',
    ...QUINNOS_RESPONSE_PROTOCOL,
  ].join('\n');
}

export function buildQuinnPatternCardApplicationPacket(
  card: QuinnPatternCardApplicationSource
) {
  const saveIntentReview = card.saveIntentReview;

  return [
    'QUINNOS PATTERN CARD APPLICATION',
    '',
    'PURPOSE:',
    'Test whether this saved Pattern Card applies to a current situation without treating it as automatic truth.',
    '',
    'APPLICATION SOURCE LOCK:',
    '- Use this current QUINNOS PATTERN CARD APPLICATION packet as the source of truth.',
    '- Ignore earlier incomplete fragments or thread summaries if they conflict with this packet.',
    '- The saved card may include compact excerpts or ellipses; treat them as available context, not as incomplete user instruction.',
    '- If WHAT I NEED FROM REN is complete in this packet, do not ask Quinn to finish an older cut-off line.',
    '- Return only the requested APPLICATION OUTPUT SHAPE sections.',
    '',
    'SAVED PATTERN:',
    formatQuinnDraftPatternCardValue(card.possiblePattern, '[No saved pattern captured.]'),
    '',
    'EVIDENCE:',
    formatQuinnDraftPatternCardValue(card.evidence, '[No evidence captured.]'),
    '',
    'OVERGENERALIZATION RISK:',
    formatQuinnDraftPatternCardValue(
      card.overgeneralizationRisk,
      '[No overgeneralization risk captured.]'
    ),
    '',
    'BEFORE USING THIS PATTERN, REMEMBER:',
    formatQuinnDraftPatternCardValue(
      card.beforeStoringDecision,
      '[No before-using note captured.]'
    ),
    '',
    'SAVE INTENT REVIEW:',
    'Save readiness:',
    formatQuinnDraftPatternCardValue(
      saveIntentReview?.saveReadiness || '',
      '[No save readiness captured.]'
    ),
    '',
    'Should preserve later:',
    formatQuinnDraftPatternCardValue(
      saveIntentReview?.shouldPreserveLater || '',
      '[No preserve-later read captured.]'
    ),
    '',
    'Clarify before storage:',
    formatQuinnDraftPatternCardValue(
      saveIntentReview?.clarifyBeforeStorage || '',
      '[No clarification captured.]'
    ),
    '',
    'Storage risk:',
    formatQuinnDraftPatternCardValue(
      saveIntentReview?.storageRisk || '',
      '[No storage risk captured.]'
    ),
    '',
    'Next best move:',
    formatQuinnDraftPatternCardValue(
      saveIntentReview?.nextBestMove || '',
      '[No next move captured.]'
    ),
    '',
    'CURRENT SITUATION:',
    '[Quinn describes what is happening now.]',
    '',
    'WHAT I AM TEMPTED TO ASSUME:',
    '(not specified)',
    '',
    'WHAT I NEED FROM REN:',
    QUINN_PATTERN_CARD_APPLICATION_NEED,
    '',
    'VISIBLE OUTPUT REQUIREMENT:',
    'Return visible text. Do not return blank, metadata only, reasoning only, or an empty response.',
    '',
    'APPLICATION OUTPUT RULES:',
    '- Return only the APPLICATION OUTPUT SHAPE sections.',
    '- Use the exact section headings shown below.',
    '- Do not return a generic summary.',
    '- Use short bullets or short lines.',
    '- Do not narrate the full saved card.',
    '- Do not stop mid-section.',
    '',
    'APPLICATION OUTPUT SHAPE:',
    'Return exactly these sections and no other sections:',
    'APPLIES?',
    'SUPPORTING EVIDENCE:',
    'LIMITS / MISFIT:',
    'RISK OF OVERUSING THIS PATTERN:',
    'NEXT BEST MOVE:',
  ].join('\n');
}

export function isQuinnPatternCardApplicationPartialFragment(packetText: string) {
  const clean = String(packetText || '').replace(/\s+/g, ' ').trim().toLowerCase();

  if (!clean || clean.includes(QUINN_PATTERN_CARD_APPLICATION_MARKER.toLowerCase())) {
    return false;
  }

  return (
    clean.startsWith(QUINN_PATTERN_CARD_APPLICATION_PARTIAL_FRAGMENT) &&
    !clean.includes(QUINN_PATTERN_CARD_APPLICATION_NEED.toLowerCase())
  );
}

export function buildQuinnSavedPatternCardReviewPacket(
  card: QuinnSavedPatternCardReviewSource
) {
  const saveIntentReview = card.saveIntentReview;
  const applicationReview = card.applicationReview;

  return [
    'QUINNOS SAVED PATTERN CARD REVIEW',
    '',
    'PURPOSE:',
    "Review this saved Pattern Card's current role without automatically changing it. Decide whether it should stay active, be revised, pinned, retired, restored, or tested again.",
    '',
    'CURRENT CARD STATE:',
    'Saved:',
    formatQuinnDraftPatternCardValue(card.savedAt || '', '[No saved time captured.]'),
    '',
    'Pinned:',
    formatQuinnDraftPatternCardValue(card.pinnedAt || '', 'none'),
    '',
    'Retired:',
    formatQuinnDraftPatternCardValue(card.retiredAt || '', 'none'),
    '',
    'Retired reason:',
    formatQuinnDraftPatternCardValue(card.retiredReason || '', 'none'),
    '',
    'SAVED PATTERN:',
    formatQuinnDraftPatternCardValue(card.possiblePattern, '[No saved pattern captured.]'),
    '',
    'EVIDENCE:',
    formatQuinnDraftPatternCardValue(card.evidence, '[No evidence captured.]'),
    '',
    'OVERGENERALIZATION RISK:',
    formatQuinnDraftPatternCardValue(
      card.overgeneralizationRisk,
      '[No overgeneralization risk captured.]'
    ),
    '',
    'BEFORE USING THIS PATTERN, REMEMBER:',
    formatQuinnDraftPatternCardValue(
      card.beforeStoringDecision,
      '[No before-using note captured.]'
    ),
    '',
    'SAVE INTENT REVIEW:',
    'Save readiness:',
    formatQuinnDraftPatternCardValue(
      saveIntentReview?.saveReadiness || '',
      '[No save readiness captured.]'
    ),
    '',
    'Should preserve later:',
    formatQuinnDraftPatternCardValue(
      saveIntentReview?.shouldPreserveLater || '',
      '[No preserve-later read captured.]'
    ),
    '',
    'Clarify before storage:',
    formatQuinnDraftPatternCardValue(
      saveIntentReview?.clarifyBeforeStorage || '',
      '[No clarification captured.]'
    ),
    '',
    'Storage risk:',
    formatQuinnDraftPatternCardValue(
      saveIntentReview?.storageRisk || '',
      '[No storage risk captured.]'
    ),
    '',
    'Next best move:',
    formatQuinnDraftPatternCardValue(
      saveIntentReview?.nextBestMove || '',
      '[No next move captured.]'
    ),
    '',
    'APPLICATION CHECK:',
    'Applies:',
    formatQuinnDraftPatternCardValue(
      applicationReview?.applies || '',
      '[No applies read captured.]'
    ),
    '',
    'Supporting evidence:',
    formatQuinnDraftPatternCardValue(
      applicationReview?.supportingEvidence || '',
      '[No supporting evidence captured.]'
    ),
    '',
    'Limits / misfit:',
    formatQuinnDraftPatternCardValue(
      applicationReview?.limitsMisfit || '',
      '[No limits captured.]'
    ),
    '',
    'Risk of overusing this pattern:',
    formatQuinnDraftPatternCardValue(
      applicationReview?.overuseRisk || '',
      '[No overuse risk captured.]'
    ),
    '',
    'Next best move:',
    formatQuinnDraftPatternCardValue(
      applicationReview?.nextBestMove || '',
      '[No next move captured.]'
    ),
    '',
    'WHY I AM REVIEWING THIS CARD NOW:',
    '[Quinn fills this in.]',
    '',
    'WHAT I AM TEMPTED TO DO WITH IT:',
    '[Quinn fills this in.]',
    '',
    'WHAT I NEED FROM REN:',
    'Use this as a saved-card lifecycle review only. Do not change the card automatically. Tell Quinn whether this card should stay active, be revised, pinned, retired, restored, or tested again. Name the risk of keeping it as-is and the next best card action.',
    '',
    'VISIBLE OUTPUT REQUIREMENT:',
    'Return visible text. Do not return blank, metadata only, reasoning only, or an empty response.',
    '',
    'LIFECYCLE OUTPUT RULES:',
    '- Return only the LIFECYCLE REVIEW OUTPUT SHAPE sections.',
    '- Use the exact section headings shown below.',
    '- Do not return a single-line recommendation.',
    '- Do not mutate the card automatically; only advise manual action.',
    '- Use short bullets or short lines.',
    '- Do not stop mid-section.',
    '',
    'LIFECYCLE REVIEW OUTPUT SHAPE:',
    'Return exactly these sections and no other sections:',
    'LIFECYCLE READ:',
    'KEEP / REVISE / RETIRE / RESTORE:',
    'WHY:',
    'RISK IF KEPT AS-IS:',
    'NEXT BEST CARD ACTION:',
  ].join('\n');
}

export function buildQuinnSavedCardShelfReviewPacket(input: QuinnSavedCardShelfReviewSource) {
  const activeSavedCards = input.activeSavedCards || [];
  const retiredSavedCards = input.retiredSavedCards || [];
  const counts = input.counts;
  const currentView = input.currentView;

  return [
    'QUINNOS SAVED CARD SHELF REVIEW',
    '',
    'PURPOSE:',
    'Review the saved Pattern Card shelf as a whole without automatically changing any cards. Identify what should stay active, what may need revision, what may be stale, what may deserve pinning, what may deserve retirement, and what should be tested again.',
    '',
    'SHELF COUNTS:',
    `Active saved cards: ${counts.activeSavedCards}`,
    `Retired saved cards: ${counts.retiredSavedCards}`,
    `Pinned saved cards: ${counts.pinnedSavedCards}`,
    `With Save Intent review: ${counts.withSaveIntentReview}`,
    `With Application check: ${counts.withApplicationCheck}`,
    `With Lifecycle review: ${counts.withLifecycleReview}`,
    `Session cards, count only: ${counts.sessionCards ?? 0}`,
    '',
    'CURRENT VIEW:',
    `Filter: ${formatQuinnShelfReviewValue(currentView.filter, 'All', 80)}`,
    `Search: ${formatQuinnShelfReviewValue(currentView.search, '(none)', 120)}`,
    `Sort: ${formatQuinnShelfReviewValue(currentView.sort, 'Newest', 80)}`,
    '',
    'SCOPE NOTE:',
    'Review all saved cards below, not only the currently visible filtered cards. Session cards are included as count only.',
    '',
    'ACTIVE SAVED CARDS:',
    ...buildQuinnSavedCardShelfReviewList(activeSavedCards, 12),
    '',
    'RETIRED SAVED CARDS:',
    ...buildQuinnSavedCardShelfReviewList(retiredSavedCards, 8),
    '',
    'WHAT I NEED FROM REN:',
    'Use this as a shelf-level review only. Do not change any cards automatically. Identify the most important maintenance pattern in this shelf, the cards that look most useful, the cards that look stale or risky, and the next best manual card action for Quinn.',
    '',
    'VISIBLE OUTPUT REQUIREMENT:',
    'Return visible text. Do not return blank, metadata only, reasoning only, or an empty response.',
    '',
    'SHELF REVIEW OUTPUT RULES:',
    '- Return only the SHELF REVIEW OUTPUT SHAPE sections.',
    '- Use the exact section headings shown below.',
    '- Use short bullets or short lines.',
    '- Do not return a generic paragraph.',
    '- Do not narrate the full shelf.',
    '- Do not mutate cards automatically; only advise manual action.',
    '- Do not stop mid-section.',
    '',
    'SHELF REVIEW OUTPUT SHAPE:',
    'Return exactly these sections and no other sections:',
    'SHELF READ:',
    'MOST USEFUL ACTIVE CARDS:',
    'STALE / RISKY / OVERFIT CARDS:',
    'MISSING OR UNDERTESTED AREAS:',
    'NEXT BEST MANUAL CARD ACTION:',
  ].join('\n');
}

export function buildQuinnReleaseReadinessAuditPacket(
  input: QuinnReleaseReadinessAuditSource
) {
  const counts = input.counts;
  const settings = input.settings || {};
  const voiceSettings = input.voiceSettings || {};
  const hasCheckpointState = Boolean(
    counts.savedCards ||
      counts.retiredSavedCards ||
      counts.sessionCards ||
      counts.shelfReviews
  );

  return [
    'QUINNOS RELEASE READINESS AUDIT',
    '',
    'PURPOSE:',
    'Audit QuinnOS as a manual, consent-shaped external processing console before calling this first full version complete. Identify whether the system feels coherent, usable, reversible, and safe enough to treat as the v3.0 manual baseline.',
    '',
    'SYSTEM STATE:',
    `Recent runs: ${counts.recentRuns}`,
    `Memories: ${counts.memories}`,
    `Notifications: ${counts.notifications}`,
    `Session Pattern Cards: ${counts.sessionCards}`,
    `Saved Pattern Cards: ${counts.savedCards}`,
    `Retired Saved Cards: ${counts.retiredSavedCards}`,
    `Pinned Saved Cards: ${counts.pinnedSavedCards}`,
    `Saved cards with Save Intent review: ${counts.savedCardsWithSaveIntentReview}`,
    `Saved cards with Application check: ${counts.savedCardsWithApplicationCheck}`,
    `Saved cards with Lifecycle review: ${counts.savedCardsWithLifecycleReview}`,
    `Saved Card Shelf Reviews: ${counts.shelfReviews}`,
    `Current composer state: ${input.composerState}`,
    `Current active thread: ${formatQuinnShelfReviewValue(
      input.activeThreadTitle || '',
      '(none)',
      120
    )}`,
    `Reduce motion: ${formatQuinnReleaseAuditToggle(settings.reduceMotion)}`,
    `Quiet notifications: ${formatQuinnReleaseAuditToggle(settings.quietNotifications)}`,
    `Focus mode: ${formatQuinnReleaseAuditToggle(settings.focusMode)}`,
    `Auto speak preview: ${formatQuinnReleaseAuditToggle(voiceSettings.autoSpeakPreview)}`,
    `Save recordings locally: ${formatQuinnReleaseAuditToggle(
      voiceSettings.saveRecordingsLocally
    )}`,
    `Transcription provider: ${formatQuinnShelfReviewValue(
      voiceSettings.transcriptionProvider || '',
      '(unknown)',
      80
    )}`,
    `Checkpoint health: ${
      hasCheckpointState
        ? 'cards and/or shelf reviews are present for explicit checkpoint restore'
        : 'conversation-only state; no cards or shelf reviews are present'
    }`,
    '',
    'AUDIT CALIBRATION:',
    '- Separate implemented capability from current local usage evidence.',
    '- Do not treat zero or low counts as missing architecture.',
    '- The counts above describe this device state, not the whole QuinnOS capability set.',
    '- If a feature appears in the capability checklist, assume it is implemented unless evidence suggests a bug.',
    '- Describe zero-count features as unexercised / low-sample / not field-proven.',
    '- Only call something missing if the packet lacks it from the capability checklist or the behavior is contradicted by evidence.',
    '- Judge v3.0 readiness across both capability readiness and field-proven readiness.',
    '',
    'CAPABILITY CHECKLIST:',
    '- Conversation-first normal replies',
    '- Outcome capture',
    '- Pattern candidate creation',
    '- Draft pattern cards',
    '- Session cards',
    '- Saved cards',
    '- Save Intent gate',
    '- Apply card',
    '- Lifecycle review',
    '- Shelf review',
    '- Export/import',
    '- Import restore report',
    '- Export health/handoff',
    '- Optimistic composer/send bubble',
    '- Local persistence for saved cards',
    '- Non-automatic mutation / Quinn approval layer',
    '',
    'WHAT I NEED FROM REN:',
    'Review QuinnOS as a whole system. Give separate verdicts for capability readiness and field-tested readiness. Tell me what works, what has low evidence, what actually rattles, what should not be automated yet, and what the next post-3.0 direction should be.',
    '',
    'VISIBLE OUTPUT REQUIREMENT:',
    'Return visible text. Do not return blank, metadata only, reasoning only, or an empty response.',
    '',
    'RELEASE AUDIT OUTPUT SHAPE:',
    'Return exactly these sections:',
    'CAPABILITY READINESS:',
    'FIELD-TESTED READINESS:',
    'WHAT WORKS:',
    'LOW-EVIDENCE / UNEXERCISED AREAS:',
    'WHAT STILL RATTLES:',
    'WHAT NOT TO AUTOMATE YET:',
    'POST-3.0 NEXT DIRECTION:',
    ...QUINNOS_RESPONSE_PROTOCOL,
  ].join('\n');
}

export function buildQuinnManualFieldTestChecklistPacket(
  input: QuinnManualFieldTestChecklistSource
) {
  const counts = input.counts;
  const settings = input.settings || {};
  const voiceSettings = input.voiceSettings || {};

  return [
    'QUINNOS MANUAL FIELD TEST CHECKLIST',
    '',
    'PURPOSE:',
    'Create a manual field test plan for QuinnOS now that the v3.0 manual-console architecture is capability-ready but not yet field-proven. The goal is to exercise major flows, collect evidence, and identify trust gaps without automating anything.',
    '',
    'CURRENT SYSTEM STATE:',
    `Recent runs: ${counts.recentRuns}`,
    `Memories: ${counts.memories}`,
    `Notifications: ${counts.notifications}`,
    `Session Pattern Cards: ${counts.sessionCards}`,
    `Saved Pattern Cards: ${counts.savedCards}`,
    `Retired Saved Cards: ${counts.retiredSavedCards}`,
    `Pinned Saved Cards: ${counts.pinnedSavedCards}`,
    `Saved cards with Save Intent review: ${counts.savedCardsWithSaveIntentReview}`,
    `Saved cards with Application check: ${counts.savedCardsWithApplicationCheck}`,
    `Saved cards with Lifecycle review: ${counts.savedCardsWithLifecycleReview}`,
    `Saved Card Shelf Reviews: ${counts.shelfReviews}`,
    `Current composer state: ${input.composerState}`,
    `Current active thread: ${formatQuinnShelfReviewValue(
      input.activeThreadTitle || '',
      '(none)',
      120
    )}`,
    `Reduce motion: ${formatQuinnReleaseAuditToggle(settings.reduceMotion)}`,
    `Quiet notifications: ${formatQuinnReleaseAuditToggle(settings.quietNotifications)}`,
    `Focus mode: ${formatQuinnReleaseAuditToggle(settings.focusMode)}`,
    `Auto speak preview: ${formatQuinnReleaseAuditToggle(voiceSettings.autoSpeakPreview)}`,
    `Save recordings locally: ${formatQuinnReleaseAuditToggle(
      voiceSettings.saveRecordingsLocally
    )}`,
    `Transcription provider: ${formatQuinnShelfReviewValue(
      voiceSettings.transcriptionProvider || '',
      '(unknown)',
      80
    )}`,
    '',
    'TESTING PRINCIPLE:',
    'Manual testing should prove behavior through real use. Do not treat untested features as broken by default. Do not automate any card or memory mutation. Quinn remains the approval layer.',
    '',
    'FIELD TEST CHECKLIST:',
    'Conversation shell:',
    '- Normal conversation path',
    '- Optimistic composer clear + sent bubble',
    '- Guards and blank-output handling',
    '',
    'Outcome and pattern flow:',
    '- Outcome capture',
    '- Pattern Candidate generation',
    '- Draft Pattern Card',
    '- Session Pattern Card approval',
    '',
    'Saved card flow:',
    '- Save Intent',
    '- Save locally',
    '- Saved card View / Apply / Review / Lifecycle Review',
    '- Pin / Unpin',
    '- Retire / Restore',
    '- Retired card Apply restriction',
    '- Search / Filter / Count / Sort',
    '',
    'Shelf and checkpoint flow:',
    '- Shelf review',
    '- Shelf review result visibility',
    '- Export Health Summary',
    '- Export Handoff Instructions',
    '- Import from export',
    '- Import Restore Report',
    '- Duplicate import behavior',
    '',
    'Device/UI fit:',
    '- Bottom safe area',
    '- Long-form composer and escape hatch',
    '',
    'OUTPUT COMPRESSION RULES:',
    '- Return only the requested FIELD TEST OUTPUT SHAPE sections.',
    '- Keep the whole response compact enough to fit in one visible reply.',
    '- Use short bullets, not paragraphs.',
    '- Use exactly five numbered stages.',
    '- Give one artifact per stage.',
    '- Do not narrate the whole checklist in prose.',
    '- If space is tight, compress wording rather than omitting stages.',
    '- Do not stop mid-stage.',
    '',
    'WHAT I NEED FROM REN:',
    'Turn this into a compact five-stage field test route. Keep it practical, section-locked, and short enough to finish in one visible reply.',
    '',
    'VISIBLE OUTPUT REQUIREMENT:',
    'Return visible text. Do not return blank, metadata only, reasoning only, or an empty response.',
    '',
    'FIELD TEST OUTPUT SHAPE:',
    'Return exactly these sections and no other sections:',
    'TEST ROUTE:',
    'Stage 1 — Conversation shell:',
    'Stage 2 — Outcome & pattern flow:',
    'Stage 3 — Saved card flow:',
    'Stage 4 — Shelf & checkpoint:',
    'Stage 5 — Device / guards / recovery:',
    '',
    'PASS / FAIL SIGNALS:',
    '[one short line per stage]',
    '',
    'EVIDENCE TO CAPTURE:',
    '[one artifact per stage]',
    '',
    'KNOWN LOW-EVIDENCE AREAS:',
    '[max 5 bullets]',
    '',
    'DO NOT AUTOMATE YET:',
    '[max 5 bullets]',
    '',
    'NEXT FIELD TEST STEP:',
    '[one sentence]',
  ].join('\n');
}

export function buildQuinnMemoryHygieneReviewPacket(
  input: QuinnMemoryHygieneReviewSource
) {
  const counts = input.counts;
  const activeThread = input.activeThread || {};

  return [
    'QUINNOS MEMORY HYGIENE REVIEW',
    '',
    'PURPOSE:',
    'Review local memory/recent-run noise without changing anything.',
    '',
    'EXECUTION LOCK:',
    'Do the review now. Do not restate the task. Return only the six headings. No memory or card changes.',
    '',
    'LOCAL STATE:',
    `Recent runs: ${counts.recentRuns}`,
    `Memories: ${counts.memories}`,
    `Pinned memories: ${
      Number.isFinite(Number(counts.pinnedMemories)) ? Number(counts.pinnedMemories) : 'unknown'
    }`,
    `Notifications: ${counts.notifications}`,
    `Saved Pattern Cards: ${counts.savedCards}`,
    `Saved Card Shelf Reviews: ${counts.shelfReviews}`,
    '',
    'CURRENT RESONANCE:',
    `Active thread: ${formatQuinnShelfReviewValue(
      activeThread.title || '',
      '(none)',
      64
    )}`,
    `Latest summary: ${formatQuinnShelfReviewValue(
      activeThread.latestSummary || '',
      '(none)',
      96
    )}`,
    ...buildQuinnMemoryHygieneResonanceList(input.memoryResonance || [], 3),
    '',
    'RECENT SIGNAL SAMPLE:',
    ...buildQuinnMemoryHygieneRunList(input.recentRuns || [], 3),
    '',
    'MEMORY SAMPLE:',
    ...buildQuinnMemoryHygieneMemoryList(input.memories || [], 3),
    '',
    'NOTIFICATION NOISE SAMPLE:',
    ...buildQuinnMemoryHygieneNotificationList(input.notifications || [], 2),
    '',
    'OUTPUT LIMIT:',
    'Max 2 bullets per heading. Short bullets. If evidence is thin, say "Evidence is thin."',
    '',
    'OUTPUT SHAPE:',
    'MEMORY SHELF READ:',
    'DURABLE SIGNALS:',
    'TRANSIENT / TEST NOISE:',
    'DUPLICATES / STALE CONTEXT:',
    'DO NOT TREAT AS IDENTITY TRUTH:',
    'NEXT MANUAL MEMORY ACTION:',
  ].join('\n');
}

export function getQuinnPatternCardApplicationPacketPreview(
  packetText: string
): QuinnPatternCardApplicationPacketPreview | null {
  const text = String(packetText || '');

  if (!text.includes(QUINN_PATTERN_CARD_APPLICATION_MARKER)) {
    return null;
  }

  const lines = text.split(/\r?\n/);
  const preview = {
    savedPattern: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'SAVED PATTERN:')
    ),
    evidence: cleanQuinnOutcomeHistoryValue(getQuinnPacketSectionValue(lines, 'EVIDENCE:')),
    currentSituation: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'CURRENT SITUATION:')
    ),
  };

  if (!preview.savedPattern && !preview.evidence && !preview.currentSituation) {
    return null;
  }

  return preview;
}

function getQuinnPatternCardApplicationFallbackResultPreview(
  packetText: string,
  responseText: string
): QuinnPatternCardApplicationResultPreview | null {
  const preview = getQuinnPatternCardApplicationPacketPreview(packetText);
  const clean = cleanQuinnFallbackText(responseText, 520);
  const lower = clean.toLowerCase();

  if (!preview || clean.length < 12) {
    return null;
  }

  let applies = 'Unclear / not section-shaped.';

  if (/\b(does not apply|doesn't apply|not apply|misfit|does not fit|doesn't fit)\b/.test(lower)) {
    applies = 'Does not clearly apply.';
  } else if (/\b(partially applies|partly applies|somewhat applies|may apply|might apply|mixed)\b/.test(lower)) {
    applies = 'Partially applies / mixed.';
  } else if (/\b(applies|fits|useful lens|relevant)\b/.test(lower)) {
    applies = 'May apply, but output was not section-shaped.';
  }

  const supportingEvidence = findQuinnFallbackSentence(clean, [
    /\bevidence\b/i,
    /\bsupport/i,
    /\bindicat/i,
    /\bbecause\b/i,
    /\bexample\b/i,
    /\bpattern\b/i,
  ]);
  const limitsMisfit = findQuinnFallbackSentence(
    clean,
    [
      /\blimit/i,
      /\bmisfit\b/i,
      /\bcaution/i,
      /\bweak/i,
      /\bdoes not\b/i,
      /\bdoesn't\b/i,
      /\bunclear\b/i,
    ],
    'Output was not section-shaped; limits need manual review.'
  );
  const overuseRisk = findQuinnFallbackSentence(
    clean,
    [
      /\brisk\b/i,
      /\boverus/i,
      /\bovergeneral/i,
      /\boverfit/i,
      /\btoo broad\b/i,
    ],
    'Risk of overusing this pattern cannot be fully assessed from unstructured output.'
  );
  const nextBestMove = findQuinnFallbackSentence(
    clean,
    [
      /\bnext\b/i,
      /\bmove\b/i,
      /\btest\b/i,
      /\btry\b/i,
      /\brevise\b/i,
      /\bvalidate\b/i,
      /\bhold off\b/i,
      /\bapply\b/i,
    ],
    'Output was not section-shaped; next move needs manual review.'
  );

  return {
    applies: markQuinnFallbackCapture(QUINN_APPLICATION_FALLBACK_CAPTURE_MARKER, applies),
    supportingEvidence: markQuinnFallbackCapture(
      QUINN_APPLICATION_FALLBACK_CAPTURE_MARKER,
      supportingEvidence
    ),
    limitsMisfit: markQuinnFallbackCapture(
      QUINN_APPLICATION_FALLBACK_CAPTURE_MARKER,
      limitsMisfit
    ),
    overuseRisk: markQuinnFallbackCapture(
      QUINN_APPLICATION_FALLBACK_CAPTURE_MARKER,
      overuseRisk
    ),
    nextBestMove: markQuinnFallbackCapture(
      QUINN_APPLICATION_FALLBACK_CAPTURE_MARKER,
      nextBestMove
    ),
  };
}

export function getQuinnPatternCardApplicationResultPreview(
  responseText: string,
  packetText = ''
): QuinnPatternCardApplicationResultPreview | null {
  const text = String(responseText || '').trim();

  if (!text) {
    return null;
  }

  const lines = text.split(/\r?\n/);
  const preview = {
    applies: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValueFromHeadings(lines, ['APPLIES?', 'APPLIES?:', 'APPLIES:'])
    ),
    supportingEvidence: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'SUPPORTING EVIDENCE:')
    ),
    limitsMisfit: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValueFromHeadings(lines, [
        'LIMITS / MISFIT:',
        'LIMITS/MISFIT:',
        'LIMITS OR MISFIT:',
      ])
    ),
    overuseRisk: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValueFromHeadings(lines, [
        'RISK OF OVERUSING THIS PATTERN:',
        'RISK OF OVERUSE:',
        'OVERUSE RISK:',
      ])
    ),
    nextBestMove: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'NEXT BEST MOVE:')
    ),
  };

  if (
    !preview.applies &&
    !preview.supportingEvidence &&
    !preview.limitsMisfit &&
    !preview.overuseRisk &&
    !preview.nextBestMove
  ) {
    return getQuinnPatternCardApplicationFallbackResultPreview(packetText, text);
  }

  return preview;
}

export function getQuinnSavedPatternCardReviewPacketPreview(
  packetText: string
): QuinnSavedPatternCardReviewPacketPreview | null {
  const text = String(packetText || '');

  if (!text.includes(QUINN_SAVED_PATTERN_CARD_REVIEW_MARKER)) {
    return null;
  }

  const lines = text.split(/\r?\n/);
  const preview = {
    savedPattern: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'SAVED PATTERN:')
    ),
    evidence: cleanQuinnOutcomeHistoryValue(getQuinnPacketSectionValue(lines, 'EVIDENCE:')),
    savedAt: cleanQuinnPatternCardStateValue(getQuinnPacketLabeledBlockValue(lines, 'Saved:')),
    pinnedAt: cleanQuinnPatternCardStateValue(getQuinnPacketLabeledBlockValue(lines, 'Pinned:')),
    retiredAt: cleanQuinnPatternCardStateValue(getQuinnPacketLabeledBlockValue(lines, 'Retired:')),
  };

  if (
    !preview.savedPattern &&
    !preview.evidence &&
    !preview.savedAt &&
    !preview.pinnedAt &&
    !preview.retiredAt
  ) {
    return null;
  }

  return preview;
}

function getQuinnSavedPatternCardReviewFallbackResultPreview(
  packetText: string,
  responseText: string
): QuinnSavedPatternCardReviewResultPreview | null {
  const preview = getQuinnSavedPatternCardReviewPacketPreview(packetText);
  const clean = cleanQuinnFallbackText(responseText, 520);
  const lower = clean.toLowerCase();

  if (!preview || clean.length < 12) {
    return null;
  }

  let action = 'UNCLEAR';

  if (/\b(retire|retired|retiring|archive)\b/.test(lower)) {
    action = 'RETIRE';
  } else if (/\b(restore|unretire)\b/.test(lower)) {
    action = 'RESTORE';
  } else if (/\b(revise|revision|validate|draft|not ready|clarify)\b/.test(lower)) {
    action = /\b(test|try again|validate|field-test)\b/.test(lower)
      ? 'REVISE / TEST AGAIN'
      : 'REVISE';
  } else if (/\b(test|try again|field-test)\b/.test(lower)) {
    action = 'TEST AGAIN';
  } else if (/\b(keep|stay active|save|pin)\b/.test(lower)) {
    action = 'KEEP';
  }

  const lifecycleRead = cleanQuinnFallbackText(clean, 180);
  const why = findQuinnFallbackSentence(
    clean,
    [
      /\bbecause\b/i,
      /\bwhy\b/i,
      /\bneeds?\b/i,
      /\bnot ready\b/i,
      /\bvalidate\b/i,
      /\bdraft\b/i,
      /\bspecific/i,
    ],
    lifecycleRead
  );
  const riskIfKeptAsIs = findQuinnFallbackSentence(
    clean,
    [
      /\brisk\b/i,
      /\bovergeneral/i,
      /\bunderspec/i,
      /\bsingle (data )?point\b/i,
      /\bnot ready\b/i,
      /\boverfit\b/i,
      /\bstale\b/i,
      /\btoo broad\b/i,
    ],
    'Risk not structured; manual review needed.'
  );
  const nextBestCardAction = findQuinnFallbackSentence(
    clean,
    [
      /\brevise\b/i,
      /\bvalidate\b/i,
      /\btest\b/i,
      /\bretry\b/i,
      /\bsave\b/i,
      /\bpin\b/i,
      /\bretire\b/i,
      /\brestore\b/i,
      /\bhold off\b/i,
    ],
    'Next card action was not section-shaped; manual review needed.'
  );

  return {
    lifecycleRead: markQuinnFallbackCapture(
      QUINN_LIFECYCLE_FALLBACK_CAPTURE_MARKER,
      lifecycleRead
    ),
    keepReviseRetireRestore: markQuinnFallbackCapture(
      QUINN_LIFECYCLE_FALLBACK_CAPTURE_MARKER,
      action
    ),
    why: markQuinnFallbackCapture(QUINN_LIFECYCLE_FALLBACK_CAPTURE_MARKER, why),
    riskIfKeptAsIs: markQuinnFallbackCapture(
      QUINN_LIFECYCLE_FALLBACK_CAPTURE_MARKER,
      riskIfKeptAsIs
    ),
    nextBestCardAction: markQuinnFallbackCapture(
      QUINN_LIFECYCLE_FALLBACK_CAPTURE_MARKER,
      nextBestCardAction
    ),
  };
}

export function getQuinnSavedPatternCardReviewResultPreview(
  responseText: string,
  packetText = ''
): QuinnSavedPatternCardReviewResultPreview | null {
  const text = String(responseText || '').trim();

  if (!text) {
    return null;
  }

  const lines = text.split(/\r?\n/);
  const preview = {
    lifecycleRead: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'LIFECYCLE READ:')
    ),
    keepReviseRetireRestore: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValueFromHeadings(lines, [
        'KEEP / REVISE / RETIRE / RESTORE:',
        'KEEP/REVISE/RETIRE/RESTORE:',
      ])
    ),
    why: cleanQuinnOutcomeHistoryValue(getQuinnPacketSectionValue(lines, 'WHY:')),
    riskIfKeptAsIs: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValueFromHeadings(lines, [
        'RISK IF KEPT AS-IS:',
        'RISK IF KEPT AS IS:',
      ])
    ),
    nextBestCardAction: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'NEXT BEST CARD ACTION:')
    ),
  };

  if (
    !preview.lifecycleRead &&
    !preview.keepReviseRetireRestore &&
    !preview.why &&
    !preview.riskIfKeptAsIs &&
    !preview.nextBestCardAction
  ) {
    return getQuinnSavedPatternCardReviewFallbackResultPreview(packetText, text);
  }

  return preview;
}

export function getQuinnPatternCardSaveIntentPacketPreview(
  packetText: string
): QuinnPatternCardSaveIntentPacketPreview | null {
  const text = String(packetText || '');

  if (!text.includes(QUINN_PATTERN_CARD_SAVE_INTENT_MARKER)) {
    return null;
  }

  const lines = text.split(/\r?\n/);
  const preview = {
    possiblePattern: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'POSSIBLE PATTERN:')
    ),
    evidence: cleanQuinnOutcomeHistoryValue(getQuinnPacketSectionValue(lines, 'EVIDENCE:')),
    sourceRunId: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketLabeledLineValue(lines, 'Source run:')
    ),
  };

  if (!preview.possiblePattern && !preview.evidence && !preview.sourceRunId) {
    return null;
  }

  return preview;
}

export function getQuinnPatternCardSaveIntentResultPreview(
  responseText: string
): QuinnPatternCardSaveIntentResultPreview | null {
  const text = String(responseText || '').trim();

  if (!text) {
    return null;
  }

  const lines = text.split(/\r?\n/);
  const preview = {
    saveReadiness: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'SAVE READINESS:')
    ),
    shouldPreserveLater: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'SHOULD PRESERVE LATER:')
    ),
    clarifyBeforeStorage: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'CLARIFY BEFORE STORAGE:')
    ),
    storageRisk: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'STORAGE RISK:')
    ),
    nextBestMove: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'NEXT BEST MOVE:')
    ),
  };

  if (
    !preview.saveReadiness &&
    !preview.shouldPreserveLater &&
    !preview.clarifyBeforeStorage &&
    !preview.storageRisk &&
    !preview.nextBestMove
  ) {
    return null;
  }

  return preview;
}

export function getQuinnSavedCardShelfReviewPacketPreview(
  packetText: string
): QuinnSavedCardShelfReviewPacketPreview | null {
  const text = String(packetText || '');

  if (!text.includes(QUINN_SAVED_CARD_SHELF_REVIEW_MARKER)) {
    return null;
  }

  const lines = text.split(/\r?\n/);

  return {
    activeSavedCount: parseQuinnShelfReviewCount(
      getQuinnPacketLabeledLineValue(lines, 'Active saved cards:')
    ),
    retiredSavedCount: parseQuinnShelfReviewCount(
      getQuinnPacketLabeledLineValue(lines, 'Retired saved cards:')
    ),
    pinnedSavedCount: parseQuinnShelfReviewCount(
      getQuinnPacketLabeledLineValue(lines, 'Pinned saved cards:')
    ),
    withSaveIntentReviewCount: parseQuinnShelfReviewCount(
      getQuinnPacketLabeledLineValue(lines, 'With Save Intent review:')
    ),
    withApplicationCheckCount: parseQuinnShelfReviewCount(
      getQuinnPacketLabeledLineValue(lines, 'With Application check:')
    ),
    withLifecycleReviewCount: parseQuinnShelfReviewCount(
      getQuinnPacketLabeledLineValue(lines, 'With Lifecycle review:')
    ),
    filter: cleanQuinnPatternCardStateValue(getQuinnPacketLabeledLineValue(lines, 'Filter:')),
    search: cleanQuinnPatternCardStateValue(getQuinnPacketLabeledLineValue(lines, 'Search:')),
    sort: cleanQuinnPatternCardStateValue(getQuinnPacketLabeledLineValue(lines, 'Sort:')),
  };
}

function getQuinnSavedCardShelfReviewFallbackResultPreview(
  packetText: string,
  responseText: string
): QuinnSavedCardShelfReviewResultPreview | null {
  const preview = getQuinnSavedCardShelfReviewPacketPreview(packetText);
  const clean = cleanQuinnFallbackText(responseText, 560);

  if (!preview || clean.length < 12) {
    return null;
  }

  const shelfRead = cleanQuinnFallbackText(clean, 180);
  const mostUsefulActiveCards = findQuinnFallbackSentence(
    clean,
    [
      /\buseful\b/i,
      /\bactive\b/i,
      /\bkeep\b/i,
      /\bstay active\b/i,
      /\bworth keeping\b/i,
      /\bstrong/i,
      /\bworking\b/i,
    ],
    'Useful active cards were not section-shaped; manual review needed.'
  );
  const staleRiskyOverfitCards = findQuinnFallbackSentence(
    clean,
    [
      /\bstale\b/i,
      /\brisky\b/i,
      /\brisk\b/i,
      /\bthin\b/i,
      /\bunderspec/i,
      /\btruncated\b/i,
      /\boverfit\b/i,
      /\bovergeneral/i,
      /\bretire\b/i,
      /\bnot ready\b/i,
    ],
    'Stale or risky cards were not section-shaped; manual review needed.'
  );
  const missingOrUndertestedAreas = findQuinnFallbackSentence(
    clean,
    [
      /\bmissing\b/i,
      /\bundertest/i,
      /\bneeds?\b/i,
      /\btesting\b/i,
      /\breplication\b/i,
      /\bevidence\b/i,
      /\bvalidate\b/i,
      /\bfield-test\b/i,
    ],
    'Missing or undertested areas were not section-shaped; manual review needed.'
  );
  const nextBestManualCardAction = findQuinnFallbackSentence(
    clean,
    [
      /\bnext\b/i,
      /\bmanual\b/i,
      /\baction\b/i,
      /\btighten\b/i,
      /\btest\b/i,
      /\brevise\b/i,
      /\bvalidate\b/i,
      /\bsurface\b/i,
      /\bretry\b/i,
      /\bno pins?\b/i,
      /\bno retirements?\b/i,
      /\bhold off\b/i,
    ],
    'Next manual card action was not section-shaped; manual review needed.'
  );

  return {
    shelfRead: markQuinnFallbackCapture(
      QUINN_SHELF_REVIEW_FALLBACK_CAPTURE_MARKER,
      shelfRead
    ),
    mostUsefulActiveCards: markQuinnFallbackCapture(
      QUINN_SHELF_REVIEW_FALLBACK_CAPTURE_MARKER,
      mostUsefulActiveCards
    ),
    staleRiskyOverfitCards: markQuinnFallbackCapture(
      QUINN_SHELF_REVIEW_FALLBACK_CAPTURE_MARKER,
      staleRiskyOverfitCards
    ),
    missingOrUndertestedAreas: markQuinnFallbackCapture(
      QUINN_SHELF_REVIEW_FALLBACK_CAPTURE_MARKER,
      missingOrUndertestedAreas
    ),
    nextBestManualCardAction: markQuinnFallbackCapture(
      QUINN_SHELF_REVIEW_FALLBACK_CAPTURE_MARKER,
      nextBestManualCardAction
    ),
  };
}

export function getQuinnSavedCardShelfReviewResultPreview(
  responseText: string,
  packetText = ''
): QuinnSavedCardShelfReviewResultPreview | null {
  const text = String(responseText || '').trim();

  if (!text) {
    return null;
  }

  const lines = text.split(/\r?\n/);
  const preview = {
    shelfRead: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'SHELF READ:')
    ),
    mostUsefulActiveCards: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'MOST USEFUL ACTIVE CARDS:')
    ),
    staleRiskyOverfitCards: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'STALE / RISKY / OVERFIT CARDS:')
    ),
    missingOrUndertestedAreas: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'MISSING OR UNDERTESTED AREAS:')
    ),
    nextBestManualCardAction: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'NEXT BEST MANUAL CARD ACTION:')
    ),
  };

  if (
    !preview.shelfRead &&
    !preview.mostUsefulActiveCards &&
    !preview.staleRiskyOverfitCards &&
    !preview.missingOrUndertestedAreas &&
    !preview.nextBestManualCardAction
  ) {
    return getQuinnSavedCardShelfReviewFallbackResultPreview(packetText, text);
  }

  return preview;
}

export function getQuinnDraftPatternCardHistoryPreview(
  packetText: string
): QuinnDraftPatternCardHistoryPreview | null {
  const text = String(packetText || '');

  if (!text.includes(QUINN_DRAFT_PATTERN_CARD_MARKER)) {
    return null;
  }

  const lines = text.split(/\r?\n/);

  return {
    candidate: cleanQuinnOutcomeHistoryValue(getQuinnPacketSectionValue(lines, 'CANDIDATE:')),
    evidence: cleanQuinnOutcomeHistoryValue(getQuinnPacketSectionValue(lines, 'EVIDENCE:')),
    confidence: cleanQuinnOutcomeHistoryValue(getQuinnPacketSectionValue(lines, 'CONFIDENCE:')),
    shouldMatter: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'WHEN THIS PATTERN SHOULD MATTER:')
    ),
    shouldNotMatter: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'WHEN THIS PATTERN SHOULD NOT MATTER:')
    ),
    mightRemember: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'WHAT QUINNOS MIGHT REMEMBER:')
    ),
  };
}

export function getQuinnDraftPatternCardResultPreview(
  responseText: string
): QuinnDraftPatternCardResultPreview | null {
  const text = String(responseText || '').trim();

  if (!text) {
    return null;
  }

  const lines = text.split(/\r?\n/);
  const preview = {
    possiblePattern: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'POSSIBLE PATTERN:')
    ),
    evidence: cleanQuinnOutcomeHistoryValue(getQuinnPacketSectionValue(lines, 'EVIDENCE:')),
    overgeneralizationRisk: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'OVERGENERALIZATION RISK:')
    ),
    beforeStoringDecision: cleanQuinnOutcomeHistoryValue(
      getQuinnPacketSectionValue(lines, 'BEFORE STORING, QUINN SHOULD DECIDE:')
    ),
  };

  if (
    !preview.possiblePattern &&
    !preview.evidence &&
    !preview.overgeneralizationRisk &&
    !preview.beforeStoringDecision
  ) {
    return null;
  }

  return preview;
}

export const QUINNOS_INTAKE_FORMS: QuinnIntakeFormDefinition[] = [
  {
    id: 'intake-compass',
    label: 'Intake',
    icon: 'compass',
    template: [
      'QUINNOS INTAKE COMPASS',
      '',
      'PURPOSE:',
      'Classify this material before shaping it. Do not forge everything. Choose the heat the material can survive.',
      '',
      'MATERIAL TYPE GUESS:',
      '[identity / structure / language / judgment / removal / action / witness / not sure]',
      '',
      'DOMAIN:',
      '[work / relationship / grief / body / money / app / creative / conflict / decision / behavior / other]',
      '',
      'RAW MATERIAL:',
      '[Paste or describe the thing here.]',
      '',
      'CONTEXT:',
      '[What happened? What matters? What is the situation around it?]',
      '',
      'STATE:',
      '[What is my body/emotional weather right now? Activated, tired, avoidant, clear, grieving, wired, numb, etc.]',
      '',
      'RISK / TIME:',
      '[Is this urgent, delicate, high-stakes, or safe to process slowly?]',
      '',
      'WHAT I THINK I WANT:',
      '[The obvious ask.]',
      '',
      'WHAT I MAY ACTUALLY NEED:',
      '[The deeper need, if I can sense it.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'First classify this as one of: Name, Framework, Rewrite, Critique, Cut, Next Move, Witness-Line, or Default Map. Then apply only the heat it can survive. Do not over-process it. End with either the cleanest witness-line, the next best move, or the exact form I should use next.',
    ],
  },
  {
    id: 'decision-intake',
    label: 'Decision',
    icon: 'target',
    template: [
      'QUINNOS DECISION INTAKE',
      '',
      'PURPOSE:',
      'Turn this decision into the most probable best next move without pretending certainty.',
      '',
      'DECISION:',
      '[What am I deciding?]',
      '',
      'OPTIONS:',
      '[What are the real options, including doing nothing or delaying?]',
      '',
      'CONTEXT:',
      '[What happened? What matters around this decision?]',
      '',
      'STATE:',
      '[What is my body/emotional weather right now? Tired, activated, hopeful, ashamed, pressured, clear, avoidant, etc.]',
      '',
      'WHAT I WANT:',
      '[What do I want to happen?]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Time, money, dignity, stability, relationships, sleep, work, safety, clarity, momentum, etc.]',
      '',
      'RISKS / COSTS:',
      '[What could each option cost later?]',
      '',
      'HIDDEN PULLS:',
      '[What might be biasing me? Panic, longing, shame, novelty, revenge, relief, avoidance, being seen, proving something, etc.]',
      '',
      'TIMING:',
      '[Does this need action now, later today, this week, or not yet?]',
      '',
      'WHAT WOULD CHANGE THE ANSWER:',
      '[What missing information would matter?]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Give me the most probable best move, confidence level, what you are uncertain about, what Future Quinn needs protected, the smallest next action, and whether this decision should be acted on, delayed, or converted into another QuinnOS form.',
    ],
  },
  {
    id: 'feeling-intake',
    label: 'Feeling',
    icon: 'heart',
    template: [
      'QUINNOS FEELING INTAKE',
      '',
      'PURPOSE:',
      'Turn this feeling into structured signal without flattening it or immediately forcing it into action.',
      '',
      'FEELING / MOOD:',
      '[What am I feeling? Use messy words if needed.]',
      '',
      'BODY SIGNALS:',
      '[Where is it in my body? Tension, heat, heaviness, buzzing, numbness, pressure, etc.]',
      '',
      'WHAT HAPPENED:',
      '[What triggered or preceded this feeling?]',
      '',
      'WHAT I THINK IT MEANS:',
      '[The story my brain is attaching to the feeling.]',
      '',
      'WHAT IT MAY ACTUALLY BE:',
      '[Need, grief, fear, exhaustion, hope, shame, anger, loneliness, overstimulation, old pattern, etc.]',
      '',
      'URGE:',
      '[What does this feeling want me to do right now? Text, withdraw, spend, eat, fix, confess, avoid, spiral, clean, sleep, etc.]',
      '',
      'RISK:',
      '[Would acting from this feeling protect me, cost me, or both?]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Stability, dignity, money, sleep, work, relationships, recovery, momentum, truth, softness, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Name what this feeling probably is, what it is asking for, what urge should not drive the car, what need deserves care, and the smallest next move that honors the feeling without letting it hijack the day.',
    ],
  },
  {
    id: 'body-nervous-system-intake',
    label: 'Body',
    icon: 'activity',
    template: [
      'QUINNOS BODY / NERVOUS SYSTEM INTAKE',
      '',
      'PURPOSE:',
      'Turn body state into structured signal before Quinn mistakes physiology for prophecy, failure, danger, or truth.',
      '',
      'BODY STATE:',
      '[What is happening physically? Tired, wired, hungry, heavy, shaky, tense, numb, restless, overstimulated, sick, sore, etc.]',
      '',
      'ENERGY LEVEL:',
      '[Low, medium, high, unstable, crashing, artificially boosted, unknown.]',
      '',
      'SENSORY LOAD:',
      '[Noise, light, touch, temperature, crowds, music, screen time, car time, work stimulation, etc.]',
      '',
      'FOOD / CAFFEINE / NICOTINE / MEDS:',
      '[What have I eaten, drunk, smoked, taken, skipped, or overdone recently?]',
      '',
      'SLEEP / REST:',
      '[How much rest did I get? What kind of sleep? Any naps, crashes, or insomnia?]',
      '',
      'EMOTIONAL WEATHER:',
      '[What feelings are riding on top of the body state?]',
      '',
      'RECENT CONTEXT:',
      '[Work shift, therapy, conflict, grief, social time, errands, spending, creative sprint, transition, etc.]',
      '',
      'URGE:',
      '[What does my body want me to do right now? Collapse, scroll, spend, text, eat, avoid, clean, cry, drive, isolate, seek contact, etc.]',
      '',
      'RISK:',
      '[What might go wrong if I obey the urge immediately? What might go wrong if I ignore the body?]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Food, sleep, money, work, dignity, recovery, emotional stability, safety, momentum, nervous system, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Separate body signal from story. Tell me what is probably physiology, what may be emotion, what urge should not drive the car, what need deserves care, and the smallest regulation move I can do in the next 5 to 15 minutes.',
    ],
  },
  {
    id: 'grief-wave-intake',
    label: 'Grief',
    icon: 'cloud-rain',
    template: [
      'QUINNOS GRIEF WAVE INTAKE',
      '',
      'PURPOSE:',
      'Turn a grief wave into structured signal without treating it like a problem to solve, a text to send, or a truth Quinn has to obey.',
      '',
      'WHAT SET IT OFF:',
      '[What triggered the wave? A place, song, memory, person, date, dream, smell, object, silence, body feeling, social media, work moment, etc.]',
      '',
      'WHO / WHAT THIS GRIEF IS ABOUT:',
      '[Person, version of me, lost future, old home, relationship, safety, time, possibility, identity, etc.]',
      '',
      'WHAT I MISS:',
      '[What exactly hurts to not have?]',
      '',
      'WHAT I AM REACHING FOR:',
      '[Contact, proof, comfort, repair, explanation, fantasy, justice, being chosen, the old feeling, the old self, etc.]',
      '',
      'WHAT MY BODY IS DOING:',
      '[Chest, throat, stomach, hands, fatigue, tears, numbness, buzzing, ache, heaviness, etc.]',
      '',
      'THE STORY MY BRAIN IS TELLING:',
      '[What meaning is grief attaching to this?]',
      '',
      'WHAT IS TRUE EVEN IF THE STORY IS LOUD:',
      '[Grounded facts, current reality, what I know when I am not inside the wave.]',
      '',
      'URGE:',
      '[Text, check, search, reread, drive somewhere, isolate, spend, eat, smoke, spiral, romanticize, shut down, perform okay, etc.]',
      '',
      'RISK:',
      '[What could this grief wave make me do that Future Quinn may have to clean up?]',
      '',
      'WHAT THIS GRIEF NEEDS INSTEAD:',
      '[Witness, body care, ritual, music, crying, packet, walk, food, no action, Ashley, Ren, sleep, containment, memory without contact, etc.]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Dignity, boundaries, recovery, sleep, work, money, self-trust, emotional safety, current relationships, momentum, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Name what kind of grief wave this is. Separate memory from current reality, longing from evidence, and contact-seeking from actual need. Give me one witness-line, one body-based care move, and the smallest next step that lets the grief move without letting it drive the car.',
    ],
  },
  {
    id: 'work-situation-intake',
    label: 'Work',
    icon: 'briefcase',
    template: [
      'QUINNOS WORK SITUATION INTAKE',
      '',
      'PURPOSE:',
      'Turn a work situation into structured signal, clean judgment, and the next best move without collapsing into people-pleasing, over-functioning, or unnecessary escalation.',
      '',
      'SITUATION:',
      '[What happened at work?]',
      '',
      'PEOPLE INVOLVED:',
      '[Who is involved? Partners, customers, SSVs, ASM, SM, DM, etc.]',
      '',
      'ROLE I WAS IN:',
      '[Shift supervisor, partner, customer-facing mode, training mode, conflict mode, cleanup mode, etc.]',
      '',
      'WHAT I NOTICED:',
      '[What facts, patterns, behaviors, or inconsistencies stood out?]',
      '',
      'WHAT I FELT:',
      '[What did it bring up emotionally or physically?]',
      '',
      'WHAT I THINK IT MEANS:',
      '[The interpretation my brain is making.]',
      '',
      'WHAT ELSE COULD BE TRUE:',
      '[Alternate explanations, missing context, operational pressures, emotional distortion, etc.]',
      '',
      'RISK / STAKES:',
      '[What could go wrong if I act, avoid, escalate, confront, document, or let it go?]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Credibility, job stability, ASM path, energy, dignity, relationships, boundaries, money, schedule, nervous system, etc.]',
      '',
      'WHAT I WANT TO DO:',
      '[My immediate urge or preferred move.]',
      '',
      'WHAT I NEED HELP DECIDING:',
      '[Clarify the actual ask.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Give me the cleanest read of this work situation. Separate facts from interpretation, name the likely pattern, identify what Future Quinn needs protected, tell me whether to act, document, ask, wait, escalate, repair, or let it go, and give me the smallest professional next move.',
    ],
  },
  {
    id: 'relationship-read-intake',
    label: 'Relationship',
    icon: 'users',
    template: [
      'QUINNOS RELATIONSHIP READ INTAKE',
      '',
      'PURPOSE:',
      'Turn a relationship situation into structured signal without over-reading, self-abandoning, or flattening the emotional truth.',
      '',
      'PERSON / PEOPLE:',
      '[Who is involved?]',
      '',
      'RELATIONSHIP CONTEXT:',
      '[What is this relationship? Friend, coworker, family, romantic, ex, situationship, therapist, customer, etc.]',
      '',
      'WHAT HAPPENED:',
      '[What actually happened? Include observable facts.]',
      '',
      'WHAT I NOTICED:',
      '[Patterns, tone shifts, timing, body language, inconsistencies, repeated behaviors, or emotional charge.]',
      '',
      'WHAT I FELT:',
      '[What came up in me emotionally or physically?]',
      '',
      'WHAT I THINK IT MEANS:',
      '[The story or interpretation my brain is making.]',
      '',
      'WHAT ELSE COULD BE TRUE:',
      '[Alternate explanations, missing information, projection, old wound, ordinary human weirdness, context I may not have.]',
      '',
      'WHAT I WANT:',
      '[What do I want from this person or situation?]',
      '',
      'WHAT I AM AFRAID OF:',
      '[Rejection, abandonment, being wrong, being too much, being used, being unseen, losing control, etc.]',
      '',
      'EVIDENCE FOR:',
      '[What supports my interpretation?]',
      '',
      'EVIDENCE AGAINST:',
      '[What weakens or complicates my interpretation?]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Dignity, boundaries, clarity, emotional safety, job stability, recovery, money, time, self-trust, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Give me the cleanest read of this relationship situation. Separate facts from interpretation, name the likely pattern, identify what may be projection or old wound, tell me what Future Quinn needs protected, and give me the smallest next move: speak, wait, ask, document, repair, detach, or let it breathe.',
    ],
  },
  {
    id: 'creative-idea-intake',
    label: 'Creative',
    icon: 'pen-tool',
    template: [
      'QUINNOS CREATIVE IDEA INTAKE',
      '',
      'PURPOSE:',
      'Turn a creative spark into structured signal without overworking it, flattening it, or forcing it to become a finished thing too early.',
      '',
      'RAW IDEA:',
      '[What is the idea, image, line, scene, concept, title, app feature, metaphor, or strange little signal?]',
      '',
      'WHERE IT CAME FROM:',
      '[What triggered it? Conversation, dream, memory, work, grief, music, therapy, body state, joke, frustration, etc.]',
      '',
      'WHAT KIND OF MATERIAL THIS IS:',
      '[Book/memoir, QuinnOS, essay, scene, poem, title, app feature, framework, joke, packet, visual, unknown.]',
      '',
      'WHAT FEELS ALIVE:',
      '[What part has charge, texture, weirdness, truth, humor, beauty, ache, or momentum?]',
      '',
      'WHAT I THINK IT WANTS TO BECOME:',
      '[If I can sense it: chapter, framework, post, form, scene, packet, feature, title, line, or nothing yet.]',
      '',
      'WHAT I AM AFRAID WILL HAPPEN:',
      '[I will ruin it, over-explain it, forget it, make it too polished, make it too weird, never finish it, expose too much, etc.]',
      '',
      'WHAT IT DOES NOT NEED YET:',
      '[Editing, explanation, judgment, audience, structure, polish, monetization, final title, moral, productivity pressure, etc.]',
      '',
      'WHAT KIND OF HELP I WANT:',
      '[Name, Framework, Rewrite, Critique, Cut, Next Move, Witness-Line, Default Map, or not sure.]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Voice, originality, privacy, momentum, energy, time, emotional safety, coherence, play, honesty, weirdness, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Classify what kind of creative material this is. Tell me what is alive in it, what heat it can survive, what not to do yet, and the smallest next creative move. If it only needs witnessing, give me the witness-line and do not over-process it.',
    ],
  },
  {
    id: 'memory-capture-intake',
    label: 'Memory',
    icon: 'bookmark',
    template: [
      'QUINNOS MEMORY CAPTURE INTAKE',
      '',
      'PURPOSE:',
      'Save something that feels meaningful before Quinn forces it to become a conclusion, project, crisis, message, or performance too soon.',
      '',
      'WHAT I WANT TO SAVE:',
      '[The moment, thought, image, phrase, quote, dream, detail, memory, feeling, pattern, coincidence, or tiny signal.]',
      '',
      'WHERE IT CAME FROM:',
      '[When, where, who, what triggered it, what was happening around it?]',
      '',
      'WHY IT CAUGHT ME:',
      '[What made it glow, sting, echo, feel funny, feel important, or refuse to leave?]',
      '',
      'WHAT IT MIGHT CONNECT TO:',
      '[Person, place, pattern, project, grief, work, relationship, memoir, QuinnOS, old self, future self, unknown.]',
      '',
      'WHAT I DO NOT KNOW YET:',
      '[What feels unclear, unfinished, unprocessed, or too early to name?]',
      '',
      'WHAT I AM TEMPTED TO DO WITH IT:',
      '[Explain it, send it, archive it, overwork it, ignore it, turn it into art, make it a sign, make it a problem, etc.]',
      '',
      'WHAT IT DOES NOT NEED YET:',
      '[Action, certainty, analysis, audience, decision, repair, message, moral, full meaning, or a finished shape.]',
      '',
      'WHAT FUTURE QUINN MAY NEED FROM THIS:',
      '[Reminder, evidence, creative seed, pattern data, comfort, warning, title, therapy material, memory trace, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Capture this cleanly. Tell me what kind of memory/signal this appears to be, what should be preserved exactly, what not to force yet, and where it should go next: leave it as a saved fragment, turn it into Creative, Therapy, Grief, Relationship, Default Map, or Outcome material.',
    ],
  },
  {
    id: 'therapy-packet-intake',
    label: 'Therapy',
    icon: 'clipboard',
    template: [
      'QUINNOS THERAPY PACKET INTAKE',
      '',
      'PURPOSE:',
      'Turn raw internal material into a packet Ashley can read aloud so Quinn can receive the truth without having to perform it from inside the pressure.',
      '',
      'SESSION CONTEXT:',
      '[What is happening today? Where am I emotionally, physically, practically, or relationally?]',
      '',
      'THE THING I NEED ASHLEY TO UNDERSTAND:',
      '[What is the main truth, pattern, event, or pressure I do not want to lose in the room?]',
      '',
      'WHAT I MAY MINIMIZE OR JOKE AROUND:',
      '[What might I make smaller, deflect, intellectualize, or turn into a bit?]',
      '',
      'WHAT FEELS HARD TO SAY DIRECTLY:',
      '[The part that gets stuck, embarrassing, too intense, too tender, too complicated, or too alive.]',
      '',
      'WHAT I NEED READ ALOUD:',
      '[The exact truth I may need Ashley to say out loud for me.]',
      '',
      'WHAT I NEED HELP SORTING:',
      '[Pattern, decision, grief, relationship, work, body, avoidance, shame, anger, hope, fear, etc.]',
      '',
      'WHAT I DO NOT NEED:',
      '[What would flatten this? Generic reassurance, over-analysis, premature advice, moralizing, minimizing, etc.]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Dignity, honesty, safety, agency, progress, softness, clarity, self-trust, recovery, momentum, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Turn this into a therapy packet Ashley can read aloud. Keep Quinn\'s voice alive. Name the core pattern, the emotional truth, what Quinn may avoid saying, what Ashley should notice, and the most useful questions for the session. Do not flatten it into generic therapy language.',
    ],
  },
  {
    id: 'default-map',
    label: 'Default Map',
    icon: 'file-text',
    template: [
      'QUINNOS DEFAULT MAP INTAKE',
      '',
      'CONSTITUTION:',
      'Quinn does not rise to her intentions. Quinn falls to her defaults.',
      'Therefore QuinnOS does not command Quinn to try harder.',
      'QuinnOS studies the slope, alters the terrain, and marks the next foothold.',
      '',
      'MODE: Strategist + Quinn Default Design',
      'DOMAIN: Behavior / Pattern / Default Redesign',
      '',
      '1. CURRENT DEFAULT',
      'What keeps happening?',
      '',
      '',
      '2. TRIGGER FIELD',
      'When, where, or under what emotional/internal conditions does it happen?',
      '',
      '',
      '3. HIDDEN REWARD',
      'What does this behavior give me immediately?',
      '',
      '',
      '4. PROTECTED NEED',
      'What valid need is hiding inside the messy behavior?',
      '',
      '',
      '5. DELAYED COST',
      'How does Future Quinn pay for this?',
      '',
      '',
      '6. BETTER REPLACEMENT',
      'What could meet the same need with less damage?',
      '',
      '',
      '7. EASE PATH',
      'How do we make the better behavior easier, smaller, closer, safer, or already-started?',
      '',
      '',
      '8. FRICTION PATH',
      'How do we make the old default slower, less automatic, or less convenient without punishment?',
      '',
      '',
      '9. MINIMUM VIABLE RETURN',
      'When I fall off, what is the smallest reset that counts?',
      '',
      '',
      '10. NEXT BEST MOVE',
      'What should I do next, specifically, in the next 5 to 15 minutes?',
      '',
      '',
      'OUTPUT I NEED FROM REN:',
      'Turn this into a Default Map. Do not stop at insight. Give me the named pattern, hidden function, cost signal, protected need, replacement path, ease path, friction path, minimum viable return, and the next best move.',
    ],
  },
  {
    id: 'outcome-log',
    label: 'Outcome',
    icon: 'activity',
    template: [
      'QUINNOS OUTCOME LOG',
      '',
      'PURPOSE:',
      'Feed the result back into QuinnOS so the system gets more accurate over time.',
      '',
      'ORIGINAL INTAKE / RECOMMENDATION:',
      '[What did QuinnOS/Ren suggest or help me decide?]',
      '',
      'WHAT I ACTUALLY DID:',
      '[What happened in real life?]',
      '',
      'IT CAUSED:',
      '[What changed afterward?]',
      '',
      'DID IT HELP?',
      '[yes / no / mixed / too soon to tell]',
      '',
      'WHAT WORKED:',
      '[What was useful, accurate, grounding, clarifying, or effective?]',
      '',
      'WHAT MISSED:',
      '[What was off, incomplete, too much, too little, generic, or badly timed?]',
      '',
      'WHAT QUINNOS SHOULD REMEMBER:',
      '[What should be weighted more strongly next time this pattern appears?]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Turn this into a calibration note. Name what worked, what failed, what should change next time, and whether this should become a recurring pattern card.',
    ],
  },
];

export function getQuinnIntakeFormKindFromPacketText(
  packetText: string
): QuinnIntakeFormPacketKind | null {
  const text = String(packetText || '');

  if (text.includes(QUINN_MEMORY_HYGIENE_REVIEW_MARKER)) {
    return {
      id: 'memory-hygiene-review',
      label: 'Memory Review',
      icon: 'database',
      marker: QUINN_MEMORY_HYGIENE_REVIEW_MARKER,
      isOutcomeLog: false,
    };
  }

  if (text.includes(QUINN_MANUAL_FIELD_TEST_CHECKLIST_MARKER)) {
    return {
      id: 'manual-field-test-checklist',
      label: 'Field Test',
      icon: 'check-square',
      marker: QUINN_MANUAL_FIELD_TEST_CHECKLIST_MARKER,
      isOutcomeLog: false,
    };
  }

  if (text.includes(QUINN_RELEASE_READINESS_AUDIT_MARKER)) {
    return {
      id: 'release-readiness-audit',
      label: 'Release Audit',
      icon: 'check-circle',
      marker: QUINN_RELEASE_READINESS_AUDIT_MARKER,
      isOutcomeLog: false,
    };
  }

  if (text.includes(QUINN_SAVED_CARD_SHELF_REVIEW_MARKER)) {
    return {
      id: 'saved-card-shelf-review',
      label: 'Shelf Review',
      icon: 'layers',
      marker: QUINN_SAVED_CARD_SHELF_REVIEW_MARKER,
      isOutcomeLog: false,
    };
  }

  if (text.includes(QUINN_SAVED_PATTERN_CARD_REVIEW_MARKER)) {
    return {
      id: 'saved-pattern-card-review',
      label: 'Card Review',
      icon: 'refresh-cw',
      marker: QUINN_SAVED_PATTERN_CARD_REVIEW_MARKER,
      isOutcomeLog: false,
    };
  }

  if (text.includes(QUINN_PATTERN_CARD_APPLICATION_MARKER)) {
    return {
      id: 'pattern-card-application',
      label: 'Card Check',
      icon: 'target',
      marker: QUINN_PATTERN_CARD_APPLICATION_MARKER,
      isOutcomeLog: false,
    };
  }

  if (text.includes(QUINN_PATTERN_CARD_SAVE_INTENT_MARKER)) {
    return {
      id: 'pattern-card-save-intent',
      label: 'Save Intent',
      icon: 'bookmark',
      marker: QUINN_PATTERN_CARD_SAVE_INTENT_MARKER,
      isOutcomeLog: false,
    };
  }

  if (text.includes(QUINN_DRAFT_PATTERN_CARD_MARKER)) {
    return {
      id: 'draft-pattern-card',
      label: 'Draft Pattern',
      icon: 'edit-3',
      marker: QUINN_DRAFT_PATTERN_CARD_MARKER,
      isOutcomeLog: false,
    };
  }

  for (const form of QUINNOS_INTAKE_FORMS) {
    const marker = form.template[0];

    if (marker && text.includes(marker)) {
      return {
        id: form.id,
        label: form.label,
        icon: form.icon,
        marker,
        isOutcomeLog: form.id === 'outcome-log',
      };
    }
  }

  return null;
}

export function buildQuinnOutcomeLogPacketFromRun(source: QuinnOutcomeLogPrefillSource) {
  const outcomeForm = QUINNOS_INTAKE_FORMS.find((form) => form.id === 'outcome-log');
  if (!outcomeForm) {
    return QUINNOS_RESPONSE_PROTOCOL.join('\n');
  }

  const originalIntake = String(source.packetText || '').trim();
  const renRecommendation = String(source.writtenResult || '').trim();
  const originalIntakePrompt = '[What did QuinnOS/Ren suggest or help me decide?]';
  const prefilledOriginalIntake = [
    'Original intake:',
    originalIntake || '[No original intake available.]',
    '',
    'Ren recommendation:',
    renRecommendation || '[No Ren recommendation available.]',
  ];
  const prefilledTemplate: string[] = [];

  for (const line of outcomeForm.template) {
    if (line === originalIntakePrompt) {
      prefilledTemplate.push(...prefilledOriginalIntake);
    } else {
      prefilledTemplate.push(line);
    }
  }

  return [...prefilledTemplate, ...QUINNOS_RESPONSE_PROTOCOL].join('\n');
}
