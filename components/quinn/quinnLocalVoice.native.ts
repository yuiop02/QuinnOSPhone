import { Directory, File, Paths } from 'expo-file-system';
import {
  buildVoiceSpeakPayload,
  getQuinnLocalVoiceSpeakRequestKey,
  getQuinnLocalVoiceSpeakUrl,
  getQuinnLocalVoiceBaseUrl,
  getQuinnLocalVoiceHealthUrl,
  getQuinnVoicePlaybackStartDelayMs,
  isQuinnLocalVoiceRemoteSource,
  parseJsonSafely,
  pingQuinnLocalVoice,
  prepareQuinnLocalVoiceSpeakUrl,
  VOICE_POST_SPEAK_ENDPOINT,
} from './quinnLocalVoice.shared';

const LOCAL_VOICE_PLAYBACK_DIR = new Directory(Paths.cache, 'quinn-voice-playback');
const LOCAL_VOICE_FILE_TTL_MS = 15 * 60 * 1000;
const MAX_LOCAL_VOICE_FILES = 24;
const cachedVoiceFiles = new Map<string, { uri: string; createdAt: number }>();
const inFlightVoiceFiles = new Map<string, Promise<string>>();

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

export {
  getQuinnLocalVoiceBaseUrl,
  getQuinnLocalVoiceHealthUrl,
  getQuinnLocalVoiceSpeakRequestKey,
  getQuinnLocalVoiceSpeakUrl,
  getQuinnVoicePlaybackStartDelayMs,
  isQuinnLocalVoiceRemoteSource,
  pingQuinnLocalVoice,
  prepareQuinnLocalVoiceSpeakUrl,
};
