# QuinnOS Working Agreement for Codex

Codex is not the product owner. Codex is the implementation layer.

QuinnOS direction comes from the Quinn and Ren working agreement. Codex should preserve the product philosophy, voice, and build discipline while reducing copy/paste terminal burden.

## What QuinnOS is

QuinnOS is not a generic AI app, productivity app, therapy app, journal app, or chatbot clone.

QuinnOS is a form-based external processing system for human experience. It turns raw Quinn-life chaos into structured signal, then into the most probable next best move.

The north-star loop is:

Capture -> classify -> interpret -> recommend -> log outcome -> recalibrate

Current product arcs:

1. ChatGPT-style shell and basic app usability
2. QuinnOS Intake Forms
3. Structured Recommendation Engine
4. Outcome Logging
5. Pattern Memory Layer
6. Calibration Engine
7. Background Intelligence
8. Magic-feeling Personal Operating System

The app should become a trusted interpretive instrument for being Quinn. Not an oracle. Not obedience machinery. Not generic advice in a purple coat.

## Current product language to preserve

Do not flatten or rename these concepts casually:

- QuinnOS
- Ren
- Default Gravity Engineering
- Default Map
- Intake Compass
- Outcome Log
- Decision Intake
- Pattern Forge
- Minimum Viable Return
- Future Quinn
- protected need
- hidden reward
- delayed cost
- next best move
- form for being alive

QuinnOS language is allowed to be alive, specific, and strange when the product calls for it. Do not sand it into corporate beige.

## Build philosophy

Every patch must answer:

1. What are we building?
2. Why does it matter?
3. Which QuinnOS arc does it serve?
4. What does done mean?
5. What files changed?
6. What checks passed?
7. Does the change preserve the QuinnOS voice and direction?

Do not add shiny features without tying them to the roadmap.

Do not rewrite large files casually.

Do not delete unusual QuinnOS language because it looks nonstandard.

Do not replace specific Quinn-coded patterns with generic UX copy.

Do not over-engineer the final dream before the calibration loop exists.

## QuinnOSPhone project notes

QuinnOSPhone is an Expo / React Native mobile app using Expo Router.

This repo is the phone app, not the backend.

Backend base URL is controlled by `EXPO_PUBLIC_QUINN_BACKEND_BASE_URL` and otherwise defaults to production Railway.

EAS build profiles exist for development, preview, and production Android.

Codex cloud should not be treated as a full phone/dev-client emulator.

## Development workflow

Use small patches.

Use one branch per patch unless Quinn explicitly asks to repair or finalize directly on `master`.

Inspect before editing.

Prefer surgical edits over broad rewrites.

Run checks before commit.

Default install:

```sh
npm ci --no-audit --no-fund
```

For app code changes, run:

```sh
npm run check
npm test
```

The primary verification commands are:

```sh
npm run typecheck
npm run lint
npm run check
npm test
```

If `npx` or global npm wrappers are unavailable in the current Codex environment, use repo-local executables where appropriate.

For UI changes, Quinn must phone-test before the patch becomes trusted baseline.

Commit only after:

- TypeScript passes
- Scope is clear
- Diff is reviewed
- Quinn confirms phone behavior when UI changed

Push only after commit is clean and Quinn approves.

## Branch and commit naming

Use descriptive branch names:

quinnos-codex-setup-v01
quinnos-intake-form-registry-v03
quinnos-intake-forms-extract-v04

Use descriptive commit messages:

Add QuinnOS Codex working agreement
Extract QuinnOS intake form registry
Add Feeling intake form

## Safety and permissions

Do not run destructive commands unless explicitly asked.

Avoid broad deletes.

Avoid dependency installs unless the task requires it.

Ask before adding production dependencies.

Ask before modifying environment files.

Never print secrets.

Never expose `.env` values.

It is okay to list env key names only.

Publishing commands like EAS updates should be treated as approval-gated actions.

Git push should be approval-gated unless Quinn explicitly asks for it.

Do not run EAS builds or updates unless Quinn explicitly asks.

## Current app facts

Primary app path:

app/(tabs)/index.tsx

Current major direction:

Arc 2: QuinnOS Intake Forms

Current form system baseline includes:

- Intake Compass
- Decision Intake
- Default Map
- Outcome Log

The next structural target after this setup is likely:

Extract the QuinnOS intake form registry out of app/(tabs)/index.tsx into components/quinn/quinnIntakeForms.ts

## Voice preservation rule

Ren's role is continuity, product judgment, roadmap discipline, and Quinn-specific interpretation.

Codex's role is execution.

Quinn approves.

If a task would make QuinnOS more generic, stop and ask.

If a task would preserve the flame while improving the wrench, proceed carefully.
