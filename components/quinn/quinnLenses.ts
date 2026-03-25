import type { SessionArc } from './quinnTypes';
import { buildSessionArcPacketContext } from './quinnSessionArc';

export type QuinnLensId = 'open' | 'read' | 'strategy' | 'write' | 'reality';

export type QuinnLens = {
  id: QuinnLensId;
  label: string;
  blurb: string;
  mode: string;
  ask: string;
  output: string;
};

type QuinnFollowUpLike = {
  focusText?: string;
  form?: {
    mode?: string;
    ask?: string;
    output?: string;
  };
};

export const DEFAULT_QUINN_LENS_ID: QuinnLensId = 'open';

const QUINN_LENSES: QuinnLens[] = [
  {
    id: 'open',
    label: 'Open',
    blurb: 'Let Quinn decide the strongest shape.',
    mode: 'adaptive',
    ask: 'Reply the way Quinn naturally would when she actually gets what this needs.',
    output: 'A direct, natural reply that feels human and context-aware.',
  },
  {
    id: 'read',
    label: 'Read',
    blurb: 'Interpret the real pattern underneath it.',
    mode: 'interpretation',
    ask: 'Say what is actually going on here without turning it into a framework.',
    output: 'A clear read in natural language, with the real subtext intact.',
  },
  {
    id: 'strategy',
    label: 'Strategy',
    blurb: 'Get decisive moves instead of vibes.',
    mode: 'strategy',
    ask: 'Give the cleanest next move or plan in a grounded way. Use structure only if it truly helps.',
    output: 'The most useful next step, or a short plan that still sounds natural.',
  },
  {
    id: 'write',
    label: 'Write',
    blurb: 'Turn it into wording Quinn can actually use.',
    mode: 'writing',
    ask: 'Write the thing the way Quinn would actually send it.',
    output: 'A clean draft that sounds human, usable, and true to Quinn’s voice.',
  },
  {
    id: 'reality',
    label: 'Reality check',
    blurb: 'Tell the truth cleanly, even if it stings.',
    mode: 'judgment',
    ask: 'Tell the truth plainly and personally, without turning it into a lecture.',
    output: 'The clearest honest read, said like someone who knows the stakes.',
  },
];

function cleanPacketValue(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function listPacketSection(label: string, value: string) {
  const clean = String(value || '').trim();

  if (!clean) {
    return '';
  }

  return `${label}:\n${clean}`;
}

export function getQuinnLenses() {
  return QUINN_LENSES;
}

export function getQuinnLens(lensId: QuinnLensId = DEFAULT_QUINN_LENS_ID) {
  return QUINN_LENSES.find((lens) => lens.id === lensId) || QUINN_LENSES[0];
}

export function buildQuinnPacket({
  packetTitle,
  packetText,
  lensId = DEFAULT_QUINN_LENS_ID,
  sessionArc = null,
}: {
  packetTitle: string;
  packetText: string;
  lensId?: QuinnLensId;
  sessionArc?: SessionArc | null;
}) {
  const lens = getQuinnLens(lensId);
  const safeTitle = cleanPacketValue(packetTitle) || 'Untitled packet';
  const safeText = String(packetText || '').trim();
  const sessionArcContext = buildSessionArcPacketContext(sessionArc);

  return [
    listPacketSection('TITLE', safeTitle),
    listPacketSection('MODE', lens.mode),
    listPacketSection('ASK', lens.ask),
    listPacketSection('OUTPUT', lens.output),
    listPacketSection(
      'CONTEXT',
      'Use the raw packet below as the live note to answer. Stay with what is actually being said, and do not drift into stale assumptions or system language.'
    ),
    sessionArcContext,
    listPacketSection('PACKET', safeText),
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export function inferQuinnLensFromFollowUp(
  followUp: QuinnFollowUpLike | null | undefined
): QuinnLensId {
  const combined = [
    String(followUp?.form?.mode || ''),
    String(followUp?.form?.ask || ''),
    String(followUp?.form?.output || ''),
    String(followUp?.focusText || ''),
  ]
    .join(' ')
    .toLowerCase();

  if (/write|draft|message|wording|note/.test(combined)) {
    return 'write';
  }

  if (/strategy|plan|next move|priority|tactic|sequence/.test(combined)) {
    return 'strategy';
  }

  if (/read|pattern|subtext|dynamic|what is going on/.test(combined)) {
    return 'read';
  }

  if (/truth|reality|real|stop romanticizing|judgment/.test(combined)) {
    return 'reality';
  }

  return DEFAULT_QUINN_LENS_ID;
}
