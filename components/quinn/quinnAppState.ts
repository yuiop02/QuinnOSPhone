import { RUN_ENDPOINT } from './quinnApi';
import {
    ExportBundle,
    MemoryItem,
    MemoryResonanceItem,
    NotificationItem,
    QuinnSettings,
    QuinnSurfaceName,
    RunHistoryItem,
    SessionArc,
    VoiceSession,
    VoiceSettings,
} from './quinnTypes';

export type ScreenName = QuinnSurfaceName;

export const INITIAL_PACKET_TITLE = 'QuinnOS Sprint 2';

export const INITIAL_PACKET_TEXT =
  'Make the app feel authored, not templated. Keep the spoken layer short and the written layer strong.';

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'seed-1',
    label: 'QuinnOS premise',
    body: INITIAL_PACKET_TEXT,
    source: 'seed',
    timestamp: new Date().toISOString(),
    pinned: true,
  },
];

export const INITIAL_SETTINGS: QuinnSettings = {
  reduceMotion: false,
  quietNotifications: false,
  focusMode: false,
};

export const INITIAL_VOICE_SETTINGS: VoiceSettings = {
  autoSpeakPreview: false,
  saveRecordingsLocally: true,
  speechRate: 0.92,
  speechPitch: 1,
  selectedVoiceId: null,
  transcriptionProvider: 'mock-packet',
  autoTranscribeOnStop: false,
};

function formatOptionalText(value: string, fallback = '(none yet)') {
  const clean = String(value || '').trim();
  return clean || fallback;
}

function formatComposerText(value: string) {
  const clean = String(value || '').trim();
  return clean || '(blank; no draft is currently staged in the composer)';
}

function formatExportLineText(value: string, fallback = '(none yet)') {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean || fallback;
}

function formatRunTimestamp(value: string | null | undefined) {
  const clean = String(value || '').trim();
  return clean || '(none yet)';
}

export type QuinnPatternCardSaveIntentReview = {
  saveReadiness: string;
  shouldPreserveLater: string;
  clarifyBeforeStorage: string;
  storageRisk: string;
  nextBestMove: string;
};

export type QuinnPatternCardApplicationReview = {
  applies: string;
  supportingEvidence: string;
  limitsMisfit: string;
  overuseRisk: string;
  nextBestMove: string;
};

export type QuinnPatternCardLifecycleReview = {
  lifecycleRead: string;
  keepReviseRetireRestore: string;
  why: string;
  riskIfKeptAsIs: string;
  nextBestCardAction: string;
};

export type QuinnSavedCardShelfReviewResult = {
  shelfRead: string;
  mostUsefulActiveCards: string;
  staleRiskyOverfitCards: string;
  missingOrUndertestedAreas: string;
  nextBestManualCardAction: string;
};

export type QuinnSavedCardShelfReview = {
  id: string;
  createdAt: string;
  activeSavedCount: number | null;
  retiredSavedCount: number | null;
  pinnedSavedCount: number | null;
  withSaveIntentReviewCount: number | null;
  withApplicationCheckCount: number | null;
  withLifecycleReviewCount: number | null;
  filter: string;
  search: string;
  sort: string;
  resultPreview: QuinnSavedCardShelfReviewResult;
};

export type QuinnExportSessionPatternCard = {
  createdAt: string;
  possiblePattern: string;
  evidence: string;
  overgeneralizationRisk: string;
  beforeStoringDecision: string;
  sourceRunId: string;
  saveIntentReview?: QuinnPatternCardSaveIntentReview | null;
};

export type QuinnSavedPatternCard = {
  id: string;
  savedAt: string;
  pinnedAt?: string | null;
  retiredAt?: string | null;
  retiredReason?: string;
  possiblePattern: string;
  evidence: string;
  overgeneralizationRisk: string;
  beforeStoringDecision: string;
  sourceRunId: string;
  saveIntentReview: QuinnPatternCardSaveIntentReview | null;
  applicationReview?: QuinnPatternCardApplicationReview | null;
  lifecycleReview?: QuinnPatternCardLifecycleReview | null;
};

type SessionPatternCardExportInput = QuinnExportSessionPatternCard;
type SavedPatternCardExportInput = QuinnSavedPatternCard;
type SavedCardShelfReviewExportInput = QuinnSavedCardShelfReview;
type ParsedPatternCardExportItem = QuinnExportSessionPatternCard & {
  savedAt?: string;
  pinnedAt?: string | null;
  retiredAt?: string | null;
  retiredReason?: string;
  applicationReview?: QuinnPatternCardApplicationReview | null;
  lifecycleReview?: QuinnPatternCardLifecycleReview | null;
};

function cleanImportedSessionPatternCardValue(value: string) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  const normalized = clean.toLowerCase();

  if (
    !clean ||
    normalized === '(none)' ||
    normalized === '(none yet)' ||
    normalized === 'untitled pattern card'
  ) {
    return '';
  }

  return clean;
}

function getImportedSessionPatternCardField(lines: string[], label: string) {
  const prefix = `- ${label}:`;
  const line = lines.find((item) =>
    item.trim().toLowerCase().startsWith(prefix.toLowerCase())
  );

  if (!line) {
    return '';
  }

  return cleanImportedSessionPatternCardValue(line.trim().slice(prefix.length));
}

function normalizeExportedSessionPatternCardSaveIntentReview(
  review: QuinnPatternCardSaveIntentReview | null | undefined
) {
  if (!review) {
    return null;
  }

  const cleanReview = {
    saveReadiness: String(review.saveReadiness || '').trim(),
    shouldPreserveLater: String(review.shouldPreserveLater || '').trim(),
    clarifyBeforeStorage: String(review.clarifyBeforeStorage || '').trim(),
    storageRisk: String(review.storageRisk || '').trim(),
    nextBestMove: String(review.nextBestMove || '').trim(),
  };

  if (
    !cleanReview.saveReadiness &&
    !cleanReview.shouldPreserveLater &&
    !cleanReview.clarifyBeforeStorage &&
    !cleanReview.storageRisk &&
    !cleanReview.nextBestMove
  ) {
    return null;
  }

  return cleanReview;
}

function normalizeExportedPatternCardApplicationReview(
  review: QuinnPatternCardApplicationReview | null | undefined
) {
  if (!review) {
    return null;
  }

  const cleanReview = {
    applies: String(review.applies || '').trim(),
    supportingEvidence: String(review.supportingEvidence || '').trim(),
    limitsMisfit: String(review.limitsMisfit || '').trim(),
    overuseRisk: String(review.overuseRisk || '').trim(),
    nextBestMove: String(review.nextBestMove || '').trim(),
  };

  if (
    !cleanReview.applies &&
    !cleanReview.supportingEvidence &&
    !cleanReview.limitsMisfit &&
    !cleanReview.overuseRisk &&
    !cleanReview.nextBestMove
  ) {
    return null;
  }

  return cleanReview;
}

function normalizeExportedPatternCardLifecycleReview(
  review: QuinnPatternCardLifecycleReview | null | undefined
) {
  if (!review) {
    return null;
  }

  const cleanReview = {
    lifecycleRead: String(review.lifecycleRead || '').trim(),
    keepReviseRetireRestore: String(review.keepReviseRetireRestore || '').trim(),
    why: String(review.why || '').trim(),
    riskIfKeptAsIs: String(review.riskIfKeptAsIs || '').trim(),
    nextBestCardAction: String(review.nextBestCardAction || '').trim(),
  };

  if (
    !cleanReview.lifecycleRead &&
    !cleanReview.keepReviseRetireRestore &&
    !cleanReview.why &&
    !cleanReview.riskIfKeptAsIs &&
    !cleanReview.nextBestCardAction
  ) {
    return null;
  }

  return cleanReview;
}

function normalizeExportedSavedCardShelfReviewResult(
  review: QuinnSavedCardShelfReviewResult | null | undefined
) {
  if (!review) {
    return null;
  }

  const cleanReview = {
    shelfRead: String(review.shelfRead || '').trim(),
    mostUsefulActiveCards: String(review.mostUsefulActiveCards || '').trim(),
    staleRiskyOverfitCards: String(review.staleRiskyOverfitCards || '').trim(),
    missingOrUndertestedAreas: String(review.missingOrUndertestedAreas || '').trim(),
    nextBestManualCardAction: String(review.nextBestManualCardAction || '').trim(),
  };

  if (
    !cleanReview.shelfRead &&
    !cleanReview.mostUsefulActiveCards &&
    !cleanReview.staleRiskyOverfitCards &&
    !cleanReview.missingOrUndertestedAreas &&
    !cleanReview.nextBestManualCardAction
  ) {
    return null;
  }

  return cleanReview;
}

function normalizeExportedSavedCardShelfReview(
  review: SavedCardShelfReviewExportInput | null | undefined
) {
  if (!review) {
    return null;
  }

  const resultPreview = normalizeExportedSavedCardShelfReviewResult(review.resultPreview);

  if (!resultPreview) {
    return null;
  }

  return {
    id: String(review.id || '').trim(),
    createdAt: String(review.createdAt || '').trim(),
    activeSavedCount: normalizeNullableShelfReviewCount(review.activeSavedCount),
    retiredSavedCount: normalizeNullableShelfReviewCount(review.retiredSavedCount),
    pinnedSavedCount: normalizeNullableShelfReviewCount(review.pinnedSavedCount),
    withSaveIntentReviewCount: normalizeNullableShelfReviewCount(
      review.withSaveIntentReviewCount
    ),
    withApplicationCheckCount: normalizeNullableShelfReviewCount(
      review.withApplicationCheckCount
    ),
    withLifecycleReviewCount: normalizeNullableShelfReviewCount(
      review.withLifecycleReviewCount
    ),
    filter: String(review.filter || '').trim(),
    search: String(review.search || '').trim(),
    sort: String(review.sort || '').trim(),
    resultPreview,
  };
}

function normalizeNullableShelfReviewCount(value: number | null | undefined) {
  const count = Number(value);
  return Number.isFinite(count) ? count : null;
}

function getSessionPatternCardSaveIntentExportLines(card: {
  saveIntentReview?: QuinnPatternCardSaveIntentReview | null;
}) {
  const review = normalizeExportedSessionPatternCardSaveIntentReview(card.saveIntentReview);

  if (!review) {
    return [];
  }

  return [
    `- Save readiness: ${formatOptionalText(review.saveReadiness)}`,
    `- Should preserve later: ${formatOptionalText(review.shouldPreserveLater)}`,
    `- Clarify before storage: ${formatOptionalText(review.clarifyBeforeStorage)}`,
    `- Storage risk: ${formatOptionalText(review.storageRisk)}`,
    `- Next best move: ${formatOptionalText(review.nextBestMove)}`,
  ];
}

function getSavedPatternCardApplicationReviewExportLines(card: {
  applicationReview?: QuinnPatternCardApplicationReview | null;
}) {
  const review = normalizeExportedPatternCardApplicationReview(card.applicationReview);

  if (!review) {
    return [];
  }

  return [
    `- Applies: ${formatOptionalText(review.applies)}`,
    `- Supporting evidence: ${formatOptionalText(review.supportingEvidence)}`,
    `- Limits / misfit: ${formatOptionalText(review.limitsMisfit)}`,
    `- Risk of overusing this pattern: ${formatOptionalText(review.overuseRisk)}`,
    `- Application next best move: ${formatOptionalText(review.nextBestMove)}`,
  ];
}

function getSavedPatternCardLifecycleReviewExportLines(card: {
  lifecycleReview?: QuinnPatternCardLifecycleReview | null;
}) {
  const review = normalizeExportedPatternCardLifecycleReview(card.lifecycleReview);

  if (!review) {
    return [];
  }

  return [
    `- Lifecycle read: ${formatOptionalText(review.lifecycleRead)}`,
    `- Keep / revise / retire / restore: ${formatOptionalText(
      review.keepReviseRetireRestore
    )}`,
    `- Lifecycle why: ${formatOptionalText(review.why)}`,
    `- Risk if kept as-is: ${formatOptionalText(review.riskIfKeptAsIs)}`,
    `- Lifecycle next best card action: ${formatOptionalText(review.nextBestCardAction)}`,
  ];
}

function formatShelfReviewCount(value: number | null | undefined) {
  return value === null || value === undefined ? '(none)' : String(value);
}

function getSavedCardShelfReviewExportLines(review: QuinnSavedCardShelfReview) {
  return [
    `- Created time: ${formatRunTimestamp(review.createdAt)}`,
    `- Active saved cards: ${formatShelfReviewCount(review.activeSavedCount)}`,
    `- Retired saved cards: ${formatShelfReviewCount(review.retiredSavedCount)}`,
    `- Pinned saved cards: ${formatShelfReviewCount(review.pinnedSavedCount)}`,
    `- With Save Intent review: ${formatShelfReviewCount(
      review.withSaveIntentReviewCount
    )}`,
    `- With Application check: ${formatShelfReviewCount(
      review.withApplicationCheckCount
    )}`,
    `- With Lifecycle review: ${formatShelfReviewCount(
      review.withLifecycleReviewCount
    )}`,
    `- Filter: ${formatExportLineText(review.filter, '(none)')}`,
    `- Search: ${formatExportLineText(review.search, '(none)')}`,
    `- Sort: ${formatExportLineText(review.sort, '(none)')}`,
    `- Shelf read: ${formatExportLineText(review.resultPreview.shelfRead)}`,
    `- Most useful active cards: ${formatExportLineText(
      review.resultPreview.mostUsefulActiveCards
    )}`,
    `- Stale / risky / overfit cards: ${formatExportLineText(
      review.resultPreview.staleRiskyOverfitCards
    )}`,
    `- Missing or undertested areas: ${formatExportLineText(
      review.resultPreview.missingOrUndertestedAreas
    )}`,
    `- Next best manual card action: ${formatExportLineText(
      review.resultPreview.nextBestManualCardAction
    )}`,
  ];
}

function parseExportCount(value: string) {
  const clean = String(value || '').trim();

  if (!clean) {
    return null;
  }

  const count = Number.parseInt(clean, 10);
  return Number.isFinite(count) ? count : null;
}

function parsePatternCardsFromExportSection(
  exportText: string,
  heading: string
): ParsedPatternCardExportItem[] {
  const text = String(exportText || '').replace(/\r\n/g, '\n');
  const isSavedPatternCardSection = heading === 'Saved Pattern Cards';
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headingMatch = text.match(new RegExp(`^## ${escapedHeading}\\s*$`, 'm'));

  if (!headingMatch || headingMatch.index === undefined) {
    return [];
  }

  const sectionStart = headingMatch.index + headingMatch[0].length;
  const remainingText = text.slice(sectionStart);
  const nextSectionIndex = remainingText.search(/\n##\s+/);
  const sectionText = (
    nextSectionIndex >= 0 ? remainingText.slice(0, nextSectionIndex) : remainingText
  ).trim();

  if (!sectionText || sectionText === '(none yet)') {
    return [];
  }

  const cardBlocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of sectionText.split('\n')) {
    if (/^###\s+\d+\.\s+/.test(line.trim())) {
      if (currentBlock.length) {
        cardBlocks.push(currentBlock);
      }

      currentBlock = [line];
      continue;
    }

    if (currentBlock.length) {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length) {
    cardBlocks.push(currentBlock);
  }

  return cardBlocks.reduce<ParsedPatternCardExportItem[]>((cards, lines) => {
      const titleLine = lines[0] || '';
      const possiblePattern = cleanImportedSessionPatternCardValue(
        titleLine.replace(/^###\s+\d+\.\s+/, '')
      );
      const card = {
        createdAt: getImportedSessionPatternCardField(lines, 'Created'),
        savedAt: getImportedSessionPatternCardField(lines, 'Saved time'),
        pinnedAt: getImportedSessionPatternCardField(lines, 'Pinned time'),
        retiredAt: getImportedSessionPatternCardField(lines, 'Retired time'),
        retiredReason: getImportedSessionPatternCardField(lines, 'Retired reason'),
        possiblePattern,
        evidence: getImportedSessionPatternCardField(lines, 'Evidence'),
        overgeneralizationRisk: getImportedSessionPatternCardField(
          lines,
          'Overgeneralization risk'
        ),
        beforeStoringDecision: getImportedSessionPatternCardField(
          lines,
          'Before storing decision'
        ),
        sourceRunId: getImportedSessionPatternCardField(lines, 'Source run'),
        saveIntentReview: {
          saveReadiness: getImportedSessionPatternCardField(lines, 'Save readiness'),
          shouldPreserveLater: getImportedSessionPatternCardField(
            lines,
            'Should preserve later'
          ),
          clarifyBeforeStorage: getImportedSessionPatternCardField(
            lines,
            'Clarify before storage'
          ),
          storageRisk: getImportedSessionPatternCardField(lines, 'Storage risk'),
          nextBestMove: getImportedSessionPatternCardField(lines, 'Next best move'),
        },
        applicationReview: {
          applies: getImportedSessionPatternCardField(lines, 'Applies'),
          supportingEvidence: getImportedSessionPatternCardField(
            lines,
            'Supporting evidence'
          ),
          limitsMisfit: getImportedSessionPatternCardField(lines, 'Limits / misfit'),
          overuseRisk: getImportedSessionPatternCardField(
            lines,
            'Risk of overusing this pattern'
          ),
          nextBestMove: getImportedSessionPatternCardField(
            lines,
            'Application next best move'
          ),
        },
        lifecycleReview: {
          lifecycleRead: getImportedSessionPatternCardField(lines, 'Lifecycle read'),
          keepReviseRetireRestore: getImportedSessionPatternCardField(
            lines,
            'Keep / revise / retire / restore'
          ),
          why: getImportedSessionPatternCardField(lines, 'Lifecycle why'),
          riskIfKeptAsIs: getImportedSessionPatternCardField(lines, 'Risk if kept as-is'),
          nextBestCardAction: getImportedSessionPatternCardField(
            lines,
            'Lifecycle next best card action'
          ),
        },
      };
      const hasSaveIntentReview = Boolean(
        card.saveIntentReview.saveReadiness ||
          card.saveIntentReview.shouldPreserveLater ||
          card.saveIntentReview.clarifyBeforeStorage ||
          card.saveIntentReview.storageRisk ||
          card.saveIntentReview.nextBestMove
      );
      const hasApplicationReview = Boolean(
        card.applicationReview.applies ||
          card.applicationReview.supportingEvidence ||
          card.applicationReview.limitsMisfit ||
          card.applicationReview.overuseRisk ||
          card.applicationReview.nextBestMove
      );
      const hasLifecycleReview = Boolean(
        card.lifecycleReview.lifecycleRead ||
          card.lifecycleReview.keepReviseRetireRestore ||
          card.lifecycleReview.why ||
          card.lifecycleReview.riskIfKeptAsIs ||
          card.lifecycleReview.nextBestCardAction
      );

      if (
        !card.possiblePattern &&
        !card.evidence &&
        !card.overgeneralizationRisk &&
        !card.beforeStoringDecision &&
        !card.sourceRunId &&
        !card.createdAt &&
        !card.savedAt &&
        !card.pinnedAt &&
        !card.retiredAt &&
        !card.retiredReason &&
        !hasSaveIntentReview &&
        !hasApplicationReview &&
        (!isSavedPatternCardSection || !hasLifecycleReview)
      ) {
        return cards;
      }

      cards.push({
        ...card,
        saveIntentReview: hasSaveIntentReview ? card.saveIntentReview : null,
        applicationReview: hasApplicationReview ? card.applicationReview : null,
        lifecycleReview:
          isSavedPatternCardSection && hasLifecycleReview ? card.lifecycleReview : null,
      });

      return cards;
    }, []);
}

export function parseSessionPatternCardsFromExport(
  exportText: string
): QuinnExportSessionPatternCard[] {
  return parsePatternCardsFromExportSection(exportText, 'Session Pattern Cards').map((card) => ({
    createdAt: String(card.createdAt || '').trim(),
    possiblePattern: card.possiblePattern,
    evidence: card.evidence,
    overgeneralizationRisk: card.overgeneralizationRisk,
    beforeStoringDecision: card.beforeStoringDecision,
    sourceRunId: card.sourceRunId,
    saveIntentReview: card.saveIntentReview,
  }));
}

export function parseSavedPatternCardsFromExport(exportText: string): QuinnSavedPatternCard[] {
  return parsePatternCardsFromExportSection(exportText, 'Saved Pattern Cards').map(
    (card, index) => ({
      id: `saved-pattern-card-import-${Date.now()}-${index}`,
      savedAt: String(card.savedAt || '').trim() || String(card.createdAt || '').trim(),
      pinnedAt: String(card.pinnedAt || '').trim() || null,
      retiredAt: String(card.retiredAt || '').trim() || null,
      retiredReason: String(card.retiredReason || '').trim(),
      possiblePattern: card.possiblePattern,
      evidence: card.evidence,
      overgeneralizationRisk: card.overgeneralizationRisk,
      beforeStoringDecision: card.beforeStoringDecision,
      sourceRunId: card.sourceRunId,
      saveIntentReview: card.saveIntentReview || null,
      applicationReview: card.applicationReview || null,
      lifecycleReview: card.lifecycleReview || null,
    })
  );
}

export function parseSavedCardShelfReviewsFromExport(
  exportText: string
): QuinnSavedCardShelfReview[] {
  const text = String(exportText || '').replace(/\r\n/g, '\n');
  const headingMatch = text.match(/^## Saved Card Shelf Reviews\s*$/m);

  if (!headingMatch || headingMatch.index === undefined) {
    return [];
  }

  const sectionStart = headingMatch.index + headingMatch[0].length;
  const remainingText = text.slice(sectionStart);
  const nextSectionIndex = remainingText.search(/\n##\s+/);
  const sectionText = (
    nextSectionIndex >= 0 ? remainingText.slice(0, nextSectionIndex) : remainingText
  ).trim();

  if (!sectionText || sectionText === '(none yet)') {
    return [];
  }

  const reviewBlocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of sectionText.split('\n')) {
    if (/^###\s+\d+\.\s+/.test(line.trim())) {
      if (currentBlock.length) {
        reviewBlocks.push(currentBlock);
      }

      currentBlock = [line];
      continue;
    }

    if (currentBlock.length) {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length) {
    reviewBlocks.push(currentBlock);
  }

  const importedAt = Date.now();

  return reviewBlocks.reduce<QuinnSavedCardShelfReview[]>((reviews, lines, index) => {
    const titleLine = lines[0] || '';
    const headerCreatedAt = cleanImportedSessionPatternCardValue(
      titleLine.replace(/^###\s+\d+\.\s+/, '')
    );
    const createdAt =
      getImportedSessionPatternCardField(lines, 'Created time') || headerCreatedAt;
    const resultPreview = normalizeExportedSavedCardShelfReviewResult({
      shelfRead: getImportedSessionPatternCardField(lines, 'Shelf read'),
      mostUsefulActiveCards: getImportedSessionPatternCardField(
        lines,
        'Most useful active cards'
      ),
      staleRiskyOverfitCards: getImportedSessionPatternCardField(
        lines,
        'Stale / risky / overfit cards'
      ),
      missingOrUndertestedAreas: getImportedSessionPatternCardField(
        lines,
        'Missing or undertested areas'
      ),
      nextBestManualCardAction: getImportedSessionPatternCardField(
        lines,
        'Next best manual card action'
      ),
    });

    if (!resultPreview) {
      return reviews;
    }

    reviews.push({
      id: `saved-card-shelf-review-import-${importedAt}-${index}`,
      createdAt: String(createdAt || '').trim() || new Date(importedAt).toISOString(),
      activeSavedCount: parseExportCount(
        getImportedSessionPatternCardField(lines, 'Active saved cards')
      ),
      retiredSavedCount: parseExportCount(
        getImportedSessionPatternCardField(lines, 'Retired saved cards')
      ),
      pinnedSavedCount: parseExportCount(
        getImportedSessionPatternCardField(lines, 'Pinned saved cards')
      ),
      withSaveIntentReviewCount: parseExportCount(
        getImportedSessionPatternCardField(lines, 'With Save Intent review')
      ),
      withApplicationCheckCount: parseExportCount(
        getImportedSessionPatternCardField(lines, 'With Application check')
      ),
      withLifecycleReviewCount: parseExportCount(
        getImportedSessionPatternCardField(lines, 'With Lifecycle review')
      ),
      filter: getImportedSessionPatternCardField(lines, 'Filter'),
      search: getImportedSessionPatternCardField(lines, 'Search'),
      sort: getImportedSessionPatternCardField(lines, 'Sort'),
      resultPreview,
    });

    return reviews;
  }, []);
}

function buildActiveThreadState({
  packetTitle,
  writtenResult,
  compressedSummary,
  currentMemoryResonance,
  currentSessionArc,
  lastRunAt,
}: {
  packetTitle: string;
  writtenResult: string;
  compressedSummary: string;
  currentMemoryResonance: MemoryResonanceItem[];
  currentSessionArc: SessionArc | null;
  lastRunAt: string | null;
}) {
  const hasVisibleThreadState = Boolean(
    currentSessionArc ||
      String(writtenResult || '').trim() ||
      String(compressedSummary || '').trim() ||
      currentMemoryResonance.length
  );
  const source = currentSessionArc
    ? 'session-arc'
    : hasVisibleThreadState
      ? 'live-output'
      : 'none';
  const title =
    String(currentSessionArc?.title || '').trim() ||
    String(packetTitle || '').trim();

  return {
    source,
    id: String(currentSessionArc?.id || '').trim() || null,
    title,
    hasActiveThread: source !== 'none',
    lastRunAt: source === 'none' ? null : lastRunAt || null,
    compressedSummary: String(compressedSummary || '').trim() ? compressedSummary : '',
    writtenResult: String(writtenResult || '').trim() ? writtenResult : '',
    memoryResonance: currentMemoryResonance,
    sessionArc: currentSessionArc,
  } as const;
}

export function buildExportBundle({
  packetTitle,
  packetText,
  writtenResult,
  compressedSummary,
  currentMemoryResonance,
  currentSessionArc,
  lastRunAt,
  recentRuns,
  sessionPatternCards = [],
  savedPatternCards = [],
  savedCardShelfReviews = [],
  memories,
  notifications,
  settings,
  voiceSessions,
  voiceSettings,
}: {
  packetTitle: string;
  packetText: string;
  writtenResult: string;
  compressedSummary: string;
  currentMemoryResonance: MemoryResonanceItem[];
  currentSessionArc: SessionArc | null;
  lastRunAt: string | null;
  recentRuns: RunHistoryItem[];
  sessionPatternCards?: SessionPatternCardExportInput[];
  savedPatternCards?: SavedPatternCardExportInput[];
  savedCardShelfReviews?: SavedCardShelfReviewExportInput[];
  memories: MemoryItem[];
  notifications: NotificationItem[];
  settings: QuinnSettings;
  voiceSessions: VoiceSession[];
  voiceSettings: VoiceSettings;
}): ExportBundle {
  const generatedAt = new Date().toISOString();
  const latestCompletedRun = recentRuns[0] || null;
  const exportedSessionPatternCards = sessionPatternCards.map((card) => ({
    createdAt: String(card.createdAt || '').trim(),
    possiblePattern: String(card.possiblePattern || '').trim(),
    evidence: String(card.evidence || '').trim(),
    overgeneralizationRisk: String(card.overgeneralizationRisk || '').trim(),
    beforeStoringDecision: String(card.beforeStoringDecision || '').trim(),
    sourceRunId: String(card.sourceRunId || '').trim(),
    saveIntentReview: normalizeExportedSessionPatternCardSaveIntentReview(
      card.saveIntentReview
    ),
  }));
  const exportedSavedPatternCards = savedPatternCards.map((card) => ({
    id: String(card.id || '').trim(),
    savedAt: String(card.savedAt || '').trim(),
    pinnedAt: String(card.pinnedAt || '').trim() || null,
    retiredAt: String(card.retiredAt || '').trim() || null,
    retiredReason: String(card.retiredReason || '').trim(),
    possiblePattern: String(card.possiblePattern || '').trim(),
    evidence: String(card.evidence || '').trim(),
    overgeneralizationRisk: String(card.overgeneralizationRisk || '').trim(),
    beforeStoringDecision: String(card.beforeStoringDecision || '').trim(),
    sourceRunId: String(card.sourceRunId || '').trim(),
    saveIntentReview: normalizeExportedSessionPatternCardSaveIntentReview(
      card.saveIntentReview
    ),
    applicationReview: normalizeExportedPatternCardApplicationReview(card.applicationReview),
    lifecycleReview: normalizeExportedPatternCardLifecycleReview(card.lifecycleReview),
  }));
  const exportedSavedCardShelfReviews = savedCardShelfReviews
    .map(normalizeExportedSavedCardShelfReview)
    .filter(
      (review: QuinnSavedCardShelfReview | null): review is QuinnSavedCardShelfReview =>
        Boolean(review)
    )
    .slice(0, 3);
  const retiredSavedPatternCardCount = exportedSavedPatternCards.filter((card) =>
    Boolean(card.retiredAt)
  ).length;
  const pinnedSavedPatternCardCount = exportedSavedPatternCards.filter((card) =>
    Boolean(card.pinnedAt)
  ).length;
  const savedCardsWithSaveIntentReviewCount = exportedSavedPatternCards.filter((card) =>
    Boolean(card.saveIntentReview)
  ).length;
  const savedCardsWithApplicationCheckCount = exportedSavedPatternCards.filter((card) =>
    Boolean(card.applicationReview)
  ).length;
  const savedCardsWithLifecycleReviewCount = exportedSavedPatternCards.filter((card) =>
    Boolean(card.lifecycleReview)
  ).length;
  const restoreCoverageSummary =
    exportedSavedPatternCards.length || exportedSavedCardShelfReviews.length
      ? 'saved cards + shelf reviews included'
      : exportedSessionPatternCards.length
        ? 'session checkpoint cards included'
        : 'conversation-only export';
  const exportHealthSummaryLines = [
    `- Recent runs: ${recentRuns.length}`,
    `- Memories: ${memories.length}`,
    `- Notifications: ${notifications.length}`,
    `- Session Pattern Cards: ${exportedSessionPatternCards.length}`,
    `- Saved Pattern Cards: ${exportedSavedPatternCards.length}`,
    `- Retired Saved Cards: ${retiredSavedPatternCardCount}`,
    `- Pinned Saved Cards: ${pinnedSavedPatternCardCount}`,
    `- Saved cards with Save Intent review: ${savedCardsWithSaveIntentReviewCount}`,
    `- Saved cards with Application check: ${savedCardsWithApplicationCheckCount}`,
    `- Saved cards with Lifecycle review: ${savedCardsWithLifecycleReviewCount}`,
    `- Saved Card Shelf Reviews: ${exportedSavedCardShelfReviews.length}`,
    `- Restore coverage: ${restoreCoverageSummary}`,
    '- Scope: Session cards are included as checkpoint state only.',
    '- Scope: Saved cards are local-device durable state.',
    '- Scope: Shelf reviews are review context only and do not mutate cards automatically.',
  ];
  const checkpointHandoffInstructionLines = [
    '- Restore in QuinnOS: paste this export into Cards -> Import from export.',
    '- Hand off to Ren / another assistant: provide this export as context and ask it to treat it as a QuinnOS checkpoint.',
    '- Debug: use Export Health, Latest Completed Run, Recent Runs, Notifications, and relevant card sections.',
    '- Session Pattern Cards are checkpoint/session-local context only.',
    '- Saved Pattern Cards are local-device durable user-approved cards.',
    '- Card reviews and Shelf Reviews are review context only; they do not mean any card action was applied.',
    '- Recent Runs and Memory are recent context, not necessarily durable identity truth.',
    '- Import Restore Report is local UI feedback and is not exported.',
  ];
  const currentComposer = {
    title: packetTitle,
    text: packetText,
    isBlank: !String(packetText || '').trim(),
  };
  const activeThread = buildActiveThreadState({
    packetTitle,
    writtenResult,
    compressedSummary,
    currentMemoryResonance,
    currentSessionArc,
    lastRunAt,
  });
  const exportTitle =
    String(activeThread.title || '').trim() ||
    String(latestCompletedRun?.packetTitle || '').trim() ||
    String(packetTitle || '').trim() ||
    'QuinnOS Export';

  const snapshot = {
    meta: {
      app: 'QuinnOSPhone',
      theme: 'QuinnOS Sprint 2',
      generatedAt,
      runEndpoint: RUN_ENDPOINT,
    },
    currentPacket: {
      title: packetTitle,
      text: packetText,
    },
    latestOutput: {
      writtenResult,
      compressedSummary,
      memoryResonance: currentMemoryResonance,
      sessionArc: currentSessionArc,
      lastRunAt,
    },
    currentComposer,
    activeThread,
    sessionPatternCards: exportedSessionPatternCards,
    savedPatternCards: exportedSavedPatternCards,
    savedCardShelfReviews: exportedSavedCardShelfReviews,
    latestCompletedRun,
    settings,
    voiceSettings,
    recentRuns,
    memories,
    notifications,
    voiceSessions,
  };

  const json = JSON.stringify(snapshot, null, 2);

  const markdown = [
    '# QuinnOS Export',
    '',
    `Generated: ${generatedAt}`,
    `Run endpoint: ${RUN_ENDPOINT}`,
    '',
    '## Export Health / Checkpoint Summary',
    '',
    ...exportHealthSummaryLines,
    '',
    '## How To Use This Checkpoint',
    '',
    ...checkpointHandoffInstructionLines,
    '',
    '## Current Composer',
    '',
    `Title: ${formatOptionalText(currentComposer.title, 'Untitled composer draft')}`,
    `State: ${currentComposer.isBlank ? 'blank composer' : 'draft staged in composer'}`,
    '',
    formatComposerText(currentComposer.text),
    '',
    '## Active Thread',
    '',
    ...(activeThread.hasActiveThread
      ? [
          `Title: ${formatOptionalText(activeThread.title, 'Untitled thread')}`,
          `Source: ${activeThread.source}`,
          `Last run: ${formatRunTimestamp(activeThread.lastRunAt)}`,
          '',
          '### Current visible summary',
          formatOptionalText(activeThread.compressedSummary),
          '',
          '### Current visible output',
          formatOptionalText(activeThread.writtenResult),
        ]
      : ['(no active thread state)']),
    '',
    '## Active Thread Memory Resonance',
    '',
    ...(
      activeThread.memoryResonance.length
        ? activeThread.memoryResonance.flatMap((item, index) => [
            `### ${index + 1}. ${item.label}`,
            item.preview || '(no preview)',
            '',
          ])
        : ['(none yet)']
    ),
    '',
    '## Active Thread Session Arc',
    '',
    ...(activeThread.sessionArc
      ? [
          `Title: ${activeThread.sessionArc.title}`,
          `Steps: ${activeThread.sessionArc.stepCount}`,
          ...activeThread.sessionArc.beats.flatMap((beat, index) => [
            `- Beat ${index + 1} (${beat.lensLabel}): ${beat.summary}`,
          ]),
        ]
      : ['(none yet)']),
    '',
    '## Session Pattern Cards',
    '',
    ...(
      exportedSessionPatternCards.length
        ? exportedSessionPatternCards.flatMap((card, index) => [
            `### ${index + 1}. ${formatOptionalText(card.possiblePattern, 'Untitled pattern card')}`,
            `- Created: ${formatRunTimestamp(card.createdAt)}`,
            `- Evidence: ${formatOptionalText(card.evidence)}`,
            `- Overgeneralization risk: ${formatOptionalText(card.overgeneralizationRisk)}`,
            `- Before storing decision: ${formatOptionalText(card.beforeStoringDecision)}`,
            `- Source run: ${formatOptionalText(card.sourceRunId, '(none)')}`,
            ...getSessionPatternCardSaveIntentExportLines(card),
            '',
          ])
        : ['(none yet)']
    ),
    '',
    '## Saved Pattern Cards',
    '',
    ...(
      exportedSavedPatternCards.length
        ? exportedSavedPatternCards.flatMap((card, index) => [
            `### ${index + 1}. ${formatOptionalText(card.possiblePattern, 'Untitled pattern card')}`,
            `- Saved time: ${formatRunTimestamp(card.savedAt)}`,
            `- Pinned time: ${formatRunTimestamp(card.pinnedAt)}`,
            `- Retired time: ${formatRunTimestamp(card.retiredAt)}`,
            `- Retired reason: ${formatOptionalText(card.retiredReason)}`,
            `- Evidence: ${formatOptionalText(card.evidence)}`,
            `- Overgeneralization risk: ${formatOptionalText(card.overgeneralizationRisk)}`,
            `- Before storing decision: ${formatOptionalText(card.beforeStoringDecision)}`,
            `- Source run: ${formatOptionalText(card.sourceRunId, '(none)')}`,
            ...getSessionPatternCardSaveIntentExportLines(card),
            ...getSavedPatternCardApplicationReviewExportLines(card),
            ...getSavedPatternCardLifecycleReviewExportLines(card),
            '',
          ])
      : ['(none yet)']
    ),
    '',
    '## Saved Card Shelf Reviews',
    '',
    ...(
      exportedSavedCardShelfReviews.length
        ? exportedSavedCardShelfReviews.flatMap((review, index) => [
            `### ${index + 1}. ${formatRunTimestamp(review.createdAt)}`,
            ...getSavedCardShelfReviewExportLines(review),
            '',
          ])
        : ['(none yet)']
    ),
    '',
    '## Latest Completed Run',
    '',
    ...(latestCompletedRun
      ? [
          `Title: ${formatOptionalText(latestCompletedRun.packetTitle, 'Untitled packet')}`,
          `Time: ${formatRunTimestamp(latestCompletedRun.timestamp)}`,
          `Session arc: ${formatOptionalText(latestCompletedRun.sessionArcTitle || '', '(none)')}`,
          `Summary: ${formatOptionalText(latestCompletedRun.compressedSummary)}`,
          '',
          '### Latest completed run packet',
          formatOptionalText(latestCompletedRun.packetText),
          '',
          '### Latest completed run output',
          formatOptionalText(latestCompletedRun.writtenResult),
        ]
      : ['(none yet)']),
    '',
    '## Settings',
    '',
    `- Reduce motion: ${settings.reduceMotion ? 'on' : 'off'}`,
    `- Quiet notifications: ${settings.quietNotifications ? 'on' : 'off'}`,
    `- Focus mode: ${settings.focusMode ? 'on' : 'off'}`,
    '',
    '## Voice Settings',
    '',
    `- Auto speak preview: ${voiceSettings.autoSpeakPreview ? 'on' : 'off'}`,
    `- Save recordings locally: ${voiceSettings.saveRecordingsLocally ? 'on' : 'off'}`,
    `- Speech rate: ${voiceSettings.speechRate}`,
    `- Speech pitch: ${voiceSettings.speechPitch}`,
    `- Selected voice: ${voiceSettings.selectedVoiceId || 'system default'}`,
    `- Transcription provider: ${voiceSettings.transcriptionProvider}`,
    `- Auto transcribe on stop: ${voiceSettings.autoTranscribeOnStop ? 'on' : 'off'}`,
    '',
    '## Recent Runs',
    '',
    ...(
      recentRuns.length
        ? recentRuns.slice(0, 5).flatMap((run, index) => [
            `### ${index + 1}. ${run.packetTitle || 'Untitled packet'}`,
            `- Time: ${run.timestamp}`,
            `- Summary: ${run.compressedSummary}`,
            '',
          ])
        : ['(none yet)']
    ),
    '',
    '## Memory',
    '',
    ...(
      memories.length
        ? memories.slice(0, 5).flatMap((item, index) => [
            `### ${index + 1}. ${item.label}`,
            `- Source: ${item.source}`,
            `- Time: ${item.timestamp}`,
            `- Pinned: ${item.pinned ? 'yes' : 'no'}`,
            `${item.body}`,
            '',
          ])
        : ['(none yet)']
    ),
    '',
    '## Notifications',
    '',
    ...(
      notifications.length
        ? notifications.slice(0, 8).flatMap((item, index) => [
            `### ${index + 1}. ${item.title}`,
            `- Time: ${item.timestamp}`,
            `- Tone: ${item.tone}`,
            `- Target: ${item.target}`,
            `${item.body}`,
            '',
          ])
        : ['(none yet)']
    ),
    '',
    '## Voice Sessions',
    '',
    ...(
      voiceSessions.length
        ? voiceSessions.slice(0, 6).flatMap((item, index) => [
            `### ${index + 1}. ${item.title}`,
            `- Time: ${item.createdAt}`,
            `- Source: ${item.source}`,
            `- Duration: ${item.durationMillis}ms`,
            `- Recording URI: ${item.recordingUri || '(none)'}`,
            `- Pipeline phase: ${item.pipelinePhase}`,
            `- Transcription provider: ${item.transcriptionProvider}`,
            `- Error: ${item.errorMessage || '(none)'}`,
            `- Spoken summary: ${item.spokenSummary}`,
            '',
          ])
        : ['(none yet)']
    ),
  ].join('\n');

  const text = [
    'QUINNOS EXPORT',
    '',
    `Generated: ${generatedAt}`,
    `Run endpoint: ${RUN_ENDPOINT}`,
    '',
    'Export health / checkpoint summary:',
    ...exportHealthSummaryLines,
    '',
    'How to use this checkpoint:',
    ...checkpointHandoffInstructionLines,
    '',
    `Current composer title: ${formatOptionalText(currentComposer.title, 'Untitled composer draft')}`,
    `Current composer state: ${currentComposer.isBlank ? 'blank composer' : 'draft staged in composer'}`,
    '',
    'Current composer:',
    formatComposerText(currentComposer.text),
    '',
    `Active thread title: ${activeThread.hasActiveThread ? formatOptionalText(activeThread.title, 'Untitled thread') : '(none yet)'}`,
    `Active thread source: ${activeThread.source}`,
    `Active thread last run: ${formatRunTimestamp(activeThread.lastRunAt)}`,
    '',
    'Active thread summary:',
    formatOptionalText(activeThread.compressedSummary),
    '',
    'Active thread visible output:',
    formatOptionalText(activeThread.writtenResult),
    '',
    'Active thread memory resonance:',
    ...(activeThread.memoryResonance.length
      ? activeThread.memoryResonance.map(
          (item) => `- ${item.label}: ${item.preview || '(no preview)'}`
        )
      : ['(none yet)']),
    '',
    'Active thread session arc:',
    ...(activeThread.sessionArc
      ? [
          `- ${activeThread.sessionArc.title} (${activeThread.sessionArc.stepCount} steps)`,
          ...activeThread.sessionArc.beats.map(
            (beat) => `- ${beat.lensLabel}: ${beat.summary}`
          ),
        ]
      : ['(none yet)']),
    '',
    'Session pattern cards:',
    ...(exportedSessionPatternCards.length
      ? exportedSessionPatternCards.flatMap((card, index) => [
          `${index + 1}. ${formatOptionalText(card.possiblePattern, 'Untitled pattern card')}`,
          `- Created: ${formatRunTimestamp(card.createdAt)}`,
          `- Evidence: ${formatOptionalText(card.evidence)}`,
          `- Overgeneralization risk: ${formatOptionalText(card.overgeneralizationRisk)}`,
          `- Before storing decision: ${formatOptionalText(card.beforeStoringDecision)}`,
          `- Source run: ${formatOptionalText(card.sourceRunId, '(none)')}`,
          ...getSessionPatternCardSaveIntentExportLines(card),
          '',
        ])
      : ['(none yet)']),
    '',
    'Saved pattern cards:',
    ...(exportedSavedPatternCards.length
      ? exportedSavedPatternCards.flatMap((card, index) => [
          `${index + 1}. ${formatOptionalText(card.possiblePattern, 'Untitled pattern card')}`,
          `- Saved time: ${formatRunTimestamp(card.savedAt)}`,
          `- Pinned time: ${formatRunTimestamp(card.pinnedAt)}`,
          `- Retired time: ${formatRunTimestamp(card.retiredAt)}`,
          `- Retired reason: ${formatOptionalText(card.retiredReason)}`,
          `- Evidence: ${formatOptionalText(card.evidence)}`,
          `- Overgeneralization risk: ${formatOptionalText(card.overgeneralizationRisk)}`,
          `- Before storing decision: ${formatOptionalText(card.beforeStoringDecision)}`,
          `- Source run: ${formatOptionalText(card.sourceRunId, '(none)')}`,
          ...getSessionPatternCardSaveIntentExportLines(card),
          ...getSavedPatternCardApplicationReviewExportLines(card),
          ...getSavedPatternCardLifecycleReviewExportLines(card),
          '',
        ])
      : ['(none yet)']),
    '',
    'Saved card shelf reviews:',
    ...(exportedSavedCardShelfReviews.length
      ? exportedSavedCardShelfReviews.flatMap((review, index) => [
          `${index + 1}. ${formatRunTimestamp(review.createdAt)}`,
          ...getSavedCardShelfReviewExportLines(review),
          '',
        ])
      : ['(none yet)']),
    '',
    'Latest completed run:',
    ...(latestCompletedRun
      ? [
          `- Title: ${formatOptionalText(latestCompletedRun.packetTitle, 'Untitled packet')}`,
          `- Time: ${formatRunTimestamp(latestCompletedRun.timestamp)}`,
          `- Session arc: ${formatOptionalText(latestCompletedRun.sessionArcTitle || '', '(none)')}`,
          `- Summary: ${formatOptionalText(latestCompletedRun.compressedSummary)}`,
          '- Packet:',
          formatOptionalText(latestCompletedRun.packetText),
          '- Output:',
          formatOptionalText(latestCompletedRun.writtenResult),
        ]
      : ['(none yet)']),
    '',
    `Recent runs kept: ${recentRuns.length}`,
    `Memory items kept: ${memories.length}`,
    `Notifications kept: ${notifications.length}`,
    `Voice sessions kept: ${voiceSessions.length}`,
    '',
    `Reduce motion: ${settings.reduceMotion ? 'on' : 'off'}`,
    `Quiet notifications: ${settings.quietNotifications ? 'on' : 'off'}`,
    `Focus mode: ${settings.focusMode ? 'on' : 'off'}`,
    `Auto speak preview: ${voiceSettings.autoSpeakPreview ? 'on' : 'off'}`,
    `Save recordings locally: ${voiceSettings.saveRecordingsLocally ? 'on' : 'off'}`,
    `Transcription provider: ${voiceSettings.transcriptionProvider}`,
    `Auto transcribe on stop: ${voiceSettings.autoTranscribeOnStop ? 'on' : 'off'}`,
  ].join('\n');

  return {
    generatedAt,
    title: exportTitle,
    snapshot,
    json,
    markdown,
    text,
  };
}
