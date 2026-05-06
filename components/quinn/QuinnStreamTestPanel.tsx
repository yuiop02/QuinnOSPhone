import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildQuinnBackendUrl } from './quinnEndpoints';

type StreamTiming = {
  totalMs?: number | null;
  firstDeltaMs?: number | null;
};

function decodeChunk(value: Uint8Array) {
  const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

  if (decoder) {
    return decoder.decode(value, { stream: true });
  }

  let result = '';
  for (let index = 0; index < value.length; index += 1) {
    result += String.fromCharCode(value[index]);
  }

  return result;
}

function parseSseBlock(block: string) {
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

export function QuinnStreamTestPanel() {
  const [isRunning, setIsRunning] = React.useState(false);
  const [status, setStatus] = React.useState('Idle');
  const [output, setOutput] = React.useState('');
  const [timings, setTimings] = React.useState<StreamTiming | null>(null);
  const [readerMode, setReaderMode] = React.useState<'unknown' | 'streaming' | 'fallback'>('unknown');

  async function runStreamTest() {
    setIsRunning(true);
    setStatus('Starting stream...');
    setOutput('');
    setTimings(null);
    setReaderMode('unknown');

    try {
      const response = await fetch(buildQuinnBackendUrl('/stream-test'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt:
            'Give me one short Ren paragraph about why streaming makes QuinnOS feel faster. Keep it conversational.',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Stream test failed: ${response.status} ${text.slice(0, 160)}`);
      }

      const body: any = response.body;

      if (!body || typeof body.getReader !== 'function') {
        setReaderMode('fallback');
        setStatus('No streaming reader available in this build; showing full response at end.');
        const text = await response.text();
        setOutput(text);
        return;
      }

      setReaderMode('streaming');
      setStatus('Streaming...');
      const reader = body.getReader();

      let buffer = '';
      let liveOutput = '';

      while (true) {
        const result = await reader.read();

        if (result.done) {
          break;
        }

        buffer += decodeChunk(result.value);

        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          if (!block.trim()) continue;

          const { event, data } = parseSseBlock(block);

          if (event === 'ready') {
            setStatus('Stream ready...');
          }

          if (event === 'delta' && data?.text) {
            liveOutput += data.text;
            setOutput(liveOutput);
            setStatus(`Streaming... ${data.elapsedMs || ''}ms`);
          }

          if (event === 'done') {
            setOutput(data?.output || liveOutput);
            setTimings(data?.timings || null);
            setStatus('Done');
          }

          if (event === 'error') {
            throw new Error(data?.error || 'Streaming error');
          }
        }
      }

      setStatus((current) => (current === 'Done' ? current : 'Done'));
    } catch (error: any) {
      setStatus(error?.message || 'Stream test failed');
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.kicker}>STREAM TEST</Text>
          <Text style={styles.status}>{readerMode === 'streaming' ? 'live' : readerMode}</Text>
        </View>

        <Text style={styles.description}>
          Checks whether the app can show Ren text as chunks arrive instead of waiting for the full response.
        </Text>

        <Pressable style={styles.button} onPress={runStreamTest} disabled={isRunning}>
          <Text style={styles.buttonText}>{isRunning ? 'Streaming...' : 'Run stream test'}</Text>
        </Pressable>

        <Text style={styles.statusLine}>{status}</Text>

        {timings ? (
          <Text style={styles.timingLine}>
            First delta {timings.firstDeltaMs ?? '—'}ms • Total {timings.totalMs ?? '—'}ms
          </Text>
        ) : null}

        {output ? <Text style={styles.output}>{output}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 16,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(244, 184, 255, 0.38)',
    backgroundColor: 'rgba(20, 4, 34, 0.72)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    color: '#ffd7ff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  status: {
    color: '#dac7e8',
    fontSize: 12,
    fontWeight: '800',
  },
  description: {
    color: '#cab8d7',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 7,
  },
  button: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 230, 120, 0.74)',
    backgroundColor: 'rgba(92, 27, 116, 0.75)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  statusLine: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },
  timingLine: {
    color: '#ffe678',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  output: {
    color: '#efe2f7',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 10,
  },
});
