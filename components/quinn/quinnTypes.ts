export type LegacySurfaceName =
  | 'TileExpandedCanvas'
  | 'GravityMicro'
  | 'LockScreen';

export type QuinnSurfaceName =
  | 'HomeTileGrid'
  | 'MemoryPanel'
  | 'ExportsPanel'
  | 'NotificationsPanel'
  | 'ControlCenter'
  | 'AppSwitcher'
  | 'VoiceMode'
  | LegacySurfaceName;

export type AppScreen =
  | Exclude<QuinnSurfaceName, LegacySurfaceName>
  | 'QuinnConversation'
  | 'SettingsHome';

export type NotificationTarget = AppScreen | LegacySurfaceName;

export type MemoryResonanceItem = {
  label: string;
  preview: string;
};

export type SessionArcBeat = {
  id: string;
  summary: string;
  timestamp: string;
  lensLabel: string;
};

export type SessionArc = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  stepCount: number;
  beats: SessionArcBeat[];
};

export type RunHistoryItem = {
  id: string;
  packetTitle: string;
  packetText: string;
  writtenResult: string;
  compressedSummary: string;
  timestamp: string;
  memoryResonance?: MemoryResonanceItem[];
  sessionArcId?: string;
  sessionArcTitle?: string;
  sessionArcStep?: number;
};

export type MemoryItem = {
  id: string;
  label: string;
  body: string;
  source: 'seed' | 'run-summary' | 'packet';
  timestamp: string;
  pinned?: boolean;
};

export type NotificationTone = 'neutral' | 'gold' | 'success' | 'alert';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  target: NotificationTarget;
  tone: NotificationTone;
  read?: boolean;
};

export type QuinnSettings = {
  reduceMotion: boolean;
  quietNotifications: boolean;
  focusMode: boolean;
};

export type VoicePipelinePhase =
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'recorded'
  | 'transcribing'
  | 'ready'
  | 'playing-recording'
  | 'speaking-preview'
  | 'failed';

export type VoiceTranscriptionProvider =
  | 'manual'
  | 'mock-packet'
  | 'future-backend'
  | 'future-dev-build-stt';

export type VoiceSettings = {
  autoSpeakPreview: boolean;
  saveRecordingsLocally: boolean;
  speechRate: number;
  speechPitch: number;
  selectedVoiceId: string | null;
  transcriptionProvider: VoiceTranscriptionProvider;
  autoTranscribeOnStop: boolean;
};

export type VoiceSession = {
  id: string;
  title: string;
  transcript: string;
  spokenSummary: string;
  recordingUri: string | null;
  durationMillis: number;
  createdAt: string;
  source: 'recording' | 'text-seed';
  pipelinePhase: VoicePipelinePhase;
  transcriptionProvider: VoiceTranscriptionProvider;
  errorMessage: string | null;
};

export type ExportBundle = {
  generatedAt: string;
  json: string;
  markdown: string;
  text: string;
};
