import { buildQuinnBackendUrl, QUINN_BACKEND_BASE_URL } from './quinnEndpoints';

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

export function buildVoiceSpeakPayload(
  text: string,
  {
    previousText = '',
    nextText = '',
  }: {
    previousText?: string;
    nextText?: string;
  } = {}
) {
  const cleanText = String(text || '').replace(/\s+/g, ' ').trim();
  const cleanPreviousText = normalizeVoiceQueryText(previousText);
  void nextText;

  return {
    text: cleanText,
    ...(cleanPreviousText ? { previous_text: cleanPreviousText } : {}),
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
  }: {
    previousText?: string;
    nextText?: string;
  } = {}
) {
  const payload = buildVoiceSpeakPayload(text, {
    previousText,
    nextText,
  });
  const params = new URLSearchParams({
    text: payload.text,
  });

  if (payload.previous_text) {
    params.set('previous_text', payload.previous_text);
  }

  return `${buildQuinnBackendUrl('/voice-speak')}?${params.toString()}`;
}

export function getQuinnLocalVoiceSpeakRequestKey(
  text: string,
  {
    previousText = '',
    nextText = '',
  }: {
    previousText?: string;
    nextText?: string;
  } = {}
) {
  const payload = buildVoiceSpeakPayload(text, {
    previousText,
    nextText,
  });

  return [payload.text, payload.previous_text || '', ''].join('::');
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
  }: {
    previousText?: string;
    nextText?: string;
  } = {}
): Promise<string> {
  const payload = buildVoiceSpeakPayload(text, {
    previousText,
    nextText,
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
