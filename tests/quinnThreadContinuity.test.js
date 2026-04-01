const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const {
  startSessionArc,
  advanceSessionArc,
} = require('../components/quinn/quinnSessionArc.ts');
const {
  inferQuinnThreadContinuity,
} = require('../components/quinn/quinnThreadContinuityState.ts');
const { inferQuinnConductor } = require('../components/quinn/quinnConductorState.ts');
const { buildQuinnPacket } = require('../components/quinn/quinnLenses.ts');

function buildWorkLifeBalanceArc() {
  const seed = startSessionArc({
    packetTitle: 'Work-life balance',
    packetText: 'I am worried my work-life balance is out of control.',
    compressedSummary: 'The user is spiraling about work-life balance and wants a reality check.',
    timestamp: '2026-04-01T10:00:00.000Z',
    lensLabel: 'Open',
  });

  return advanceSessionArc(seed, {
    packetTitle: '',
    packetText: 'Can you reality-check whether I am overreacting about work-life balance?',
    compressedSummary:
      'Quinn gave a work-life-balance reality check and kept the subject on burnout and balance.',
    timestamp: '2026-04-01T10:05:00.000Z',
    lensLabel: 'Open',
  });
}

const cakePrompt =
  'Cool, thank you. Moving on, I wonder what flavor of cake would be the best for shoving my face into like a toddler. Any ideas?';
const sameTopicPivotishPrompt =
  'On another note about the same work-life balance issue, what boundary do I need first?';
const repoRoot = path.resolve(process.cwd());
const backendServerPath = path.resolve(repoRoot, '..', 'QuinnOSBackend', 'server.mjs');

function inspectBackendRunContinuity(packet) {
  const script = `
    import { pathToFileURL } from 'node:url';
    process.env.QUINN_SERVER_SKIP_LISTEN = '1';
    const backendServerPath = process.argv[1];
    const payload = JSON.parse(process.argv[2]);
    const { inspectRunContinuitySignals } = await import(pathToFileURL(backendServerPath).href);
    const result = inspectRunContinuitySignals(payload.packet, payload.projectTag);
    console.log(JSON.stringify(result));
  `;

  const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script, backendServerPath, JSON.stringify({
    packet,
    projectTag: 'General',
  })], {
    encoding: 'utf8',
    cwd: repoRoot,
  }).trim();

  return JSON.parse(output.split(/\r?\n/).filter(Boolean).at(-1));
}

const cases = [
  {
    name: 'genuine follow-up stays on the same thread subject',
    run() {
      const continuity = inferQuinnThreadContinuity({
        packetText: 'Still on that work-life balance point, what do I change first?',
        sessionArc: buildWorkLifeBalanceArc(),
      });

      assert.equal(continuity.hasActiveThread, true);
      assert.equal(continuity.frameContinuation, true);
      assert.equal(continuity.threadCarryoverMode.id, 'keep');
      assert.equal(continuity.suppressTemplateReuse, false);
    },
  },
  {
    name: 'pivot-like same-topic phrasing does not hard-reset continuity',
    run() {
      const continuity = inferQuinnThreadContinuity({
        packetText: sameTopicPivotishPrompt,
        sessionArc: buildWorkLifeBalanceArc(),
      });
      const packet = buildQuinnPacket({
        packetTitle: 'Same topic continuation',
        packetText: sameTopicPivotishPrompt,
        sessionArc: buildWorkLifeBalanceArc(),
        previousAssistantReply:
          'You are probably not overreacting, but your work-life balance does need a reality check.',
      });
      const backendSignals = inspectBackendRunContinuity(packet);

      assert.equal(continuity.hasActiveThread, true);
      assert.equal(continuity.threadCarryoverMode.id, 'keep');
      assert.equal(continuity.suppressTemplateReuse, false);
      assert.equal(continuity.staleFrameRisk.id, 'none');
      assert.equal(continuity.frameContinuation, true);
      assert.equal(backendSignals.explicitTopicPivot, false);
      assert.equal(backendSignals.threadCarryoverMode, 'keep');
      assert.equal(backendSignals.suppressTemplateReuse, false);
      assert.equal(backendSignals.frameContinuation, true);
    },
  },
  {
    name: 'explicit topic pivot drops local topic dominance without erasing thread history',
    run() {
      const continuity = inferQuinnThreadContinuity({
        packetText: cakePrompt,
        sessionArc: buildWorkLifeBalanceArc(),
      });

      assert.equal(continuity.hasActiveThread, true);
      assert.match(continuity.recentBeatSummary, /work-life-balance reality check/i);
      assert.equal(continuity.frameContinuation, false);
      assert.equal(continuity.liveSubjectDominance.id, 'high');
      assert.equal(continuity.threadCarryoverMode.id, 'drop');
      assert.equal(continuity.staleFrameRisk.id, 'strong');
      assert.equal(continuity.suppressTemplateReuse, true);
    },
  },
  {
    name: 'backend run continuity inputs drop stale carryover for the cake repro',
    run() {
      const packet = buildQuinnPacket({
        packetTitle: 'Cake pivot',
        packetText: cakePrompt,
        sessionArc: buildWorkLifeBalanceArc(),
        previousAssistantReply:
          'You are probably not overreacting, but your work-life balance does need a reality check.',
      });
      const effectiveSignals = inspectBackendRunContinuity(packet);

      assert.equal(effectiveSignals.liveSubjectDominance, 'high');
      assert.equal(effectiveSignals.threadCarryoverMode, 'drop');
      assert.equal(effectiveSignals.staleFrameRisk, 'strong');
      assert.equal(effectiveSignals.suppressTemplateReuse, true);
      assert.equal(effectiveSignals.frameContinuation, false);
      assert.equal(effectiveSignals.explicitTopicPivot, true);
    },
  },
  {
    name: 'moving on plus cake example emits drop-mode packet cues instead of carrying work-life-balance forward',
    run() {
      const packet = buildQuinnPacket({
        packetTitle: 'Cake pivot',
        packetText: cakePrompt,
        sessionArc: buildWorkLifeBalanceArc(),
        previousAssistantReply:
          'You are probably not overreacting, but your work-life balance does need a reality check.',
      });

      const conductor = inferQuinnConductor({
        packetText: cakePrompt,
        sessionArc: buildWorkLifeBalanceArc(),
        previousAssistantReply:
          'You are probably not overreacting, but your work-life balance does need a reality check.',
      });

      assert.match(packet, /LIVE SUBJECT DOMINANCE:\nhigh/);
      assert.match(packet, /THREAD CARRYOVER MODE:\ndrop/);
      assert.match(packet, /STALE FRAME RISK:\nstrong/);
      assert.match(packet, /SUPPRESS TEMPLATE REUSE:\ntrue/);
      assert.ok(
        conductor.arbitrationNotes.some((note) =>
          note.includes('Drop the stale frame and answer the newest note directly')
        )
      );
      assert.equal(conductor.finalMemoryExpression, 'implicit');
    },
  },
  {
    name: 'user correction plus pivot still suppresses stale reuse without losing correction guards',
    run() {
      const packetText =
        "That's not what we're talking about. Moving on, what cake flavor should I shove my face into like a toddler?";
      const continuity = inferQuinnThreadContinuity({
        packetText,
        sessionArc: buildWorkLifeBalanceArc(),
      });
      const conductor = inferQuinnConductor({
        packetText,
        sessionArc: buildWorkLifeBalanceArc(),
        previousAssistantReply: 'You need to protect your work-life balance.',
      });

      assert.equal(continuity.threadCarryoverMode.id, 'drop');
      assert.equal(continuity.staleTemplateInterrupt.id, 'hard');
      assert.equal(continuity.suppressTemplateReuse, true);
      assert.equal(conductor.finalAsk, 'noAsk');
      assert.equal(conductor.conversationalCoherence.groundedReplyMode.id, 'corrective');
      assert.ok(
        conductor.arbitrationNotes.some((note) =>
          note.includes("The user is objecting to Quinn's conversational behavior itself")
        )
      );
    },
  },
];

module.exports = { cases };
