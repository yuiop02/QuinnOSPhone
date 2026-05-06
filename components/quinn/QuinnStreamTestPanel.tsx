import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildQuinnBackendUrl } from './quinnEndpoints';

type StreamTiming = {
  totalMs?: number | null;
  firstDeltaMs?: number | null;
};

type ParsedSseEvent = {
  event: string;
  data: any;
};

function parseSseBlock(block: string): ParsedSseEvent {
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
  const [readerMode, setReaderMode] = React.useState<
    'idle' | 'xhr' | 'xhr-live' | 'xhr-full-end' | 'error'
  >('idle');

  async function runStreamTest() {
    setIsRunning(true);
    setStatus('Starting real Ren stream...');
    setOutput('');
    setTimings(null);
    setReaderMode('xhr');

    const startedAt = Date.now();
    const url = buildQuinnBackendUrl('/run-stream-lite');

    let processedLength = 0;
    let buffer = '';
    let liveOutput = '';
    let sawDeltaBeforeDone = false;
    let isDone = false;

    function handleBlock(block: string) {
      if (!block.trim()) return;

      const { event, data } = parseSseBlock(block);

      if (event === 'ready') {
        setStatus('Stream ready...');
      }

      if (event === 'delta' && data?.text) {
        liveOutput += data.text;
        sawDeltaBeforeDone = true;
        setReaderMode('xhr-live');
        setOutput(liveOutput);
        setStatus(`Streaming live... ${data.elapsedMs || Date.now() - startedAt}ms`);
      }

      if (event === 'done') {
        isDone = true;
        setOutput(data?.output || liveOutput);
        setTimings(data?.timings || null);
        setReaderMode(sawDeltaBeforeDone ? 'xhr-live' : 'xhr-full-end');
        setStatus(sawDeltaBeforeDone ? 'Done, streamed live' : 'Done, but arrived all at end');
      }

      if (event === 'error') {
        throw new Error(data?.error || 'Streaming error');
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

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', 'text/event-stream');
        xhr.timeout = 60000;

        xhr.onprogress = () => {
          try {
            consumeResponseText(xhr.responseText || '');
          } catch (error) {
            reject(error);
          }
        };

        xhr.onreadystatechange = () => {
          try {
            if (xhr.readyState === 3 || xhr.readyState === 4) {
              consumeResponseText(xhr.responseText || '');
            }

            if (xhr.readyState === 4) {
              if (xhr.status < 200 || xhr.status >= 300) {
                reject(
                  new Error(
                    `XHR run stream failed: ${xhr.status} ${String(xhr.responseText || '').slice(0, 180)}`
                  )
                );
                return;
              }

              if (buffer.trim()) {
                handleBlock(buffer);
                buffer = '';
              }

              if (!isDone) {
                setReaderMode(sawDeltaBeforeDone ? 'xhr-live' : 'xhr-full-end');
                setStatus(sawDeltaBeforeDone ? 'Stream ended' : 'Stream ended without live deltas');
              }

              resolve();
            }
          } catch (error) {
            reject(error);
          }
        };

        xhr.onerror = () => {
          reject(new Error('XHR run stream network error'));
        };

        xhr.ontimeout = () => {
          reject(new Error('XHR run stream timed out'));
        };

        xhr.send(
          JSON.stringify({
            packet:
              'Run-stream-lite in-app check: give me one short Ren paragraph about XHR streaming working inside QuinnOS now. Keep it casual and not too technical.',
            prompt: 'Reply naturally as Ren. One short paragraph. No list.',
            projectTag: 'QuinnOS',
            threadId: 'in-app-run-stream-lite-test',
          })
        );
      });
    } catch (error: any) {
      setReaderMode('error');
      setStatus(error?.message || 'Run stream test failed');
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.kicker}>RUN STREAM LITE</Text>
          <Text style={styles.status}>{readerMode}</Text>
        </View>

        <Text style={styles.description}>
          Tests the real lightweight Ren streaming route before we wire it into the main conversation flow.
        </Text>

        <Pressable style={styles.button} onPress={runStreamTest} disabled={isRunning}>
          <Text style={styles.buttonText}>{isRunning ? 'Streaming...' : 'Run real stream test'}</Text>
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
