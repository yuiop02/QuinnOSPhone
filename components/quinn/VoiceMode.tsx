import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import QuinnSurfaceShell from './QuinnSurfaceShell';
import SectionCard from './SectionCard';
import {
  getSingleReplySpeechPolicy,
  prepareQuinnVoiceSpeech,
} from './quinnSpeechText';
import {
  getQuinnLocalVoiceBaseUrl,
  getQuinnLocalVoiceSpeakRequestKey,
  getQuinnVoicePlaybackStartDelayMs,
  isQuinnLocalVoiceRemoteSource,
  pingQuinnLocalVoice,
  prepareQuinnLocalVoicePlaybackSource,
} from './quinnLocalVoice';
import { SURFACE_THEME } from './quinnSurfaceTheme';
import type { QuinnVoiceTtsHint } from './quinnVoiceProsody';
import {
  VoicePipelinePhase,
  VoiceSession,
  VoiceSettings,
  VoiceTranscriptionProvider,
} from './quinnTypes';
import {
  buildVoiceFailureMessage,
  buildVoiceProviderPayload,
  buildVoiceSeed,
  createVoiceSession,
  deleteLocalRecording,
  disableRecordingAudioMode,
  enableRecordingAudioMode,
  ensureMicrophonePermission,
  formatDurationMillis,
  formatPipelinePhase,
  formatTranscriptionProvider,
  loadAvailableSpeechVoices,
  persistRecordingToDocument,
  speakSystemVoicePreview,
  stopSystemVoicePreview,
  transcribeWithConfiguredProvider,
} from './quinnVoice';

type VoiceModeProps = {
  onBack: () => void;
  onOpenCanvas: () => void;
  onOpenGravity: () => void;
  packetTitle: string;
  packetText: string;
  lastSummary: string;
  voiceSessions: VoiceSession[];
  voiceSettings: VoiceSettings;
  onSaveVoiceSession: (session: VoiceSession) => void;
  onDeleteVoiceSession: (id: string) => void;
  onPatchVoiceSettings: (patch: Partial<VoiceSettings>) => void;
};

const PROVIDER_ORDER: VoiceTranscriptionProvider[] = [
  'manual',
  'mock-packet',
  'future-backend',
  'future-dev-build-stt',
];

type PlayerMode = 'recording' | 'quinn-preview' | null;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export default function VoiceMode({
  onBack,
  onOpenCanvas,
  onOpenGravity,
  packetTitle,
  packetText,
  lastSummary,
  voiceSessions,
  voiceSettings,
  onSaveVoiceSession,
  onDeleteVoiceSession,
  onPatchVoiceSettings,
}: VoiceModeProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);

  const [playbackSource, setPlaybackSource] = useState<string | null>(null);
  const [playerMode, setPlayerMode] = useState<PlayerMode>(null);
  const player = useAudioPlayer(playbackSource, {
    updateInterval: 40,
    downloadFirst: true,
  });
  const playerStatus = useAudioPlayerStatus(player);

  const initialSeed = useMemo(
    () =>
      buildVoiceSeed({
        packetTitle,
        packetText,
        lastSummary,
      }),
    [packetTitle, packetText, lastSummary]
  );

  const [pipelinePhase, setPipelinePhase] = useState<VoicePipelinePhase>('idle');
  const [transcript, setTranscript] = useState(initialSeed.transcript);
  const [spokenSummary, setSpokenSummary] = useState(initialSeed.spokenSummary);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionState, setPermissionState] = useState('Unknown');
  const [statusMessage, setStatusMessage] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<
    { identifier: string; name: string; language: string }[]
  >([]);
  const [lastTranscriptNote, setLastTranscriptNote] = useState('');
  const [quinnVoiceReachable, setQuinnVoiceReachable] = useState<boolean | null>(null);
  const [isCheckingQuinnVoice, setIsCheckingQuinnVoice] = useState(false);
  const [isSpeakingQuinn, setIsSpeakingQuinn] = useState(false);
  const [quinnChunks, setQuinnChunks] = useState<string[]>([]);
  const [quinnChunkIndex, setQuinnChunkIndex] = useState(0);
  const preparedQuinnChunkSourcesRef = useRef(new Map<string, string>());
  const preparedQuinnChunkPromisesRef = useRef(new Map<string, Promise<string>>());
  const readyQuinnChunkKeysRef = useRef(new Set<string>());
  const quinnVoiceProsodyHintRef = useRef<QuinnVoiceTtsHint | null>(null);

  useEffect(() => {
    let isActive = true;

    loadAvailableSpeechVoices().then((voices) => {
      if (!isActive) {
        return;
      }

      setAvailableVoices(
        voices.map((voice) => ({
          identifier: String(voice.identifier || ''),
          name: String(voice.name || ''),
          language: String(voice.language || ''),
        }))
      );
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function checkQuinnVoice() {
      const ok = await pingQuinnLocalVoice();

      if (isActive) {
        setQuinnVoiceReachable(ok);
      }
    }

    checkQuinnVoice();

    return () => {
      isActive = false;
    };
  }, []);

  const clearPreparedQuinnChunkState = useCallback(() => {
    preparedQuinnChunkSourcesRef.current.clear();
    preparedQuinnChunkPromisesRef.current.clear();
    readyQuinnChunkKeysRef.current.clear();
    quinnVoiceProsodyHintRef.current = null;
  }, []);

  const prepareQuinnChunkPlaybackSource = useCallback(
    async (
      text: string,
      {
        previousText = '',
        nextText = '',
        prosodyHint = null,
      }: {
        previousText?: string;
        nextText?: string;
        prosodyHint?: QuinnVoiceTtsHint | null;
      } = {}
    ) => {
      const activeProsodyHint = prosodyHint ?? quinnVoiceProsodyHintRef.current;
      const requestKey = getQuinnLocalVoiceSpeakRequestKey(text, {
        previousText,
        nextText,
        prosodyHint: activeProsodyHint,
      });
      const cachedSource = preparedQuinnChunkSourcesRef.current.get(requestKey);

      if (cachedSource) {
        return {
          requestKey,
          playbackSource: cachedSource,
        };
      }

      const existingPromise = preparedQuinnChunkPromisesRef.current.get(requestKey);

      if (existingPromise) {
        return {
          requestKey,
          playbackSource: await existingPromise,
        };
      }

      const preparePromise = (async () => {
        const playbackSource = await prepareQuinnLocalVoicePlaybackSource(text, {
          previousText,
          nextText,
          prosodyHint: activeProsodyHint,
        });

        preparedQuinnChunkSourcesRef.current.set(requestKey, playbackSource);
        return playbackSource;
      })();

      preparedQuinnChunkPromisesRef.current.set(requestKey, preparePromise);

      try {
        return {
          requestKey,
          playbackSource: await preparePromise,
        };
      } finally {
        const activePromise = preparedQuinnChunkPromisesRef.current.get(requestKey);

        if (activePromise === preparePromise) {
          preparedQuinnChunkPromisesRef.current.delete(requestKey);
        }
      }
    },
    []
  );

  const warmQuinnChunk = useCallback(
    async (chunks: string[], chunkIndex: number) => {
      const text = chunks[chunkIndex];

      if (!text) {
        return;
      }

      try {
        const { requestKey, playbackSource } = await prepareQuinnChunkPlaybackSource(text, {
          previousText: chunks[chunkIndex - 1] || '',
          nextText: chunks[chunkIndex + 1] || '',
          prosodyHint: quinnVoiceProsodyHintRef.current,
        });

        if (isQuinnLocalVoiceRemoteSource(playbackSource)) {
          await fetch(playbackSource);
        }

        readyQuinnChunkKeysRef.current.add(requestKey);
      } catch {}
    },
    [prepareQuinnChunkPlaybackSource]
  );

// `playQuinnChunk` intentionally stays outside the dependency list here so this
// effect only responds to the player finish transition.
/* eslint-disable react-hooks/exhaustive-deps */
useEffect(() => {
  if (!playerStatus.didJustFinish) {
    return;
  }

  if (playerMode === 'recording') {
    setPipelinePhase('ready');
    setStatusMessage('Recording playback finished.');
    setPlayerMode(null);
    return;
  }

  if (playerMode === 'quinn-preview') {
    const nextIndex = quinnChunkIndex + 1;

    if (nextIndex < quinnChunks.length) {
      setQuinnChunkIndex(nextIndex);
      setStatusMessage('Quinn voice speaking now.');
      void Promise.all([
        warmQuinnChunk(quinnChunks, nextIndex + 1),
        warmQuinnChunk(quinnChunks, nextIndex + 2),
      ]);
      void playQuinnChunk(quinnChunks[nextIndex], {
        isFirstChunk: false,
        previousText: quinnChunks[nextIndex - 1] || '',
        nextText: quinnChunks[nextIndex + 1] || '',
      });
      return;
    }

    setPipelinePhase('ready');
    setStatusMessage('Quinn voice finished.');
    setPlayerMode(null);
    setIsSpeakingQuinn(false);
    setQuinnChunks([]);
    setQuinnChunkIndex(0);
    clearPreparedQuinnChunkState();
  }
}, [clearPreparedQuinnChunkState, playerMode, playerStatus.didJustFinish, quinnChunkIndex, quinnChunks]);
/* eslint-enable react-hooks/exhaustive-deps */
  const providerPayload = useMemo(
    () =>
      buildVoiceProviderPayload({
        packetTitle,
        packetText,
        lastSummary,
        transcript,
        spokenSummary,
        recordingUri,
        durationMillis: recordingDuration,
        transcriptionProvider: voiceSettings.transcriptionProvider,
        pipelinePhase,
        errorMessage: lastError,
      }),
    [
      packetTitle,
      packetText,
      lastSummary,
      transcript,
      spokenSummary,
      recordingUri,
      recordingDuration,
      voiceSettings.transcriptionProvider,
      pipelinePhase,
      lastError,
    ]
  );

  const recentVoiceSessions = useMemo(
    () => (Array.isArray(voiceSessions) ? voiceSessions : []),
    [voiceSessions]
  );
  const visibleVoiceSessions = useMemo(
    () => recentVoiceSessions.slice(0, 6),
    [recentVoiceSessions]
  );

  const preparePlaybackMode = useCallback(async () => {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      interruptionMode: 'doNotMix',
      shouldPlayInBackground: false,
    });
  }, []);

  const playQuinnChunk = useCallback(
    async (
      text: string,
      {
        isFirstChunk = false,
        previousText = '',
        nextText = '',
        prosodyHint = null,
      }: {
        isFirstChunk?: boolean;
        previousText?: string;
        nextText?: string;
        prosodyHint?: QuinnVoiceTtsHint | null;
      } = {}
    ) => {
      try {
        await preparePlaybackMode();

        const requestKey = getQuinnLocalVoiceSpeakRequestKey(text, {
          previousText,
          nextText,
          prosodyHint: prosodyHint ?? quinnVoiceProsodyHintRef.current,
        });
        const wasWarmSource =
          readyQuinnChunkKeysRef.current.has(requestKey) ||
          !isQuinnLocalVoiceRemoteSource(preparedQuinnChunkSourcesRef.current.get(requestKey) || '');
        const { playbackSource } = await prepareQuinnChunkPlaybackSource(text, {
          previousText,
          nextText,
          prosodyHint,
        });
        const playbackDelayMs = getQuinnVoicePlaybackStartDelayMs(playbackSource, {
          isFirstChunk,
          isWarmSource:
            wasWarmSource ||
            (!isQuinnLocalVoiceRemoteSource(playbackSource) &&
              preparedQuinnChunkSourcesRef.current.has(requestKey)),
        });

        player.replace(playbackSource);

        if (playbackDelayMs > 0) {
          await wait(playbackDelayMs);
        }

        player.play();

        setPlayerMode('quinn-preview');
        return true;
      } catch (error) {
        clearPreparedQuinnChunkState();
        const message = buildVoiceFailureMessage(error);
        setPipelinePhase('failed');
        setLastError(message);
        setStatusMessage(message);
        setPlayerMode(null);
        setIsSpeakingQuinn(false);
        setQuinnChunks([]);
        setQuinnChunkIndex(0);
        return false;
      }
    },
    [clearPreparedQuinnChunkState, player, preparePlaybackMode, prepareQuinnChunkPlaybackSource]
  );

  const tryPlaySingleQuinnVoice = useCallback(
    async (clean: string, prosodyHint: QuinnVoiceTtsHint | null) => {
      const policy = getSingleReplySpeechPolicy(clean);

      if (!policy.shouldAttemptSingleFile) {
        return false;
      }

      setQuinnChunks([clean]);
      setQuinnChunkIndex(0);
      quinnVoiceProsodyHintRef.current = prosodyHint;
      setStatusMessage('Quinn voice loading full preview...');
      const timeoutMessage = 'Full reply preview voice preparation timed out.';
      const prepareFullReplySource = () =>
        prepareQuinnChunkPlaybackSource(clean, {
          previousText: '',
          nextText: '',
          prosodyHint,
        });

      try {
        try {
          await withTimeout(
            prepareFullReplySource(),
            policy.initialPrepareTimeoutMs,
            timeoutMessage
          );
        } catch (error) {
          const timedOut = error instanceof Error && error.message === timeoutMessage;

          if (!timedOut || policy.gracePrepareTimeoutMs <= 0) {
            throw error;
          }

          setStatusMessage('Quinn voice still loading full preview...');
          await withTimeout(
            prepareFullReplySource(),
            policy.gracePrepareTimeoutMs,
            timeoutMessage
          );
        }

        const started = await playQuinnChunk(clean, {
          isFirstChunk: true,
          previousText: '',
          nextText: '',
          prosodyHint,
        });

        if (started) {
          return true;
        }
      } catch {}

      clearPreparedQuinnChunkState();
      setQuinnChunks([]);
      setQuinnChunkIndex(0);
      return false;
    },
    [clearPreparedQuinnChunkState, playQuinnChunk, prepareQuinnChunkPlaybackSource]
  );

  async function handleCheckQuinnVoice(showStatus = true) {
    try {
      setIsCheckingQuinnVoice(true);

      const ok = await pingQuinnLocalVoice();
      setQuinnVoiceReachable(ok);

      if (showStatus) {
        setStatusMessage(
          ok
            ? 'Quinn voice is reachable.'
            : `Quinn voice is not reachable at ${getQuinnLocalVoiceBaseUrl()}.`
        );
      }

      return ok;
    } catch {
      setQuinnVoiceReachable(false);

      if (showStatus) {
        setStatusMessage(
          `Quinn voice is not reachable at ${getQuinnLocalVoiceBaseUrl()}.`
        );
      }

      return false;
    } finally {
      setIsCheckingQuinnVoice(false);
    }
  }
    async function handleRequestPermission() {
    setPipelinePhase('requesting-permission');
    setLastError(null);

    const granted = await ensureMicrophonePermission();

    setPermissionState(granted ? 'Granted' : 'Denied');
    setPipelinePhase('idle');
    setStatusMessage(
      granted ? 'Microphone permission granted.' : 'Microphone permission denied.'
    );
  }

  async function handleStartRecording() {
    try {
      const granted = await ensureMicrophonePermission();

      if (!granted) {
        setPermissionState('Denied');
        setPipelinePhase('failed');
        setLastError('Microphone permission is required to record.');
        setStatusMessage('Microphone permission is required to record.');
        return;
      }

      await stopSystemVoicePreview();
      player.pause();
      setPlayerMode(null);

      setPermissionState('Granted');
      setLastError(null);
      setStatusMessage('Recording live.');
      setRecordingUri(null);
      setRecordingDuration(0);
      setPlaybackSource(null);

      await enableRecordingAudioMode();
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPipelinePhase('recording');
    } catch (error) {
      const message = buildVoiceFailureMessage(error);
      setPipelinePhase('failed');
      setLastError(message);
      setStatusMessage(message);
    }
  }

  async function handleStopRecording() {
    try {
      const duration = recorderState.durationMillis || 0;

      await recorder.stop();
      await disableRecordingAudioMode();

      const rawUri = recorder.uri || null;

      if (!rawUri) {
        setPipelinePhase('failed');
        setLastError('Recording stopped, but no audio file was returned.');
        setStatusMessage('Recording stopped, but no audio file was returned.');
        return;
      }

      const finalUri = voiceSettings.saveRecordingsLocally
        ? (await persistRecordingToDocument(rawUri)) || rawUri
        : rawUri;

      setRecordingUri(finalUri);
      setRecordingDuration(duration);
      setPlaybackSource(finalUri);
      setPipelinePhase('recorded');
      setStatusMessage('Recording saved and ready for the voice pipeline.');

      if (voiceSettings.autoTranscribeOnStop) {
        await handleTranscribeRecording(finalUri, duration);
      }
    } catch (error) {
      const message = buildVoiceFailureMessage(error);
      setPipelinePhase('failed');
      setLastError(message);
      setStatusMessage(message);
    }
  }

  async function handleTranscribeRecording(
    uriOverride?: string | null,
    durationOverride?: number
  ) {
    try {
      setPipelinePhase('transcribing');
      setLastError(null);

      const result = await transcribeWithConfiguredProvider({
        provider: voiceSettings.transcriptionProvider,
        packetTitle,
        packetText,
        lastSummary,
        currentTranscript: transcript,
        recordingUri: uriOverride ?? recordingUri,
        durationMillis: durationOverride ?? recordingDuration,
      });

      setTranscript(result.transcript);
      setSpokenSummary(result.spokenSummary);
      setLastTranscriptNote(result.note);
      setPipelinePhase('ready');
      setStatusMessage('Transcript pipeline completed.');
      setRecordingDuration(durationOverride ?? recordingDuration);
    } catch (error) {
      const message = buildVoiceFailureMessage(error);
      setPipelinePhase('failed');
      setLastError(message);
      setStatusMessage(message);
    }
  }

  function handleSeedFromPacket() {
    const seed = buildVoiceSeed({
      packetTitle,
      packetText,
      lastSummary,
    });

    setTranscript(seed.transcript);
    setSpokenSummary(seed.spokenSummary);
    setPipelinePhase('ready');
    setLastError(null);
    setLastTranscriptNote('Seeded directly from the current packet.');
    setStatusMessage('Voice draft seeded from the current packet.');
  }

  function handleRebuildSummary() {
    const summary = buildVoiceSeed({
      packetTitle,
      packetText: transcript || packetText,
      lastSummary,
    }).spokenSummary;

    setSpokenSummary(summary);
    setPipelinePhase('ready');
    setLastError(null);
    setStatusMessage('Short spoken summary refreshed.');
  }

async function handleSpeakQuinnVoice() {
  const voicePlan = prepareQuinnVoiceSpeech({
    text: spokenSummary,
    stateSeedText: transcript || packetText || spokenSummary,
    sessionArc: null,
    lensMode: 'adaptive',
  });
  const clean = voicePlan.clean;

  if (!clean) {
    setStatusMessage('Add or rebuild a spoken summary first.');
    return;
  }

  if (isSpeakingQuinn) {
    setStatusMessage('Quinn is already speaking.');
    return;
  }

  try {
    clearPreparedQuinnChunkState();
    setIsSpeakingQuinn(true);
    setQuinnChunkIndex(0);
    setPipelinePhase('speaking-preview');
    setLastError(null);

    await stopSystemVoicePreview();
    player.pause();
    setPlayerMode(null);

    const ok = await handleCheckQuinnVoice(false);

    if (!ok) {
      const message = `Quinn voice is not reachable at ${getQuinnLocalVoiceBaseUrl()}.`;
      setPipelinePhase('failed');
      setLastError(message);
      setStatusMessage(message);
      setIsSpeakingQuinn(false);
      setQuinnChunks([]);
      setQuinnChunkIndex(0);
      clearPreparedQuinnChunkState();
      return;
    }

    if (await tryPlaySingleQuinnVoice(clean, voicePlan.ttsHint)) {
      return;
    }

    setIsSpeakingQuinn(true);
    setPipelinePhase('speaking-preview');
    setLastError(null);

    const chunks = voicePlan.chunks;

    if (!chunks.length) {
      setStatusMessage('Add or rebuild a spoken summary first.');
      setIsSpeakingQuinn(false);
      setQuinnChunks([]);
      setQuinnChunkIndex(0);
      return;
    }

    quinnVoiceProsodyHintRef.current = voicePlan.ttsHint;
    setStatusMessage('Quinn voice speaking now.');
    void Promise.all([warmQuinnChunk(chunks, 1), warmQuinnChunk(chunks, 2)]);

    await playQuinnChunk(chunks[0], {
      isFirstChunk: true,
      nextText: chunks[1] || '',
      prosodyHint: voicePlan.ttsHint,
    });
  } catch (error) {
    clearPreparedQuinnChunkState();
    const message = buildVoiceFailureMessage(error);
    setPipelinePhase('failed');
    setLastError(message);
    setStatusMessage(message);
    setIsSpeakingQuinn(false);
    setQuinnChunks([]);
    setQuinnChunkIndex(0);
  }
}

  async function handleSpeakSystemPreview() {
    const cleanSummary = String(spokenSummary || '').trim();

    if (!cleanSummary) {
      setStatusMessage('Add or rebuild a spoken summary first.');
      return;
    }

    player.pause();
    setPlayerMode(null);

    setPipelinePhase('speaking-preview');
    setLastError(null);

    speakSystemVoicePreview(cleanSummary, voiceSettings, {
      onStart: () => {
        setStatusMessage('System fallback speaking now.');
      },
      onDone: () => {
        setPipelinePhase('ready');
        setStatusMessage('System fallback finished.');
      },
      onStopped: () => {
        setPipelinePhase('ready');
        setStatusMessage('System fallback stopped.');
      },
      onError: (error) => {
        setPipelinePhase('failed');
        setLastError(error.message);
        setStatusMessage(error.message);
      },
    });
  }

  async function handleStopPreview() {
  await stopSystemVoicePreview();
  player.pause();
  setPlayerMode(null);
  setIsSpeakingQuinn(false);
  setQuinnChunks([]);
  setQuinnChunkIndex(0);
  clearPreparedQuinnChunkState();
  setPipelinePhase('ready');
  setStatusMessage('Voice playback stopped.');
}

  async function handlePlayRecording(uri?: string | null) {
    const target = uri ?? recordingUri;

    if (!target) {
      setStatusMessage('No recording is attached yet.');
      return;
    }

    await stopSystemVoicePreview();
    await preparePlaybackMode();

    setPlaybackSource(target);
    await wait(100);
    player.replace(target);
    await wait(150);
    player.play();

    setPlayerMode('recording');
    setPipelinePhase('playing-recording');
    setStatusMessage('Playing saved recording.');
  }

  function handlePauseRecording() {
    player.pause();
    setPlayerMode(null);
    setPipelinePhase('ready');
    setStatusMessage('Recording playback paused.');
  }

  async function handleDeleteCurrentTake() {
    player.pause();
    setPlayerMode(null);

    await deleteLocalRecording(recordingUri);
    setRecordingUri(null);
    setRecordingDuration(0);
    setPlaybackSource(null);
    setPipelinePhase('idle');
    setStatusMessage('Current take deleted from Voice Mode.');
  }

  async function handleReplaceTake() {
    await handleDeleteCurrentTake();
    await handleStartRecording();
  }

  function handleSaveVoiceSession() {
    const session = createVoiceSession({
      packetTitle,
      transcript,
      spokenSummary,
      recordingUri,
      durationMillis: recordingDuration,
      pipelinePhase,
      transcriptionProvider: voiceSettings.transcriptionProvider,
      errorMessage: lastError,
    });

    onSaveVoiceSession(session);
    setStatusMessage('Voice handoff session saved.');
  }

  function handleLoadVoiceSession(session: VoiceSession) {
    void stopSystemVoicePreview();
    player.pause();
    setPlayerMode(null);
    setIsSpeakingQuinn(false);
    setQuinnChunks([]);
    setQuinnChunkIndex(0);
    clearPreparedQuinnChunkState();
    setTranscript(session.transcript);
    setSpokenSummary(session.spokenSummary);
    setRecordingUri(session.recordingUri);
    setRecordingDuration(session.durationMillis);
    setPlaybackSource(session.recordingUri);
    setPipelinePhase(
      session.pipelinePhase === 'playing-recording' || session.pipelinePhase === 'speaking-preview'
        ? 'ready'
        : session.pipelinePhase || 'ready'
    );
    setLastError(session.errorMessage || null);
    setLastTranscriptNote('Loaded from saved voice handoff.');
    setStatusMessage(`${session.title} loaded into Voice Mode.`);
  }

  async function handleDeleteVoiceSession(id: string, uri: string | null) {
    await deleteLocalRecording(uri);
    onDeleteVoiceSession(id);

    if (uri && recordingUri === uri) {
      player.pause();
      setPlayerMode(null);
      setRecordingUri(null);
      setRecordingDuration(0);
      setPlaybackSource(null);
      setPipelinePhase('idle');
      setLastTranscriptNote('');
      clearPreparedQuinnChunkState();
    }

    setStatusMessage('Saved voice session deleted.');
  }
    function handleCycleProvider() {
    const currentIndex = PROVIDER_ORDER.indexOf(voiceSettings.transcriptionProvider);
    const nextProvider =
      currentIndex >= 0 && currentIndex < PROVIDER_ORDER.length - 1
        ? PROVIDER_ORDER[currentIndex + 1]
        : PROVIDER_ORDER[0];

    onPatchVoiceSettings({
      transcriptionProvider: nextProvider,
    });

    setStatusMessage(
      `Transcription provider set to ${formatTranscriptionProvider(nextProvider)}.`
    );
  }

  function handleCycleVoice() {
    if (!availableVoices.length) {
      setStatusMessage('No system voices were returned on this device.');
      return;
    }

    const currentIndex = availableVoices.findIndex(
      (voice) => voice.identifier === voiceSettings.selectedVoiceId
    );

    const nextVoice =
      currentIndex >= 0 && currentIndex < availableVoices.length - 1
        ? availableVoices[currentIndex + 1]
        : availableVoices[0];

    onPatchVoiceSettings({
      selectedVoiceId: nextVoice.identifier,
    });

    setStatusMessage(`System fallback set to ${nextVoice.name} (${nextVoice.language}).`);
  }

  const currentPlaybackLabel =
    playerStatus.duration && Number.isFinite(playerStatus.duration)
      ? `${Math.round(playerStatus.currentTime || 0)}s / ${Math.round(
          playerStatus.duration || 0
        )}s`
      : formatDurationMillis(recordingDuration);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <QuinnSurfaceShell
        eyebrow="VOICE STUDIO"
        title="Quinn voice is live."
        description="Record, transcribe, compress, and speak with the real Quinn voice. Keep audio short. Keep the screen text long. The spoken layer should feel intentional, not overloaded."
        onBack={onBack}
        actions={[
          {
            label:
              quinnVoiceReachable === null
                ? 'Voice checking'
                : quinnVoiceReachable
                  ? 'Voice reachable'
                  : 'Voice offline',
            tone: 'secondary',
          },
          { label: formatPipelinePhase(pipelinePhase), tone: 'ghost' },
          {
            label: isSpeakingQuinn ? 'Quinn speaking' : 'Ready to speak',
            tone: 'primary',
          },
        ]}
      />

      <SectionCard eyebrow="PIPELINE STATE" title="Voice state machine">
        <Text style={styles.bodyLine}>Phase: {formatPipelinePhase(pipelinePhase)}</Text>
        <Text style={styles.bodyLine}>
          Provider: {formatTranscriptionProvider(voiceSettings.transcriptionProvider)}
        </Text>
        <Text style={styles.bodyLine}>Permission: {permissionState}</Text>
        <Text style={styles.bodyLine}>
          Current take: {recordingUri ? 'attached' : 'none'}
        </Text>
        <Text style={styles.bodyLine}>
          Playback: {playerStatus.playing ? 'playing' : 'idle'} • {currentPlaybackLabel}
        </Text>
        {lastError ? <Text style={styles.errorText}>Last error: {lastError}</Text> : null}
        {lastTranscriptNote ? <Text style={styles.noteText}>{lastTranscriptNote}</Text> : null}
      </SectionCard>

      <SectionCard eyebrow="QUINN VOICE" title="Primary spoken output">
        <Text style={styles.bodyLine}>Route: {getQuinnLocalVoiceBaseUrl()}</Text>
        <Text style={styles.bodyLine}>
          Reachable:{' '}
          {quinnVoiceReachable === null
            ? 'checking'
            : quinnVoiceReachable
              ? 'yes'
              : 'no'}
        </Text>
        <Text style={styles.helperText}>
          This is the live Quinn voice route. System fallback stays available if this
          route is down.
        </Text>

        <View style={styles.rowWrap}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => handleCheckQuinnVoice(true)}
          >
            <Text style={styles.secondaryButtonText}>
              {isCheckingQuinnVoice ? 'Checking...' : 'Check Quinn voice'}
            </Text>
          </Pressable>

          <Pressable style={styles.primaryButton} onPress={handleSpeakQuinnVoice}>
  <Text style={styles.primaryButtonText}>
    {isSpeakingQuinn ? 'Quinn speaking...' : 'Speak Quinn'}
  </Text>
</Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleStopPreview}>
            <Text style={styles.secondaryButtonText}>Stop audio</Text>
          </Pressable>
        </View>
      </SectionCard>

      <SectionCard eyebrow="VOICE INPUT" title="Microphone and take management">
        <Text style={styles.bodyLine}>
          Recorder: {recorderState.isRecording ? 'recording live' : 'idle'}
        </Text>
        <Text style={styles.bodyLine}>
          Duration:{' '}
          {formatDurationMillis(
            recorderState.isRecording ? recorderState.durationMillis : recordingDuration
          )}
        </Text>
        <Text style={styles.bodyLine}>
          Recording file: {recordingUri ? 'ready' : 'none yet'}
        </Text>

        <View style={styles.rowWrap}>
          <Pressable style={styles.secondaryButton} onPress={handleRequestPermission}>
            <Text style={styles.secondaryButtonText}>Request mic</Text>
          </Pressable>

          {!recorderState.isRecording ? (
            <Pressable style={styles.primaryButton} onPress={handleStartRecording}>
              <Text style={styles.primaryButtonText}>Start recording</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.primaryButton} onPress={handleStopRecording}>
              <Text style={styles.primaryButtonText}>Stop recording</Text>
            </Pressable>
          )}

          <Pressable style={styles.secondaryButton} onPress={handleReplaceTake}>
            <Text style={styles.secondaryButtonText}>Replace take</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleDeleteCurrentTake}>
            <Text style={styles.secondaryButtonText}>Delete take</Text>
          </Pressable>
        </View>

        <View style={styles.rowWrap}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => handlePlayRecording()}
          >
            <Text style={styles.secondaryButtonText}>Play take</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handlePauseRecording}>
            <Text style={styles.secondaryButtonText}>Pause take</Text>
          </Pressable>

          <Pressable
            style={styles.primaryButton}
            onPress={() => handleTranscribeRecording()}
          >
            <Text style={styles.primaryButtonText}>Run transcript step</Text>
          </Pressable>
        </View>

        <Text style={styles.helperText}>
          Capture and playback stay local. The summary voice uses Quinn.
        </Text>
      </SectionCard>

      <SectionCard eyebrow="TRANSCRIPT DRAFT" title="Shape the spoken input">
        <TextInput
          multiline
          value={transcript}
          onChangeText={setTranscript}
          placeholder="Transcript draft"
          placeholderTextColor={SURFACE_THEME.textSoft}
          style={styles.canvasInput}
          textAlignVertical="top"
        />

        <View style={styles.rowWrap}>
          <Pressable style={styles.secondaryButton} onPress={handleSeedFromPacket}>
            <Text style={styles.secondaryButtonText}>Seed from packet</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onOpenCanvas}>
            <Text style={styles.secondaryButtonText}>Open Quinn</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={onOpenGravity}>
            <Text style={styles.secondaryButtonText}>Open deck</Text>
          </Pressable>
        </View>
      </SectionCard>

      <SectionCard eyebrow="SPOKEN OUTPUT" title="Short spoken summary only">
        <TextInput
          multiline
          value={spokenSummary}
          onChangeText={setSpokenSummary}
          placeholder="Spoken summary"
          placeholderTextColor={SURFACE_THEME.textSoft}
          style={styles.summaryInput}
          textAlignVertical="top"
        />

        <View style={styles.rowWrap}>
          <Pressable style={styles.primaryButton} onPress={handleRebuildSummary}>
            <Text style={styles.primaryButtonText}>Refresh summary</Text>
          </Pressable>

          <Pressable style={styles.primaryButton} onPress={handleSpeakQuinnVoice}>
  <Text style={styles.primaryButtonText}>
    {isSpeakingQuinn ? 'Quinn speaking...' : 'Speak Quinn'}
  </Text>
</Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleSpeakSystemPreview}>
            <Text style={styles.secondaryButtonText}>System fallback</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleStopPreview}>
            <Text style={styles.secondaryButtonText}>Stop preview</Text>
          </Pressable>
        </View>
      </SectionCard>

      <SectionCard eyebrow="VOICE CONFIG" title="Transcription and fallback controls">
        <Text style={styles.bodyLine}>
          Transcription provider:{' '}
          {formatTranscriptionProvider(voiceSettings.transcriptionProvider)}
        </Text>
        <Text style={styles.bodyLine}>
          Auto transcribe on stop: {voiceSettings.autoTranscribeOnStop ? 'on' : 'off'}
        </Text>
        <Text style={styles.bodyLine}>
          Auto speak preview: {voiceSettings.autoSpeakPreview ? 'on' : 'off'}
        </Text>
        <Text style={styles.bodyLine}>
          Save recordings locally: {voiceSettings.saveRecordingsLocally ? 'on' : 'off'}
        </Text>
        <Text style={styles.bodyLine}>
          System fallback voice: {voiceSettings.selectedVoiceId || 'system default'}
        </Text>
        <Text style={styles.bodyLine}>
          Rate: {voiceSettings.speechRate.toFixed(2)} • Pitch:{' '}
          {voiceSettings.speechPitch.toFixed(2)}
        </Text>

        <View style={styles.rowWrap}>
          <Pressable style={styles.secondaryButton} onPress={handleCycleProvider}>
            <Text style={styles.secondaryButtonText}>Next provider</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              onPatchVoiceSettings({
                autoTranscribeOnStop: !voiceSettings.autoTranscribeOnStop,
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Toggle auto transcribe</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              onPatchVoiceSettings({
                autoSpeakPreview: !voiceSettings.autoSpeakPreview,
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Toggle auto speak</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              onPatchVoiceSettings({
                saveRecordingsLocally: !voiceSettings.saveRecordingsLocally,
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Toggle local save</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              onPatchVoiceSettings({
                speechRate: Math.max(
                  0.6,
                  Number((voiceSettings.speechRate - 0.08).toFixed(2))
                ),
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Slower</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              onPatchVoiceSettings({
                speechRate: Math.min(
                  1.4,
                  Number((voiceSettings.speechRate + 0.08).toFixed(2))
                ),
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Faster</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              onPatchVoiceSettings({
                speechPitch: Math.max(
                  0.7,
                  Number((voiceSettings.speechPitch - 0.05).toFixed(2))
                ),
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Lower</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              onPatchVoiceSettings({
                speechPitch: Math.min(
                  1.4,
                  Number((voiceSettings.speechPitch + 0.05).toFixed(2))
                ),
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Higher</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleCycleVoice}>
            <Text style={styles.secondaryButtonText}>Next fallback voice</Text>
          </Pressable>
        </View>
      </SectionCard>

      <SectionCard eyebrow="HANDOFF PAYLOAD" title="Voice state export">
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>{JSON.stringify(providerPayload, null, 2)}</Text>
        </View>

        <View style={styles.rowWrap}>
          <Pressable style={styles.primaryButton} onPress={handleSaveVoiceSession}>
            <Text style={styles.primaryButtonText}>Save voice handoff</Text>
          </Pressable>
        </View>
      </SectionCard>

      <SectionCard eyebrow="SAVED VOICE SESSIONS" title="Replay, reload, or delete">
        {recentVoiceSessions.length ? (
          visibleVoiceSessions.map((session) => (
            <View key={session.id} style={styles.feedItem}>
              <Text style={styles.feedTitle} numberOfLines={1}>
                {session.title}
              </Text>
              <Text style={styles.feedMeta}>
                {new Date(session.createdAt).toLocaleString()} •{' '}
                {formatTranscriptionProvider(session.transcriptionProvider)}
              </Text>
              <Text style={styles.feedBody} numberOfLines={2}>
                {session.spokenSummary}
              </Text>

              <View style={styles.rowWrap}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => handleLoadVoiceSession(session)}
                >
                  <Text style={styles.secondaryButtonText}>Load</Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => handlePlayRecording(session.recordingUri)}
                >
                  <Text style={styles.secondaryButtonText}>Play</Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => handleDeleteVoiceSession(session.id, session.recordingUri)}
                >
                  <Text style={styles.secondaryButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.bodyLine}>
            No saved voice handoffs yet. Record or draft one here first.
          </Text>
        )}
      </SectionCard>

      {statusMessage ? (
        <View style={styles.statusBand}>
          <Text style={styles.statusBandText}>{statusMessage}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },

  bodyLine: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 8,
  },

  helperText: {
    color: SURFACE_THEME.textSoft,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 6,
  },

  errorText: {
    color: '#FFB6C7',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    marginTop: 4,
  },

  noteText: {
    color: SURFACE_THEME.gold,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    marginTop: 4,
  },

  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },

  primaryButton: {
    backgroundColor: SURFACE_THEME.goldSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderWarm,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  primaryButtonText: {
    color: SURFACE_THEME.gold,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  secondaryButton: {
    backgroundColor: SURFACE_THEME.panelSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 8,
  },

  secondaryButtonText: {
    color: SURFACE_THEME.text,
    fontSize: 13,
    fontWeight: '900',
  },

  canvasInput: {
    minHeight: 180,
    color: SURFACE_THEME.text,
    backgroundColor: SURFACE_THEME.panelInset,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 18,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },

  summaryInput: {
    minHeight: 120,
    color: SURFACE_THEME.text,
    backgroundColor: SURFACE_THEME.panelInset,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 18,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },

  previewBox: {
    backgroundColor: SURFACE_THEME.panelInset,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 18,
    padding: 14,
  },

  previewText: {
    color: SURFACE_THEME.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  feedItem: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: SURFACE_THEME.border,
  },

  feedTitle: {
    color: SURFACE_THEME.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },

  feedMeta: {
    color: SURFACE_THEME.textSoft,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  feedBody: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  statusBand: {
    marginTop: 8,
    backgroundColor: SURFACE_THEME.panelSoft,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  statusBandText: {
    color: SURFACE_THEME.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
});
