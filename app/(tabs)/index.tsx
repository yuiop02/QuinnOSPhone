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
  Animated,
  Dimensions,
  Easing,
  Pressable,
  SafeAreaView as RNSafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as SafeAreaContext from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Path,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
} from 'react-native-svg';

import * as AppSwitcherModule from '../../components/quinn/AppSwitcher';
import * as ControlCenterModule from '../../components/quinn/ControlCenter';
import * as ExportsPanelModule from '../../components/quinn/ExportsPanel';
import * as HomeTileGridModule from '../../components/quinn/HomeTileGrid';
import * as MemoryPanelModule from '../../components/quinn/MemoryPanel';
import * as NotificationsPanelModule from '../../components/quinn/NotificationsPanel';
import * as VoiceModeModule from '../../components/quinn/VoiceMode';

import Feather from '@expo/vector-icons/Feather';
import QuinnField from '../../components/quinn/QuinnField';
import QuinnSurfaceShell from '../../components/quinn/QuinnSurfaceShell';
import {
  buildCompressionSummary,
  generateFollowupPacket,
  runQuinnPacket,
  sanitizeQuinnVisibleReplyText,
  transcribeAudioFile,
} from '../../components/quinn/quinnApi';
import {
  buildExportBundle,
  INITIAL_MEMORIES,
  INITIAL_PACKET_TITLE,
  INITIAL_SETTINGS,
  INITIAL_VOICE_SETTINGS
} from '../../components/quinn/quinnAppState';
import {
  getQuinnLocalVoiceBaseUrl,
  getQuinnLocalVoiceSpeakRequestKey,
  getQuinnVoicePlaybackStartDelayMs,
  isQuinnLocalVoiceRemoteSource,
  pingQuinnLocalVoice,
  prepareQuinnLocalVoicePlaybackSource,
} from '../../components/quinn/quinnLocalVoice';
import {
  countUnreadNotifications,
  markNotificationRead,
  prependNotification,
  removeNotification,
  toggleNotificationRead,
} from '../../components/quinn/quinnNotificationState';
import {
  resolveNotificationTarget,
} from '../../components/quinn/quinnNavigation';
import {
  buildQuinnPacket,
  DEFAULT_QUINN_LENS_ID,
  getQuinnLens,
  getQuinnLenses,
  inferQuinnLensFromFollowUp,
  type QuinnLensId,
} from '../../components/quinn/quinnLenses';
import {
  buildSpokenSummary,
  getSingleReplySpeechPolicy,
  prepareQuinnVoiceSpeech,
} from '../../components/quinn/quinnSpeechText';
import {
  advanceSessionArc,
  buildSessionArcMeta,
  resumeSessionArcFromRun,
} from '../../components/quinn/quinnSessionArc';
import { derivePacketTitle } from '../../components/quinn/quinnSignalTitle';
import { createRunArtifacts } from '../../components/quinn/quinnRunArtifacts';
import { createNotification } from '../../components/quinn/quinnNotificationFactory';
import { useQuinnConversationMotion } from '../../components/quinn/useQuinnConversationMotion';
import { loadQuinnSnapshot, saveQuinnSnapshot } from '../../components/quinn/quinnStorage';
import { TOKENS } from '../../components/quinn/quinnSystem';
import { SURFACE_THEME } from '../../components/quinn/quinnSurfaceTheme';
import type { QuinnVoiceTtsHint } from '../../components/quinn/quinnVoiceProsody';
import type {
  AppScreen,
  MemoryItem,
  MemoryResonanceItem,
  NotificationItem,
  NotificationTarget,
  NotificationTone,
  QuinnSettings,
  RunHistoryItem,
  SessionArc,
  VoiceSession,
  VoiceSettings,
} from '../../components/quinn/quinnTypes';
import {
  disableRecordingAudioMode,
  enableRecordingAudioMode,
  ensureMicrophonePermission,
  formatDurationMillis,
  persistRecordingToDocument,
  stopSystemVoicePreview,
} from '../../components/quinn/quinnVoice';

type QuinnRunResult = {
  written: string;
  summary: string;
  timestamp: string;
  memoryResonance?: MemoryResonanceItem[];
};

type NumberedOption = {
  index: number;
  text: string;
};

type VisibleReplySource = {
  packetTitle: string;
  packetText: string;
  lensId: QuinnLensId;
};

const HEADER_HEIGHT = 254;
const FADE_WALL_HEIGHT = 324;
const WINDOW_WIDTH = Dimensions.get('window').width;
const QUINN_LENSES = getQuinnLenses();
const SNAPSHOT_PERSIST_DEBOUNCE_MS = 250;
const AMBIENT_STARS = [
  { x: 18, y: 82, size: 2.2, color: '#FFF7F0' },
  { x: 56, y: 58, size: 1.8, color: '#E6EEFF' },
  { x: 104, y: 112, size: 1.6, color: '#FFFFFF' },
  { x: 152, y: 74, size: 2.3, color: '#FFEFE5' },
  { x: 206, y: 124, size: 1.7, color: '#DCEBFF' },
  { x: 262, y: 66, size: 2.1, color: '#FFFFFF' },
  { x: 316, y: 116, size: 1.8, color: '#FCEBFF' },
  { x: 34, y: 176, size: 1.7, color: '#FFFFFF' },
  { x: 92, y: 214, size: 2.5, color: '#FFF4EC' },
  { x: 148, y: 188, size: 1.5, color: '#E6F0FF' },
  { x: 214, y: 236, size: 2.1, color: '#FFFFFF' },
  { x: 286, y: 196, size: 1.8, color: '#FFF0E6' },
  { x: 336, y: 252, size: 1.6, color: '#DCEBFF' },
  { x: 48, y: 312, size: 2.3, color: '#FFFFFF' },
  { x: 122, y: 348, size: 1.8, color: '#FFF3EA' },
  { x: 188, y: 322, size: 1.5, color: '#E5EEFF' },
  { x: 254, y: 374, size: 2.2, color: '#FFFFFF' },
  { x: 324, y: 334, size: 1.7, color: '#FBE8FF' },
  { x: 28, y: 452, size: 2.2, color: '#FFFFFF' },
  { x: 86, y: 494, size: 1.7, color: '#FFF4EC' },
  { x: 154, y: 462, size: 1.6, color: '#E4EEFF' },
  { x: 230, y: 520, size: 2.1, color: '#FFFFFF' },
  { x: 298, y: 482, size: 1.8, color: '#FFEFE5' },
  { x: 342, y: 544, size: 1.5, color: '#DCEBFF' },
  { x: 46, y: 620, size: 2.2, color: '#FFFFFF' },
  { x: 118, y: 668, size: 1.7, color: '#FFF5EE' },
  { x: 192, y: 632, size: 1.5, color: '#E3EDFF' },
  { x: 266, y: 700, size: 2.2, color: '#FFFFFF' },
  { x: 330, y: 658, size: 1.7, color: '#FFF0E8' },
  { x: 32, y: 774, size: 2.3, color: '#DCEBFF' },
  { x: 108, y: 824, size: 1.7, color: '#FFFFFF' },
  { x: 196, y: 792, size: 2.2, color: '#FFF4EC' },
  { x: 284, y: 850, size: 1.9, color: '#FFFFFF' },
  { x: 336, y: 804, size: 1.6, color: '#E6EEFF' },
] as const;

function MissingScreen({ name }: { name: string }) {
  return (
    <View style={styles.missingWrap}>
      <Text style={styles.missingEyebrow}>SCREEN IMPORT ISSUE</Text>
      <Text style={styles.missingTitle}>{name} is not exporting correctly.</Text>
      <Text style={styles.missingBody}>
        The app shell is up. This one screen likely got changed from a default export
        to a named export, or the file export was altered.
      </Text>
    </View>
  );
}

function resolveScreen(moduleValue: any, exportName: string): React.ComponentType<any> {
  if (moduleValue?.default) {
    return moduleValue.default;
  }

  if (moduleValue?.[exportName]) {
    return moduleValue[exportName];
  }

  return function ResolvedMissingScreen() {
    return <MissingScreen name={exportName} />;
  };
}

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

function buildThreadContinuityId() {
  return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanOptionText(value: string, maxLength = 240) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();

  if (!clean) {
    return '';
  }

  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3).trim()}...` : clean;
}

function extractNumberedOptions(text: string): NumberedOption[] {
  const clean = String(text || '').replace(/\r\n?/g, '\n').trim();

  if (!clean) {
    return [];
  }

  const matches = [
    ...clean.matchAll(
      /(?:^|\n)\s*(\d{1,2})[.)]\s+([\s\S]*?)(?=(?:\n\s*\d{1,2}[.)]\s+)|(?:\n{2,})|$)/g
    ),
  ];

  const options = matches
    .map((match) => ({
      index: Number(match[1] || 0),
      text: cleanOptionText(match[2] || ''),
    }))
    .filter((option) => Number.isFinite(option.index) && option.index > 0 && option.text);

  if (options.length < 2) {
    return [];
  }

  const unique = new Map<number, NumberedOption>();

  for (const option of options) {
    if (!unique.has(option.index)) {
      unique.set(option.index, option);
    }
  }

  return [...unique.values()].sort((a, b) => a.index - b.index);
}

function parseBareNumericSelection(text: string) {
  const clean = String(text || '').trim().toLowerCase();

  if (!clean) {
    return null;
  }

  const match = clean.match(/^(?:option\s*)?#?\s*(\d{1,2})[.!?]*$/i);

  if (!match) {
    return null;
  }

  const index = Number(match[1] || 0);
  return Number.isFinite(index) && index > 0 ? index : null;
}

function coerceQuinnLensId(value: unknown): QuinnLensId {
  const clean = String(value || '').trim().toLowerCase();

  if (
    clean === 'open' ||
    clean === 'read' ||
    clean === 'strategy' ||
    clean === 'write' ||
    clean === 'reality'
  ) {
    return clean as QuinnLensId;
  }

  return DEFAULT_QUINN_LENS_ID;
}

function deriveVisibleReplySource({
  writtenResult,
  recentRuns,
  packetTitle,
  packetText,
  activeLensId,
}: {
  writtenResult: string;
  recentRuns: RunHistoryItem[];
  packetTitle: string;
  packetText: string;
  activeLensId: QuinnLensId;
}): VisibleReplySource {
  const latestRun = Array.isArray(recentRuns) ? recentRuns[0] : null;

  if (String(writtenResult || '').trim() && latestRun) {
    return {
      packetTitle: latestRun.packetTitle || packetTitle,
      packetText: latestRun.packetText || packetText,
      lensId: latestRun.lensId ? coerceQuinnLensId(latestRun.lensId) : activeLensId,
    };
  }

  return {
    packetTitle,
    packetText,
    lensId: activeLensId,
  };
}

function sanitizeRunHistoryItemForDisplay(item: RunHistoryItem): RunHistoryItem {
  const cleanWrittenResult = sanitizeQuinnVisibleReplyText(item.writtenResult || '');
  const cleanCompressedSummary = sanitizeQuinnVisibleReplyText(item.compressedSummary || '');

  return {
    ...item,
    writtenResult: cleanWrittenResult,
    compressedSummary:
      cleanCompressedSummary || buildCompressionSummary(cleanWrittenResult || item.packetText || ''),
  };
}

function sanitizeRunHistoryItemsForDisplay(items: RunHistoryItem[]) {
  return items.map(sanitizeRunHistoryItemForDisplay);
}

const TopFadeWall = React.memo(function TopFadeWall() {
  return (
    <View pointerEvents="none" style={styles.topFadeWall}>
      <Svg width={WINDOW_WIDTH} height={FADE_WALL_HEIGHT}>
        <Defs>
          <SvgLinearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#020008" stopOpacity="1" />
            <Stop offset="22%" stopColor="#020008" stopOpacity="0.99" />
            <Stop offset="46%" stopColor="#020008" stopOpacity="0.93" />
            <Stop offset="68%" stopColor="#020008" stopOpacity="0.68" />
            <Stop offset="84%" stopColor="#020008" stopOpacity="0.26" />
            <Stop offset="100%" stopColor="#020008" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>
        <Rect width={WINDOW_WIDTH} height={FADE_WALL_HEIGHT} fill="url(#topFade)" />
      </Svg>
    </View>
  );
});

const AmbientGalaxyMotion = React.memo(function AmbientGalaxyMotion() {
  const drift = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0)).current;
  const meteorA = useRef(new Animated.Value(0)).current;
  const meteorB = useRef(new Animated.Value(0)).current;
  const meteorC = useRef(new Animated.Value(0)).current;

  const height = Dimensions.get('window').height;

  useEffect(() => {
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 16000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 16000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const twinkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, {
          toValue: 1,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(twinkle, {
          toValue: 0,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const meteorLoopA = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(meteorA, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(3200),
        Animated.timing(meteorA, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    const meteorLoopB = Animated.loop(
      Animated.sequence([
        Animated.delay(2600),
        Animated.timing(meteorB, {
          toValue: 1,
          duration: 1750,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(3600),
        Animated.timing(meteorB, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    const meteorLoopC = Animated.loop(
      Animated.sequence([
        Animated.delay(4600),
        Animated.timing(meteorC, {
          toValue: 1,
          duration: 1700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(3800),
        Animated.timing(meteorC, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    driftLoop.start();
    twinkleLoop.start();
    meteorLoopA.start();
    meteorLoopB.start();
    meteorLoopC.start();

    return () => {
      driftLoop.stop();
      twinkleLoop.stop();
      meteorLoopA.stop();
      meteorLoopB.stop();
      meteorLoopC.stop();
    };
  }, [drift, twinkle, meteorA, meteorB, meteorC]);

  const baseShiftX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 8],
  });

  const baseShiftY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 7],
  });

  const planetShiftX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-3, 4],
  });

  const planetShiftY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  const hazeOpacity = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0.64, 0.84],
  });

  const twinkleOpacity = twinkle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 0.9],
  });

  const meteorAOpacity = meteorA.interpolate({
    inputRange: [0, 0.08, 0.7, 1],
    outputRange: [0, 0.74, 0.74, 0],
  });

  const meteorAX = meteorA.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 330],
  });

  const meteorAY = meteorA.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 190],
  });

  const meteorBOpacity = meteorB.interpolate({
    inputRange: [0, 0.08, 0.7, 1],
    outputRange: [0, 0.7, 0.7, 0],
  });

  const meteorBX = meteorB.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -340],
  });

  const meteorBY = meteorB.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 210],
  });

  const meteorCOpacity = meteorC.interpolate({
    inputRange: [0, 0.08, 0.7, 1],
    outputRange: [0, 0.68, 0.68, 0],
  });

  const meteorCX = meteorC.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 310],
  });

  const meteorCY = meteorC.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 170],
  });

  function ShootingStar({
    idPrefix,
    warm = false,
    reverse = false,
  }: {
    idPrefix: string;
    warm?: boolean;
    reverse?: boolean;
  }) {
    const tailId = `${idPrefix}-tail`;
    const coreId = `${idPrefix}-core`;
    const glowId = `${idPrefix}-glow`;

    if (!reverse) {
      return (
        <Svg width={240} height={40} viewBox="0 0 240 40">
          <Defs>
            <SvgLinearGradient id={tailId} x1="0" y1="20" x2="226" y2="20" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor={warm ? '#FFE7D2' : '#D9E9FF'} stopOpacity="0" />
              <Stop offset="26%" stopColor={warm ? '#FFE7D2' : '#D9E9FF'} stopOpacity="0.06" />
              <Stop offset="72%" stopColor={warm ? '#FFE7D2' : '#D9E9FF'} stopOpacity="0.26" />
              <Stop offset="100%" stopColor={warm ? '#FFF8F0' : '#FFFFFF'} stopOpacity="1" />
            </SvgLinearGradient>
            <SvgLinearGradient id={coreId} x1="128" y1="20" x2="228" y2="20" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor={warm ? '#FFF1E2' : '#EEF6FF'} stopOpacity="0" />
              <Stop offset="42%" stopColor={warm ? '#FFF1E2' : '#EEF6FF'} stopOpacity="0.42" />
              <Stop offset="100%" stopColor={warm ? '#FFF9F3' : '#FFFFFF'} stopOpacity="1" />
            </SvgLinearGradient>
            <SvgRadialGradient id={glowId} cx="88%" cy="50%" r="30%">
              <Stop offset="0%" stopColor={warm ? '#FFF2E4' : '#FFFFFF'} stopOpacity="0.95" />
              <Stop offset="100%" stopColor={warm ? '#FFF2E4' : '#DCEBFF'} stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>

          <Path
            d="M 8 20 C 56 19.6 108 19.4 162 19.3 C 196 19.25 214 19.5 226 20 C 214 20.5 196 20.75 162 20.7 C 108 20.6 56 20.4 8 20 Z"
            fill={`url(#${tailId})`}
          />
          <Path
            d="M 126 20 C 154 19.7 182 19.55 210 19.7 C 219 19.76 224 19.86 228 20 C 224 20.14 219 20.24 210 20.3 C 182 20.45 154 20.3 126 20 Z"
            fill={`url(#${coreId})`}
          />
          <Circle cx="226" cy="20" r="9" fill={`url(#${glowId})`} />
          <Circle cx="226" cy="20" r="3.8" fill={warm ? '#FFF4E8' : '#FFFFFF'} />
        </Svg>
      );
    }

    return (
      <Svg width={240} height={40} viewBox="0 0 240 40">
        <Defs>
          <SvgLinearGradient id={tailId} x1="232" y1="20" x2="14" y2="20" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={warm ? '#FFE7D2' : '#D9E9FF'} stopOpacity="0" />
            <Stop offset="26%" stopColor={warm ? '#FFE7D2' : '#D9E9FF'} stopOpacity="0.06" />
            <Stop offset="72%" stopColor={warm ? '#FFE7D2' : '#D9E9FF'} stopOpacity="0.26" />
            <Stop offset="100%" stopColor={warm ? '#FFF8F0' : '#FFFFFF'} stopOpacity="1" />
          </SvgLinearGradient>
          <SvgLinearGradient id={coreId} x1="112" y1="20" x2="12" y2="20" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={warm ? '#FFF1E2' : '#EEF6FF'} stopOpacity="0" />
            <Stop offset="42%" stopColor={warm ? '#FFF1E2' : '#EEF6FF'} stopOpacity="0.42" />
            <Stop offset="100%" stopColor={warm ? '#FFF9F3' : '#FFFFFF'} stopOpacity="1" />
          </SvgLinearGradient>
          <SvgRadialGradient id={glowId} cx="12%" cy="50%" r="30%">
            <Stop offset="0%" stopColor={warm ? '#FFF2E4' : '#FFFFFF'} stopOpacity="0.95" />
            <Stop offset="100%" stopColor={warm ? '#FFF2E4' : '#DCEBFF'} stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>

        <Path
          d="M 232 20 C 184 19.6 132 19.4 78 19.3 C 44 19.25 26 19.5 14 20 C 26 20.5 44 20.75 78 20.7 C 132 20.6 184 20.4 232 20 Z"
          fill={`url(#${tailId})`}
        />
        <Path
          d="M 114 20 C 86 19.7 58 19.55 30 19.7 C 21 19.76 16 19.86 12 20 C 16 20.14 21 20.24 30 20.3 C 58 20.45 86 20.3 114 20 Z"
          fill={`url(#${coreId})`}
        />
        <Circle cx="14" cy="20" r="9" fill={`url(#${glowId})`} />
        <Circle cx="14" cy="20" r="3.8" fill={warm ? '#FFF4E8' : '#FFFFFF'} />
      </Svg>
    );
  }

  return (
    <View pointerEvents="none" style={styles.ambientGalaxy}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: hazeOpacity,
            transform: [{ translateX: baseShiftX }, { translateY: baseShiftY }],
          },
        ]}
      >
        <Svg width={WINDOW_WIDTH} height={height + 180}>
          <Defs>
            <SvgRadialGradient id="spaceGlowViolet" cx="80%" cy="16%" r="52%">
              <Stop offset="0%" stopColor="#D164FF" stopOpacity="0.34" />
              <Stop offset="38%" stopColor="#320846" stopOpacity="0.26" />
              <Stop offset="100%" stopColor="#020008" stopOpacity="0" />
            </SvgRadialGradient>
            <SvgRadialGradient id="spaceGlowRose" cx="88%" cy="56%" r="44%">
              <Stop offset="0%" stopColor="#FF7AD3" stopOpacity="0.22" />
              <Stop offset="46%" stopColor="#4A0F28" stopOpacity="0.14" />
              <Stop offset="100%" stopColor="#020008" stopOpacity="0" />
            </SvgRadialGradient>
            <SvgRadialGradient id="spaceGlowCyan" cx="10%" cy="42%" r="42%">
              <Stop offset="0%" stopColor="#8A6BFF" stopOpacity="0.12" />
              <Stop offset="44%" stopColor="#12123D" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#020008" stopOpacity="0" />
            </SvgRadialGradient>
            <SvgRadialGradient id="spaceGlowPeach" cx="54%" cy="10%" r="34%">
              <Stop offset="0%" stopColor="#FFE5CF" stopOpacity="0.15" />
              <Stop offset="42%" stopColor="#5C1730" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#020008" stopOpacity="0" />
            </SvgRadialGradient>
            <SvgRadialGradient id="portalCoreGlow" cx="50%" cy="50%" r="62%">
              <Stop offset="0%" stopColor="#FFF0E2" stopOpacity="0.22" />
              <Stop offset="28%" stopColor="#FFB6E2" stopOpacity="0.20" />
              <Stop offset="56%" stopColor="#B45EFF" stopOpacity="0.14" />
              <Stop offset="100%" stopColor="#020008" stopOpacity="0" />
            </SvgRadialGradient>
            <SvgLinearGradient id="portalArcHot" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFEDD8" stopOpacity="0.9" />
              <Stop offset="32%" stopColor="#FFB3E4" stopOpacity="0.9" />
              <Stop offset="72%" stopColor="#C869FF" stopOpacity="0.82" />
              <Stop offset="100%" stopColor="#6F27A4" stopOpacity="0.12" />
            </SvgLinearGradient>
            <SvgLinearGradient id="portalArcSoft" x1="1" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFE3CA" stopOpacity="0.22" />
              <Stop offset="44%" stopColor="#FF89D5" stopOpacity="0.28" />
              <Stop offset="100%" stopColor="#7A38C5" stopOpacity="0.08" />
            </SvgLinearGradient>

            <SvgRadialGradient id="planetAtmos" cx="34%" cy="28%" r="72%">
              <Stop offset="0%" stopColor="#FFD8E7" stopOpacity="0.24" />
              <Stop offset="22%" stopColor="#C892FF" stopOpacity="0.16" />
              <Stop offset="56%" stopColor="#4B2763" stopOpacity="0.07" />
              <Stop offset="100%" stopColor="#04010A" stopOpacity="0" />
            </SvgRadialGradient>
            <SvgRadialGradient id="planetSurface" cx="28%" cy="28%" r="76%">
              <Stop offset="0%" stopColor="#8C5398" stopOpacity="1" />
              <Stop offset="20%" stopColor="#5A2F73" stopOpacity="1" />
              <Stop offset="54%" stopColor="#251435" stopOpacity="1" />
              <Stop offset="100%" stopColor="#09030F" stopOpacity="1" />
            </SvgRadialGradient>

            <SvgRadialGradient id="moonAtmos" cx="32%" cy="30%" r="70%">
              <Stop offset="0%" stopColor="#E5F2FF" stopOpacity="0.18" />
              <Stop offset="44%" stopColor="#88B5F3" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#02030A" stopOpacity="0" />
            </SvgRadialGradient>
            <SvgRadialGradient id="moonSurface" cx="30%" cy="30%" r="74%">
              <Stop offset="0%" stopColor="#C2CBD7" stopOpacity="1" />
              <Stop offset="20%" stopColor="#99A5B7" stopOpacity="1" />
              <Stop offset="50%" stopColor="#5B677C" stopOpacity="1" />
              <Stop offset="100%" stopColor="#151B28" stopOpacity="1" />
            </SvgRadialGradient>

            <SvgLinearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#04010A" stopOpacity="0.02" />
              <Stop offset="72%" stopColor="#04010A" stopOpacity="0" />
              <Stop offset="100%" stopColor="#020008" stopOpacity="0.74" />
            </SvgLinearGradient>
          </Defs>

          <Rect width={WINDOW_WIDTH} height={height + 180} fill="#020008" />
          <Rect width={WINDOW_WIDTH} height={height + 180} fill="url(#spaceGlowViolet)" />
          <Rect width={WINDOW_WIDTH} height={height + 180} fill="url(#spaceGlowRose)" />
          <Rect width={WINDOW_WIDTH} height={height + 180} fill="url(#spaceGlowCyan)" />
          <Rect width={WINDOW_WIDTH} height={height + 180} fill="url(#spaceGlowPeach)" />

          <Ellipse
            cx={WINDOW_WIDTH * 0.58}
            cy={height * 0.30}
            rx={178}
            ry={78}
            fill="rgba(177, 97, 255, 0.07)"
            transform={`rotate(-16 ${WINDOW_WIDTH * 0.58} ${height * 0.30})`}
          />
          <Ellipse
            cx={WINDOW_WIDTH * 0.26}
            cy={height * 0.62}
            rx={166}
            ry={72}
            fill="rgba(121, 101, 255, 0.045)"
            transform={`rotate(18 ${WINDOW_WIDTH * 0.26} ${height * 0.62})`}
          />
          <Ellipse
            cx={WINDOW_WIDTH * 0.88}
            cy={height * 0.80}
            rx={142}
            ry={62}
            fill="rgba(255, 127, 203, 0.05)"
            transform={`rotate(-18 ${WINDOW_WIDTH * 0.88} ${height * 0.80})`}
          />
          <Ellipse
            cx={WINDOW_WIDTH * 0.54}
            cy={height * 0.16}
            rx={152}
            ry={52}
            fill="rgba(255, 223, 197, 0.038)"
            transform={`rotate(-8 ${WINDOW_WIDTH * 0.54} ${height * 0.16})`}
          />
          <Ellipse
            cx={WINDOW_WIDTH * 0.57}
            cy={height * 0.26}
            rx={124}
            ry={90}
            fill="url(#portalCoreGlow)"
            transform={`rotate(-18 ${WINDOW_WIDTH * 0.57} ${height * 0.26})`}
          />
          <Ellipse
            cx={WINDOW_WIDTH * 0.57}
            cy={height * 0.26}
            rx={120}
            ry={84}
            fill="none"
            stroke="url(#portalArcHot)"
            strokeWidth="2.6"
            opacity={0.94}
            transform={`rotate(-20 ${WINDOW_WIDTH * 0.57} ${height * 0.26})`}
          />
          <Ellipse
            cx={WINDOW_WIDTH * 0.59}
            cy={height * 0.28}
            rx={154}
            ry={108}
            fill="none"
            stroke="url(#portalArcSoft)"
            strokeWidth="1.4"
            opacity={0.44}
            transform={`rotate(-24 ${WINDOW_WIDTH * 0.59} ${height * 0.28})`}
          />
          <Path
            d={`M ${WINDOW_WIDTH * 0.55} ${height * 0.34} C ${WINDOW_WIDTH * 0.63} ${height * 0.35}, ${WINDOW_WIDTH * 0.76} ${height * 0.45}, ${WINDOW_WIDTH * 0.88} ${height * 0.5}`}
            fill="none"
            stroke="url(#portalArcHot)"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity={0.52}
          />

          <Rect width={WINDOW_WIDTH} height={height + 180} fill="url(#vignette)" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ translateX: planetShiftX }, { translateY: planetShiftY }],
          },
        ]}
      >
        <Svg width={WINDOW_WIDTH} height={height + 180}>
          <Circle cx={WINDOW_WIDTH + 112} cy={160} r={222} fill="url(#planetAtmos)" />
          <Circle cx={WINDOW_WIDTH + 112} cy={160} r={184} fill="url(#planetSurface)" />
          <Circle cx={WINDOW_WIDTH + 202} cy={126} r={188} fill="rgba(2, 1, 7, 0.68)" />

          <Ellipse
            cx={WINDOW_WIDTH + 6}
            cy={118}
            rx={108}
            ry={18}
            fill="rgba(255, 229, 214, 0.09)"
            transform={`rotate(-14 ${WINDOW_WIDTH + 6} 118)`}
          />
          <Ellipse
            cx={WINDOW_WIDTH - 2}
            cy={190}
            rx={132}
            ry={24}
            fill="rgba(180, 107, 255, 0.11)"
            transform={`rotate(-10 ${WINDOW_WIDTH - 2} 190)`}
          />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: twinkleOpacity,
            transform: [{ translateX: baseShiftX }, { translateY: baseShiftY }],
          },
        ]}
      >
        {AMBIENT_STARS.map((star, index) => (
          <View
            key={`star-${index}`}
            style={{
              position: 'absolute',
              left: star.x,
              top: star.y,
              width: star.size * 5,
              height: star.size * 5,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                position: 'absolute',
                width: star.size * 4.8,
                height: star.size * 4.8,
                borderRadius: star.size * 2.4,
                backgroundColor:
                  star.color === '#DCEBFF' || star.color === '#E6EEFF' || star.color === '#E4EEFF'
                    ? 'rgba(102, 188, 255, 0.12)'
                    : 'rgba(255, 214, 234, 0.09)',
              }}
            />
            <View
              style={{
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                backgroundColor: star.color,
              }}
            />
          </View>
        ))}
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 180,
          left: -240,
          width: 240,
          height: 40,
          zIndex: 4,
          opacity: meteorAOpacity,
          transform: [
            { translateX: meteorAX },
            { translateY: meteorAY },
            { rotate: '18deg' },
          ],
        }}
      >
        <ShootingStar idPrefix="meteor-a" />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 320,
          left: WINDOW_WIDTH + 12,
          width: 240,
          height: 40,
          zIndex: 4,
          opacity: meteorBOpacity,
          transform: [
            { translateX: meteorBX },
            { translateY: meteorBY },
            { rotate: '-16deg' },
          ],
        }}
      >
        <ShootingStar idPrefix="meteor-b" warm reverse />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 520,
          left: -230,
          width: 240,
          height: 40,
          zIndex: 4,
          opacity: meteorCOpacity,
          transform: [
            { translateX: meteorCX },
            { translateY: meteorCY },
            { rotate: '16deg' },
          ],
        }}
      >
        <ShootingStar idPrefix="meteor-c" warm />
      </Animated.View>
    </View>
  );
});

const FixedQuinnHeader = React.memo(function FixedQuinnHeader() {
  const aura = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(aura, {
          toValue: 1,
          duration: 7600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(aura, {
          toValue: 0,
          duration: 7600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 9800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 9800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    auraLoop.start();
    driftLoop.start();

    return () => {
      auraLoop.stop();
      driftLoop.stop();
    };
  }, [aura, drift]);

  const auraOpacity = aura.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.38],
  });

  const auraScale = aura.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const shimmerOpacity = aura.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.22],
  });

  const titleLift = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  const introLift = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  const titleDriftX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-3, 4],
  });

  const sparkleFloat = aura.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const badgeRotate = drift.interpolate({
    inputRange: [0, 1],
    outputRange: ['-7deg', '-2deg'],
  });

  const titleScale = aura.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.018],
  });

  return (
    <View pointerEvents="none" style={styles.fixedHeaderShell}>
      <View style={styles.headerPanel}>
        <View style={styles.headerPanelGlow} />
        <View style={styles.headerPanelWarmGlow} />
        <View style={styles.headerPanelCoreBloom} />
        <View style={styles.headerPanelRingPrimary} />
        <View style={styles.headerPanelRingSecondary} />
        <View style={styles.headerPanelTailArc} />
        <View style={styles.headerPanelSheen} />

        <Animated.View
          style={[
            styles.headerAuraLarge,
            {
              opacity: auraOpacity,
              transform: [{ scale: auraScale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.headerAuraSmall,
            {
              opacity: shimmerOpacity,
              transform: [{ translateX: titleDriftX }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.headerNebulaRing,
            {
              opacity: shimmerOpacity,
              transform: [{ translateX: titleDriftX }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.headerSparkle,
            styles.headerSparkleOne,
            {
              opacity: shimmerOpacity,
              transform: [{ translateY: sparkleFloat }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.headerSparkle,
            styles.headerSparkleTwo,
            {
              opacity: shimmerOpacity,
              transform: [{ translateY: titleLift }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.headerSparkle,
            styles.headerSparkleThree,
            {
              opacity: shimmerOpacity,
              transform: [{ translateY: sparkleFloat }, { translateX: titleDriftX }],
            },
          ]}
        />

        <View style={styles.headerOverlineRow}>
          <View style={styles.headerOverlineDot} />
          <Text style={styles.headerOverline}>MAIN PORTAL</Text>
        </View>

        <Animated.View
          style={[
            styles.heroTitleWrap,
            {
              transform: [
                { translateY: titleLift },
                { translateX: titleDriftX },
                { scale: titleScale },
              ],
            },
          ]}
        >
          <View style={styles.titleGlowBlobA} />
          <View style={styles.titleGlowBlobB} />

          <Text style={styles.headerQuinnGlow}>Quinn</Text>

          <View style={styles.headerTitleRow}>
            <Text style={styles.headerQuinn}>
              <Text style={styles.headerQuinnQ}>Q</Text>
              <Text style={styles.headerQuinnRest}>uinn</Text>
            </Text>

            <Animated.View
              style={[
                styles.headerVersionCapsule,
                {
                  transform: [{ rotate: badgeRotate }],
                },
              ]}
            >
              <View style={styles.headerVersionShine} />
              <Text style={styles.headerVersionText}>2.0</Text>
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.fixedIntroText,
            {
              transform: [{ translateY: introLift }],
            },
          ]}
        >
          When the real Quinn is too busy painting or crying over a man who didn&apos;t
          deserve her, Quinn 2.0 can tell you what she&apos;d say in the meantime.
        </Animated.Text>
      </View>
    </View>
  );
});

const SafeArea = (SafeAreaContext as any)?.SafeAreaView || RNSafeAreaView;

const HomeTileGrid = resolveScreen(HomeTileGridModule, 'HomeTileGrid');
const MemoryPanel = resolveScreen(MemoryPanelModule, 'MemoryPanel');
const ExportsPanel = resolveScreen(ExportsPanelModule, 'ExportsPanel');
const NotificationsPanel = resolveScreen(NotificationsPanelModule, 'NotificationsPanel');
const ControlCenter = resolveScreen(ControlCenterModule, 'ControlCenter');
const AppSwitcher = resolveScreen(AppSwitcherModule, 'AppSwitcher');
const VoiceMode = resolveScreen(VoiceModeModule, 'VoiceMode');

type QuinnConversationSurfaceProps = {
  packetTitle: string;
  packetText: string;
  responsePacketTitle: string;
  responsePacketText: string;
  responseLensId: QuinnLensId;
  writtenResult: string;
  compressedSummary: string;
  memoryResonance: MemoryResonanceItem[];
  sessionArc: SessionArc | null;
  isRunning: boolean;
  activeLensId: QuinnLensId;
  isStagingNextMove: boolean;
  runError: string;
  onTriggerWave: () => void;
  onChangePacketText: (value: string) => void;
  onSelectLens: (lensId: QuinnLensId) => void;
  onStageNextMove: () => Promise<void>;
  onStartFreshArc: () => void;
  onRunPacket: (override?: {
    packetTitle: string;
    packetText: string;
    lensId?: QuinnLensId;
    stayOnScreen?: boolean;
    syncVisibleInput?: boolean;
    sessionArc?: SessionArc | null;
  }) => Promise<QuinnRunResult | null>;
};

function QuinnConversationSurface({
  packetTitle,
  packetText,
  responsePacketTitle,
  responsePacketText,
  responseLensId,
  writtenResult,
  compressedSummary,
  memoryResonance,
  sessionArc,
  isRunning,
  activeLensId,
  isStagingNextMove,
  runError,
  onTriggerWave,
  onChangePacketText,
  onSelectLens,
  onStageNextMove,
  onStartFreshArc,
  onRunPacket,
}: QuinnConversationSurfaceProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);

  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [, setPermissionState] = useState('Unknown');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [, setQuinnVoiceReachable] = useState<boolean | null>(null);
  const [, setIsCheckingQuinnVoice] = useState(false);
  const [isPreparingQuinnVoice, setIsPreparingQuinnVoice] = useState(false);
  const [isSpeakingResponse, setIsSpeakingResponse] = useState(false);
  const [playbackSource, setPlaybackSource] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [showResponseDetails, setShowResponseDetails] = useState(false);
  const [showThreadDetails, setShowThreadDetails] = useState(false);

  const speechChunksRef = useRef<string[]>([]);
  const speechActiveChunkIndexRef = useRef(-1);
  const speechSessionRef = useRef(0);
  const warmedChunkKeysRef = useRef(new Set<string>());
  const preparedSpeechSourcesRef = useRef(new Map<string, string>());
  const preparedSpeechSourcePromisesRef = useRef(new Map<string, Promise<string>>());
  const readySpeechSourceKeysRef = useRef(new Set<string>());
  const speechProsodyHintRef = useRef<QuinnVoiceTtsHint | null>(null);
  const speechAdvanceInFlightRef = useRef(false);
  const awaitingSpeechFinishRef = useRef(false);
  const awaitingSpeechFinishSessionRef = useRef(0);
  const awaitingSpeechFinishChunkIndexRef = useRef(-1);
  const speechPlaybackStartedAtRef = useRef(0);

  const player = useAudioPlayer(playbackSource, {
    updateInterval: 40,
    downloadFirst: true,
  });
  const playerStatus = useAudioPlayerStatus(player);

  const trimmedInput = String(packetText || '').trim();
  const canSend = trimmedInput.length > 0 && !isRunning;
  const activeLens = getQuinnLens(activeLensId);
  const responseLens = getQuinnLens(responseLensId);
  const sessionArcMeta = buildSessionArcMeta(sessionArc);
  const displayThreadTitle = derivePacketTitle({
    packetTitle: responsePacketTitle,
    packetText: responsePacketText,
    lensLabel: responseLens.label,
    sessionArcTitle: sessionArc?.title || '',
  });
  const showThreadTitle =
    !sessionArc || displayThreadTitle.toLowerCase() !== String(sessionArc.title || '').toLowerCase();
  const responseContextItems = [
    {
      label: 'Lens',
      value: responseLens.label,
    },
    {
      label: 'Carryover',
      value: sessionArc
        ? `${sessionArc.title}${sessionArcMeta.stepLabel ? ` • ${sessionArcMeta.stepLabel}` : ''}`
        : 'Fresh thread',
    },
    {
      label: 'Memory pull',
      value: memoryResonance.length
        ? `${memoryResonance.length} signal${memoryResonance.length === 1 ? '' : 's'} shaping this reply`
        : 'No extra pull needed',
    },
  ];
  const responseMetaLine = `${responseLens.label} lens • ${sessionArc ? 'Carrying thread' : 'Fresh thread'}`;
  const hasResponseDetails = Boolean(writtenResult) && memoryResonance.length + responseContextItems.length > 0;
  const hasThreadDetails = Boolean(sessionArc && sessionArcMeta.beats.length);
  const voicePlaybackActive = isPreparingQuinnVoice || isSpeakingResponse;
  const {
    composerLift,
    responseLift,
    composerGlowOpacity,
    responseGlowOpacity,
    dockGlowOpacity,
    focusGlowOpacity,
    focusScale,
    composerOverlayTranslate,
    replayScale,
    replayGlowOpacity,
    orbShiftX,
    orbShiftY,
    sparkleDriftX,
    sparkleDriftY,
    sparkleOpacity,
    sheenTranslateA,
    sheenTranslateB,
    sheenRise,
    sheenOpacity,
    sheenCoreOpacity,
    responseCardOpacity,
    responseCardTranslate,
  } = useQuinnConversationMotion({
    inputFocused,
    isRecording: recorderState.isRecording,
    voicePlaybackActive,
    writtenResult,
  });

  useEffect(() => {
    setShowResponseDetails(false);
  }, [writtenResult]);

  useEffect(() => {
    let isActive = true;

    async function checkVoice() {
      const ok = await pingQuinnLocalVoice();

      if (isActive) {
        setQuinnVoiceReachable(ok);
      }
    }

    checkVoice();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    setShowThreadDetails(false);
  }, [sessionArc?.id]);

  // Speech playback is index-driven so finish handling never depends on destructive
  // queue mutation during active playback.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!playerStatus.didJustFinish) {
      return;
    }

    if (!awaitingSpeechFinishRef.current) {
      return;
    }

    const armedSessionId = awaitingSpeechFinishSessionRef.current;
    const armedChunkIndex = awaitingSpeechFinishChunkIndexRef.current;

    if (
      armedSessionId !== speechSessionRef.current ||
      armedChunkIndex < 0 ||
      armedChunkIndex !== speechActiveChunkIndexRef.current
    ) {
      return;
    }

    const elapsedSinceChunkStart = Date.now() - speechPlaybackStartedAtRef.current;

    if (elapsedSinceChunkStart < 300) {
      return;
    }

    const duration = Number(playerStatus.duration || 0);
    const currentTime = Number(playerStatus.currentTime || 0);
    const currentChunkReachedEnd =
      duration > 0.25 &&
      currentTime >= Math.max(0, duration - 0.18);

    if (!currentChunkReachedEnd) {
      return;
    }

    awaitingSpeechFinishRef.current = false;
    awaitingSpeechFinishSessionRef.current = 0;
    awaitingSpeechFinishChunkIndexRef.current = -1;
    speechPlaybackStartedAtRef.current = 0;

    const sessionId = armedSessionId;
    const nextIndex = armedChunkIndex + 1;

    if (nextIndex < speechChunksRef.current.length) {
      void playSpeechChunkAtIndex(sessionId, nextIndex);
      return;
    }

    speechActiveChunkIndexRef.current = -1;
    setIsPreparingQuinnVoice(false);
    setIsSpeakingResponse(false);
    setVoiceStatus('Audio finished.');
  }, [playerStatus.didJustFinish]);
  /* eslint-enable react-hooks/exhaustive-deps */

  function clearSpeechQueue() {
    speechChunksRef.current = [];
    speechActiveChunkIndexRef.current = -1;
    speechSessionRef.current += 1;
    speechAdvanceInFlightRef.current = false;
    awaitingSpeechFinishRef.current = false;
    awaitingSpeechFinishSessionRef.current = 0;
    awaitingSpeechFinishChunkIndexRef.current = -1;
    speechPlaybackStartedAtRef.current = 0;
    warmedChunkKeysRef.current.clear();
    preparedSpeechSourcesRef.current.clear();
    preparedSpeechSourcePromisesRef.current.clear();
    readySpeechSourceKeysRef.current.clear();
    speechProsodyHintRef.current = null;
  }

  const prepareSpeechPlaybackSource = useCallback(
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
      },
      sessionId: number
    ) => {
      const activeProsodyHint = prosodyHint ?? speechProsodyHintRef.current;
      const requestKey = getQuinnLocalVoiceSpeakRequestKey(text, {
        previousText,
        nextText,
        prosodyHint: activeProsodyHint,
      });
      const cachedSource = preparedSpeechSourcesRef.current.get(requestKey);

      if (cachedSource) {
        return {
          requestKey,
          playbackSource: cachedSource,
        };
      }

      const existingPromise = preparedSpeechSourcePromisesRef.current.get(requestKey);

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

        if (sessionId === speechSessionRef.current) {
          preparedSpeechSourcesRef.current.set(requestKey, playbackSource);
        }

        return playbackSource;
      })();

      preparedSpeechSourcePromisesRef.current.set(requestKey, preparePromise);

      try {
        return {
          requestKey,
          playbackSource: await preparePromise,
        };
      } finally {
        const activePromise = preparedSpeechSourcePromisesRef.current.get(requestKey);

        if (activePromise === preparePromise) {
          preparedSpeechSourcePromisesRef.current.delete(requestKey);
        }
      }
    },
    []
  );

  const warmSpeechChunk = useCallback(
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
      },
      sessionId: number
    ) => {
      if (!text || sessionId !== speechSessionRef.current) {
        return;
      }

      const requestKey = getQuinnLocalVoiceSpeakRequestKey(text, {
        previousText,
        nextText,
        prosodyHint: prosodyHint ?? speechProsodyHintRef.current,
      });

      if (warmedChunkKeysRef.current.has(requestKey)) {
        return;
      }

      warmedChunkKeysRef.current.add(requestKey);

      try {
        const { playbackSource } = await prepareSpeechPlaybackSource(
          text,
          {
            previousText,
            nextText,
            prosodyHint,
          },
          sessionId
        );

        if (sessionId !== speechSessionRef.current) {
          warmedChunkKeysRef.current.delete(requestKey);
          preparedSpeechSourcesRef.current.delete(requestKey);
          readySpeechSourceKeysRef.current.delete(requestKey);
          return;
        }

        if (isQuinnLocalVoiceRemoteSource(playbackSource)) {
          await fetch(playbackSource);
        }

        if (sessionId === speechSessionRef.current) {
          readySpeechSourceKeysRef.current.add(requestKey);
        }
      } catch {
        warmedChunkKeysRef.current.delete(requestKey);
        readySpeechSourceKeysRef.current.delete(requestKey);
      }
    },
    [prepareSpeechPlaybackSource]
  );

  const warmUpcomingSpeechChunks = useCallback(
    async (sessionId: number, count = 3, fromIndex?: number) => {
      if (sessionId !== speechSessionRef.current) {
        return;
      }

      const startIndex =
        typeof fromIndex === 'number'
          ? Math.max(0, fromIndex)
          : Math.max(0, speechActiveChunkIndexRef.current + 1);

      const upcomingChunks = speechChunksRef.current.slice(startIndex, startIndex + count);

      await Promise.all(
        upcomingChunks.map((chunk, offset) =>
          warmSpeechChunk(
            chunk,
            {
              previousText: speechChunksRef.current[startIndex + offset - 1] || '',
              nextText: speechChunksRef.current[startIndex + offset + 1] || '',
            },
            sessionId
          )
        )
      );
    },
    [warmSpeechChunk]
  );

  const playSpeechChunkAtIndex = useCallback(
    async (sessionId: number, chunkIndex: number) => {
      if (sessionId !== speechSessionRef.current || speechAdvanceInFlightRef.current) {
        return false;
      }

      speechAdvanceInFlightRef.current = true;

      try {
        if (sessionId !== speechSessionRef.current) {
          return false;
        }

        const chunks = speechChunksRef.current;
        const nextChunk = chunks[chunkIndex];

        if (!nextChunk) {
          speechActiveChunkIndexRef.current = -1;
          awaitingSpeechFinishRef.current = false;
          awaitingSpeechFinishSessionRef.current = 0;
          awaitingSpeechFinishChunkIndexRef.current = -1;
          speechPlaybackStartedAtRef.current = 0;
          setIsPreparingQuinnVoice(false);
          setIsSpeakingResponse(false);
          setVoiceStatus('Audio finished.');
          return false;
        }

        const currentPart = chunkIndex + 1;
        const totalParts = chunks.length;
        const previousText = chunks[chunkIndex - 1] || '';
        const nextText = chunks[chunkIndex + 1] || '';
        const requestKey = getQuinnLocalVoiceSpeakRequestKey(nextChunk, {
          previousText,
          nextText,
          prosodyHint: speechProsodyHintRef.current,
        });
        const wasWarmSource =
          readySpeechSourceKeysRef.current.has(requestKey) ||
          !isQuinnLocalVoiceRemoteSource(preparedSpeechSourcesRef.current.get(requestKey) || '');
        const { playbackSource } = await prepareSpeechPlaybackSource(
          nextChunk,
          {
            previousText,
            nextText,
            prosodyHint: speechProsodyHintRef.current,
          },
          sessionId
        );
        const playbackDelayMs = getQuinnVoicePlaybackStartDelayMs(playbackSource, {
          isFirstChunk: currentPart === 1,
          isWarmSource:
            wasWarmSource ||
            (!isQuinnLocalVoiceRemoteSource(playbackSource) &&
              preparedSpeechSourcesRef.current.has(requestKey)),
        });

        setVoiceStatus(
          totalParts > 1
            ? `Quinn voice ${currentPart}/${totalParts}...`
            : 'Quinn voice playing now.'
        );

        // Ignore any stale finish signal while we are swapping the player source.
        awaitingSpeechFinishRef.current = false;
        awaitingSpeechFinishSessionRef.current = 0;
        awaitingSpeechFinishChunkIndexRef.current = -1;
        speechPlaybackStartedAtRef.current = 0;

        if (sessionId !== speechSessionRef.current) {
          return false;
        }

        void warmUpcomingSpeechChunks(sessionId, 2, chunkIndex + 1);
        player.replace(playbackSource);

        if (playbackDelayMs > 0) {
          await wait(playbackDelayMs);
        }

        if (sessionId !== speechSessionRef.current) {
          return false;
        }

        if (speechChunksRef.current[chunkIndex] !== nextChunk) {
          return false;
        }

        speechActiveChunkIndexRef.current = chunkIndex;
        player.play();
        awaitingSpeechFinishSessionRef.current = sessionId;
        awaitingSpeechFinishChunkIndexRef.current = chunkIndex;
        speechPlaybackStartedAtRef.current = Date.now();
        awaitingSpeechFinishRef.current = true;
        setIsPreparingQuinnVoice(false);
        setIsSpeakingResponse(true);
        return true;
      } catch (error) {
        clearSpeechQueue();
        const message =
          error instanceof Error ? error.message : 'Quinn voice playback failed.';
        setVoiceError(message);
        setVoiceStatus(message);
        setIsPreparingQuinnVoice(false);
        setIsSpeakingResponse(false);
        return false;
      } finally {
        speechAdvanceInFlightRef.current = false;
      }
    },
    [player, prepareSpeechPlaybackSource, warmUpcomingSpeechChunks]
  );

  const tryPlaySingleReplySpeech = useCallback(
    async (clean: string, prosodyHint: QuinnVoiceTtsHint | null) => {
      const policy = getSingleReplySpeechPolicy(clean);

      if (!policy.shouldAttemptSingleFile) {
        return false;
      }

      speechChunksRef.current = [clean];
      speechActiveChunkIndexRef.current = -1;
      speechSessionRef.current += 1;
      speechProsodyHintRef.current = prosodyHint;

      const sessionId = speechSessionRef.current;

      setVoiceStatus('Quinn voice loading full reply...');
      const timeoutMessage = 'Full reply voice preparation timed out.';
      const prepareFullReplySource = () =>
        prepareSpeechPlaybackSource(
          clean,
          {
            previousText: '',
            nextText: '',
            prosodyHint,
          },
          sessionId
        );

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

          setVoiceStatus('Quinn voice still loading full reply...');
          await withTimeout(
            prepareFullReplySource(),
            policy.gracePrepareTimeoutMs,
            timeoutMessage
          );
        }

        if (sessionId !== speechSessionRef.current) {
          return true;
        }

        const started = await playSpeechChunkAtIndex(sessionId, 0);

        if (started) {
          return true;
        }
      } catch {}

      if (sessionId === speechSessionRef.current) {
        clearSpeechQueue();
        player.pause();
      }

      return false;
    },
    [player, playSpeechChunkAtIndex, prepareSpeechPlaybackSource]
  );

  async function interruptQuinnPlayback() {
    await stopSystemVoicePreview();
    clearSpeechQueue();
    player.pause();
    setPlaybackSource(null);
    setIsPreparingQuinnVoice(false);
    setIsSpeakingResponse(false);
  }

  async function preparePlaybackMode() {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      interruptionMode: 'doNotMix',
      shouldPlayInBackground: false,
    });
  }

  async function handleCheckQuinnVoice(showStatus = true) {
    try {
      setIsCheckingQuinnVoice(true);

      const ok = await pingQuinnLocalVoice();
      setQuinnVoiceReachable(ok);

      if (showStatus) {
        setVoiceStatus(
          ok
            ? 'Quinn voice is reachable.'
            : `Quinn voice is not reachable at ${getQuinnLocalVoiceBaseUrl()}.`
        );
      }

      return ok;
    } catch {
      setQuinnVoiceReachable(false);

      if (showStatus) {
        setVoiceStatus(`Quinn voice is not reachable at ${getQuinnLocalVoiceBaseUrl()}.`);
      }

      return false;
    } finally {
      setIsCheckingQuinnVoice(false);
    }
  }

  async function handleStartRecording() {
    try {
      const granted = await ensureMicrophonePermission();

      if (!granted) {
        setPermissionState('Denied');
        setVoiceError('Microphone permission is required to record.');
        setVoiceStatus('Microphone permission is required to record.');
        return;
      }

      await interruptQuinnPlayback();

      setPermissionState('Granted');
      setVoiceError(null);
      setVoiceStatus('Recording live.');
      setRecordingUri(null);
      setRecordingDuration(0);

      await enableRecordingAudioMode();
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Recording failed to start.';
      setVoiceError(message);
      setVoiceStatus(message);
    }
  }

  async function handleSpeakQuinnText(text: string) {
  const voicePlan = prepareQuinnVoiceSpeech({
    text,
    stateSeedText: responsePacketText || packetText || text,
    sessionArc,
    lensMode: getQuinnLens(responseLensId).mode,
  });
  const clean = voicePlan.clean;

  if (!clean) {
    setVoiceStatus('Run Quinn first so there is something to speak.');
    return;
  }

  try {
    setVoiceError(null);
    setIsPreparingQuinnVoice(true);
    setIsSpeakingResponse(false);

    await stopSystemVoicePreview();
    clearSpeechQueue();
    player.pause();

    const ok = await handleCheckQuinnVoice(false);

    if (!ok) {
      const message = `Quinn voice is not reachable at ${getQuinnLocalVoiceBaseUrl()}.`;
      setVoiceError(message);
      setVoiceStatus(message);
      setIsPreparingQuinnVoice(false);
      return;
    }

    await preparePlaybackMode();

    if (await tryPlaySingleReplySpeech(clean, voicePlan.ttsHint)) {
      return;
    }

    setVoiceError(null);
    setIsPreparingQuinnVoice(true);
    setIsSpeakingResponse(false);

    const chunks = voicePlan.chunks;

    if (!chunks.length) {
      setVoiceStatus('Run Quinn first so there is something to speak.');
      setIsPreparingQuinnVoice(false);
      return;
    }

    speechChunksRef.current = [...chunks];
    speechActiveChunkIndexRef.current = -1;
    speechSessionRef.current += 1;
    speechProsodyHintRef.current = voicePlan.ttsHint;

    const sessionId = speechSessionRef.current;

    setVoiceStatus(
      chunks.length > 1
        ? `Quinn voice warming up 1/${chunks.length}...`
        : 'Quinn voice requested. Using buffered playback.'
    );

    if (chunks.length > 1) {
      void warmUpcomingSpeechChunks(sessionId, 2, 1);
    }

    await playSpeechChunkAtIndex(sessionId, 0);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Quinn voice playback failed.';
    setVoiceError(message);
    setVoiceStatus(message);
    setIsPreparingQuinnVoice(false);
    setIsSpeakingResponse(false);
  }
}

  async function handleProcessRecordedTake(finalUri: string, duration: number) {
    try {
      setVoiceError(null);
      setVoiceStatus('Transcribing take in background...');

      const result = await transcribeAudioFile({
        audioUri: finalUri,
        durationMillis: duration,
        packetTitle,
        packetText,
        lastSummary: compressedSummary,
      });

      const transcript = String(result.transcript || '').trim();

      if (!transcript) {
        setVoiceStatus('Transcript came back empty.');
        return;
      }

      setVoiceStatus('Transcript ready. Sending to Quinn...');

      const runResult = await onRunPacket({
        packetTitle: packetTitle || 'Quinn Thread',
        packetText: transcript,
        stayOnScreen: true,
        syncVisibleInput: false,
      });

      const speakText = String(runResult?.written || '').trim();

      if (speakText) {
        setVoiceStatus('Quinn answered. Speaking now...');
        await handleSpeakQuinnText(speakText);
      } else {
        setVoiceStatus('Voice input sent to Quinn.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Voice send failed.';
      setVoiceError(message);
      setVoiceStatus(message);
    }
  }

  async function handleStopRecording() {
    try {
      const duration = recorderState.durationMillis || 0;

      await recorder.stop();
      await disableRecordingAudioMode();

      const rawUri = recorder.uri || null;

      if (!rawUri) {
        setVoiceError('Recording stopped, but no audio file was returned.');
        setVoiceStatus('Recording stopped, but no audio file was returned.');
        return;
      }

      const finalUri = (await persistRecordingToDocument(rawUri)) || rawUri;

      setRecordingUri(finalUri);
      setRecordingDuration(duration);
      setPlaybackSource(finalUri);
      setVoiceStatus('Take saved. Sending to Quinn...');
      onTriggerWave();

      await handleProcessRecordedTake(finalUri, duration);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Recording failed to stop cleanly.';
      setVoiceError(message);
      setVoiceStatus(message);
    }
  }

  async function handleRunTypedQuinn() {
    if (!trimmedInput) {
      return;
    }

    await interruptQuinnPlayback();
    onTriggerWave();

    const runResult = await onRunPacket({
      packetTitle: packetTitle || 'Quinn Thread',
      packetText,
      stayOnScreen: true,
      syncVisibleInput: true,
    });

    if (runResult) {
      onChangePacketText('');
    }

    const speakText = String(runResult?.written || '').trim();

    if (speakText) {
      setVoiceStatus('Quinn answered. Speaking now...');
      await handleSpeakQuinnText(speakText);
    }
  }

  async function handleSpeakQuinn() {
    const clean = String(writtenResult || '').trim();
    await handleSpeakQuinnText(clean);
  }

  return (
    <ScrollView
  style={styles.quinnConversationViewport}
  contentContainerStyle={styles.quinnConversationScroll}
  showsVerticalScrollIndicator={false}
  scrollEventThrottle={16}
>
      <View style={styles.conversationStageShell}>
        <View pointerEvents="none" style={styles.conversationStageVeil} />
        <View pointerEvents="none" style={styles.conversationStageGlowPrimary} />
        <View pointerEvents="none" style={styles.conversationStageGlowSecondary} />
        <View pointerEvents="none" style={styles.conversationStageGlowWarm} />
        <View pointerEvents="none" style={styles.conversationStageRingPrimary} />
        <View pointerEvents="none" style={styles.conversationStageRingSecondary} />
        <View pointerEvents="none" style={styles.conversationStageTailArc} />
        <View pointerEvents="none" style={styles.conversationStageSheen} />

        <Animated.View
          style={[
            styles.cardFloatWrap,
            {
              transform: [{ translateY: composerLift }],
            },
          ]}
        >
          <View style={styles.commandStage}>
            <Animated.View
              style={[
                styles.composerShell,
                {
                  transform: [{ scale: focusScale }],
                },
              ]}
            >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cardOrbGlowCool,
              {
                opacity: composerGlowOpacity,
                transform: [{ translateX: orbShiftX }, { translateY: orbShiftY }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cardOrbGlowPurple,
              {
                opacity: composerGlowOpacity,
                transform: [{ translateX: sparkleDriftX }, { translateY: orbShiftY }],
              },
            ]}
          />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.focusAura,
                {
                  opacity: focusGlowOpacity,
                  transform: [{ translateX: sparkleDriftX }, { translateY: sparkleDriftY }],
                },
              ]}
            />
            <View pointerEvents="none" style={styles.cardTopSheen} />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.cardTopSheenSoft,
                {
                  transform: [{ translateX: sheenTranslateA }],
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.cardSideShine,
                {
                  transform: [{ translateX: orbShiftX }, { translateY: sparkleDriftY }],
                },
              ]}
            />
            <View pointerEvents="none" style={styles.cardOrbitArcPrimary} />
            <View pointerEvents="none" style={styles.cardOrbitArcSecondary} />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.cardGlitterSweep,
                {
                  opacity: sheenOpacity,
                  transform: [
                    { translateX: sheenTranslateA },
                    { translateY: sheenRise },
                    { rotate: '-18deg' },
                  ],
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.cardGlitterSweepCore,
                {
                  opacity: sheenCoreOpacity,
                  transform: [
                    { translateX: sheenTranslateA },
                    { translateY: sheenRise },
                    { rotate: '-18deg' },
                  ],
                },
              ]}
            />
            <View pointerEvents="none" style={styles.cardBottomFog} />

            <Animated.View
              pointerEvents="none"
              style={[
                styles.sparkleLayer,
                {
                  opacity: sparkleOpacity,
                  transform: [{ translateX: sparkleDriftX }, { translateY: sparkleDriftY }],
                },
              ]}
            >
              <View style={[styles.sparkle, styles.sparkleOne]} />
              <View style={[styles.sparkle, styles.sparkleTwo]} />
              <View style={[styles.sparkle, styles.sparkleThree]} />
              <View style={[styles.sparkle, styles.sparkleFour]} />
              <View style={[styles.sparkle, styles.sparkleFive]} />
              <View style={[styles.sparkle, styles.sparkleSix]} />
              <View style={[styles.sparkle, styles.sparkleSeven]} />
              <View style={[styles.sparkle, styles.sparkleEight]} />
            </Animated.View>

            <View style={styles.composerInnerShell}>
              {recorderState.isRecording ? (
                <>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.listeningSweep,
                      {
                        transform: [{ translateX: composerOverlayTranslate }],
                      },
                    ]}
                  />
                  <View style={styles.listeningChip}>
                    <View style={styles.listeningDot} />
                    <Text style={styles.listeningChipText}>Listening</Text>
                  </View>
                </>
              ) : null}

              {showThreadTitle ? (
                <View style={styles.threadTitleWrap}>
                  <Text style={styles.threadTitleEyebrow}>Current thread</Text>
                  <Text style={styles.threadTitleText} numberOfLines={1}>
                    {displayThreadTitle}
                  </Text>
                </View>
              ) : null}

              <View style={styles.lensRailWrap}>
                <Text style={styles.lensEyebrow}>Response lens</Text>
                <View style={styles.lensRail}>
                  {QUINN_LENSES.map((lens) => {
                    const selected = lens.id === activeLensId;

                    return (
                      <Pressable
                        key={lens.id}
                        style={[styles.lensChip, selected && styles.lensChipActive]}
                        onPress={() => onSelectLens(lens.id)}
                      >
                        <Text style={[styles.lensChipText, selected && styles.lensChipTextActive]}>
                          {lens.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.lensBlurb}>{activeLens.blurb}</Text>
              </View>

              {sessionArc ? (
                <View style={styles.threadManagerRail}>
                  <View style={styles.threadManagerRow}>
                    <View style={styles.threadManagerCopy}>
                      <Text style={styles.threadManagerEyebrow}>Thread</Text>
                      <Text style={styles.threadManagerTitle} numberOfLines={1}>
                        {sessionArc.title}
                      </Text>
                      <Text style={styles.threadManagerMeta}>
                        {sessionArcMeta.stepLabel}
                        {sessionArcMeta.continuityLabel
                          ? ` • ${sessionArcMeta.continuityLabel}`
                          : ''}
                      </Text>
                    </View>

                    <View style={styles.threadManagerActions}>
                      {hasThreadDetails ? (
                        <Pressable
                          style={styles.threadManagerActionChip}
                          onPress={() => setShowThreadDetails((prev) => !prev)}
                        >
                          <Text style={styles.threadManagerActionChipText}>
                            {showThreadDetails ? 'Hide details' : 'Details'}
                          </Text>
                          <Feather
                            name={showThreadDetails ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color="rgba(235, 240, 255, 0.72)"
                          />
                        </Pressable>
                      ) : null}

                      <Pressable style={styles.threadManagerResetChip} onPress={onStartFreshArc}>
                        <Text style={styles.threadManagerResetChipText}>New thread</Text>
                      </Pressable>
                    </View>
                  </View>

                  {showThreadDetails && hasThreadDetails ? (
                    <View style={styles.threadManagerDetails}>
                      <View style={styles.sessionArcBeatRow}>
                      {sessionArcMeta.beats.map((beat) => (
                        <View key={beat.id} style={styles.sessionArcBeat}>
                          <Text style={styles.sessionArcBeatLabel}>{beat.lensLabel}</Text>
                          <Text style={styles.sessionArcBeatText} numberOfLines={2}>
                            {beat.summary}
                          </Text>
                        </View>
                      ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.composerFieldShell}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.composerActionDockGlow,
                    {
                      opacity: dockGlowOpacity,
                    },
                  ]}
                />

                <View style={styles.composerFieldRow}>
                  <TextInput
                    multiline
                    value={packetText}
                    onChangeText={onChangePacketText}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Type what's actually going on..."
                    placeholderTextColor="rgba(232, 220, 236, 0.32)"
                    style={styles.composerInput}
                    textAlignVertical="top"
                  />

                  <View style={styles.composerActionDock}>
                    <View style={styles.composerActions}>
                      <Pressable
                        style={[
                          styles.inlineIconButton,
                          styles.inlineHeartButton,
                          !canSend && styles.inlineHeartButtonDisabled,
                        ]}
                        onPress={handleRunTypedQuinn}
                        disabled={!canSend}
                      >
                        {isRunning ? (
                          <Text style={styles.inlineLoadingIcon}>…</Text>
                        ) : (
                          <Feather
                            name="send"
                            size={16}
                            color={canSend ? '#FBFCFF' : 'rgba(251,252,255,0.40)'}
                          />
                        )}
                      </Pressable>

                      {!recorderState.isRecording ? (
                        <Pressable
                          style={[styles.inlineIconButton, styles.inlineMicButton]}
                          onPress={handleStartRecording}
                        >
                          <Feather name="mic" size={16} color="#FBFCFF" />
                        </Pressable>
                      ) : (
                        <Pressable
                          style={[styles.inlineIconButton, styles.inlineMicButtonActive]}
                          onPress={handleStopRecording}
                        >
                          <Feather name="square" size={15} color="#FBFCFF" />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {recordingUri ? (
            <Text style={styles.inlineTakeStatus}>
              Voice take attached • {formatDurationMillis(recordingDuration)}
            </Text>
          ) : null}

          {runError ? <Text style={styles.errorText}>Run error: {runError}</Text> : null}
          {voiceError ? <Text style={styles.errorText}>Voice error: {voiceError}</Text> : null}
          {voiceStatus ? <Text style={styles.helperText}>{voiceStatus}</Text> : null}
        </View>
      </Animated.View>

        <Animated.View
          style={[
            styles.cardFloatWrap,
            {
              opacity: responseCardOpacity,
              transform: [
                { translateY: responseCardTranslate },
                { translateY: responseLift },
              ],
            },
          ]}
        >
          <View style={styles.heroResponseCard}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cardOrbGlowWarm,
              {
                opacity: responseGlowOpacity,
                transform: [{ translateX: orbShiftX }, { translateY: orbShiftY }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cardOrbGlowPurple,
              {
                opacity: responseGlowOpacity,
                transform: [{ translateX: sparkleDriftX }, { translateY: sparkleDriftY }],
              },
            ]}
          />
          <View pointerEvents="none" style={styles.cardTopSheen} />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cardTopSheenSoft,
              {
                transform: [{ translateX: sheenTranslateB }],
              },
            ]}
          />
          <View pointerEvents="none" style={styles.cardOrbitArcPrimary} />
          <View pointerEvents="none" style={styles.cardOrbitArcSecondary} />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cardGlitterSweepWarm,
              {
                opacity: sheenOpacity,
                transform: [
                  { translateX: sheenTranslateB },
                  { translateY: sheenRise },
                  { rotate: '-18deg' },
                ],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cardGlitterSweepCoreWarm,
              {
                opacity: sheenCoreOpacity,
                transform: [
                  { translateX: sheenTranslateB },
                  { translateY: sheenRise },
                  { rotate: '-18deg' },
                ],
              },
            ]}
          />

          <View style={styles.responseInnerFrame}>
            <View style={styles.responseHeaderRow}>
              <View style={styles.responseHeaderTextWrap}>
                <Text style={styles.responseLabel}>Quinn 2.0 reply</Text>
                <Text style={styles.responseMetaLine}>{responseMetaLine}</Text>
              </View>
              {hasResponseDetails ? (
                <Pressable
                  style={styles.responseDetailsToggle}
                  onPress={() => setShowResponseDetails((prev) => !prev)}
                >
                  <Text style={styles.responseDetailsToggleText}>
                    {showResponseDetails ? 'Hide details' : 'Details'}
                  </Text>
                  <Feather
                    name={showResponseDetails ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="rgba(227, 233, 248, 0.76)"
                  />
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.heroResponseBody}>
              {writtenResult ||
                'Ask something outrageous, practical, or heartbreak-adjacent and Quinn 2.0 will answer here.'}
            </Text>

            {showResponseDetails && hasResponseDetails ? (
              <View style={styles.responseDetailsPanel}>
                <Text style={styles.responseDetailsEyebrow}>Thread details</Text>
                {responseContextItems.map((item) => (
                  <View key={item.label} style={styles.responseDetailRow}>
                    <Text style={styles.responseDetailLabel}>{item.label}</Text>
                    <Text style={styles.responseDetailValue}>{item.value}</Text>
                  </View>
                ))}

                {memoryResonance.length ? (
                  <View style={styles.responseDetailsSection}>
                    <Text style={styles.memoryResonanceEyebrow}>Why this felt personal</Text>
                    <View style={styles.memoryResonanceRow}>
                      {memoryResonance.slice(0, 4).map((item, index) => (
                        <View
                          key={`${item.label}-${index}`}
                          style={styles.memoryResonanceChip}
                        >
                          <Text style={styles.memoryResonanceLabel}>{item.label}</Text>
                          <Text style={styles.memoryResonancePreview} numberOfLines={2}>
                            {item.preview}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.responseFooterRow}>
              <Pressable
                style={[
                  styles.responseActionChip,
                  (!writtenResult || isStagingNextMove || isRunning) &&
                    styles.responseActionChipDisabled,
                ]}
                onPress={() => {
                  void onStageNextMove();
                }}
                disabled={!writtenResult || isStagingNextMove || isRunning}
              >
                <Text
                  style={[
                    styles.responseActionChipText,
                    (!writtenResult || isStagingNextMove || isRunning) &&
                      styles.responseActionChipTextDisabled,
                  ]}
                >
                  {isStagingNextMove
                    ? 'Staging next move...'
                    : isRunning
                      ? 'Run in progress...'
                      : 'Stage next move'}
                </Text>
              </Pressable>

              <View style={styles.responseFooterActions}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.replayGlow,
                    {
                      opacity: replayGlowOpacity,
                      transform: [{ scale: replayScale }],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.replayButtonWrap,
                    {
                      transform: [{ scale: replayScale }],
                    },
                  ]}
                >
                  <Pressable style={styles.responseReplayButton} onPress={handleSpeakQuinn}>
                    <Feather name="rotate-ccw" size={16} color="#F7F9FF" />
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          </View>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('QuinnConversation');
  const [packetTitle, setPacketTitle] = useState(INITIAL_PACKET_TITLE);
  const [packetText, setPacketText] = useState('');
  const [activeLensId, setActiveLensId] = useState<QuinnLensId>(DEFAULT_QUINN_LENS_ID);
  const [writtenResult, setWrittenResult] = useState('');
  const [compressedSummary, setCompressedSummary] = useState('');
  const [currentMemoryResonance, setCurrentMemoryResonance] = useState<MemoryResonanceItem[]>([]);
  const [currentSessionArc, setCurrentSessionArc] = useState<SessionArc | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isStagingNextMove, setIsStagingNextMove] = useState(false);
  const [runError, setRunError] = useState('');
  const [recentRuns, setRecentRuns] = useState<RunHistoryItem[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>(INITIAL_MEMORIES);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<QuinnSettings>(INITIAL_SETTINGS);
  const [voiceSessions, setVoiceSessions] = useState<VoiceSession[]>([]);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(INITIAL_VOICE_SETTINGS);
  const [waveKey, setWaveKey] = useState(0);
  const activeThreadIdRef = useRef(buildThreadContinuityId());
  const lastAssistantResponseRef = useRef<{ threadId: string; text: string } | null>(null);
  const lastNumberedOptionsRef = useRef<{
    threadId: string;
    options: NumberedOption[];
  } | null>(null);
  const activeRunTokenRef = useRef(0);
  const runInFlightRef = useRef(false);
  const activeStageTokenRef = useRef(0);

  function primeThreadContinuity(threadId: string, responseText: string) {
    const cleanResponse = String(responseText || '').trim();

    lastAssistantResponseRef.current = cleanResponse
      ? {
          threadId,
          text: cleanResponse,
        }
      : null;

    const numberedOptions = extractNumberedOptions(cleanResponse);
    lastNumberedOptionsRef.current = numberedOptions.length
      ? {
          threadId,
          options: numberedOptions,
        }
      : null;
  }

  function clearThreadContinuity({
    clearVisibleResponse = false,
    clearComposer = false,
    resetTitle = false,
  }: {
    clearVisibleResponse?: boolean;
    clearComposer?: boolean;
    resetTitle?: boolean;
  } = {}) {
    activeRunTokenRef.current += 1;
    runInFlightRef.current = false;
    activeStageTokenRef.current += 1;
    setIsRunning(false);
    setIsStagingNextMove(false);
    activeThreadIdRef.current = buildThreadContinuityId();
    lastAssistantResponseRef.current = null;
    lastNumberedOptionsRef.current = null;
    setCurrentSessionArc(null);
    setCurrentMemoryResonance([]);
    setCompressedSummary('');
    setRunError('');

    if (clearVisibleResponse) {
      setWrittenResult('');
    }

    if (resetTitle) {
      setPacketTitle(INITIAL_PACKET_TITLE);
    }

    if (clearComposer) {
      setPacketText('');
    }
  }

  useEffect(() => {
    let isActive = true;

    async function hydrateState() {
      const snapshot = await loadQuinnSnapshot();

      if (!isActive) {
        return;
      }

      if (snapshot) {
        const hydratedThreadId =
          String(snapshot.currentSessionArc?.id || '').trim() || buildThreadContinuityId();
        const hydratedWrittenResult = sanitizeQuinnVisibleReplyText(snapshot.writtenResult || '');
        const hydratedCompressedSummary =
          sanitizeQuinnVisibleReplyText(snapshot.compressedSummary || '') ||
          buildCompressionSummary(hydratedWrittenResult || snapshot.packetText || '');
        const hydratedRecentRuns = Array.isArray(snapshot.recentRuns)
          ? sanitizeRunHistoryItemsForDisplay(snapshot.recentRuns)
          : [];

        activeThreadIdRef.current = hydratedThreadId;
        primeThreadContinuity(hydratedThreadId, hydratedWrittenResult);
        setPacketTitle(snapshot.packetTitle || INITIAL_PACKET_TITLE);
        setPacketText('');
        setWrittenResult(hydratedWrittenResult);
        setCompressedSummary(hydratedCompressedSummary);
        setCurrentMemoryResonance(
          Array.isArray(snapshot.currentMemoryResonance) ? snapshot.currentMemoryResonance : []
        );
        setCurrentSessionArc(snapshot.currentSessionArc || null);
        setLastRunAt(snapshot.lastRunAt || null);
        setRecentRuns(hydratedRecentRuns);
        setMemories(
          Array.isArray(snapshot.memories) && snapshot.memories.length
            ? snapshot.memories
            : INITIAL_MEMORIES
        );
        setNotifications(Array.isArray(snapshot.notifications) ? snapshot.notifications : []);
        setSettings(snapshot.settings || INITIAL_SETTINGS);
        setVoiceSessions(Array.isArray(snapshot.voiceSessions) ? snapshot.voiceSessions : []);
        setVoiceSettings(snapshot.voiceSettings || INITIAL_VOICE_SETTINGS);
        setLastSavedAt(snapshot.savedAt || null);
      }

      setIsHydrated(true);
    }

    hydrateState();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    let isActive = true;

    async function persistState() {
      const savedAt = await saveQuinnSnapshot({
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
      });

      if (isActive && savedAt) {
        setLastSavedAt(savedAt);
      }
    }

    const persistTimeout = setTimeout(() => {
      void persistState();
    }, SNAPSHOT_PERSIST_DEBOUNCE_MS);

    return () => {
      isActive = false;
      clearTimeout(persistTimeout);
    };
  }, [
    isHydrated,
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
  ]);

  const exportBundle = useMemo(
    () =>
      buildExportBundle({
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
      }),
    [
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
    ]
  );

  function triggerWave() {
    setWaveKey((prev) => prev + 1);
  }

  function pushNotification(
    notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>
  ) {
    const next = createNotification(notification as {
      title: string;
      body: string;
      target: NotificationTarget;
      tone: NotificationTone;
    });
    setNotifications((prev) => prependNotification(prev, next));
  }

  async function handleRunPacket(
    override?: {
      packetTitle: string;
      packetText: string;
      lensId?: QuinnLensId;
      stayOnScreen?: boolean;
      syncVisibleInput?: boolean;
      sessionArc?: SessionArc | null;
    }
  ): Promise<QuinnRunResult | null> {
    if (runInFlightRef.current) {
      const message = 'Quinn is already running. Let the current run finish first.';
      setRunError(message);
      pushNotification({
        title: 'Run already in progress',
        body: message,
        target: 'QuinnConversation',
        tone: 'alert',
      });
      return null;
    }

    const nextTitle = override?.packetTitle ?? packetTitle;
    const rawNextText = override?.packetText ?? packetText;
    const effectiveLensId = override?.lensId ?? activeLensId;
    const stayOnScreen = override?.stayOnScreen ?? true;
    const syncVisibleInput = override?.syncVisibleInput ?? true;
    const sessionArcForRun = override?.sessionArc ?? currentSessionArc;
    const runThreadId =
      String(sessionArcForRun?.id || '').trim() || activeThreadIdRef.current;
    const previousAssistantReply =
      lastAssistantResponseRef.current?.threadId === runThreadId
        ? lastAssistantResponseRef.current.text
        : '';
    const activeLensLabel = getQuinnLens(effectiveLensId).label;
    const selectedOptionIndex = parseBareNumericSelection(rawNextText);
    const selectedOption =
      selectedOptionIndex &&
      lastNumberedOptionsRef.current?.threadId === activeThreadIdRef.current &&
      lastAssistantResponseRef.current?.threadId === activeThreadIdRef.current
        ? lastNumberedOptionsRef.current.options.find(
            (option) => option.index === selectedOptionIndex
          ) || null
        : null;
    const nextText = selectedOption
      ? `I choose option ${selectedOption.index} from your previous list: ${selectedOption.text}. Please continue from that choice.\n\nMy raw reply was: ${String(rawNextText || '').trim()}`
      : rawNextText;
    const effectiveTitle = derivePacketTitle({
      packetTitle: nextTitle,
      packetText: nextText,
      lensLabel: activeLensLabel,
      sessionArcTitle: sessionArcForRun?.title || '',
    });

    if (!String(nextText || '').trim()) {
      setRunError('Add text first.');

      pushNotification({
        title: 'Run blocked',
        body: 'No input was provided.',
        target: 'QuinnConversation',
        tone: 'alert',
      });
      return null;
    }

    if (override) {
      setPacketTitle(effectiveTitle);

      if (syncVisibleInput) {
        setPacketText(rawNextText);
      }

      if (effectiveLensId !== activeLensId) {
        setActiveLensId(effectiveLensId);
      }
    } else if (effectiveTitle !== packetTitle) {
      setPacketTitle(effectiveTitle);
    }

    const runToken = activeRunTokenRef.current + 1;
    activeRunTokenRef.current = runToken;
    runInFlightRef.current = true;
    setIsRunning(true);
    setRunError('');

    try {
      const result = await runQuinnPacket({
        packetTitle: effectiveTitle,
        packetText: nextText,
        lensId: effectiveLensId,
        sessionArc: sessionArcForRun,
        previousAssistantReply,
        threadId: runThreadId,
      });

      if (activeRunTokenRef.current !== runToken) {
        return null;
      }

      const cleanWrittenResult = sanitizeQuinnVisibleReplyText(result.written);
      const shortSummary = buildSpokenSummary(result.summary, cleanWrittenResult);
      const cleanCompressedSummary =
        sanitizeQuinnVisibleReplyText(shortSummary) ||
        buildCompressionSummary(cleanWrittenResult || nextText);
      const timestamp = result.timestamp;
      const nextSessionArc = advanceSessionArc(sessionArcForRun, {
        packetTitle: effectiveTitle,
        packetText: nextText,
        compressedSummary: cleanCompressedSummary,
        timestamp,
        lensLabel: activeLensLabel,
      });

      const { runItem, memoryItem } = createRunArtifacts({
        packetTitle: effectiveTitle,
        packetText: nextText,
        writtenResult: cleanWrittenResult,
        compressedSummary: cleanCompressedSummary,
        timestamp,
        lensId: effectiveLensId,
        memoryResonance: result.memoryResonance,
        sessionArc: nextSessionArc,
      });
      const nextThreadId = String(nextSessionArc?.id || '').trim() || activeThreadIdRef.current;

      activeThreadIdRef.current = nextThreadId;
      primeThreadContinuity(nextThreadId, cleanWrittenResult);
      setWrittenResult(cleanWrittenResult);
      setCompressedSummary(cleanCompressedSummary);
      setCurrentMemoryResonance(result.memoryResonance);
      setCurrentSessionArc(nextSessionArc);
      setLastRunAt(timestamp);
      setRecentRuns((prev) =>
        sanitizeRunHistoryItemsForDisplay([runItem, ...prev]).slice(0, 24)
      );
      setMemories((prev) => [memoryItem, ...prev].slice(0, 12));

      pushNotification({
        title: 'Run landed',
        body: shortSummary || 'Quinn returned a fresh result.',
        target: 'QuinnConversation',
        tone: 'success',
      });

      if (!stayOnScreen) {
        setScreen('QuinnConversation');
      }

      return {
        ...result,
        written: cleanWrittenResult,
        summary: cleanCompressedSummary,
      };
    } catch (error) {
      if (activeRunTokenRef.current !== runToken) {
        return null;
      }

      const message = error instanceof Error ? error.message : 'The backend run failed.';

      setRunError(message);

      pushNotification({
        title: 'Run failed',
        body: message,
        target: 'QuinnConversation',
        tone: 'alert',
      });

      return null;
    } finally {
      if (activeRunTokenRef.current === runToken) {
        runInFlightRef.current = false;
        setIsRunning(false);
      }
    }
  }

  async function handleStageNextMove() {
    if (isRunning) {
      pushNotification({
        title: 'Run in progress',
        body: 'Wait for Quinn to finish, then stage the next move from the latest reply.',
        target: 'QuinnConversation',
        tone: 'alert',
      });
      return;
    }

    const responseText = sanitizeQuinnVisibleReplyText(writtenResult);
    const visibleReplySource = deriveVisibleReplySource({
      writtenResult,
      recentRuns,
      packetTitle,
      packetText,
      activeLensId,
    });

    if (!responseText) {
      pushNotification({
        title: 'Nothing to stage yet',
        body: 'Run Quinn first, then stage the next move from the response card.',
        target: 'QuinnConversation',
        tone: 'alert',
      });
      return;
    }

    setIsStagingNextMove(true);
    const stageToken = activeStageTokenRef.current + 1;
    activeStageTokenRef.current = stageToken;

    try {
      const followUp = await generateFollowupPacket({
        responseText,
        currentPacket: buildQuinnPacket({
          packetTitle: visibleReplySource.packetTitle,
          packetText: visibleReplySource.packetText,
          lensId: visibleReplySource.lensId,
          sessionArc: currentSessionArc,
        }),
      });

      if (activeStageTokenRef.current !== stageToken) {
        return;
      }

      const nextLensId = inferQuinnLensFromFollowUp(followUp);
      const nextText =
        String(followUp.focusText || '').trim() ||
        String(followUp.summary || '').trim();
      const nextTitle = derivePacketTitle({
        packetTitle: String(followUp.sessionName || '').trim() || 'Next move',
        packetText: nextText,
        lensLabel: getQuinnLens(nextLensId).label,
        sessionArcTitle: currentSessionArc?.title || '',
      });

      if (!nextText) {
        throw new Error('Quinn did not return a usable next move.');
      }

      setPacketTitle(nextTitle);
      setPacketText(nextText);
      setActiveLensId(nextLensId);
      setRunError('');
      setScreen('QuinnConversation');
      triggerWave();

      pushNotification({
        title: 'Next move staged',
        body: followUp.summary || `${nextTitle} is loaded into Quinn.`,
        target: 'QuinnConversation',
        tone: 'gold',
      });
    } catch (error) {
      if (activeStageTokenRef.current !== stageToken) {
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Could not stage the next move.';

      pushNotification({
        title: 'Next move failed',
        body: message,
        target: 'QuinnConversation',
        tone: 'alert',
      });
    } finally {
      if (activeStageTokenRef.current === stageToken) {
        setIsStagingNextMove(false);
      }
    }
  }

  function handleStartFreshArc() {
    clearThreadContinuity({
      clearVisibleResponse: true,
      clearComposer: true,
      resetTitle: true,
    });

    pushNotification({
      title: 'Fresh thread ready',
      body: 'Quinn will treat the next run as a new topic with no carryover from the prior thread.',
      target: 'QuinnConversation',
      tone: 'gold',
    });
  }

  function handleLoadMemoryItem(item: MemoryItem) {
    clearThreadContinuity({
      clearVisibleResponse: true,
    });
    setPacketTitle(item.label);
    setPacketText(item.body);
    setRunError('');
    setScreen('QuinnConversation');

    pushNotification({
      title: 'Memory loaded',
      body: `${item.label} moved back into Quinn.`,
      target: 'QuinnConversation',
      tone: 'gold',
    });
  }

  function handleToggleMemoryPin(id: string) {
    let becamePinned = false;
    let label = 'Memory item';

    setMemories((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const nextPinned = !item.pinned;
        becamePinned = nextPinned;
        label = item.label || 'Memory item';

        return {
          ...item,
          pinned: nextPinned,
        };
      })
    );

    pushNotification({
      title: becamePinned ? 'Memory pinned' : 'Memory unpinned',
      body: `${label} was ${becamePinned ? 'pinned' : 'unpinned'}.`,
      target: 'MemoryPanel',
      tone: 'gold',
    });
  }

  function handleDeleteMemoryItem(id: string) {
    let label = 'Memory item';

    setMemories((prev) =>
      prev.filter((item) => {
        if (item.id === id) {
          label = item.label || 'Memory item';
          return false;
        }

        return true;
      })
    );

    pushNotification({
      title: 'Memory deleted',
      body: `${label} was removed from Memory.`,
      target: 'MemoryPanel',
      tone: 'alert',
    });
  }

  function handleRestoreRunToCanvas(run: RunHistoryItem) {
    clearThreadContinuity({
      clearVisibleResponse: true,
    });
    setActiveLensId(run.lensId ? coerceQuinnLensId(run.lensId) : activeLensId);
    setPacketTitle(run.packetTitle || 'Untitled packet');
    setPacketText(run.packetText || '');
    setRunError('');
    setScreen('QuinnConversation');

    pushNotification({
      title: 'Run restored',
      body: `${run.packetTitle || 'Untitled packet'} moved back into Quinn.`,
      target: 'QuinnConversation',
      tone: 'neutral',
    });
  }

  function handleRerunHistoryItem(run: RunHistoryItem) {
    const resumedArc = resumeSessionArcFromRun(run);
    setRunError('');
    handleRunPacket({
      packetTitle: run.packetTitle || 'Untitled packet',
      packetText: run.packetText || '',
      lensId: run.lensId ? coerceQuinnLensId(run.lensId) : activeLensId,
      stayOnScreen: screen === 'QuinnConversation',
      syncVisibleInput: true,
      sessionArc: resumedArc,
    });
  }

  function handleToggleSetting(key: keyof QuinnSettings) {
    let nextValue = false;

    setSettings((prev) => {
      nextValue = !prev[key];
      return {
        ...prev,
        [key]: nextValue,
      };
    });

    pushNotification({
      title: `${key} ${nextValue ? 'enabled' : 'disabled'}`,
      body: `Control Center changed ${key} to ${nextValue ? 'on' : 'off'}.`,
      target: 'ControlCenter',
      tone: 'gold',
    });
  }

  function handlePatchVoiceSettings(patch: Partial<VoiceSettings>) {
    setVoiceSettings((prev) => ({
      ...prev,
      ...patch,
    }));
  }

  function handleSaveVoiceSession(session: VoiceSession) {
    setVoiceSessions((prev) => [session, ...prev].slice(0, 12));

    pushNotification({
      title: 'Voice handoff saved',
      body: `${session.title} was saved.`,
      target: 'VoiceMode',
      tone: 'gold',
    });
  }

  function handleDeleteVoiceSession(id: string) {
    setVoiceSessions((prev) => prev.filter((item) => item.id !== id));

    pushNotification({
      title: 'Voice handoff deleted',
      body: 'A saved voice handoff was removed.',
      target: 'VoiceMode',
      tone: 'alert',
    });
  }

  function handleOpenNotification(item: NotificationItem) {
    setNotifications((prev) => markNotificationRead(prev, item.id));
    setScreen(resolveNotificationTarget(item.target));
  }

  function handleToggleNotificationRead(id: string) {
    setNotifications((prev) => toggleNotificationRead(prev, id));
  }

  function handleDeleteNotification(id: string) {
    setNotifications((prev) => removeNotification(prev, id));
  }

  function handleClearNotifications() {
    setNotifications([]);
  }

  const unreadCount = useMemo(
    () => countUnreadNotifications(notifications),
    [notifications]
  );
  const visibleReplySource = useMemo(
    () =>
      deriveVisibleReplySource({
        writtenResult,
        recentRuns,
        packetTitle,
        packetText,
        activeLensId,
      }),
    [activeLensId, packetText, packetTitle, recentRuns, writtenResult]
  );

  let content = null;

  if (screen === 'QuinnConversation') {
    content = (
        <QuinnConversationSurface
          packetTitle={packetTitle}
          packetText={packetText}
          responsePacketTitle={visibleReplySource.packetTitle}
          responsePacketText={visibleReplySource.packetText}
          responseLensId={visibleReplySource.lensId}
          writtenResult={writtenResult}
        compressedSummary={compressedSummary}
        memoryResonance={currentMemoryResonance}
        sessionArc={currentSessionArc}
        isRunning={isRunning}
        activeLensId={activeLensId}
        isStagingNextMove={isStagingNextMove}
        runError={runError}
        onTriggerWave={triggerWave}
        onChangePacketText={setPacketText}
        onSelectLens={setActiveLensId}
        onStageNextMove={handleStageNextMove}
        onStartFreshArc={handleStartFreshArc}
        onRunPacket={handleRunPacket}
      />
    );
  } else if (screen === 'SettingsHome') {
    content = (
      <ScrollView contentContainerStyle={styles.systemScroll} showsVerticalScrollIndicator={false}>
        <QuinnSurfaceShell
          eyebrow="SYSTEM LAYER"
          title="Everything around the conversation, kept precise."
          description="Quinn 2.0 stays at the center. This layer is where memory, voice, exports, signals, and control stay organized without turning the app into a cluttered dashboard."
          onBack={() => setScreen('QuinnConversation')}
          backLabel="Back to Quinn"
          actions={[
            { label: `${recentRuns.length} runs`, tone: 'secondary' },
            { label: `${memories.length} memory items`, tone: 'ghost' },
            { label: unreadCount ? `${unreadCount} active alerts` : 'Signals quiet', tone: 'primary' },
          ]}
        />

        <View style={styles.systemHubGrid}>
          <Pressable style={styles.systemHubCard} onPress={() => setScreen('HomeTileGrid')}>
            <Text style={styles.systemHubEyebrow}>SYSTEM DECK</Text>
            <Text style={styles.systemHubTitle}>Surface index</Text>
            <Text style={styles.systemHubBody}>
              See the current signal, restore recent runs, and open the right layer fast.
            </Text>
          </Pressable>

          <Pressable style={styles.systemHubCard} onPress={() => setScreen('MemoryPanel')}>
            <Text style={styles.systemHubEyebrow}>MEMORY</Text>
            <Text style={styles.systemHubTitle}>Deck</Text>
            <Text style={styles.systemHubBody}>
              {memories.length} kept items ready for Quinn when they genuinely matter.
            </Text>
          </Pressable>

          <Pressable style={styles.systemHubCard} onPress={() => setScreen('VoiceMode')}>
            <Text style={styles.systemHubEyebrow}>VOICE</Text>
            <Text style={styles.systemHubTitle}>Studio</Text>
            <Text style={styles.systemHubBody}>
              Build spoken handoffs, check the live route, and save audio sessions.
            </Text>
          </Pressable>

          <Pressable style={styles.systemHubCard} onPress={() => setScreen('ExportsPanel')}>
            <Text style={styles.systemHubEyebrow}>EXPORTS</Text>
            <Text style={styles.systemHubTitle}>Studio</Text>
            <Text style={styles.systemHubBody}>
              Pull clean JSON, Markdown, or plain-text bundles from the current Quinn state.
            </Text>
          </Pressable>

          <Pressable style={styles.systemHubCard} onPress={() => setScreen('NotificationsPanel')}>
            <Text style={styles.systemHubEyebrow}>SIGNALS</Text>
            <Text style={styles.systemHubTitle}>Stack</Text>
            <Text style={styles.systemHubBody}>
              {unreadCount} unread items waiting across runs, memory, and system changes.
            </Text>
          </Pressable>

          <Pressable style={styles.systemHubCard} onPress={() => setScreen('ControlCenter')}>
            <Text style={styles.systemHubEyebrow}>CONTROL</Text>
            <Text style={styles.systemHubTitle}>Center</Text>
            <Text style={styles.systemHubBody}>
              Focus {settings.focusMode ? 'on' : 'off'} • motion {settings.reduceMotion ? 'reduced' : 'live'} • alerts {settings.quietNotifications ? 'quiet' : 'live'}.
            </Text>
          </Pressable>

          <Pressable style={styles.systemHubCardWide} onPress={() => setScreen('AppSwitcher')}>
            <Text style={styles.systemHubEyebrow}>QUICK JUMP</Text>
            <Text style={styles.systemHubTitle}>Surface switcher</Text>
            <Text style={styles.systemHubBody}>
              Move between QuinnOS layers instantly when you already know where you need to land.
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  } else if (screen === 'HomeTileGrid') {
    content = (
      <HomeTileGrid
        onOpenCanvas={() => setScreen('QuinnConversation')}
        onOpenGravity={() => setScreen('VoiceMode')}
        onOpenMemory={() => setScreen('MemoryPanel')}
        onOpenExports={() => setScreen('ExportsPanel')}
        onOpenSettings={() => setScreen('SettingsHome')}
        onOpenNotifications={() => setScreen('NotificationsPanel')}
        onOpenControlCenter={() => setScreen('ControlCenter')}
        onOpenSwitcher={() => setScreen('AppSwitcher')}
        onRunCurrentPacket={() =>
          handleRunPacket({ packetTitle, packetText, stayOnScreen: true })
        }
        onRestoreRunToCanvas={handleRestoreRunToCanvas}
        onRerunHistoryItem={handleRerunHistoryItem}
        canRunCurrentPacket={Boolean(String(packetText || '').trim()) && !isRunning}
        packetTitle={packetTitle}
        packetText={packetText}
        activeLensLabel={getQuinnLens(visibleReplySource.lensId).label}
        currentSessionArc={currentSessionArc}
        currentMemoryResonance={currentMemoryResonance}
        writtenResult={writtenResult}
        lastSummary={compressedSummary}
        lastRunAt={lastRunAt}
        lastSavedAt={lastSavedAt}
        isHydrated={isHydrated}
        isRunning={isRunning}
        runError={runError}
        recentRuns={recentRuns}
        memories={memories}
        notifications={notifications}
        settings={settings}
      />
    );
  } else if (screen === 'MemoryPanel') {
    content = (
      <MemoryPanel
        onBack={() => setScreen('SettingsHome')}
        onOpenCanvas={() => setScreen('QuinnConversation')}
        memories={memories}
        onLoadMemoryItem={handleLoadMemoryItem}
        onTogglePin={handleToggleMemoryPin}
        onDeleteMemoryItem={handleDeleteMemoryItem}
      />
    );
  } else if (screen === 'ExportsPanel') {
    content = (
      <ExportsPanel
        onBack={() => setScreen('SettingsHome')}
        onOpenCanvas={() => setScreen('QuinnConversation')}
        exportBundle={exportBundle}
        packetTitle={packetTitle}
        recentRunsCount={recentRuns.length}
        memoryCount={memories.length}
      />
    );
  } else if (screen === 'NotificationsPanel') {
    content = (
      <NotificationsPanel
        onBack={() => setScreen('SettingsHome')}
        notifications={notifications}
        quietNotifications={settings.quietNotifications}
        onOpenNotification={handleOpenNotification}
        onToggleRead={handleToggleNotificationRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAll={handleClearNotifications}
      />
    );
  } else if (screen === 'ControlCenter') {
    content = (
      <ControlCenter
        onBack={() => setScreen('SettingsHome')}
        onOpenSettings={() => setScreen('SettingsHome')}
        onOpenNotifications={() => setScreen('NotificationsPanel')}
        settings={settings}
        unreadCount={unreadCount}
        onToggleSetting={handleToggleSetting}
      />
    );
  } else if (screen === 'AppSwitcher') {
    content = (
      <AppSwitcher
        onBack={() => setScreen('SettingsHome')}
        onSwitchToScreen={setScreen}
        currentScreen={screen}
        packetTitle={packetTitle}
        lastSummary={compressedSummary}
        notificationCount={notifications.length}
        memoryCount={memories.length}
        recentRunCount={recentRuns.length}
        voiceSessionCount={voiceSessions.length}
        settings={settings}
      />
    );
  } else if (screen === 'VoiceMode') {
    content = (
      <VoiceMode
        onBack={() => setScreen('SettingsHome')}
        onOpenCanvas={() => setScreen('QuinnConversation')}
        onOpenGravity={() => setScreen('HomeTileGrid')}
        packetTitle={packetTitle}
        packetText={packetText}
        lastSummary={compressedSummary}
        voiceSessions={voiceSessions}
        voiceSettings={voiceSettings}
        onSaveVoiceSession={handleSaveVoiceSession}
        onDeleteVoiceSession={handleDeleteVoiceSession}
        onPatchVoiceSettings={handlePatchVoiceSettings}
      />
    );
  }

  const showFixedConversationHeader = screen === 'QuinnConversation';

  return (
    <SafeArea edges={['top']} style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#04050A" />

      {showFixedConversationHeader ? (
  <>
    <QuinnField waveKey={waveKey} />
    <AmbientGalaxyMotion />
    <FixedQuinnHeader />
    <TopFadeWall />
  </>
      ) : (
        <>
          <View pointerEvents="none" style={styles.appBackground}>
            <View style={styles.appGlowA} />
            <View style={styles.appGlowB} />
            <View style={styles.appGlowC} />
            <View style={styles.appGlowD} />
            <View style={styles.appOrbitRingA} />
            <View style={styles.appOrbitRingB} />
          </View>

          <View style={styles.topBar}>
            <View style={styles.systemBrandChip}>
              <View pointerEvents="none" style={styles.systemBrandGlow} />
              <View pointerEvents="none" style={styles.systemBrandWarmGlow} />
              <View pointerEvents="none" style={styles.systemBrandRing} />
              <Text style={styles.systemBrandOverline}>QUINNOS SYSTEM</Text>
              <Text style={styles.brand}>
                Quinn <Text style={styles.brandVersion}>2.0</Text>
              </Text>
              <Text style={styles.systemBrandSubcopy}>Memory. Voice. Export. Control.</Text>
            </View>
          </View>
        </>
      )}

      {content}

      <Pressable
        onPress={() =>
          setScreen(screen === 'QuinnConversation' ? 'SettingsHome' : 'QuinnConversation')
        }
        style={[
          styles.floatingSettingsButton,
          screen !== 'QuinnConversation' && styles.floatingSettingsButtonActive,
        ]}
      >
        <Feather name="settings" size={16} color="#F2F6FF" />
      </Pressable>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SURFACE_THEME.bg,
  },

  quinnConversationViewport: {
  flex: 1,
  position: 'relative',
  zIndex: 1,
},

  ambientGalaxy: {
  ...StyleSheet.absoluteFillObject,
  zIndex: -10,
},

  galaxyHazeA: {
  position: 'absolute',
  top: -220,
  right: -140,
  width: 460,
  height: 460,
  borderRadius: 230,
  backgroundColor: 'rgba(168, 92, 255, 0.26)',
},

galaxyHazeB: {
  position: 'absolute',
  top: 180,
  left: -160,
  width: 360,
  height: 360,
  borderRadius: 180,
  backgroundColor: 'rgba(64, 210, 255, 0.13)',
},

galaxyHazeC: {
  position: 'absolute',
  bottom: -150,
  right: -40,
  width: 300,
  height: 300,
  borderRadius: 150,
  backgroundColor: 'rgba(255, 126, 182, 0.14)',
},

  galaxyDust: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.94)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 1,
    shadowRadius: 10,
  },

    shootingStarWrap: {
    position: 'absolute',
    width: 170,
    height: 22,
    justifyContent: 'center',
  },

  shootingStarTailFar: {
    position: 'absolute',
    left: 0,
    width: 118,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(188, 218, 255, 0.18)',
  },

  shootingStarTailMid: {
    position: 'absolute',
    left: 44,
    width: 84,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: 'rgba(214, 232, 255, 0.34)',
  },

  shootingStarTailCore: {
    position: 'absolute',
    left: 84,
    width: 58,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 250, 255, 0.92)',
    shadowColor: '#F2F8FF',
    shadowOpacity: 1,
    shadowRadius: 12,
  },

  shootingStarTailFarWarm: {
    backgroundColor: 'rgba(255, 220, 192, 0.18)',
  },

  shootingStarTailMidWarm: {
    backgroundColor: 'rgba(255, 232, 208, 0.34)',
  },

  shootingStarTailCoreWarm: {
    backgroundColor: 'rgba(255, 244, 230, 0.92)',
    shadowColor: '#FFF0E2',
  },

  shootingStarGlow: {
    position: 'absolute',
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(214, 234, 255, 0.26)',
  },

  shootingStarGlowWarm: {
    backgroundColor: 'rgba(255, 232, 208, 0.24)',
  },

  shootingStarHead: {
    position: 'absolute',
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#F8FBFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 1,
    shadowRadius: 16,
  },

  shootingStarHeadWarm: {
    backgroundColor: '#FFF1E0',
    shadowColor: '#FFF1E0',
  },

  appBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SURFACE_THEME.bg,
  },

  appGlowA: {
  position: 'absolute',
  top: -220,
  right: -138,
  width: 480,
  height: 480,
  borderRadius: 240,
  backgroundColor: SURFACE_THEME.plumGlow,
},

appGlowB: {
  position: 'absolute',
  top: 210,
  left: -134,
  width: 330,
  height: 330,
  borderRadius: 165,
  backgroundColor: 'rgba(132, 86, 255, 0.16)',
},

appGlowC: {
  position: 'absolute',
  bottom: -150,
  right: -26,
  width: 310,
  height: 310,
  borderRadius: 155,
  backgroundColor: SURFACE_THEME.roseGlow,
},

appGlowD: {
  position: 'absolute',
  top: 58,
  left: 26,
  width: 250,
  height: 184,
  borderRadius: 999,
  backgroundColor: SURFACE_THEME.portalWarm,
},

appOrbitRingA: {
  position: 'absolute',
  top: 86,
  right: -42,
  width: 236,
  height: 132,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: SURFACE_THEME.orbital,
  transform: [{ rotate: '-14deg' }],
},

appOrbitRingB: {
  position: 'absolute',
  bottom: 64,
  left: -56,
  width: 204,
  height: 112,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: 'rgba(255, 230, 202, 0.12)',
  transform: [{ rotate: '16deg' }],
},

  fixedHeaderShell: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 26,
  paddingHorizontal: 24,
  paddingTop: 12,
  paddingBottom: 12,
},

  headerPanel: {
  overflow: 'hidden',
  position: 'relative',
  minHeight: 212,
  borderRadius: 36,
  borderWidth: 1,
  borderColor: SURFACE_THEME.borderStrong,
  backgroundColor: SURFACE_THEME.heroPanel,
  paddingHorizontal: 20,
  paddingTop: 16,
  paddingBottom: 18,
  shadowColor: SURFACE_THEME.shadow,
  shadowOpacity: 0.54,
  shadowRadius: 40,
  shadowOffset: { width: 0, height: 24 },
  elevation: 12,
},

  headerPanelGlow: {
  position: 'absolute',
  top: -62,
  left: -34,
  width: 360,
  height: 236,
  borderRadius: 999,
  backgroundColor: SURFACE_THEME.plumGlow,
},

  headerPanelWarmGlow: {
  position: 'absolute',
  top: -12,
  right: 38,
  width: 210,
  height: 160,
  borderRadius: 999,
  backgroundColor: SURFACE_THEME.portalWarm,
},

  headerPanelCoreBloom: {
  position: 'absolute',
  top: 18,
  left: 168,
  width: 198,
  height: 124,
  borderRadius: 999,
  backgroundColor: SURFACE_THEME.portalHot,
},

  headerPanelRingPrimary: {
  position: 'absolute',
  top: 18,
  right: 18,
  width: 244,
  height: 124,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: SURFACE_THEME.orbital,
  transform: [{ rotate: '-14deg' }],
},

  headerPanelRingSecondary: {
  position: 'absolute',
  bottom: -16,
  right: 72,
  width: 218,
  height: 96,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: SURFACE_THEME.portalTail,
  transform: [{ rotate: '12deg' }],
},

  headerPanelTailArc: {
  position: 'absolute',
  top: 74,
  right: 124,
  width: 186,
  height: 70,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: 'rgba(255, 212, 233, 0.12)',
  transform: [{ rotate: '20deg' }],
},

  headerPanelSheen: {
  position: 'absolute',
  top: 8,
  left: 14,
  right: 14,
  height: 24,
  borderRadius: 999,
  backgroundColor: SURFACE_THEME.glassHighlight,
},

  headerAuraLarge: {
  position: 'absolute',
  top: -52,
  right: -2,
  width: 260,
  height: 260,
  borderRadius: 130,
  backgroundColor: 'rgba(187, 90, 255, 0.24)',
},

headerAuraSmall: {
  position: 'absolute',
  top: 42,
  right: 80,
  width: 118,
  height: 118,
  borderRadius: 59,
  backgroundColor: 'rgba(255, 164, 220, 0.16)',
},

  headerNebulaRing: {
    position: 'absolute',
    top: 20,
    right: 26,
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 1,
    borderColor: 'rgba(248, 194, 246, 0.16)',
    transform: [{ scaleX: 1.18 }, { rotate: '-18deg' }],
  },

  headerSparkle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.84)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },

  headerSparkleOne: {
    top: 56,
    right: 60,
  },

  headerSparkleTwo: {
    top: 104,
    right: 128,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },

  headerSparkleThree: {
    top: 78,
    right: 94,
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
  },

  headerOverlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  headerOverlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(206, 191, 255, 0.86)',
    marginRight: 8,
  },

  headerOverline: {
    color: 'rgba(222, 228, 246, 0.72)',
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 2.1,
  },

  headerTitleRow: {
  flexDirection: 'row',
  alignItems: 'flex-end',
},

  headerQuinn: {
  fontSize: 64,
  lineHeight: 66,
  fontWeight: '900',
  letterSpacing: -3.8,
  marginRight: 10,
},

  headerVersionCapsule: {
  position: 'relative',
  overflow: 'hidden',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 999,
  marginLeft: 2,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: 'rgba(255, 226, 239, 0.40)',
  backgroundColor: 'rgba(78, 24, 71, 0.82)',
  shadowColor: '#FF9AE0',
  shadowOpacity: 0.42,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 6 },
  elevation: 8,
},

headerVersionText: {
  color: '#FFF2FA',
  fontSize: 13,
  lineHeight: 15,
  fontWeight: '900',
  letterSpacing: 0.8,
},

  topFadeWall: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: FADE_WALL_HEIGHT,
  zIndex: 25,
},

  topBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },

  systemBrandChip: {
    overflow: 'hidden',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderStrong,
    backgroundColor: 'rgba(16, 6, 27, 0.84)',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: SURFACE_THEME.shadow,
    shadowOpacity: 0.46,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
  },

  systemBrandGlow: {
    position: 'absolute',
    top: -44,
    left: -22,
    width: 188,
    height: 124,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.portalGlow,
  },

  systemBrandWarmGlow: {
    position: 'absolute',
    top: 12,
    right: -26,
    width: 126,
    height: 92,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.portalWarm,
  },

  systemBrandRing: {
    position: 'absolute',
    top: -12,
    right: -28,
    width: 132,
    height: 74,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 228, 241, 0.18)',
    transform: [{ rotate: '-12deg' }],
  },

  systemBrandOverline: {
    color: SURFACE_THEME.eyebrow,
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 1.9,
    marginBottom: 6,
  },

  brand: {
    color: '#F8FAFF',
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -2.2,
    textShadowColor: 'rgba(255, 188, 229, 0.34)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },

  brandVersion: {
    color: '#CEC1FF',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  systemBrandSubcopy: {
    color: SURFACE_THEME.textSoft,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 6,
  },

  heroTitleWrap: {
  position: 'relative',
  alignSelf: 'flex-start',
  marginBottom: 8,
  paddingRight: 8,
},

titleGlowBlobA: {
  position: 'absolute',
  left: -4,
  top: 4,
  width: 194,
  height: 68,
  borderRadius: 30,
  backgroundColor: 'rgba(255, 120, 214, 0.14)',
},

titleGlowBlobB: {
  position: 'absolute',
  left: 88,
  top: -10,
  width: 136,
  height: 72,
  borderRadius: 31,
  backgroundColor: 'rgba(179, 104, 255, 0.16)',
},

headerQuinnGlow: {
  position: 'absolute',
  left: 2,
  top: 4,
  fontSize: 68,
  lineHeight: 70,
  fontWeight: '900',
  letterSpacing: -4,
  color: 'rgba(255, 207, 232, 0.22)',
  textShadowColor: 'rgba(255, 170, 224, 0.74)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 24,
},

headerQuinnQ: {
  color: '#FFD2EA',
  textShadowColor: 'rgba(255, 184, 227, 0.86)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 16,
},

headerQuinnRest: {
  color: '#FEF4FF',
  textShadowColor: 'rgba(206, 159, 255, 0.78)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 16,
},

headerVersionShine: {
  position: 'absolute',
  top: 2,
  left: 8,
  right: 8,
  height: 10,
  borderRadius: 999,
  backgroundColor: 'rgba(255,255,255,0.12)',
},

  fixedIntroText: {
  color: 'rgba(244, 236, 246, 0.86)',
  fontSize: 14,
  lineHeight: 22,
  fontWeight: '500',
  maxWidth: 760,
  marginTop: 6,
},

  quinnConversationScroll: {
    paddingHorizontal: 20,
    paddingTop: HEADER_HEIGHT + 10,
    paddingBottom: 108,
  },

  conversationStageShell: {
    position: 'relative',
    width: '100%',
    maxWidth: 1600,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 18,
    marginTop: 4,
    marginBottom: 8,
  },

  conversationStageVeil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: SURFACE_THEME.portalEdge,
    backgroundColor: SURFACE_THEME.heroPanelSoft,
    shadowColor: SURFACE_THEME.shadow,
    shadowOpacity: 0.32,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 20 },
  },

  conversationStageGlowPrimary: {
    position: 'absolute',
    top: -52,
    left: -10,
    width: 420,
    height: 240,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.portalGlow,
  },

  conversationStageGlowSecondary: {
    position: 'absolute',
    top: 82,
    right: -18,
    width: 360,
    height: 280,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.violetCore,
  },

  conversationStageGlowWarm: {
    position: 'absolute',
    right: 72,
    top: 24,
    width: 260,
    height: 180,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.portalWarm,
  },

  conversationStageRingPrimary: {
    position: 'absolute',
    top: 22,
    right: 28,
    width: 236,
    height: 124,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SURFACE_THEME.orbital,
    transform: [{ rotate: '-12deg' }],
  },

  conversationStageRingSecondary: {
    position: 'absolute',
    bottom: 8,
    left: 22,
    width: 212,
    height: 112,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SURFACE_THEME.portalTail,
    transform: [{ rotate: '14deg' }],
  },

  conversationStageTailArc: {
    position: 'absolute',
    top: 86,
    right: 118,
    width: 220,
    height: 80,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 216, 236, 0.12)',
    transform: [{ rotate: '18deg' }],
  },

  conversationStageSheen: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    height: 28,
    borderRadius: 999,
    backgroundColor: SURFACE_THEME.glassHighlight,
  },

  quinnScroll: {
    position: 'relative',
    minHeight: 1120,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
  },

  systemScroll: {
    position: 'relative',
    minHeight: 1120,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
  },

  systemHubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  systemHubCard: {
    width: '47.5%',
    backgroundColor: SURFACE_THEME.panelAlt,
    borderWidth: 1,
    borderColor: SURFACE_THEME.border,
    borderRadius: 26,
    padding: 16,
    marginBottom: 12,
  },

  systemHubCardWide: {
    width: '100%',
    backgroundColor: SURFACE_THEME.panel,
    borderWidth: 1,
    borderColor: SURFACE_THEME.borderStrong,
    borderRadius: 28,
    padding: 18,
    marginBottom: 12,
  },

  systemHubEyebrow: {
    color: SURFACE_THEME.eyebrow,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.25,
    marginBottom: 8,
  },

  systemHubTitle: {
    color: SURFACE_THEME.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginBottom: 6,
  },

  systemHubBody: {
    color: SURFACE_THEME.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },

  cardFloatWrap: {
  position: 'relative',
  zIndex: 1,
  width: '100%',
},

  commandStage: {
  marginBottom: 18,
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: 1560,
  alignSelf: 'center',
},

  primaryCard: {
    overflow: 'hidden',
    marginBottom: 16,
    padding: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(232,236,255,0.12)',
    backgroundColor: 'rgba(12, 16, 31, 0.62)',
    shadowColor: '#A8B0FF',
    shadowOpacity: 0.24,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },

  composerShell: {
  overflow: 'hidden',
  position: 'relative',
  minHeight: 128,
  borderRadius: 36,
  borderWidth: 1,
  borderColor: 'rgba(255, 221, 243, 0.28)',
  backgroundColor: 'rgba(104, 34, 129, 0.92)',
  padding: 2,
  shadowColor: '#1B031F',
  shadowOpacity: 0.48,
  shadowRadius: 40,
  shadowOffset: { width: 0, height: 18 },
  elevation: 12,
},

  composerInnerShell: {
  overflow: 'hidden',
  position: 'relative',
  minHeight: 118,
  borderRadius: 34,
  borderWidth: 1,
  borderColor: 'rgba(255, 241, 247, 0.10)',
  backgroundColor: 'rgba(10, 4, 18, 0.986)',
  paddingLeft: 24,
  paddingRight: 24,
  paddingTop: 22,
  paddingBottom: 18,
},

  lensRailWrap: {
    marginBottom: 10,
    paddingRight: 8,
  },

  threadTitleWrap: {
    marginBottom: 10,
  },

  threadTitleEyebrow: {
    color: 'rgba(188, 196, 226, 0.48)',
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  threadTitleText: {
    color: '#F5F8FF',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  lensEyebrow: {
    color: 'rgba(188, 196, 226, 0.56)',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  lensRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: -8,
  },

  lensChip: {
    paddingHorizontal: 11,
    paddingVertical: 8.5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(249, 221, 244, 0.10)',
    backgroundColor: 'rgba(15, 7, 25, 0.76)',
    marginRight: 8,
    marginBottom: 8,
  },

  lensChipActive: {
    borderColor: 'rgba(255, 224, 243, 0.20)',
    backgroundColor: 'rgba(84, 40, 104, 0.84)',
    shadowColor: '#C65BFF',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },

  lensChipText: {
    color: 'rgba(233, 238, 255, 0.72)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.15,
  },

  lensChipTextActive: {
    color: '#FBFCFF',
  },

  lensBlurb: {
    color: 'rgba(204, 212, 236, 0.54)',
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '500',
  },

  threadManagerRail: {
    marginBottom: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(248, 212, 243, 0.14)',
    backgroundColor: 'rgba(20, 8, 29, 0.54)',
  },

  threadManagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  threadManagerCopy: {
    flex: 1,
    paddingRight: 10,
  },

  threadManagerEyebrow: {
    color: 'rgba(187, 196, 225, 0.48)',
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 4,
  },

  threadManagerTitle: {
    color: '#F4F7FF',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: -0.15,
    marginBottom: 2,
  },

  threadManagerMeta: {
    color: 'rgba(206, 214, 236, 0.54)',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },

  threadManagerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    alignSelf: 'flex-start',
  },

  threadManagerActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(249, 221, 244, 0.12)',
    backgroundColor: 'rgba(17, 8, 26, 0.68)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 7,
  },

  threadManagerActionChipText: {
    color: 'rgba(235, 240, 255, 0.72)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    marginRight: 4,
  },

  threadManagerResetChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 229, 207, 0.12)',
    backgroundColor: 'rgba(24, 10, 20, 0.58)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  threadManagerResetChipText: {
    color: 'rgba(245, 248, 255, 0.70)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },

  threadManagerDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 228, 238, 0.08)',
  },

  composerFieldShell: {
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(253, 226, 244, 0.13)',
    backgroundColor: 'rgba(14, 6, 23, 0.84)',
    paddingLeft: 16,
    paddingRight: 12,
    paddingTop: 14,
    paddingBottom: 12,
  },

  composerFieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  sessionArcRail: {
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(204, 214, 255, 0.08)',
    backgroundColor: 'rgba(7, 11, 20, 0.68)',
  },

  sessionArcHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  sessionArcCopy: {
    flex: 1,
    paddingRight: 12,
  },

  sessionArcEyebrow: {
    color: 'rgba(187, 196, 225, 0.60)',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  sessionArcTitle: {
    color: '#F5F8FF',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 3,
  },

  sessionArcMeta: {
    color: 'rgba(206, 214, 236, 0.60)',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },

  sessionArcResetChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(214, 222, 255, 0.10)',
    backgroundColor: 'rgba(11, 14, 24, 0.86)',
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  sessionArcResetChipText: {
    color: 'rgba(245, 248, 255, 0.86)',
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '700',
  },

  sessionArcBeatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginRight: -8,
  },

  sessionArcBeat: {
    minWidth: 128,
    maxWidth: 220,
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(204, 214, 255, 0.07)',
    backgroundColor: 'rgba(10, 13, 23, 0.76)',
  },

  sessionArcBeatLabel: {
    color: 'rgba(242, 245, 255, 0.74)',
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 0.35,
    marginBottom: 5,
  },

  sessionArcBeatText: {
    color: 'rgba(216, 223, 242, 0.68)',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },

  focusAura: {
    position: 'absolute',
    top: -46,
    left: -28,
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: 'rgba(209, 89, 255, 0.20)',
  },

  cardTopSheen: {
  position: 'absolute',
  top: 7,
  left: 7,
  right: 7,
  height: 20,
  borderRadius: 18,
  backgroundColor: 'rgba(255, 247, 251, 0.12)',
},

  cardTopSheenSoft: {
  position: 'absolute',
  top: 10,
  left: 22,
  right: 22,
  height: 92,
  borderRadius: 34,
  backgroundColor: 'rgba(255, 210, 242, 0.06)',
},

  cardSideShine: {
  position: 'absolute',
  top: 10,
  right: 10,
  width: 128,
  height: 128,
  borderRadius: 64,
  backgroundColor: 'rgba(255, 232, 241, 0.06)',
},

  cardOrbitArcPrimary: {
  position: 'absolute',
  top: -20,
  right: -42,
  width: 214,
  height: 120,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: 'rgba(255, 215, 243, 0.18)',
  transform: [{ rotate: '-15deg' }],
},

  cardOrbitArcSecondary: {
  position: 'absolute',
  bottom: -44,
  left: -34,
  width: 184,
  height: 98,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: 'rgba(255, 227, 205, 0.14)',
  transform: [{ rotate: '15deg' }],
},

  cardGlitterSweep: {
  position: 'absolute',
  top: -20,
  left: -40,
  width: 110,
  height: 240,
  borderRadius: 55,
  backgroundColor: 'rgba(255, 227, 244, 0.10)',
},

  cardGlitterSweepCore: {
  position: 'absolute',
  top: -14,
  left: -18,
  width: 42,
  height: 240,
  borderRadius: 21,
  backgroundColor: 'rgba(255, 236, 246, 0.18)',
},

  cardGlitterSweepWarm: {
    position: 'absolute',
    top: -24,
    left: -40,
    width: 120,
    height: 240,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 228, 212, 0.12)',
  },

  cardGlitterSweepCoreWarm: {
    position: 'absolute',
    top: -18,
    left: -20,
    width: 52,
    height: 240,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 242, 222, 0.18)',
  },

  cardBottomFog: {
  position: 'absolute',
  left: 12,
  right: 12,
  bottom: -10,
  height: 112,
  borderRadius: 40,
  backgroundColor: 'rgba(214, 93, 255, 0.12)',
},

  cardOrbGlowCool: {
  position: 'absolute',
  top: -54,
  right: -20,
  width: 152,
  height: 152,
  borderRadius: 76,
  backgroundColor: 'rgba(183, 108, 255, 0.20)',
},

cardOrbGlowPurple: {
  position: 'absolute',
  top: -72,
  right: 32,
  width: 210,
  height: 210,
  borderRadius: 105,
  backgroundColor: 'rgba(202, 82, 255, 0.18)',
},

cardOrbGlowWarm: {
  position: 'absolute',
  top: -54,
  right: -14,
  width: 150,
  height: 150,
  borderRadius: 75,
  backgroundColor: 'rgba(255, 146, 204, 0.16)',
},

  sparkleLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  sparkle: {
    position: 'absolute',
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: 'rgba(255,255,255,0.86)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.54,
    shadowRadius: 8,
  },

  sparkleWarm: {
  backgroundColor: 'rgba(255, 228, 214, 0.98)',
  shadowColor: '#FFD8E8',
},

  sparkleOne: {
    top: 18,
    right: 28,
  },

  sparkleTwo: {
    top: 36,
    right: 80,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },

  sparkleThree: {
    top: 74,
    right: 46,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },

  sparkleFour: {
    bottom: 28,
    right: 42,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  sparkleFive: {
    top: 18,
    left: 24,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },

  sparkleSix: {
    bottom: 22,
    left: 34,
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
  },

  sparkleSeven: {
    top: 46,
    left: 70,
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
  },

  sparkleEight: {
    bottom: 44,
    left: 18,
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
  },

  listeningSweep: {
    position: 'absolute',
    top: 10,
    bottom: 10,
    width: 96,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  listeningChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 152, 0.24)',
    backgroundColor: 'rgba(34, 10, 16, 0.70)',
  },

  listeningDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF7676',
    marginRight: 6,
  },

  listeningChipText: {
    color: '#FFDADA',
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  composerInput: {
  flex: 1,
  minHeight: 72,
  color: 'rgba(251, 246, 255, 0.96)',
  fontSize: 15.5,
  lineHeight: 24,
  fontWeight: '500',
  letterSpacing: -0.08,
  padding: 0,
  paddingTop: 2,
  paddingBottom: 4,
  paddingRight: 12,
},

  composerActionDockGlow: {
  position: 'absolute',
  right: 12,
  bottom: 12,
  width: 110,
  height: 56,
  borderRadius: 28,
  backgroundColor: 'rgba(255, 133, 214, 0.18)',
},

  composerActionDock: {
    marginLeft: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 226, 244, 0.14)',
    backgroundColor: 'rgba(13, 6, 22, 0.90)',
    shadowColor: '#2A0428',
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
  },

  composerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  inlineIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2.5,
    borderWidth: 1,
  },

  inlineHeartButton: {
  backgroundColor: 'rgba(152, 57, 139, 0.68)',
  borderColor: 'rgba(255, 224, 240, 0.24)',
  shadowColor: '#701267',
  shadowOpacity: 0.24,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 6 },
},

  inlineHeartButtonDisabled: {
    backgroundColor: 'rgba(20, 24, 38, 0.58)',
    borderColor: 'rgba(255,255,255,0.05)',
  },

  inlineMicButton: {
    backgroundColor: 'rgba(16, 8, 25, 0.98)',
    borderColor: 'rgba(255, 244, 248, 0.14)',
  },

  inlineMicButtonActive: {
    backgroundColor: 'rgba(134, 58, 74, 0.56)',
    borderColor: 'rgba(255, 170, 182, 0.24)',
  },

  inlineLoadingIcon: {
    color: '#F8FAFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: -2,
  },

  inlineTakeStatus: {
  color: 'rgba(230, 236, 250, 0.84)',
  fontSize: 12,
  lineHeight: 17,
  fontWeight: '700',
  marginTop: 10,
  marginLeft: 4,
  alignSelf: 'flex-start',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: 'rgba(215, 221, 255, 0.08)',
  backgroundColor: 'rgba(9, 12, 21, 0.70)',
},

  helperText: {
  color: 'rgba(230, 236, 250, 0.84)',
  fontSize: 12,
  lineHeight: 19,
  fontWeight: '700',
  marginTop: 10,
  alignSelf: 'flex-start',
  maxWidth: '90%',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: 'rgba(215, 221, 255, 0.08)',
  backgroundColor: 'rgba(9, 12, 21, 0.68)',
},

  errorText: {
    color: '#FF94A2',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginTop: 10,
    alignSelf: 'flex-start',
    maxWidth: '90%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 148, 162, 0.16)',
    backgroundColor: 'rgba(36, 12, 18, 0.68)',
  },

  responseStage: {
  marginTop: 0,
  marginBottom: 10,
  paddingLeft: 2,
  position: 'relative',
  zIndex: 1,
},

  responseStageEyebrow: {
    color: 'rgba(214, 220, 240, 0.62)',
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 2.1,
    marginBottom: 5,
  },

  responseStageTitle: {
    color: '#FAFBFF',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  heroResponseCard: {
  overflow: 'hidden',
  position: 'relative',
  marginBottom: 14,
  borderRadius: 34,
  borderWidth: 1,
  borderColor: 'rgba(255, 223, 243, 0.18)',
  backgroundColor: 'rgba(44, 15, 47, 0.92)',
  padding: 2,
  width: '100%',
  maxWidth: 1560,
  alignSelf: 'center',
  shadowColor: '#120015',
  shadowOpacity: 0.60,
  shadowRadius: 38,
  shadowOffset: { width: 0, height: 18 },
  elevation: 13,
},

  spokenResponseCard: {
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(238, 230, 255, 0.18)',
    backgroundColor: 'rgba(20, 24, 42, 0.74)',
    padding: 3,
    shadowColor: '#B0B7FF',
    shadowOpacity: 0.32,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 13,
  },

  responseInnerFrame: {
  overflow: 'hidden',
  borderRadius: 32,
  borderWidth: 1,
  borderColor: 'rgba(255, 244, 247, 0.10)',
  backgroundColor: 'rgba(12, 4, 19, 0.986)',
  paddingHorizontal: 30,
  paddingTop: 22,
  paddingBottom: 22,
},

  spokenInnerFrame: {
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(8, 11, 25, 0.90)',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  heroResponseBody: {
  color: 'rgba(245, 247, 253, 0.95)',
  fontSize: 15.8,
  lineHeight: 31,
  fontWeight: '500',
  letterSpacing: 0.1,
  maxWidth: 900,
},

  sectionTitle: {
    color: '#F5F7FF',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 14,
  },

  responseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  responseHeaderTextWrap: {
    flex: 1,
    maxWidth: 980,
  },

  responseContextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    marginRight: -10,
  },

  responseContextChip: {
    minWidth: 144,
    maxWidth: 260,
    marginRight: 10,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(201, 209, 241, 0.09)',
    backgroundColor: 'rgba(11, 14, 23, 0.76)',
  },

  responseContextChipLabel: {
    color: 'rgba(184, 193, 219, 0.56)',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1.05,
    marginBottom: 4,
  },

  responseContextChipValue: {
    color: 'rgba(244, 247, 255, 0.9)',
    fontSize: 12.2,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.08,
  },

  memoryResonanceWrap: {
    marginBottom: 4,
  },

  memoryResonanceEyebrow: {
    color: 'rgba(188, 198, 226, 0.54)',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 9,
  },

  memoryResonanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: -10,
    marginBottom: 6,
  },

  memoryResonanceChip: {
    minWidth: 138,
    maxWidth: 220,
    marginRight: 10,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(206, 214, 255, 0.08)',
    backgroundColor: 'rgba(10, 13, 22, 0.74)',
  },

  memoryResonanceLabel: {
    color: '#F4F7FF',
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 0.18,
    marginBottom: 5,
  },

  memoryResonancePreview: {
    color: 'rgba(218, 225, 244, 0.62)',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },

  responseLabel: {
  color: 'rgba(255, 249, 253, 0.84)',
  fontSize: 12.5,
  lineHeight: 18,
  fontWeight: '800',
  letterSpacing: 0.9,
  marginBottom: 4,
},

  responseMetaLine: {
  color: 'rgba(210, 198, 226, 0.58)',
  fontSize: 11.5,
  lineHeight: 16,
  fontWeight: '600',
  letterSpacing: 0.08,
},

  responseDetailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(252, 220, 243, 0.12)',
    backgroundColor: 'rgba(17, 8, 25, 0.76)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginLeft: 12,
  },

  responseDetailsToggleText: {
    color: 'rgba(227, 233, 248, 0.76)',
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '700',
    marginRight: 6,
  },

  responseDetailsPanel: {
    marginTop: 16,
    marginBottom: 2,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 215, 242, 0.12)',
    backgroundColor: 'rgba(16, 7, 24, 0.76)',
  },

  responseDetailsEyebrow: {
    color: 'rgba(188, 198, 226, 0.54)',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 10,
  },

  responseDetailRow: {
    marginBottom: 10,
  },

  responseDetailLabel: {
    color: 'rgba(184, 193, 219, 0.56)',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1.05,
    marginBottom: 3,
  },

  responseDetailValue: {
    color: 'rgba(242, 246, 255, 0.84)',
    fontSize: 12.2,
    lineHeight: 18,
    fontWeight: '600',
  },

  responseDetailsSection: {
    marginTop: 8,
  },

  responseSubLabel: {
    color: 'rgba(226, 231, 246, 0.68)',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '600',
  },

  voiceAccentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 6,
    marginBottom: 8,
  },

  voiceAccentBar: {
    width: 3,
    borderRadius: 999,
    marginRight: 5,
    backgroundColor: 'rgba(214, 226, 255, 0.86)',
  },

  responseBody: {
    color: '#F7F9FF',
    fontSize: 15.5,
    lineHeight: 25,
    fontWeight: '400',
    marginTop: 2,
  },

  responseFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },

  responseFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 44,
  },

  responseActionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 222, 242, 0.14)',
    backgroundColor: 'rgba(18, 7, 26, 0.84)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '72%',
  },

  responseActionChipDisabled: {
    borderColor: 'rgba(212, 220, 255, 0.05)',
    backgroundColor: 'rgba(10, 14, 25, 0.52)',
  },

  responseActionChipText: {
    color: 'rgba(242, 246, 255, 0.88)',
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
    letterSpacing: 0.12,
  },

  responseActionChipTextDisabled: {
    color: 'rgba(242, 246, 255, 0.48)',
  },

  replayButtonWrap: {
    position: 'relative',
    zIndex: 2,
  },

  replayGlow: {
  position: 'absolute',
  right: 0,
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: 'rgba(255, 130, 214, 0.16)',
},

responseReplayButton: {
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: 'rgba(255, 226, 244, 0.14)',
  backgroundColor: 'rgba(83, 36, 88, 0.68)',
  shadowColor: '#360631',
  shadowOpacity: 0.18,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
},

  responseReplayIcon: {
    color: '#F7F9FF',
    fontSize: 16,
    fontWeight: '700',
  },

  floatingSettingsButton: {
    position: 'absolute',
    right: 18,
    bottom: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 221, 244, 0.14)',
    backgroundColor: 'rgba(17, 7, 27, 0.94)',
    shadowColor: '#170118',
    shadowOpacity: 0.48,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    zIndex: 10,
  },

  floatingSettingsButtonActive: {
    borderColor: 'rgba(255, 225, 244, 0.18)',
    backgroundColor: 'rgba(21, 8, 31, 0.98)',
  },

  floatingSettingsIcon: {
    color: '#F2F6FF',
    fontSize: 16,
    fontWeight: '700',
  },

  quinnEyebrow: {
    color: 'rgba(160, 170, 206, 0.76)',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 8,
    marginBottom: 8,
  },

  quinnHeroTitle: {
    color: '#F5F7FF',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -1.2,
    marginBottom: 8,
  },

  quinnHeroText: {
    color: 'rgba(208, 216, 236, 0.74)',
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 14,
  },

  sectionEyebrow: {
    color: 'rgba(160, 170, 206, 0.76)',
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 6,
  },

  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },

  secondaryAction: {
    backgroundColor: 'rgba(12, 16, 30, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(178, 186, 255, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 11,
    marginRight: 10,
    marginBottom: 8,
  },

  secondaryActionText: {
    color: '#F2F5FF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.25,
  },

  missingWrap: {
    overflow: 'hidden',
    margin: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(152, 128, 255, 0.28)',
    backgroundColor: 'rgba(12,16,30,0.60)',
    borderRadius: TOKENS.radius?.lg ?? 24,
  },

  missingEyebrow: {
    color: '#D8DFFF',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  missingTitle: {
    color: '#F6F8FF',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 8,
  },

  missingBody: {
    color: 'rgba(210, 218, 238, 0.76)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
});
