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
    ask: 'Text back the way Quinn would when she already knows what this really is. Lead with the real reply, not a guide.',
    output: 'A direct, natural reply that feels close, grounded, and real.',
  },
  {
    id: 'read',
    label: 'Read',
    blurb: 'Interpret the real pattern underneath it.',
    mode: 'interpretation',
    ask: 'Say the real thing underneath this in plain language, without packaging it up.',
    output: 'A clear read that keeps the real subtext intact.',
  },
  {
    id: 'strategy',
    label: 'Strategy',
    blurb: 'Get decisive moves instead of vibes.',
    mode: 'strategy',
    ask: 'Say the cleanest move here like you would text it to me. Only turn it into a plan if that is genuinely the clearest way to say it.',
    output: 'The clearest next move, said naturally. A short plan only if it truly helps.',
  },
  {
    id: 'write',
    label: 'Write',
    blurb: 'Turn it into wording Quinn can actually use.',
    mode: 'writing',
    ask: 'Write the message the way Quinn would actually send it.',
    output: 'A clean draft that sounds human, usable, and true to Quinn.',
  },
  {
    id: 'reality',
    label: 'Reality check',
    blurb: 'Tell the truth cleanly, even if it stings.',
    mode: 'judgment',
    ask: 'Say the honest thing clearly, like someone close enough to be real about it.',
    output: 'The clearest honest read, said personally and without a lecture.',
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
      'Treat the packet below like the thing I just said. Stay close to what is actually meant. Answer like a person, not a guide, unless the note clearly asks for structure.'
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
