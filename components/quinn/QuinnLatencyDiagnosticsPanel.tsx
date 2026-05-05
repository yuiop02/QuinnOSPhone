import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildQuinnBackendUrl, QUINN_BACKEND_BASE_URL } from './quinnEndpoints';

type LatencyRecord = {
  id: string;
  label: string;
  url: string;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
  ok?: boolean;
  status?: number;
  error?: string;
  backendTimings?: any;
};

type Subscriber = (records: LatencyRecord[]) => void;

const subscribers = new Set<Subscriber>();
const MAX_RECORDS = 20;

let installed = false;
let records: LatencyRecord[] = [];

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return String((input as Request).url || input);
}

function labelForUrl(url: string) {
  const lower = url.toLowerCase();

  if (lower.includes('/run')) return 'run';
  if (lower.includes('/voice-speak/prepare')) return 'voice prepare';
  if (lower.includes('/voice-speak')) return 'voice speak';
  if (lower.includes('/voice-health')) return 'voice health';
  if (lower.includes('/voice-info')) return 'voice info';
  if (lower.endsWith('/health') || lower.includes('/health?')) return 'api health';

  if (
    lower.includes('quinnosbackend') ||
    lower.includes('quinn-voice') ||
    lower.includes('127.0.0.1:8787') ||
    lower.includes('localhost:8787')
  ) {
    return 'quinn network';
  }

  return '';
}

function emit() {
  const snapshot = [...records];
  for (const subscriber of subscribers) {
    subscriber(snapshot);
  }
}

function upsert(record: LatencyRecord) {
  records = [record, ...records.filter((item) => item.id !== record.id)].slice(0, MAX_RECORDS);
  emit();
}

export function subscribeQuinnLatencyDiagnostics(subscriber: Subscriber) {
  subscribers.add(subscriber);
  subscriber([...records]);

  return () => {
    subscribers.delete(subscriber);
  };
}

export function installQuinnLatencyDiagnostics() {
  if (installed) return;
  installed = true;

  const originalFetch = globalThis.fetch;

  if (typeof originalFetch !== 'function') return;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = getUrl(input);
    const label = labelForUrl(url);

    if (!label) {
      return originalFetch(input as any, init as any);
    }

    const startedAt = Date.now();
    const record: LatencyRecord = {
      id: makeId(),
      label,
      url,
      startedAt,
    };

    upsert(record);

    try {
      const response = await originalFetch(input as any, init as any);
      const endedAt = Date.now();

      let backendTimings = null;

      if (label === 'run') {
        try {
          const clonedResponse = typeof response.clone === 'function' ? response.clone() : null;
          const json = clonedResponse ? await clonedResponse.json() : null;
          backendTimings = json?.timings || null;
        } catch {
          backendTimings = null;
        }
      }

      upsert({
        ...record,
        endedAt,
        durationMs: endedAt - startedAt,
        ok: response.ok,
        status: response.status,
        backendTimings,
      });

      return response;
    } catch (error: any) {
      const endedAt = Date.now();

      upsert({
        ...record,
        endedAt,
        durationMs: endedAt - startedAt,
        ok: false,
        error: error?.message || 'Network request failed',
      });

      throw error;
    }
  };
}

function formatMs(value?: number) {
  if (typeof value !== 'number') return '—';
  if (value < 1000) return `${value}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

function latest(label: string, items: LatencyRecord[]) {
  return items.find((item) => item.label === label && typeof item.durationMs === 'number');
}

function latestVoice(items: LatencyRecord[]) {
  return items.find(
    (item) =>
      (item.label === 'voice speak' || item.label === 'voice prepare') &&
      typeof item.durationMs === 'number'
  );
}

function runToVoiceGap(items: LatencyRecord[]) {
  const run = latest('run', items);
  if (!run?.endedAt) return undefined;

  const voice = items
    .filter((item) => item.startedAt >= run.endedAt! && item.label.startsWith('voice'))
    .sort((a, b) => a.startedAt - b.startedAt)[0];

  if (!voice) return undefined;

  return voice.startedAt - run.endedAt;
}


function backendTimingMark(record: LatencyRecord | undefined, label: string) {
  const marks = record?.backendTimings?.marks;

  if (!Array.isArray(marks)) return undefined;

  const found = marks.find((mark: any) => mark?.label === label);
  return typeof found?.atMs === 'number' ? found.atMs : undefined;
}

function statusText(record?: LatencyRecord) {
  if (!record) return '—';
  if (record.error) return 'error';
  if (record.ok === false) return `bad ${record.status || ''}`.trim();
  if (record.ok === true) return 'ok';
  return '...';
}

export function QuinnLatencyDiagnosticsPanel() {
  const [items, setItems] = React.useState<LatencyRecord[]>([]);
  const [expanded, setExpanded] = React.useState(false);
  const [health, setHealth] = React.useState<{
    api?: string;
    voice?: string;
    provider?: string;
    model?: string;
  }>({});

  React.useEffect(() => {
    installQuinnLatencyDiagnostics();
    return subscribeQuinnLatencyDiagnostics(setItems);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      const next: typeof health = {};

      try {
        const apiRes = await fetch(buildQuinnBackendUrl('/health'));
        next.api = apiRes.ok ? 'online' : `bad ${apiRes.status}`;
      } catch {
        next.api = 'error';
      }

      try {
        const voiceRes = await fetch(buildQuinnBackendUrl('/voice-health'));
        next.voice = voiceRes.ok ? 'online' : `bad ${voiceRes.status}`;
      } catch {
        next.voice = 'error';
      }

      try {
        const infoRes = await fetch('https://quinn-voice-production.up.railway.app/voice-info');
        const info = await infoRes.json();
        next.provider = info?.provider || 'unknown';
        next.model = info?.modelId || 'unknown';
      } catch {
        next.provider = 'unknown';
        next.model = 'unknown';
      }

      if (!cancelled) setHealth(next);
    }

    loadHealth();
    const timer = setInterval(loadHealth, 30000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const run = latest('run', items);
  const voice = latestVoice(items);
  const apiHealth = latest('api health', items);
  const voiceHealth = latest('voice health', items);
  const gap = runToVoiceGap(items);

  const total =
    run?.startedAt && voice?.endedAt
      ? voice.endedAt - run.startedAt
      : undefined;

  const backendTimings = run?.backendTimings;
  const providerMs = backendTimings?.providerMs;
  const backendTotalMs = backendTimings?.totalMs;
  const memoryReadMs = backendTimingMark(run, 'memory_read');
  const inputBuiltMs = backendTimingMark(run, 'input_built');
  const providerReturnedMs = backendTimingMark(run, 'provider_returned');

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <Pressable style={styles.card} onPress={() => setExpanded((value) => !value)}>
        <View style={styles.row}>
          <Text style={styles.title}>LATENCY DEBUG</Text>
          <Text style={styles.status}>
            API {health.api || statusText(apiHealth)} • Voice {health.voice || statusText(voiceHealth)}
          </Text>
        </View>

        <Text style={styles.line}>
          Run {formatMs(run?.durationMs)} • Voice {formatMs(voice?.durationMs)} • Total {formatMs(total)}
        </Text>

        {expanded ? (
          <View style={styles.details}>
            <Text style={styles.detail}>Backend: {QUINN_BACKEND_BASE_URL}</Text>
            <Text style={styles.detail}>Provider: {health.provider || '—'} • Model: {health.model || '—'}</Text>
            <Text style={styles.detail}>Run → voice gap: {formatMs(gap)}</Text>
            <Text style={styles.detail}>Backend total: {formatMs(backendTotalMs)} • Provider: {formatMs(providerMs)}</Text>
            <Text style={styles.detail}>Memory: {formatMs(memoryReadMs)} • Input: {formatMs(inputBuiltMs)} • Provider returned: {formatMs(providerReturnedMs)}</Text>
            {items.slice(0, 7).map((item) => (
              <Text key={item.id} style={styles.detail}>
                {item.label}: {formatMs(item.durationMs)} {item.ok === false ? 'error' : ''}
              </Text>
            ))}
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 34,
    zIndex: 999999,
    elevation: 999999,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255, 230, 120, 0.95)',
    backgroundColor: 'rgba(35, 0, 55, 0.97)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 190,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: '#f5d7ff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  status: {
    color: '#c8b6d8',
    fontSize: 10,
    fontWeight: '700',
  },
  line: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  details: {
    marginTop: 8,
    gap: 3,
  },
  detail: {
    color: '#c8b6d8',
    fontSize: 10,
    lineHeight: 13,
  },
});
