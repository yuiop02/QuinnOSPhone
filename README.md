# QuinnOSPhone

QuinnOSPhone is the Expo / React Native frontend for QuinnOS.

The main product surface is the Quinn 2.0 homepage conversation screen in [app/(tabs)/index.tsx](C:/Users/mrbro/QuinnOSPhone/app/(tabs)/index.tsx). The app is designed around a premium single-response conversation experience, backend-assisted memory-aware writing, and buffered voice playback.

## Frontend Commands

```bash
npm install
npm run start
npm run web
npm run typecheck
npm run lint
npm run check
```

## Backend Pairing

The frontend talks to the Node backend in `C:\Users\mrbro\QuinnOSBackend`.

Useful backend commands:

```bash
cd C:\Users\mrbro\QuinnOSBackend
npm install
npm run start
npm run voice
npm run check
```

## Local Web Preview

For local web preview on this laptop, the frontend automatically falls back to:

- backend: `http://127.0.0.1:8787`

On mobile / Expo Go, it keeps using the shared public tunnel configured in [components/quinn/quinnEndpoints.ts](C:/Users/mrbro/QuinnOSPhone/components/quinn/quinnEndpoints.ts).

To use the full local web flow:

1. Start the backend on `8787`
2. Start the Fish voice server on `8788`
3. Run `npm run web`

Health endpoints:

- backend: `http://127.0.0.1:8787/health`
- voice proxy: `http://127.0.0.1:8787/voice-health`
- Fish voice server: `http://127.0.0.1:8788/health`

## Important Frontend Files

- [app/(tabs)/index.tsx](C:/Users/mrbro/QuinnOSPhone/app/(tabs)/index.tsx): Quinn 2.0 homepage and main conversation flow
- [components/quinn/quinnApi.ts](C:/Users/mrbro/QuinnOSPhone/components/quinn/quinnApi.ts): `/run` and `/transcribe` client calls
- [components/quinn/quinnLocalVoice.ts](C:/Users/mrbro/QuinnOSPhone/components/quinn/quinnLocalVoice.ts): voice health/speak URL helpers
- [components/quinn/quinnEndpoints.ts](C:/Users/mrbro/QuinnOSPhone/components/quinn/quinnEndpoints.ts): shared backend base URL selection
- [components/quinn/quinnSpeechText.ts](C:/Users/mrbro/QuinnOSPhone/components/quinn/quinnSpeechText.ts): pure spoken-text and chunking helpers
- [components/quinn/quinnStorage.ts](C:/Users/mrbro/QuinnOSPhone/components/quinn/quinnStorage.ts): homepage persistence / hydration
- [components/quinn/quinnRunArtifacts.ts](C:/Users/mrbro/QuinnOSPhone/components/quinn/quinnRunArtifacts.ts): run-history / memory shaping

## Product Guardrails

- Quinn 2.0 homepage is the main experience
- Keep one response card only
- Keep the fixed header and top fade working
- Keep the dark cosmic premium visual direction
- Keep the current 2-chunk buffered voice architecture unless there is a strong reason to change it
- `handleSpeakQuinnText(text)` should always speak the passed text

## Notes

- The repo still uses Expo Router, but the product is intentionally centered on the homepage instead of a multi-tab starter layout.
- The hidden `explore` and `modal` template routes now redirect back to home so generic Expo starter content does not leak into the product.
