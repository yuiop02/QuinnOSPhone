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

function formatRunTimestamp(value: string | null | undefined) {
  const clean = String(value || '').trim();
  return clean || '(none yet)';
}

function buildActiveThreadState({
  packetTitle,
  writtenResult,
  compressedSummary,
  currentMemoryResonance,
  currentSessionArc,
  lastRunAt,
  latestCompletedRun,
}: {
  packetTitle: string;
  writtenResult: string;
  compressedSummary: string;
  currentMemoryResonance: MemoryResonanceItem[];
  currentSessionArc: SessionArc | null;
  lastRunAt: string | null;
  latestCompletedRun: RunHistoryItem | null;
}) {
  const hasVisibleThreadState = Boolean(
    currentSessionArc ||
      String(writtenResult || '').trim() ||
      String(compressedSummary || '').trim() ||
      currentMemoryResonance.length ||
      latestCompletedRun
  );
  const source = currentSessionArc
    ? 'session-arc'
    : latestCompletedRun
      ? 'latest-run'
      : hasVisibleThreadState
        ? 'live-output'
        : 'none';
  const title =
    String(currentSessionArc?.title || '').trim() ||
    String(latestCompletedRun?.sessionArcTitle || '').trim() ||
    String(latestCompletedRun?.packetTitle || '').trim() ||
    String(packetTitle || '').trim();

  return {
    source,
    id:
      String(currentSessionArc?.id || '').trim() ||
      String(latestCompletedRun?.sessionArcId || '').trim() ||
      null,
    title,
    hasActiveThread: source !== 'none',
    lastRunAt: lastRunAt || latestCompletedRun?.timestamp || null,
    compressedSummary: String(compressedSummary || '').trim()
      ? compressedSummary
      : latestCompletedRun?.compressedSummary || '',
    writtenResult: String(writtenResult || '').trim()
      ? writtenResult
      : latestCompletedRun?.writtenResult || '',
    memoryResonance: currentMemoryResonance.length
      ? currentMemoryResonance
      : latestCompletedRun?.memoryResonance || [],
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
  memories: MemoryItem[];
  notifications: NotificationItem[];
  settings: QuinnSettings;
  voiceSessions: VoiceSession[];
  voiceSettings: VoiceSettings;
}): ExportBundle {
  const generatedAt = new Date().toISOString();
  const latestCompletedRun = recentRuns[0] || null;
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
    latestCompletedRun,
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
