import { buildQuinnBackendUrl, QUINN_BACKEND_BASE_URL } from './quinnEndpoints';
import {
  buildQuinnPacket,
  DEFAULT_QUINN_LENS_ID,
  type QuinnLensId,
} from './quinnLenses';
import type { MemoryResonanceItem, SessionArc } from './quinnTypes';

export const BACKEND_BASE_URL = QUINN_BACKEND_BASE_URL;
export const RUN_ENDPOINT = buildQuinnBackendUrl('/run');
export const TRANSCRIBE_ENDPOINT = buildQuinnBackendUrl('/transcribe');
export const FOLLOWUP_PACKET_ENDPOINT = buildQuinnBackendUrl('/followup-packet');

type RunPacketArgs = {
  packetTitle: string;
  packetText: string;
  lensId?: QuinnLensId;
  sessionArc?: SessionArc | null;
};

type RunPacketResult = {
  written: string;
  summary: string;
  timestamp: string;
  memoryResonance: MemoryResonanceItem[];
};

type TranscribeAudioArgs = {
  audioUri: string;
  fileName?: string;
  mimeType?: string;
  durationMillis: number;
  packetTitle: string;
  packetText: string;
  lastSummary: string;
};

type TranscribeAudioResult = {
  transcript: string;
  durationMillis: number;
  provider: string;
};

export type FollowUpPacket = {
  sessionName: string;
  focusText: string;
  summary: string;
  form: Record<string, string>;
};

function buildReadableError(status: number, fallback: string) {
  return `${fallback} (${status})`;
}

async function parseJsonSafely(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function buildCompressionSummary(text: string) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();

  if (!clean) {
    return 'Nothing to summarize yet. Run something, then Quinn will compress it into one clean spoken pass.';
  }

  const sentences = clean.match(/[^.!?]+[.!?]?/g) || [clean];
  const joined = sentences.slice(0, 2).join(' ').trim();

  return joined.length > 180 ? `${joined.slice(0, 177)}...` : joined;
}

export async function runQuinnPacket({
  packetTitle,
  packetText,
  lensId = DEFAULT_QUINN_LENS_ID,
  sessionArc = null,
}: RunPacketArgs): Promise<RunPacketResult> {
  const builtPacket = buildQuinnPacket({
    packetTitle,
    packetText,
    lensId,
    sessionArc,
  });

  const response = await fetch(RUN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      packet: builtPacket,
      prompt:
        'Run this QuinnOS packet. Give the strongest natural response to the signal. Default to clean prose unless the user clearly wants options, bullets, or a step-by-step structure. Use long-term memory only when it materially sharpens the answer.',
      packetTitle,
      packetText,
      projectTag: 'General',
    }),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      String(
        data?.error ||
          data?.message ||
          buildReadableError(response.status, 'Run request failed')
      )
    );
  }

  const written = String(
    data?.written ??
      data?.writtenResult ??
      data?.result ??
      data?.output ??
      ''
  ).trim();

  const summary = String(
    data?.summary ??
      data?.compressedSummary ??
      buildCompressionSummary(written || packetText)
  ).trim();

  const timestamp = String(
    data?.timestamp ||
      data?.ranAt ||
      new Date().toISOString()
  );
  const memoryResonance = Array.isArray(data?.memoryResonance)
    ? data.memoryResonance
        .map((item: any): MemoryResonanceItem => ({
          label: String(item?.label || '').trim(),
          preview: String(item?.preview || '').trim(),
        }))
        .filter((item: MemoryResonanceItem) => item.label || item.preview)
    : [];

  return {
    written,
    summary,
    timestamp,
    memoryResonance,
  };
}

export async function generateFollowupPacket({
  responseText,
  currentPacket,
}: {
  responseText: string;
  currentPacket: string;
}): Promise<FollowUpPacket> {
  const response = await fetch(FOLLOWUP_PACKET_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      responseText,
      currentPacket,
    }),
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      String(
        data?.error ||
          data?.message ||
          buildReadableError(response.status, 'Follow-up packet request failed')
      )
    );
  }

  const followUp = data?.followUp || {};

  return {
    sessionName: String(followUp.sessionName || 'Next move').trim(),
    focusText: String(followUp.focusText || '').trim(),
    summary: String(followUp.summary || '').trim(),
    form:
      followUp.form && typeof followUp.form === 'object'
        ? Object.fromEntries(
            Object.entries(followUp.form).map(([key, value]) => [
              key,
              String(value || '').trim(),
            ])
          )
        : {},
  };
}

export async function transcribeAudioFile({
  audioUri,
  fileName,
  mimeType,
  durationMillis,
  packetTitle,
  packetText,
  lastSummary,
}: TranscribeAudioArgs): Promise<TranscribeAudioResult> {
  const safeFileName =
    fileName ||
    audioUri.split('/').pop() ||
    `quinn-voice-${Date.now()}.m4a`;

  const formData = new FormData();

  formData.append('audio', {
    uri: audioUri,
    name: safeFileName,
    type: mimeType || 'audio/mp4',
  } as any);

  formData.append('durationMillis', String(durationMillis || 0));
  formData.append('packetTitle', String(packetTitle || ''));
  formData.append('packetText', String(packetText || ''));
  formData.append('lastSummary', String(lastSummary || ''));

  const response = await fetch(TRANSCRIBE_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    throw new Error(
      String(
        data?.error ||
          data?.message ||
          buildReadableError(response.status, 'Transcription request failed')
      )
    );
  }

  return {
    transcript: String(data?.transcript || '').trim(),
    durationMillis: Number(data?.durationMillis || durationMillis || 0),
    provider: String(data?.provider || 'unknown'),
  };
}
