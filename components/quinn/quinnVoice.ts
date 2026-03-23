import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import * as Speech from 'expo-speech';
import {
  buildCompressionSummary,
  transcribeAudioFile,
} from './quinnApi';
import {
  VoicePipelinePhase,
  VoiceSession,
  VoiceSettings,
  VoiceTranscriptionProvider,
} from './quinnTypes';

export function formatDurationMillis(durationMillis: number) {
  const totalSeconds = Math.max(0, Math.round((durationMillis || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatPipelinePhase(phase: VoicePipelinePhase) {
  if (phase === 'requesting-permission') return 'requesting permission';
  if (phase === 'playing-recording') return 'playing recording';
  if (phase === 'speaking-preview') return 'speaking preview';
  return phase;
}

export function formatTranscriptionProvider(provider: VoiceTranscriptionProvider) {
  if (provider === 'manual') return 'manual';
  if (provider === 'mock-packet') return 'mock packet';
  if (provider === 'future-backend') return 'future backend';
  return 'future dev-build stt';
}

export async function ensureMicrophonePermission() {
  const current = await getRecordingPermissionsAsync();

  if (current.granted) {
    return true;
  }

  const requested = await requestRecordingPermissionsAsync();
  return requested.granted;
}

export async function enableRecordingAudioMode() {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
  });
}

export async function disableRecordingAudioMode() {
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
  });
}

export async function stopSystemVoicePreview() {
  try {
    await Speech.stop();
  } catch {}
}

export async function loadAvailableSpeechVoices() {
  try {
    const voices = await Speech.getAvailableVoicesAsync();

    return voices
      .filter((voice) =>
        String(voice.language || '').toLowerCase().startsWith('en')
      )
      .sort((a, b) => {
        const aName = `${a.language} ${a.name}`.toLowerCase();
        const bName = `${b.language} ${b.name}`.toLowerCase();
        return aName.localeCompare(bName);
      });
  } catch {
    return [];
  }
}

export function speakSystemVoicePreview(
  text: string,
  voiceSettings: VoiceSettings,
  hooks?: {
    onStart?: () => void;
    onDone?: () => void;
    onStopped?: () => void;
    onError?: (error: Error) => void;
  }
) {
  const safeText = String(text || '').trim();

  if (!safeText) {
    return;
  }

  Speech.speak(safeText, {
    voice: voiceSettings.selectedVoiceId || undefined,
    rate: voiceSettings.speechRate,
    pitch: voiceSettings.speechPitch,
    onStart: hooks?.onStart,
    onDone: hooks?.onDone,
    onStopped: hooks?.onStopped,
    onError: hooks?.onError,
  });
}

export function buildVoiceSeed({
  packetTitle,
  packetText,
  lastSummary,
}: {
  packetTitle: string;
  packetText: string;
  lastSummary: string;
}) {
  const safeTitle = String(packetTitle || '').trim() || 'Untitled packet';
  const safeText = String(packetText || '').replace(/\s+/g, ' ').trim();
  const safeSummary = String(lastSummary || '').replace(/\s+/g, ' ').trim();

  const transcript =
    safeText ||
    `Quinn, here is the current packet. Title: ${safeTitle}. Build the shortest clean spoken pass from this.`;

  const spokenSummary = buildCompressionSummary(
    safeSummary || safeText || safeTitle
  );

  return {
    transcript,
    spokenSummary,
  };
}

export function buildVoiceProviderPayload({
  packetTitle,
  packetText,
  lastSummary,
  transcript,
  spokenSummary,
  recordingUri,
  durationMillis,
  transcriptionProvider,
  pipelinePhase,
  errorMessage,
}: {
  packetTitle: string;
  packetText: string;
  lastSummary: string;
  transcript: string;
  spokenSummary: string;
  recordingUri: string | null;
  durationMillis: number;
  transcriptionProvider: VoiceTranscriptionProvider;
  pipelinePhase: VoicePipelinePhase;
  errorMessage: string | null;
}) {
  return {
    providerReady: true,
    note: 'This payload is ready for backend transcription now, and ready for the real Quinn voice model next.',
    packet: {
      title: String(packetTitle || ''),
      text: String(packetText || ''),
      lastSummary: String(lastSummary || ''),
    },
    voiceInput: {
      transcript: String(transcript || ''),
      recordingUri,
      durationMillis,
      transcriptionProvider,
    },
    voiceOutputTarget: {
      spokenSummary: String(spokenSummary || ''),
      style: 'short spoken summary only',
      voiceModel: 'TO_BE_REPLACED_WITH_REAL_QUINN_VOICE',
    },
    pipeline: {
      phase: pipelinePhase,
      errorMessage,
    },
  };
}

export async function persistRecordingToDocument(sourceUri: string) {
  try {
    if (!sourceUri) {
      return null;
    }

    const voiceDirectory = new Directory(Paths.document, 'quinn-voice');
    voiceDirectory.create({
      idempotent: true,
      intermediates: true,
    });

    const source = new File(sourceUri);
    const rawExtension = sourceUri.split('.').pop()?.split('?')[0]?.trim();
    const extension = rawExtension || 'm4a';

    const destination = new File(
      voiceDirectory,
      `voice-${Date.now()}.${extension}`
    );

    if (destination.exists) {
      destination.delete();
    }

    source.copy(destination);

    return destination.uri;
  } catch {
    return null;
  }
}

export async function deleteLocalRecording(uri: string | null) {
  try {
    if (!uri) {
      return;
    }

    const file = new File(uri);

    if (file.exists) {
      file.delete();
    }
  } catch {}
}

export function createVoiceSession({
  packetTitle,
  transcript,
  spokenSummary,
  recordingUri,
  durationMillis,
  pipelinePhase,
  transcriptionProvider,
  errorMessage,
}: {
  packetTitle: string;
  transcript: string;
  spokenSummary: string;
  recordingUri: string | null;
  durationMillis: number;
  pipelinePhase: VoicePipelinePhase;
  transcriptionProvider: VoiceTranscriptionProvider;
  errorMessage: string | null;
}): VoiceSession {
  return {
    id: `voice-${Date.now()}`,
    title: String(packetTitle || '').trim() || 'Untitled packet',
    transcript: String(transcript || '').trim(),
    spokenSummary: String(spokenSummary || '').trim(),
    recordingUri,
    durationMillis,
    createdAt: new Date().toISOString(),
    source: recordingUri ? 'recording' : 'text-seed',
    pipelinePhase,
    transcriptionProvider,
    errorMessage,
  };
}

export async function transcribeWithConfiguredProvider({
  provider,
  packetTitle,
  packetText,
  lastSummary,
  currentTranscript,
  recordingUri,
  durationMillis,
}: {
  provider: VoiceTranscriptionProvider;
  packetTitle: string;
  packetText: string;
  lastSummary: string;
  currentTranscript: string;
  recordingUri: string | null;
  durationMillis: number;
}) {
  if (provider === 'manual') {
    const transcript = String(currentTranscript || '').trim();

    return {
      transcript,
      spokenSummary: buildCompressionSummary(
        transcript || String(packetText || '').trim()
      ),
      note: 'Manual provider keeps the transcript field user-authored.',
    };
  }

  if (provider === 'mock-packet') {
    const seed = buildVoiceSeed({
      packetTitle,
      packetText,
      lastSummary,
    });

    return {
      transcript: seed.transcript,
      spokenSummary: seed.spokenSummary,
      note: 'Mock packet provider is a stand-in path.',
    };
  }

  if (provider === 'future-backend') {
    if (!recordingUri) {
      throw new Error(
        'No recording is attached. Record a take before running backend transcription.'
      );
    }

    const result = await transcribeAudioFile({
      audioUri: recordingUri,
      durationMillis,
      packetTitle,
      packetText,
      lastSummary,
    });

    const transcript = String(result.transcript || '').trim();

    return {
      transcript,
      spokenSummary: buildCompressionSummary(
        transcript || String(packetText || '').trim()
      ),
      note: `Backend transcription completed via ${result.provider}.`,
    };
  }

  if (!recordingUri) {
    throw new Error(
      'No recording is attached. A native STT path would need a recorded take first.'
    );
  }

  throw new Error(
    'Dev-build STT provider is not wired yet. QuinnOS backend transcription is the real path for now.'
  );
}

export function buildVoiceFailureMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'The voice pipeline failed.';
}