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
    '## Current Packet',
    '',
    `Title: ${packetTitle || 'Untitled packet'}`,
    '',
    packetText || '(blank)',
    '',
    '## Latest Compression',
    '',
    compressedSummary || '(none yet)',
    '',
    '## Memory Resonance',
    '',
    ...(
      currentMemoryResonance.length
        ? currentMemoryResonance.flatMap((item, index) => [
            `### ${index + 1}. ${item.label}`,
            item.preview || '(no preview)',
            '',
          ])
        : ['(none yet)']
    ),
    '',
    '## Session Arc',
    '',
    ...(currentSessionArc
      ? [
          `Title: ${currentSessionArc.title}`,
          `Steps: ${currentSessionArc.stepCount}`,
          ...currentSessionArc.beats.flatMap((beat, index) => [
            `- Beat ${index + 1} (${beat.lensLabel}): ${beat.summary}`,
          ]),
        ]
      : ['(none yet)']),
    '',
    '## Latest Written Result',
    '',
    writtenResult || '(none yet)',
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
    `Current packet title: ${packetTitle || 'Untitled packet'}`,
    '',
    'Current packet:',
    packetText || '(blank)',
    '',
    'Latest compression:',
    compressedSummary || '(none yet)',
    '',
    'Memory resonance:',
    ...(currentMemoryResonance.length
      ? currentMemoryResonance.map((item) => `- ${item.label}: ${item.preview || '(no preview)'}`)
      : ['(none yet)']),
    '',
    'Session arc:',
    ...(currentSessionArc
      ? [
          `- ${currentSessionArc.title} (${currentSessionArc.stepCount} steps)`,
          ...currentSessionArc.beats.map((beat) => `- ${beat.lensLabel}: ${beat.summary}`),
        ]
      : ['(none yet)']),
    '',
    'Latest written result:',
    writtenResult || '(none yet)',
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
    json,
    markdown,
    text,
  };
}
