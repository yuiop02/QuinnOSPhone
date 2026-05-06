import { buildQuinnBackendUrl, QUINN_BACKEND_BASE_URL } from './quinnEndpoints';
import {
  buildQuinnPacket,
  DEFAULT_QUINN_LENS_ID,
  type QuinnLensId,
} from './quinnLenses';
import type { MemoryResonanceItem, SessionArc } from './quinnTypes';

export const BACKEND_BASE_URL = QUINN_BACKEND_BASE_URL;
export const RUN_ENDPOINT = buildQuinnBackendUrl('/run');
export const RUN_STREAM_LITE_ENDPOINT = buildQuinnBackendUrl('/run-stream-lite');
export const TRANSCRIBE_ENDPOINT = buildQuinnBackendUrl('/transcribe');
export const FOLLOWUP_PACKET_ENDPOINT = buildQuinnBackendUrl('/followup-packet');

type RunPacketArgs = {
  packetTitle: string;
  packetText: string;
  lensId?: QuinnLensId;
  sessionArc?: SessionArc | null;
  previousAssistantReply?: string;
  threadId?: string;
};

type RunPacketResult = {
  written: string;
  summary: string;
  timestamp: string;
  memoryResonance: MemoryResonanceItem[];
};

type RunPacketStreamLiteArgs = RunPacketArgs & {
  onDelta?: (text: string) => void;
  onStatus?: (status: string) => void;
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
  'speaker contract',
  'speaker position',
  'speaker persona literalness',
  'offscreen self allowance',
  'role validation risk',
  'meta role clarification',
  'offscreen self disallowed',
  'premise challenge',
  'reality anchor mode',
  'assistant self-claim risk',
  'suppress concrete self-status',
  'frame rejection',
  'social frame mode',
  'user requests realignment',
  'suppress escalated bounceback',
  'assistant persona literalness',
  'concrete self-claim suppression',
  'self-status specificity risk',
  'casual status restraint',
  'draft commentary allowance',
  'recipient role',
  'flirt transfer suppression',
  'recipient boundary risk',
  'recipient invite leak risk',
  'reply presentation mode',
  'explicit multi-option ask',
  'explicit playful invite',
  'explicit recipient flirt invite',
  'explicit invitation ask',
  'single-line draft request',
  'third-party draft mode',
  'third-party greeting mode',
  'professional tone guard',
  'option menu suppression',
  'clarification override',
  'interpretation replacement',
  'clarification type',
  'correction latch',
  'constraint priority',
  'repeat guard',
  'acknowledgment style',
  'active thread continuity',
  'live subject dominance',
  'thread carryover mode',
  'stale frame risk',
  'stale template interrupt',
  'direct complaint about conversation',
  'suppress template reuse',
  'frame continuation',
  'conversational coherence priority',
  'grounded reply mode',
  'style override risk',
  'stale pattern pressure',
  'turn role anchor',
  'previous assistant asked question',
  'adjacency mode',
  'suppress assistant status pattern',
  'local course correction',
  'thread continuity policy',
  'thread continuity control',
  'speaker contract control',
  'conversational coherence',
  'turn role policy',
  'speaker contract policy',
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


type ParsedSseEvent = {
  event: string;
  data: any;
};

function parseRunStreamSseBlock(block: string): ParsedSseEvent {
  const lines = block.split(/\r?\n/);
  let event = 'message';
  let dataText = '';

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
    }

    if (line.startsWith('data:')) {
      dataText += line.slice('data:'.length).trim();
    }
  }

  let data: any = null;

  try {
    data = dataText ? JSON.parse(dataText) : null;
  } catch {
    data = dataText;
  }

  return { event, data };
}

export async function runQuinnPacketStreamLite({
  packetTitle,
  packetText,
  lensId = DEFAULT_QUINN_LENS_ID,
  sessionArc = null,
  previousAssistantReply = '',
  threadId = '',
  onDelta,
  onStatus,
}: RunPacketStreamLiteArgs): Promise<RunPacketResult> {
  const builtPacket = buildQuinnPacket({
    packetTitle,
    packetText,
    lensId,
    sessionArc,
    previousAssistantReply,
  });
  const cleanPreviousAssistantReply = sanitizeQuinnVisibleReplyText(previousAssistantReply);

  // STREAM_LITE_RAW_CURRENT_PACKET_V1
  const currentPacketForStreamLite = [
    'CURRENT RAW USER TEXT - ANSWER THIS FIRST AND LITERALLY',
    String(packetText || '').trim(),
    'PACKET TITLE',
    String(packetTitle || '').trim(),
    'FULL QUINNOS PACKET - USE ONLY AFTER THE RAW USER TEXT IS ANSWERED',
    builtPacket,
  ].join('\n\n');

  return new Promise<RunPacketResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    let processedLength = 0;
    let buffer = '';
    let liveOutput = '';
    let doneData: any = null;
    let settled = false;

    function settleResolve(result: RunPacketResult) {
      if (settled) return;
      settled = true;
      resolve(result);
    }

    function settleReject(error: Error) {
      if (settled) return;
      settled = true;
      reject(error);
    }

    function handleBlock(block: string) {
      if (!block.trim()) return;

      const { event, data } = parseRunStreamSseBlock(block);

      if (event === 'ready') {
        onStatus?.('Stream ready...');
      }

      if (event === 'delta' && data?.text) {
        liveOutput += String(data.text || '');
        onDelta?.(liveOutput);
        onStatus?.(`Streaming... ${data.elapsedMs || ''}ms`);
      }

      if (event === 'done') {
        doneData = data || {};
        const written = sanitizeQuinnVisibleReplyText(doneData?.output || liveOutput);
        const summary = buildCompressionSummary(written || packetText);
        const timestamp = String(doneData?.timestamp || doneData?.ranAt || new Date().toISOString());

        settleResolve({
          written,
          summary,
          timestamp,
          memoryResonance: Array.isArray(doneData?.memoryResonance)
            ? doneData.memoryResonance
                .map((item: any): MemoryResonanceItem => ({
                  label: String(item?.label || '').trim(),
                  preview: String(item?.preview || '').trim(),
                }))
                .filter((item: MemoryResonanceItem) => item.label || item.preview)
            : [],
        });
      }

      if (event === 'error') {
        settleReject(new Error(String(data?.error || 'Run stream failed')));
      }
    }

    function consumeResponseText(responseText: string) {
      if (responseText.length <= processedLength) return;

      const nextChunk = responseText.slice(processedLength);
      processedLength = responseText.length;
      buffer += nextChunk;

      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        handleBlock(block);
      }
    }

    xhr.open('POST', RUN_STREAM_LITE_ENDPOINT, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.timeout = 60000;

    xhr.onprogress = () => {
      try {
        consumeResponseText(xhr.responseText || '');
      } catch (error: any) {
        settleReject(error instanceof Error ? error : new Error(String(error || 'Stream parse failed')));
      }
    };

    xhr.onreadystatechange = () => {
      try {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          consumeResponseText(xhr.responseText || '');
        }

        if (xhr.readyState === 4) {
          if (xhr.status < 200 || xhr.status >= 300) {
            settleReject(
              new Error(
                `Run stream failed: ${xhr.status} ${String(xhr.responseText || '').slice(0, 180)}`
              )
            );
            return;
          }

          if (buffer.trim()) {
            handleBlock(buffer);
            buffer = '';
          }

          if (!doneData && !settled) {
            const written = sanitizeQuinnVisibleReplyText(liveOutput);
            settleResolve({
              written,
              summary: buildCompressionSummary(written || packetText),
              timestamp: new Date().toISOString(),
              memoryResonance: [],
            });
          }
        }
      } catch (error: any) {
        settleReject(error instanceof Error ? error : new Error(String(error || 'Stream failed')));
      }
    };

    xhr.onerror = () => {
      settleReject(new Error('Run stream network error'));
    };

    xhr.ontimeout = () => {
      settleReject(new Error('Run stream timed out'));
    };

    xhr.send(
      JSON.stringify({
        packet: currentPacketForStreamLite,
        prompt:
          'Answer the CURRENT RAW USER TEXT first. Obey explicit output constraints exactly. Do not reality-check, reinterpret, or get clever unless the raw text asks for that. Keep Ren voice natural, direct, concise, and conversational.',
        packetTitle,
        packetText,
        previousAssistantReply: cleanPreviousAssistantReply,
        threadId: String(threadId || '').trim(),
        projectTag: 'General',
      })
    );
  });
}


export async function runQuinnPacket({
  packetTitle,
  packetText,
  lensId = DEFAULT_QUINN_LENS_ID,
  sessionArc = null,
  previousAssistantReply = '',
  threadId = '',
}: RunPacketArgs): Promise<RunPacketResult> {
  const builtPacket = buildQuinnPacket({
    packetTitle,
    packetText,
    lensId,
    sessionArc,
    previousAssistantReply,
  });
  const cleanPreviousAssistantReply = sanitizeQuinnVisibleReplyText(
    previousAssistantReply
  );

  const rawCurrentText = String(packetText || '').trim();
  const currentPacketForRun = [
    'CURRENT RAW USER TEXT - ANSWER THIS FIRST AND LITERALLY',
    rawCurrentText,
    'PACKET TITLE',
    String(packetTitle || '').trim(),
    'FULL QUINNOS PACKET - BACKGROUND ONLY; NEVER OVERRIDE THE RAW USER TEXT',
    builtPacket,
  ].join('\n\n');

  const response = await fetch(RUN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      packet: currentPacketForRun,
      prompt:
        'Answer the CURRENT RAW USER TEXT first. Obey explicit output constraints exactly. If the raw text is a technical check, answer the technical check plainly. Do not reality-check, reinterpret, diagnose, or get clever unless the raw text asks for that. Use Ren voice only after obedience: natural, direct, concise, warm, and conversational. Do not use "if you want" endings.',
      packetTitle,
      packetText: rawCurrentText,
      previousAssistantReply: cleanPreviousAssistantReply,
      threadId: String(threadId || '').trim(),
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
  const summary = summaryCandidate || buildCompressionSummary(written || rawCurrentText);

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
