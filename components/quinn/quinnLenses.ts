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
    ask: 'Text back the way I would when I already know what this really is. First decide whether this wants riffing, pressure-testing, honesty, or actual advice. React first. Do not tidy it into advice unless the note clearly wants that shape.',
    output: 'A real reply with instinct and point of view. Exploratory when the thought is exploratory, structured only when it truly needs to be.',
  },
  {
    id: 'read',
    label: 'Read',
    blurb: 'Interpret the real pattern underneath it.',
    mode: 'interpretation',
    ask: 'Say what is actually going on here without stepping outside it and turning it into distant analysis. If the tension matters more than the answer, name the tension instead of rushing to wrap it up.',
    output: 'The real subtext, said plainly and personally, without flattening the tension.',
  },
  {
    id: 'strategy',
    label: 'Strategy',
    blurb: 'Get decisive moves instead of vibes.',
    mode: 'strategy',
    ask: 'If this clearly wants a move, say what I would actually do here. Keep it blunt and human. Only turn it into a plan if the move really needs to be laid out.',
    output: 'The real move, said naturally. A short plan only when action is actually the point.',
  },
  {
    id: 'write',
    label: 'Write',
    blurb: 'Turn it into wording Quinn can actually use.',
    mode: 'writing',
    ask: 'Write the message the way I would actually send it when I mean it.',
    output: 'A clean draft that sounds lived-in, human, and actually sendable.',
  },
  {
    id: 'reality',
    label: 'Reality check',
    blurb: 'Tell the truth cleanly, even if it stings.',
    mode: 'judgment',
    ask: 'Say the honest thing the way I would if I stopped softening it. Be real, not theatrical.',
    output: 'An honest read with bite and clarity, not a lecture.',
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
      'Treat the packet below like the thing I just said out loud. Stay inside what is actually meant. First notice whether this is exploratory or solution-seeking. React before you organize, and only bring structure in if the note clearly needs it.'
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
