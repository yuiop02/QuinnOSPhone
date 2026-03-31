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

const INTERNAL_REPLY_SECTION_LABELS = new Set([
  'background context',
  'freshness guard',
  'quiet background that may help',
  'background that may help here',
  'reply stance',
  'default feel',
  'the live note to respond to',
  'same thread',
  'recent flow',
  'open / write',
  'open/write',
  'project tag',
  'mode',
  'ask',
  'task',
  'output',
  'context',
  'correction latch',
  'constraint priority',
  'repeat guard',
  'acknowledgment style',
  'local course correction',
]);

function joinCleanParts(parts: string[], separator = '\n\n') {
  return parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(separator)
    .trim();
}

function stripFenceWrapper(text: string) {
  const match = String(text || '')
    .trim()
    .match(/^```(?:json|javascript|js|typescript|ts|txt)?\s*([\s\S]*?)```$/i);

  return match ? String(match[1] || '').trim() : String(text || '').trim();
}

function tryParseStructuredText(text: string): unknown | null {
  const candidates = [String(text || '').trim(), stripFenceWrapper(text)];

  for (const candidate of candidates) {
    if (!candidate || (!candidate.startsWith('{') && !candidate.startsWith('['))) {
      continue;
    }

    try {
      return JSON.parse(candidate);
    } catch {
      // Keep falling through to the plain-text cleanup path.
    }
  }

  return null;
}

function extractStructuredAssistantText(
  value: unknown,
  seen = new Set<unknown>()
): string {
  if (typeof value === 'string') {
    return String(value || '').trim();
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  if (seen.has(value)) {
    return '';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return joinCleanParts(
      value.map((item) => extractStructuredAssistantText(item, seen))
    );
  }

  const record = value as Record<string, unknown>;
  const type = String(record.type || '')
    .trim()
    .toLowerCase();

  if (
    type.includes('reasoning') ||
    type.includes('tool') ||
    type.includes('function') ||
    type.includes('web_search') ||
    type.includes('file_search')
  ) {
    return '';
  }

  if (type === 'message' && Array.isArray(record.content)) {
    return joinCleanParts(
      record.content.map((item) => extractStructuredAssistantText(item, seen))
    );
  }

  if ((type === 'output_text' || type === 'text') && typeof record.text === 'string') {
    return String(record.text || '').trim();
  }

  if ((type === 'output_text' || type === 'text') && typeof record.value === 'string') {
    return String(record.value || '').trim();
  }

  if (typeof record.output_text === 'string' && String(record.output_text || '').trim()) {
    return String(record.output_text || '').trim();
  }

  if (Array.isArray(record.output)) {
    const outputText = joinCleanParts(
      record.output.map((item) => extractStructuredAssistantText(item, seen))
    );

    if (outputText) {
      return outputText;
    }
  }

  if (Array.isArray(record.content)) {
    const contentText = joinCleanParts(
      record.content.map((item) => extractStructuredAssistantText(item, seen))
    );

    if (contentText) {
      return contentText;
    }
  }

  for (const key of ['written', 'writtenResult', 'message', 'result', 'response', 'data']) {
    const nested = extractStructuredAssistantText(record[key], seen);

    if (nested) {
      return nested;
    }
  }

  return '';
}

function countInternalLeakMarkers(text: string) {
  const clean = String(text || '').toLowerCase();
  let count = 0;

  for (const label of INTERNAL_REPLY_SECTION_LABELS) {
    if (clean.includes(label)) {
      count += 1;
    }
  }

  if (/rs_[\w-]+/i.test(text)) {
    count += 2;
  }

  if (/"type"\s*:\s*"reasoning"|type\s*:\s*reasoning/i.test(text)) {
    count += 2;
  }

  if (/"summary"\s*:\s*\[\s*\]|summary\s*:\s*\[\s*\]/i.test(text)) {
    count += 1;
  }

  return count;
}

function isInternalMetadataBlock(block: string) {
  const trimmed = String(block || '').trim();

  if (!trimmed) {
    return true;
  }

  const firstLine = String(trimmed.split('\n')[0] || '')
    .trim()
    .replace(/:$/, '')
    .toLowerCase();

  if (INTERNAL_REPLY_SECTION_LABELS.has(firstLine)) {
    return true;
  }

  if (
    /rs_[\w-]+/i.test(trimmed) ||
    /"type"\s*:\s*"reasoning"|type\s*:\s*reasoning/i.test(trimmed) ||
    /"summary"\s*:\s*\[\s*\]|summary\s*:\s*\[\s*\]/i.test(trimmed)
  ) {
    return true;
  }

  if (/^[\[{]/.test(trimmed) && /"type"\s*:|"id"\s*:|"summary"\s*:|rs_/i.test(trimmed)) {
    return true;
  }

  return false;
}

function stripMetadataLines(text: string) {
  return String(text || '')
    .split('\n')
    .filter((line) => {
      const trimmed = String(line || '').trim();

      if (!trimmed) {
        return true;
      }

      if (
        /^rs_[\w-]+$/i.test(trimmed) ||
        /^id\s*:\s*rs_[\w-]+$/i.test(trimmed) ||
        /^type\s*:\s*reasoning$/i.test(trimmed) ||
        /^summary\s*:\s*\[\s*\]$/i.test(trimmed) ||
        /^"id"\s*:\s*"rs_[^"]+"\s*,?$/i.test(trimmed) ||
        /^"type"\s*:\s*"reasoning"\s*,?$/i.test(trimmed) ||
        /^"summary"\s*:\s*\[\s*\]\s*,?$/i.test(trimmed) ||
        /^[\[\]{},]+$/.test(trimmed)
      ) {
        return false;
      }

      return true;
    })
    .join('\n');
}

export function sanitizeQuinnVisibleReplyText(value: unknown): string {
  const raw = typeof value === 'string' ? value : String(value ?? '');
  const parsed = tryParseStructuredText(raw);
  const extracted = parsed ? extractStructuredAssistantText(parsed) : '';
  let clean = String(extracted || raw || '').replace(/\r\n?/g, '\n').trim();

  if (!clean) {
    return '';
  }

  if (countInternalLeakMarkers(clean) >= 2) {
    const cleanedBlocks = clean
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter((block) => block && !isInternalMetadataBlock(block));

    if (cleanedBlocks.length) {
      clean = cleanedBlocks.join('\n\n').trim();
    }
  }

  clean = stripMetadataLines(clean)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return clean;
}

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
      'Reply like another me in the same headspace, not like someone helping from the outside. First notice whether I am exploring, venting, riffing, conflicted, casually talking, or actually asking for advice. If I am exploring or just talking, stay with the thought and bounce it back instead of solving too fast. If the thought is still discovering itself, build with it instead of compressing it into a smaller cleaner answer. If I clearly want a move, options, or a plan, then be direct and useful. Match the note’s energy implicitly through cadence, sentence length, sharpness, softness, humor density, and directness. Let the same Quinn voice also show more texture when it fits: drier, warmer, more amused, more blunt, more lightly exasperated, or more locked into the idea, without turning into a different persona. Mirror with judgment, not obedience. If the note is dressing something up, hiding inside vagueness, or calling avoidance confusion, challenge that cleanly when the signal is strong enough. If the latest note is correcting, rejecting, or invalidating part of the previous move, clock that quickly and pivot instead of continuing the old frame. When a new blocker shows up, let feasibility override the earlier hype or wanting. If repetition just got called out, do not reuse the same joke, premise, or phrasing in slightly different words. A brief natural acknowledgment is enough; do not turn it into apology theater. Let the ending stop where the point actually lands. Do not default to recap sentences, thread-extender questions, or assistant-style completion lines. Ask a follow-up question only if it is genuinely the strongest move, not because silence feels unsafe or because the thread needs help staying alive. If the packet cues pull in different directions, let the conductor decide how much room, edge, question-restraint, structural noticing, and course-correction the reply actually needs. Let the polish cue handle final taste: when to hold two candidate framings in the air, how much warmth is actually right, whether a micro-turn wants a tiny beat or a live latch, what residue to strip out before landing, how to avoid repeating Quinn’s own pawprints, and when one notch of surprise is truer than the safest good option. Say what you actually think in natural prose, usually one to three short paragraphs. Do not default to steps, options, or a how-to unless I clearly asked for that or the thought truly needs structure. If I am not asking for help, do not tack on suggestions, soft next moves, a decorative question, or a helpful reframe at the end just to land the reply. Let memory change what you assume, skip, sharpen, and emphasize without narrating the remembering process. Do not quote old facts back just to prove continuity, and avoid phrases like "you previously said" unless direct grounding is genuinely needed.',
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

  const written = sanitizeQuinnVisibleReplyText(
    data?.written ??
      data?.writtenResult ??
      data?.result ??
      data?.output ??
      ''
  );

  const summaryCandidate = sanitizeQuinnVisibleReplyText(
    data?.summary ??
      data?.compressedSummary ??
      ''
  );
  const summary = summaryCandidate || buildCompressionSummary(written || packetText);

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
    focusText: sanitizeQuinnVisibleReplyText(followUp.focusText || ''),
    summary: sanitizeQuinnVisibleReplyText(followUp.summary || ''),
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
