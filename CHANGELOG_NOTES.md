# CHANGELOG_NOTES

## Overview of the current QuinnOS state

QuinnOS is currently split across two repos:

- `C:\Users\mrbro\QuinnOSPhone`
- `C:\Users\mrbro\QuinnOSBackend`

The current product shape is still:

- homepage-first Quinn 2.0 flow
- one response card
- fixed header and top fade
- dark premium QuinnOS look
- hosted backend on Railway
- ElevenLabs voice with the same custom `ELEVENLABS_VOICE_ID`

Behavior-wise, the current app is a layered result of many surgical fixes rather than a few neat feature commits. Some important work was bundled under misleading commit messages, so use this file as the real map before future refactors.

## Important behavior changes by commit

### Frontend repo: `C:\Users\mrbro\QuinnOSPhone`

- `fbc51b9bf64e248c3e172da7caf49a2f023214cf`
  - Message: `Fix start fresh thread reset and numbered option continuity`
  - What changed:
    - `Start fresh` began clearing current-thread continuity instead of only clearing UI text.
    - Bare numeric replies like `1`, `2`, `option 2` began resolving against Quinn's immediately previous numbered list in the active thread.
  - Files:
    - `app/(tabs)/index.tsx`

- `1eb7fc4c6dd317fa6707884e1952d0b9827e1df0`
  - Message: `Fix speech chunking for numbered lists`
  - What changed:
    - speech-only text normalization was added so numbered lists would not collapse into bare numerals during TTS.
    - this is the first key commit in the list-reading fix chain.
  - Files:
    - `components/quinn/quinnSpeechText.ts`

- `042fcf6fea6a812749639b0d4c02c6a727aafb87`
  - Message: `Tighten Quinn speech finish guards for Android chunk playback`
  - What changed:
    - tightened `didJustFinish` handling for Android chunk playback.
    - reduced stale/duplicate finish-event advancement risk.
  - Files:
    - `app/(tabs)/index.tsx`

- `c4e728124fe5e38c3ed5d6a440b76f7d61406943`
  - Message: `Fix Quinn state restore, rerun flow, and shared voice prep`
  - What changed:
    - stabilized rerun/restore behavior.
    - aligned `VoiceMode` with shared speech prep instead of drifting into its own logic.
  - Files:
    - `app/(tabs)/index.tsx`
    - `components/quinn/HomeTileGrid.tsx`
    - `components/quinn/VoiceMode.tsx`

- `8181516a24ceabadb48921e04e7e58083336d62b`
  - Message: `Improve Quinn voice expression and chunk continuity`
  - What changed:
    - added frontend continuity-hint plumbing for chunked voice requests.
    - improved speech-only shaping and chunk continuity behavior.
  - Files:
    - `app/(tabs)/index.tsx`
    - `components/quinn/VoiceMode.tsx`
    - `components/quinn/quinnLocalVoice.ts`
    - `components/quinn/quinnSpeechText.ts`

- `4a8005f38ec3183eb3152dac17ac13b2edb46589`
  - Message: `Improve voice request transport and conversational reply shaping`
  - What changed:
    - frontend side of the safer hosted voice transport work.
    - also included conversational reply-shaping changes.
  - Files:
    - `app/(tabs)/index.tsx`
    - `components/quinn/VoiceMode.tsx`
    - `components/quinn/quinnApi.ts`
    - `components/quinn/quinnLocalVoice.ts`
    - `components/quinn/quinnSessionArc.ts`

- `6a28c197b26e4de317bd52d8e6e054289babcd1e`
  - Message: `Use local audio files for Quinn voice playback and refine personal tone`
  - What changed:
    - native Quinn voice moved to local cached audio-file playback for reliability.
    - also included prompt/tone work in the same commit.
  - Files:
    - `app/(tabs)/index.tsx`
    - `components/quinn/VoiceMode.tsx`
    - `components/quinn/quinnApi.ts`
    - `components/quinn/quinnLenses.ts`
    - `components/quinn/quinnLocalVoice.ts`
    - `components/quinn/quinnSessionArc.ts`

- `1f37374f955dc21356b971be54823f6447f0df9c`
  - Message: `Split Quinn local voice path for web and native compatibility`
  - What changed:
    - split the local voice path into `.native` and `.web` files.
    - prevented web from importing `expo-file-system`.
  - Files:
    - `components/quinn/quinnLocalVoice.native.ts`
    - `components/quinn/quinnLocalVoice.shared.ts`
    - `components/quinn/quinnLocalVoice.ts`
    - `components/quinn/quinnLocalVoice.web.ts`

- `45446fbc57a2e7d9349b964a507b54c60e8a92e3`
  - Message: `Polish Quinn voice pacing and reduce chunk boundary artifacts`
  - What changed:
    - reduced chunk boundary pop/artifacts.
    - adjusted pacing and chunk boundary behavior.
  - Files:
    - `app/(tabs)/index.tsx`
    - `components/quinn/VoiceMode.tsx`
    - `components/quinn/quinnLocalVoice.shared.ts`
    - `components/quinn/quinnSpeechText.ts`

- `dc7338f70bbe32a1fab3f7b193f30bff02e0e684`
  - Message: `Refine Quinn voice tone and tighten chunk pacing`
  - What changed:
    - further chunk pacing and voice-feel tuning.
    - part of the same reliability/polish chain as `45446fb` and `6777d51`.
  - Files:
    - `app/(tabs)/index.tsx`
    - `components/quinn/VoiceMode.tsx`
    - `components/quinn/quinnLocalVoice.shared.ts`
    - `components/quinn/quinnSpeechText.ts`

- `6777d51bb33422df6da387bf17f43f63697ee080`
  - Message: `Reduce Quinn voice chunk handoff delay with warmed-source reuse`
  - What changed:
    - reused warmed prepared sources instead of re-preparing them at handoff.
    - shortened chunk handoff delay without replacing the 2-chunk architecture.
  - Files:
    - `app/(tabs)/index.tsx`
    - `components/quinn/VoiceMode.tsx`
    - `components/quinn/quinnLocalVoice.shared.ts`

- `69884941259c6c1f76695a433b874987cb1c9485`
  - Message: `Refine Quinn tone to feel more personal and conversational`
  - What changed:
    - frontend-side tone/personal-stance shaping in packet/lens/continuity text.
  - Files:
    - `components/quinn/quinnApi.ts`
    - `components/quinn/quinnLenses.ts`
    - `components/quinn/quinnSessionArc.ts`

- `2484115f3ae0980e1e4713f50961bf8c68a3a00a`
  - Message: `Make Quinn replies more conversational and less guide-like`
  - Important:
    - this commit included **BOTH**:
      - the **single-file Quinn speech playback experiment**
      - **conversational reply-style changes**
  - What changed:
    - introduced `canUseSingleReplySpeech(...)`.
    - added a full-reply single-file speech path in homepage playback.
    - added matching single-file behavior in `VoiceMode`.
    - kept the chunked speech path intact as fallback.
    - also changed reply-style shaping toward more conversational prose.
  - Files:
    - `app/(tabs)/index.tsx`
    - `components/quinn/VoiceMode.tsx`
    - `components/quinn/quinnApi.ts`
    - `components/quinn/quinnLenses.ts`
    - `components/quinn/quinnSessionArc.ts`
    - `components/quinn/quinnSpeechText.ts`

- `7ae5b6d5c2123ce4fa6e07b987f96c9d5d36658a`
  - Message: `Fix Stage next move to use sanitized visible reply text`
  - What changed:
    - `Stage next move` stopped using polluted raw run payload text.
    - visible reply text, hydrated runs, and staged next packets now go through a clean assistant-reply sanitizer/extractor path.
  - Files:
    - `app/(tabs)/index.tsx`
    - `components/quinn/quinnApi.ts`

### Backend repo: `C:\Users\mrbro\QuinnOSBackend`

- `533db8e26841d78b830d24b46a7bf43642ca3d22`
  - Message: `Enable ElevenLabs text normalization for Quinn speech`
  - What changed:
    - turned on ElevenLabs text normalization to help structured text read more naturally.
  - Files:
    - `elevenTts.mjs`

- `2a6cd74bc48fb083849ace5eea9c8cf878487ca9`
  - Message: `Tune ElevenLabs voice settings and add chunk continuity hints`
  - What changed:
    - backend side of chunk continuity hints.
    - request-level ElevenLabs voice tuning.
  - Files:
    - `elevenTts.mjs`
    - `quinnVoiceServer.mjs`
    - `server.mjs`

- `11af70fab68a5c194ea33f25ea152c861696b8bf`
  - Message: `Prepare tokenized voice transport and tighten memory relevance`
  - What changed:
    - backend side of safer hosted voice transport.
    - tighter memory relevance thresholds and less intrusive memory carryover.
  - Files:
    - `server.mjs`

- `a1a1b66f3f96e0e968f6a932e0baf46982ea50e6`
  - Message: `Shift Quinn prompt framing toward personal conversational tone`
  - What changed:
    - moved prompt framing away from Quinn-as-tool language and toward a more personal voice.
  - Files:
    - `server.mjs`

- `b142b6eccdc14076bb3e02dd041085c7e03644b1`
  - Message: `Refine Quinn prompt tone toward a more personal voice`
  - What changed:
    - another backend prompt pass toward a closer, less assistant-like tone.
  - Files:
    - `server.mjs`

- `21a4da5be524b99d3cf6c8bc37e49cc6b833157d`
  - Message: `Shift Quinn default reply style toward natural prose conversation`
  - What changed:
    - current backend default stance toward natural prose over lists/how-to formatting.
  - Files:
    - `server.mjs`

- `e072ea8f1627ec57a53e2e4d6bb0afd515de8f5d`
  - Message: `Tune Quinn voice settings for a cleaner less boosted sound`
  - What changed:
    - reduced overly boosted / processed voice feel.
  - Files:
    - `elevenTts.mjs`

- `0feca2380257038d6b95055ce7e31c891c0d345a`
  - Message: `Tune Quinn ElevenLabs voice for a cleaner less processed sound`
  - What changed:
    - further cleanup of processed / boomy voice feel.
  - Files:
    - `elevenTts.mjs`

- `041ae26dce53053ca7348ec09a14f6c0b12be714`
  - Message: `Retune Quinn custom voice to feel lighter and more feminine`
  - What changed:
    - experimental voice retune toward lighter/feminine delivery.
  - Files:
    - `elevenTts.mjs`

- `698abe4eb2692725299a3f0576f53a7d501bcb90`
  - Message: `Make Quinn custom voice more expressive and less monotone`
  - What changed:
    - more aggressive voice-expressiveness tuning.
    - later judged to overshoot.
  - Files:
    - `elevenTts.mjs`

- `4610f68b885bae704d429228dc077aabcb089450`
  - Message: `Rollback overly styled Quinn voice retune to a safer natural range`
  - What changed:
    - rolled back the overly styled/unnatural voice settings to the safer current range.
  - Files:
    - `elevenTts.mjs`

## Mixed commits to remember

These are the commits most likely to confuse future refactors because the message does not fully describe the behavior change:

- `2484115f3ae0980e1e4713f50961bf8c68a3a00a` in the phone repo
  - bundled **single-file speech playback** together with **conversational reply-style changes**
  - if you are tracing voice behavior only, do not assume this was a tone-only commit

- `4a8005f38ec3183eb3152dac17ac13b2edb46589` in the phone repo
  - bundled **voice request transport changes** together with **conversational reply shaping**

- `6a28c197b26e4de317bd52d8e6e054289babcd1e` in the phone repo
  - bundled **native local-file playback** together with **personal tone refinements**

- `11af70fab68a5c194ea33f25ea152c861696b8bf` in the backend repo
  - bundled **tokenized voice transport** together with **memory relevance tightening**

- `8181516a24ceabadb48921e04e7e58083336d62b` in the phone repo plus `2a6cd74bc48fb083849ace5eea9c8cf878487ca9` in the backend repo
  - chunk continuity was split across both repos
  - frontend and backend traces need to be read together

- `698abe4eb2692725299a3f0576f53a7d501bcb90` in the backend repo
  - do not treat this as the final voice tuning state by itself
  - it was later corrected by `4610f68b885bae704d429228dc077aabcb089450`

Honest note: Quinn voice reliability was not introduced in one neat boundary. It evolved across a chain of commits in both repos, so the safest way to reason about it is by behavior clusters, not by assuming one commit equals one feature.

## Current known-good behavior

- `Start fresh` clears short-term thread continuity instead of only clearing UI text.
- Bare numeric replies like `1` or `option 2` resolve against Quinn's immediately previous numbered list in the same thread.
- `Stage next move` now stages only the cleaned visible assistant reply, not raw response metadata.
- Visible reply text is sanitized on parse and on snapshot hydration, which protects both the current response card and restored history.
- Quinn now defaults more often to conversational prose instead of lists/how-to output.
- Memory relevance is tighter than before and should be less likely to inject stale or weakly relevant memory.
- Native Quinn voice uses local cached audio-file playback.
- Web and native voice paths are split so web does not try to load native-only file APIs.
- Short/medium replies can use the single-file speech path; longer or failed preps fall back to chunked speech.
- The chunked path still exists and has warmed-source reuse plus multiple handoff/pacing fixes.
- ElevenLabs still uses the same custom voice identity; recent backend tuning ended in the safer rollback range rather than the overshot expressive range.

## Known remaining rough edges

- Voice behavior is still the most sensitive area because the final system is the product of many incremental fixes across both repos.
- The single-file speech path is threshold-based, not universal, so long replies still depend on the chunked path.
- The backend `/run` path can still fall back to serialized response output when `output_text` is missing; the frontend sanitizer currently protects the user-facing surface from that leak.
- Commit messages are not always trustworthy summaries of actual behavior changes.
- Voice-quality tuning history on the backend includes an overshoot-and-rollback sequence; do not cherry-pick voice-setting commits casually.
- If future prompt changes make Quinn more list-heavy again, inspect both frontend packet wording and backend `server.mjs` prompt framing together.

## Files most sensitive to future edits

### Frontend repo

- `app/(tabs)/index.tsx`
  - central Quinn conversation flow
  - speech playback orchestration
  - single-file vs chunk fallback decision path
  - `Stage next move`
  - thread continuity

- `components/quinn/VoiceMode.tsx`
  - preview-path mirror of Quinn homepage speech behavior

- `components/quinn/quinnApi.ts`
  - run-result parsing
  - sanitized visible reply extraction
  - follow-up packet text shaping

- `components/quinn/quinnSpeechText.ts`
  - speech-only normalization
  - numbered-list handling
  - chunk boundaries
  - single-file speech threshold

- `components/quinn/quinnLocalVoice.shared.ts`
  - playback-source prep
  - handoff delay behavior
  - warmed-source reuse

- `components/quinn/quinnLocalVoice.native.ts`
  - native local audio-file path

- `components/quinn/quinnLocalVoice.web.ts`
  - web-safe fallback path

- `components/quinn/quinnSessionArc.ts`
  - continuity framing that can affect reply tone

- `components/quinn/quinnLenses.ts`
  - model-facing lens wording that can push Quinn toward or away from guide-like replies

### Backend repo

- `server.mjs`
  - run prompt
  - memory relevance
  - follow-up packet generation
  - hosted voice transport/proxy behavior

- `elevenTts.mjs`
  - ElevenLabs voice settings
  - text normalization
  - voice identity feel without changing `ELEVENLABS_VOICE_ID`

- `quinnVoiceServer.mjs`
  - voice caching
  - continuity hints
  - hosted voice generation path
