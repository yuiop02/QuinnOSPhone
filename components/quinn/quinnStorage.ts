import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_SETTINGS, INITIAL_VOICE_SETTINGS } from './quinnAppState';
import {
    MemoryItem,
    MemoryResonanceItem,
    NotificationItem,
    NotificationTarget,
    QuinnSettings,
    RunHistoryItem,
    SessionArc,
    SessionArcBeat,
    VoicePipelinePhase,
    VoiceSession,
    VoiceSettings,
    VoiceTranscriptionProvider,
} from './quinnTypes';

const STORAGE_KEY = 'quinnos.sprint2.snapshot.v4';

export type QuinnSnapshot = {
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
  savedAt: string;
};

function normalizeSessionArcBeat(item: any): SessionArcBeat | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const summary = String(item.summary || '').trim();
  const timestamp = String(item.timestamp || '').trim();
  const lensLabel = String(item.lensLabel || '').trim();

  if (!summary && !timestamp && !lensLabel) {
    return null;
  }

  return {
    id: String(item.id || ''),
    summary,
    timestamp,
    lensLabel,
  };
}

function normalizeSessionArc(item: any): SessionArc | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const id = String(item.id || '').trim();
  const title = String(item.title || '').trim();

  if (!id || !title) {
    return null;
  }

  const beats = Array.isArray(item.beats)
    ? item.beats
        .map(normalizeSessionArcBeat)
        .filter((entry: SessionArcBeat | null): entry is SessionArcBeat => Boolean(entry))
    : [];

  return {
    id,
    title,
    createdAt: String(item.createdAt || ''),
    updatedAt: String(item.updatedAt || ''),
    stepCount: Number(item.stepCount || 0),
    beats,
  };
}

function normalizeMemoryResonanceItem(item: any): MemoryResonanceItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const label = String(item.label || '').trim();
  const preview = String(item.preview || '').trim();

  if (!label && !preview) {
    return null;
  }

  return {
    label,
    preview,
  };
}

function isValidTarget(value: any): value is NotificationTarget {
  return [
    'QuinnConversation',
    'SettingsHome',
    'HomeTileGrid',
    'TileExpandedCanvas',
    'GravityMicro',
    'MemoryPanel',
    'ExportsPanel',
    'LockScreen',
    'NotificationsPanel',
    'ControlCenter',
    'AppSwitcher',
    'VoiceMode',
  ].includes(value);
}

function isValidPipelinePhase(value: any): value is VoicePipelinePhase {
  return [
    'idle',
    'requesting-permission',
    'recording',
    'recorded',
    'transcribing',
    'ready',
    'playing-recording',
    'speaking-preview',
    'failed',
  ].includes(value);
}

function isValidTranscriptionProvider(value: any): value is VoiceTranscriptionProvider {
  return [
    'manual',
    'mock-packet',
    'future-backend',
    'future-dev-build-stt',
  ].includes(value);
}

function normalizeRunHistoryItem(item: any): RunHistoryItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const memoryResonance = Array.isArray(item.memoryResonance)
    ? item.memoryResonance
        .map(normalizeMemoryResonanceItem)
        .filter(
          (entry: MemoryResonanceItem | null): entry is MemoryResonanceItem => Boolean(entry)
        )
    : [];

  return {
    id: String(item.id || ''),
    packetTitle: String(item.packetTitle || ''),
    packetText: String(item.packetText || ''),
    writtenResult: String(item.writtenResult || ''),
    compressedSummary: String(item.compressedSummary || ''),
    timestamp: String(item.timestamp || ''),
    lensId: item.lensId ? String(item.lensId) : undefined,
    memoryResonance,
    sessionArcId: item.sessionArcId ? String(item.sessionArcId) : undefined,
    sessionArcTitle: item.sessionArcTitle ? String(item.sessionArcTitle) : undefined,
    sessionArcStep:
      Number.isFinite(Number(item.sessionArcStep)) && Number(item.sessionArcStep) > 0
        ? Number(item.sessionArcStep)
        : undefined,
  };
}

function normalizeMemoryItem(item: any): MemoryItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const source =
    item.source === 'packet' || item.source === 'run-summary' || item.source === 'seed'
      ? item.source
      : 'seed';

  return {
    id: String(item.id || ''),
    label: String(item.label || ''),
    body: String(item.body || ''),
    source,
    timestamp: String(item.timestamp || ''),
    pinned: Boolean(item.pinned),
  };
}

function normalizeNotificationItem(item: any): NotificationItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const tone =
    item.tone === 'gold' ||
    item.tone === 'success' ||
    item.tone === 'alert' ||
    item.tone === 'neutral'
      ? item.tone
      : 'neutral';

  const target = isValidTarget(item.target) ? item.target : 'HomeTileGrid';

  return {
    id: String(item.id || ''),
    title: String(item.title || ''),
    body: String(item.body || ''),
    timestamp: String(item.timestamp || ''),
    target,
    tone,
    read: Boolean(item.read),
  };
}

function normalizeSettings(value: any): QuinnSettings {
  return {
    reduceMotion: Boolean(value?.reduceMotion),
    quietNotifications: Boolean(value?.quietNotifications),
    focusMode: Boolean(value?.focusMode),
  };
}

function normalizeVoiceSettings(value: any): VoiceSettings {
  const rate = Number(value?.speechRate);
  const pitch = Number(value?.speechPitch);
  const provider = isValidTranscriptionProvider(value?.transcriptionProvider)
    ? value.transcriptionProvider
    : INITIAL_VOICE_SETTINGS.transcriptionProvider;

  return {
    autoSpeakPreview: Boolean(value?.autoSpeakPreview),
    saveRecordingsLocally:
      typeof value?.saveRecordingsLocally === 'boolean'
        ? value.saveRecordingsLocally
        : INITIAL_VOICE_SETTINGS.saveRecordingsLocally,
    speechRate: Number.isFinite(rate) ? rate : INITIAL_VOICE_SETTINGS.speechRate,
    speechPitch: Number.isFinite(pitch) ? pitch : INITIAL_VOICE_SETTINGS.speechPitch,
    selectedVoiceId: value?.selectedVoiceId ? String(value.selectedVoiceId) : null,
    transcriptionProvider: provider,
    autoTranscribeOnStop:
      typeof value?.autoTranscribeOnStop === 'boolean'
        ? value.autoTranscribeOnStop
        : INITIAL_VOICE_SETTINGS.autoTranscribeOnStop,
  };
}

function normalizeVoiceSession(item: any): VoiceSession | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const source =
    item.source === 'recording' || item.source === 'text-seed'
      ? item.source
      : 'text-seed';

  const pipelinePhase = isValidPipelinePhase(item.pipelinePhase)
    ? item.pipelinePhase
    : 'idle';

  const provider = isValidTranscriptionProvider(item.transcriptionProvider)
    ? item.transcriptionProvider
    : INITIAL_VOICE_SETTINGS.transcriptionProvider;

  return {
    id: String(item.id || ''),
    title: String(item.title || ''),
    transcript: String(item.transcript || ''),
    spokenSummary: String(item.spokenSummary || ''),
    recordingUri: item.recordingUri ? String(item.recordingUri) : null,
    durationMillis: Number(item.durationMillis || 0),
    createdAt: String(item.createdAt || ''),
    source,
    pipelinePhase,
    transcriptionProvider: provider,
    errorMessage: item.errorMessage ? String(item.errorMessage) : null,
  };
}

function normalizeSnapshot(data: any): QuinnSnapshot {
  const currentMemoryResonance = Array.isArray(data?.currentMemoryResonance)
    ? data.currentMemoryResonance
        .map(normalizeMemoryResonanceItem)
        .filter(
          (item: MemoryResonanceItem | null): item is MemoryResonanceItem => Boolean(item)
        )
    : [];
  const currentSessionArc = normalizeSessionArc(data?.currentSessionArc);

  const recentRuns = Array.isArray(data?.recentRuns)
    ? data.recentRuns
        .map(normalizeRunHistoryItem)
        .filter((item: RunHistoryItem | null): item is RunHistoryItem => Boolean(item))
    : [];

  const memories = Array.isArray(data?.memories)
    ? data.memories
        .map(normalizeMemoryItem)
        .filter((item: MemoryItem | null): item is MemoryItem => Boolean(item))
    : [];

  const notifications = Array.isArray(data?.notifications)
    ? data.notifications
        .map(normalizeNotificationItem)
        .filter((item: NotificationItem | null): item is NotificationItem => Boolean(item))
    : [];

  const voiceSessions = Array.isArray(data?.voiceSessions)
    ? data.voiceSessions
        .map(normalizeVoiceSession)
        .filter((item: VoiceSession | null): item is VoiceSession => Boolean(item))
    : [];

  return {
    packetTitle: String(data?.packetTitle || ''),
    packetText: String(data?.packetText || ''),
    writtenResult: String(data?.writtenResult || ''),
    compressedSummary: String(data?.compressedSummary || ''),
    currentMemoryResonance,
    currentSessionArc,
    lastRunAt: data?.lastRunAt ? String(data.lastRunAt) : null,
    recentRuns,
    memories,
    notifications,
    settings: data?.settings ? normalizeSettings(data.settings) : INITIAL_SETTINGS,
    voiceSessions,
    voiceSettings: data?.voiceSettings
      ? normalizeVoiceSettings(data.voiceSettings)
      : INITIAL_VOICE_SETTINGS,
    savedAt: data?.savedAt ? String(data.savedAt) : new Date().toISOString(),
  };
}

export async function loadQuinnSnapshot(): Promise<QuinnSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return normalizeSnapshot(parsed);
  } catch {
    return null;
  }
}

export async function saveQuinnSnapshot(
  snapshot: Omit<QuinnSnapshot, 'savedAt'>
): Promise<string | null> {
  try {
    const savedAt = new Date().toISOString();

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...snapshot,
        savedAt,
      })
    );

    return savedAt;
  } catch {
    return null;
  }
}
