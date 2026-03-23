import { Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';

type UseQuinnConversationMotionParams = {
  inputFocused: boolean;
  isRecording: boolean;
  voicePlaybackActive: boolean;
  writtenResult: string;
};

function cardOpacityFor(value: Animated.Value) {
  return value.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
}

function cardTranslateFor(value: Animated.Value) {
  return value.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });
}

export function useQuinnConversationMotion({
  inputFocused,
  isRecording,
  voicePlaybackActive,
  writtenResult,
}: UseQuinnConversationMotionParams) {
  const ambientA = useRef(new Animated.Value(0)).current;
  const ambientB = useRef(new Animated.Value(0)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;
  const listenAnim = useRef(new Animated.Value(0)).current;
  const responseCardAnim = useRef(new Animated.Value(writtenResult ? 1 : 0)).current;
  const replayAnim = useRef(new Animated.Value(0)).current;
  const barsAnim = useRef(new Animated.Value(0)).current;
  const previousResultKey = useRef(writtenResult);

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: inputFocused ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.sin),
      useNativeDriver: true,
    }).start();
  }, [focusAnim, inputFocused]);

  useEffect(() => {
    const ambientLoopA = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientA, {
          toValue: 1,
          duration: 7600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ambientA, {
          toValue: 0,
          duration: 7600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const ambientLoopB = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientB, {
          toValue: 1,
          duration: 9800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ambientB, {
          toValue: 0,
          duration: 9800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    ambientLoopA.start();
    ambientLoopB.start();

    return () => {
      ambientLoopA.stop();
      ambientLoopB.stop();
    };
  }, [ambientA, ambientB]);

  useEffect(() => {
    if (isRecording) {
      const shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(listenAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(listenAnim, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      shimmerLoop.start();

      return () => {
        shimmerLoop.stop();
        listenAnim.setValue(0);
      };
    }

    listenAnim.setValue(0);
  }, [isRecording, listenAnim]);

  useEffect(() => {
    if (voicePlaybackActive) {
      const replayLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(replayAnim, {
            toValue: 1,
            duration: 760,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(replayAnim, {
            toValue: 0,
            duration: 760,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      const barsLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(barsAnim, {
            toValue: 1,
            duration: 560,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(barsAnim, {
            toValue: 0,
            duration: 560,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      replayLoop.start();
      barsLoop.start();

      return () => {
        replayLoop.stop();
        barsLoop.stop();
        replayAnim.setValue(0);
        barsAnim.setValue(0);
      };
    }

    replayAnim.setValue(0);
    barsAnim.setValue(0);
  }, [barsAnim, replayAnim, voicePlaybackActive]);

  useEffect(() => {
    const nextKey = writtenResult;

    if (nextKey === previousResultKey.current) {
      return;
    }

    previousResultKey.current = nextKey;

    if (!writtenResult) {
      return;
    }

    responseCardAnim.setValue(0);

    Animated.timing(responseCardAnim, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.sin),
      useNativeDriver: true,
    }).start();
  }, [responseCardAnim, writtenResult]);

  return {
    composerLift: ambientA.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -10],
    }),
    responseLift: ambientB.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -12],
    }),
    composerGlowOpacity: ambientA.interpolate({
      inputRange: [0, 1],
      outputRange: [0.28, 0.62],
    }),
    responseGlowOpacity: ambientB.interpolate({
      inputRange: [0, 1],
      outputRange: [0.26, 0.58],
    }),
    dockGlowOpacity: ambientB.interpolate({
      inputRange: [0, 1],
      outputRange: [0.18, 0.4],
    }),
    focusGlowOpacity: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.38],
    }),
    focusScale: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.03],
    }),
    composerOverlayTranslate: listenAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-96, 260],
    }),
    replayScale: replayAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.12],
    }),
    replayGlowOpacity: replayAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.18, 0.38],
    }),
    orbShiftX: ambientA.interpolate({
      inputRange: [0, 1],
      outputRange: [-14, 18],
    }),
    orbShiftY: ambientB.interpolate({
      inputRange: [0, 1],
      outputRange: [-12, 14],
    }),
    sparkleDriftX: ambientB.interpolate({
      inputRange: [0, 1],
      outputRange: [-8, 10],
    }),
    sparkleDriftY: ambientA.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -18],
    }),
    sparkleOpacity: ambientA.interpolate({
      inputRange: [0, 1],
      outputRange: [0.72, 1],
    }),
    sheenTranslateA: ambientA.interpolate({
      inputRange: [0, 1],
      outputRange: [-90, 90],
    }),
    sheenTranslateB: ambientB.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 100],
    }),
    sheenRise: ambientA.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 16],
    }),
    sheenOpacity: ambientB.interpolate({
      inputRange: [0, 1],
      outputRange: [0.18, 0.34],
    }),
    sheenCoreOpacity: ambientA.interpolate({
      inputRange: [0, 1],
      outputRange: [0.22, 0.42],
    }),
    responseCardOpacity: cardOpacityFor(responseCardAnim),
    responseCardTranslate: cardTranslateFor(responseCardAnim),
  };
}
