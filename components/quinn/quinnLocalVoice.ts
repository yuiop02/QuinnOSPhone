import { buildQuinnBackendUrl, QUINN_BACKEND_BASE_URL } from './quinnEndpoints';

const QUINN_LOCAL_VOICE_BASE_URL = QUINN_BACKEND_BASE_URL;

export function getQuinnLocalVoiceBaseUrl(): string {
  return QUINN_LOCAL_VOICE_BASE_URL;
}

export function getQuinnLocalVoiceHealthUrl(): string {
  return buildQuinnBackendUrl('/voice-health');
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
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  const params = new URLSearchParams({
    text: clean,
  });
  const cleanPreviousText = normalizeVoiceQueryText(previousText);
  const cleanNextText = normalizeVoiceQueryText(nextText);

  if (cleanPreviousText) {
    params.set('previous_text', cleanPreviousText);
  }

  if (cleanNextText) {
    params.set('next_text', cleanNextText);
  }

  return `${buildQuinnBackendUrl('/voice-speak')}?${params.toString()}`;
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
