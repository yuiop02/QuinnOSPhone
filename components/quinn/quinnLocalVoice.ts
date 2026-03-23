import { buildQuinnBackendUrl, QUINN_BACKEND_BASE_URL } from './quinnEndpoints';

const QUINN_LOCAL_VOICE_BASE_URL = QUINN_BACKEND_BASE_URL;

export function getQuinnLocalVoiceBaseUrl(): string {
  return QUINN_LOCAL_VOICE_BASE_URL;
}

export function getQuinnLocalVoiceHealthUrl(): string {
  return buildQuinnBackendUrl('/voice-health');
}

export function getQuinnLocalVoiceSpeakUrl(text: string) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return `${buildQuinnBackendUrl('/voice-speak')}?text=${encodeURIComponent(clean)}`;
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
