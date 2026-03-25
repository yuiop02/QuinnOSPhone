import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { buildQuinnBackendUrl, QUINN_BACKEND_BASE_URL } from './quinnEndpoints';

const QUINN_LOCAL_VOICE_BASE_URL = QUINN_BACKEND_BASE_URL;
const VOICE_PREPARE_ENDPOINT = buildQuinnBackendUrl('/voice-speak/prepare');
const VOICE_POST_SPEAK_ENDPOINT = buildQuinnBackendUrl('/speak');
const LOCAL_VOICE_PLAYBACK_DIR = new Directory(Paths.cache, 'quinn-voice-playback');
const LOCAL_VOICE_FILE_TTL_MS = 15 * 60 * 1000;
const MAX_LOCAL_VOICE_FILES = 24;
const cachedVoiceFiles = new Map<string, { uri: string; createdAt: number }>();
const inFlightVoiceFiles = new Map<string, Promise<string>>();

export function getQuinnLocalVoiceBaseUrl(): string {
  return QUINN_LOCAL_VOICE_BASE_URL;
}

export function getQuinnLocalVoiceHealthUrl(): string {
  return buildQuinnBackendUrl('/voice-health');
}

export function isQuinnLocalVoiceRemoteSource(value: string) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function normalizeVoiceQueryText(value: string, maxLength = 360) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();

  if (!clean) {
    return '';
  }

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength - 3).trim()}...`;
}

function buildVoiceSpeakPayload(
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
  const cleanNextText = normalizeVoiceQueryText(nextText);

  return {
    text: cleanText,
    ...(cleanPreviousText ? { previous_text: cleanPreviousText } : {}),
    ...(cleanNextText ? { next_text: cleanNextText } : {}),
  };
}

async function parseJsonSafely(response: Response) {
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

  if (payload.next_text) {
    params.set('next_text', payload.next_text);
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

  return [payload.text, payload.previous_text || '', payload.next_text || ''].join('::');
}

function ensureLocalVoicePlaybackDirectory() {
  LOCAL_VOICE_PLAYBACK_DIR.create({
    idempotent: true,
    intermediates: true,
  });
}

function deleteLocalVoiceFileQuietly(uri: string) {
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

function pruneLocalVoicePlaybackCache() {
  const now = Date.now();

  for (const [requestKey, entry] of cachedVoiceFiles.entries()) {
    if (now - entry.createdAt > LOCAL_VOICE_FILE_TTL_MS) {
      cachedVoiceFiles.delete(requestKey);
      deleteLocalVoiceFileQuietly(entry.uri);
    }
  }

  const entries = [...cachedVoiceFiles.entries()].sort(
    (a, b) => a[1].createdAt - b[1].createdAt
  );

  while (entries.length > MAX_LOCAL_VOICE_FILES) {
    const oldest = entries.shift();

    if (!oldest) {
      break;
    }

    cachedVoiceFiles.delete(oldest[0]);
    deleteLocalVoiceFileQuietly(oldest[1].uri);
  }
}

function getCachedLocalVoicePlaybackSource(requestKey: string) {
  const entry = cachedVoiceFiles.get(requestKey);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.createdAt > LOCAL_VOICE_FILE_TTL_MS) {
    cachedVoiceFiles.delete(requestKey);
    deleteLocalVoiceFileQuietly(entry.uri);
    return null;
  }

  try {
    const file = new File(entry.uri);

    if (!file.exists) {
      cachedVoiceFiles.delete(requestKey);
      return null;
    }
  } catch {
    cachedVoiceFiles.delete(requestKey);
    return null;
  }

  return entry.uri;
}

function buildLocalVoicePlaybackFile() {
  ensureLocalVoicePlaybackDirectory();

  const file = new File(
    LOCAL_VOICE_PLAYBACK_DIR,
    `quinn-voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`
  );

  if (file.exists) {
    file.delete();
  }

  file.create({
    intermediates: true,
    overwrite: true,
  });

  return file;
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

export async function prepareQuinnLocalVoicePlaybackSource(
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

  if (Platform.OS === 'web') {
    return prepareQuinnLocalVoiceSpeakUrl(text, {
      previousText,
      nextText,
    });
  }

  pruneLocalVoicePlaybackCache();

  const requestKey = getQuinnLocalVoiceSpeakRequestKey(text, {
    previousText,
    nextText,
  });
  const cachedUri = getCachedLocalVoicePlaybackSource(requestKey);

  if (cachedUri) {
    return cachedUri;
  }

  const pending = inFlightVoiceFiles.get(requestKey);

  if (pending) {
    return pending;
  }

  const playbackPromise = (async () => {
    const response = await fetch(VOICE_POST_SPEAK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 404 || response.status === 405) {
      return prepareQuinnLocalVoiceSpeakUrl(text, {
        previousText,
        nextText,
      });
    }

    const contentType = String(response.headers.get('Content-Type') || '').toLowerCase();

    if (!response.ok) {
      const data = await parseJsonSafely(response);
      throw new Error(
        String(data?.error || data?.message || `Voice speak request failed (${response.status})`)
      );
    }

    if (contentType && !contentType.includes('audio/')) {
      throw new Error(`Voice speak request returned unexpected content type: ${contentType}`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());

    if (!bytes.length) {
      throw new Error('Voice speak request returned empty audio.');
    }

    const destination = buildLocalVoicePlaybackFile();
    destination.write(bytes);
    cachedVoiceFiles.set(requestKey, {
      uri: destination.uri,
      createdAt: Date.now(),
    });
    pruneLocalVoicePlaybackCache();

    return destination.uri;
  })();

  inFlightVoiceFiles.set(requestKey, playbackPromise);

  try {
    return await playbackPromise;
  } finally {
    inFlightVoiceFiles.delete(requestKey);
  }
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
