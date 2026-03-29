import { buildQuinnBackendUrl, QUINN_BACKEND_BASE_URL } from './quinnEndpoints';
import type { QuinnVoiceTtsHint } from './quinnVoiceProsody';

export const QUINN_LOCAL_VOICE_BASE_URL = QUINN_BACKEND_BASE_URL;
export const VOICE_PREPARE_ENDPOINT = buildQuinnBackendUrl('/voice-speak/prepare');
export const VOICE_POST_SPEAK_ENDPOINT = buildQuinnBackendUrl('/speak');

export function getQuinnLocalVoiceBaseUrl(): string {
  return QUINN_LOCAL_VOICE_BASE_URL;
}

export function getQuinnLocalVoiceHealthUrl(): string {
  return buildQuinnBackendUrl('/voice-health');
}

export function isQuinnLocalVoiceRemoteSource(value: string) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

export function normalizeVoiceQueryText(value: string, maxLength = 360) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();

  if (!clean) {
    return '';
  }

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength - 3).trim()}...`;
}

const QUINN_VOICE_HINT_PROFILES = new Set([
  'neutralBalanced',
  'heldSoft',
  'tightFirm',
  'lightCurl',
  'magnetized',
  'settledWarm',
]);

const QUINN_VOICE_HINT_PACE = new Set(['held', 'balanced', 'quick']);
const QUINN_VOICE_HINT_LANDING = new Set(['soft', 'balanced', 'firm']);
const QUINN_VOICE_HINT_SMOOTHNESS = new Set(['smooth', 'balanced', 'crisp']);
const QUINN_VOICE_HINT_CONTOUR = new Set(['settled', 'lightLift', 'alive']);

type QuinnLocalVoiceSpeakOptions = {
  previousText?: string;
  nextText?: string;
  prosodyHint?: QuinnVoiceTtsHint | null;
};

function normalizeVoiceHintSpeed(value: unknown) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.min(1.08, Math.max(0.98, Math.round(numeric * 100) / 100));
}

function normalizeVoiceProsodyHint(value: QuinnVoiceTtsHint | null | undefined) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const profile = QUINN_VOICE_HINT_PROFILES.has(String(value.profile))
    ? String(value.profile)
    : '';
  const pace = QUINN_VOICE_HINT_PACE.has(String(value.pace)) ? String(value.pace) : '';
  const landing = QUINN_VOICE_HINT_LANDING.has(String(value.landing))
    ? String(value.landing)
    : '';
  const smoothness = QUINN_VOICE_HINT_SMOOTHNESS.has(String(value.smoothness))
    ? String(value.smoothness)
    : '';
  const contour = QUINN_VOICE_HINT_CONTOUR.has(String(value.contour))
    ? String(value.contour)
    : '';
  const speed = normalizeVoiceHintSpeed(value.speed);

  if (!profile || !pace || !landing || !smoothness || !contour || speed === null) {
    return null;
  }

  return {
    profile: profile as QuinnVoiceTtsHint['profile'],
    speed,
    pace: pace as QuinnVoiceTtsHint['pace'],
    landing: landing as QuinnVoiceTtsHint['landing'],
    smoothness: smoothness as QuinnVoiceTtsHint['smoothness'],
    contour: contour as QuinnVoiceTtsHint['contour'],
  };
}

function buildVoiceProsodyQueryParams(prosodyHint: QuinnVoiceTtsHint | null | undefined) {
  const normalized = normalizeVoiceProsodyHint(prosodyHint);

  if (!normalized) {
    return {};
  }

  return {
    voice_profile: normalized.profile,
    voice_speed: String(normalized.speed),
    voice_pace: normalized.pace,
    voice_landing: normalized.landing,
    voice_smoothness: normalized.smoothness,
    voice_contour: normalized.contour,
  };
}

function buildVoiceProsodyCacheKey(prosodyHint: QuinnVoiceTtsHint | null | undefined) {
  const normalized = normalizeVoiceProsodyHint(prosodyHint);

  if (!normalized) {
    return '';
  }

  return [
    normalized.profile,
    normalized.speed,
    normalized.pace,
    normalized.landing,
    normalized.smoothness,
    normalized.contour,
  ].join('|');
}

export function buildVoiceSpeakPayload(
  text: string,
  {
    previousText = '',
    nextText = '',
    prosodyHint = null,
  }: QuinnLocalVoiceSpeakOptions = {}
) {
  const cleanText = String(text || '').replace(/\s+/g, ' ').trim();
  const cleanPreviousText = normalizeVoiceQueryText(previousText);
  const cleanProsodyHint = normalizeVoiceProsodyHint(prosodyHint);
  void nextText;

  return {
    text: cleanText,
    ...(cleanPreviousText ? { previous_text: cleanPreviousText } : {}),
    ...(cleanProsodyHint ? { prosody_hint: cleanProsodyHint } : {}),
  };
}

export async function parseJsonSafely(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function getQuinnLocalVoiceSpeakUrl(
  text: string,
  {
    previousText = '',
    nextText = '',
    prosodyHint = null,
  }: QuinnLocalVoiceSpeakOptions = {}
) {
  const payload = buildVoiceSpeakPayload(text, {
    previousText,
    nextText,
    prosodyHint,
  });
  const params = new URLSearchParams({
    text: payload.text,
  });

  if (payload.previous_text) {
    params.set('previous_text', payload.previous_text);
  }

  const prosodyParams = buildVoiceProsodyQueryParams(payload.prosody_hint);

  for (const [key, value] of Object.entries(prosodyParams)) {
    params.set(key, value);
  }

  return `${buildQuinnBackendUrl('/voice-speak')}?${params.toString()}`;
}

export function getQuinnLocalVoiceSpeakRequestKey(
  text: string,
  {
    previousText = '',
    nextText = '',
    prosodyHint = null,
  }: QuinnLocalVoiceSpeakOptions = {}
) {
  const payload = buildVoiceSpeakPayload(text, {
    previousText,
    nextText,
    prosodyHint,
  });

  return [
    payload.text,
    payload.previous_text || '',
    '',
    buildVoiceProsodyCacheKey(payload.prosody_hint),
  ].join('::');
}

export function getQuinnVoicePlaybackStartDelayMs(
  playbackSource: string,
  {
    isFirstChunk = false,
    isWarmSource = false,
  }: {
    isFirstChunk?: boolean;
    isWarmSource?: boolean;
  } = {}
) {
  if (isQuinnLocalVoiceRemoteSource(playbackSource)) {
    if (isWarmSource) {
      return isFirstChunk ? 18 : 2;
    }

    return isFirstChunk ? 48 : 6;
  }

  if (isWarmSource) {
    return isFirstChunk ? 1 : 0;
  }

  return isFirstChunk ? 4 : 0;
}

export async function prepareQuinnLocalVoiceSpeakUrl(
  text: string,
  {
    previousText = '',
    nextText = '',
    prosodyHint = null,
  }: QuinnLocalVoiceSpeakOptions = {}
): Promise<string> {
  const payload = buildVoiceSpeakPayload(text, {
    previousText,
    nextText,
    prosodyHint,
  });

  if (!payload.text) {
    throw new Error('No text was provided for Quinn voice.');
  }

  const response = await fetch(VOICE_PREPARE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafely(response);

  if (response.status === 404 || response.status === 405) {
    return getQuinnLocalVoiceSpeakUrl(text, {
      previousText,
      nextText,
      prosodyHint,
    });
  }

  if (!response.ok) {
    throw new Error(
      String(data?.error || data?.message || `Voice prepare request failed (${response.status})`)
    );
  }

  const token = String(data?.token || '').trim();

  if (!token) {
    throw new Error('Voice prepare response did not include a playback token.');
  }

  return `${buildQuinnBackendUrl('/voice-speak')}?${new URLSearchParams({
    token,
  }).toString()}`;
}

export async function pingQuinnLocalVoice(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(getQuinnLocalVoiceHealthUrl(), {
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
