import type { ComponentProps } from 'react';

import type Feather from '@expo/vector-icons/Feather';

export type QuinnIntakeFormIconName = ComponentProps<typeof Feather>['name'];

export type QuinnIntakeFormId =
  | 'intake-compass'
  | 'decision-intake'
  | 'feeling-intake'
  | 'body-nervous-system-intake'
  | 'grief-wave-intake'
  | 'work-situation-intake'
  | 'relationship-read-intake'
  | 'creative-idea-intake'
  | 'memory-capture-intake'
  | 'therapy-packet-intake'
  | 'default-map'
  | 'outcome-log';

export type QuinnIntakeFormDefinition = {
  id: QuinnIntakeFormId;
  label: string;
  icon: QuinnIntakeFormIconName;
  template: string[];
};

export const QUINNOS_RESPONSE_PROTOCOL = [
  '',
  'QUINNOS RESPONSE PROTOCOL',
  '',
  'REN OUTPUT STRUCTURE:',
  'Use the completed intake above as the source material. Do not flatten it into generic advice, perform certainty, or turn it into obedience machinery.',
  '',
  'CLEAN READ:',
  '[The cleanest read of what is happening.]',
  '',
  'CORE PATTERN OR SIGNAL:',
  '[The pattern, signal, hidden function, or material type QuinnOS should notice.]',
  '',
  'PROTECTED NEED:',
  '[The valid need that deserves care or protection.]',
  '',
  'RISK / DISTORTION / UNCERTAINTY:',
  '[What may be biased, incomplete, body-driven, old-wound-driven, high-cost, or genuinely uncertain.]',
  '',
  'MOST PROBABLE NEXT BEST MOVE:',
  '[The move most likely to protect Future Quinn while honoring the real signal.]',
  '',
  'TINY VERSION:',
  '[The smallest version Quinn can do if capacity is low.]',
  '',
  'RETURN PATH:',
  '[If Quinn falls off, spirals, avoids, overdoes it, or cannot act, name the smallest way back.]',
  '',
  'CONFIDENCE LEVEL:',
  '[Low / medium / high, with one sentence about why.]',
  '',
  'WHAT WOULD CHANGE THE ANSWER:',
  '[The missing information, outcome, state change, or real-world signal that would recalibrate this read.]',
];

export function buildQuinnIntakeFormPacket(form: QuinnIntakeFormDefinition) {
  return [...form.template, ...QUINNOS_RESPONSE_PROTOCOL].join('\n');
}

export type QuinnOutcomeLogPrefillSource = {
  packetText?: string | null;
  writtenResult?: string | null;
};

export type QuinnOutcomeLogMinimumCaptureField =
  | 'WHAT I ACTUALLY DID:'
  | 'IT CAUSED:'
  | 'DID IT HELP?';

export type QuinnOutcomeLogMinimumCaptureStatus = {
  isOutcomeLog: boolean;
  hasMinimumData: boolean;
  missingRequiredFields: QuinnOutcomeLogMinimumCaptureField[];
};

const QUINN_OUTCOME_LOG_MARKER = 'QUINNOS OUTCOME LOG';

const QUINN_OUTCOME_LOG_MINIMUM_CAPTURE_FIELDS: {
  heading: QuinnOutcomeLogMinimumCaptureField;
  placeholder: string;
}[] = [
  {
    heading: 'WHAT I ACTUALLY DID:',
    placeholder: '[What happened in real life?]',
  },
  {
    heading: 'IT CAUSED:',
    placeholder: '[What changed afterward?]',
  },
  {
    heading: 'DID IT HELP?',
    placeholder: '[yes / no / mixed / too soon to tell]',
  },
];

function isQuinnPacketSectionHeading(line: string) {
  const clean = line.trim();
  return Boolean(clean && clean === clean.toUpperCase() && /^[A-Z0-9 /?'-]+:?$/.test(clean));
}

function getQuinnPacketSectionValue(lines: string[], heading: string) {
  const headingIndex = lines.findIndex((line) => line.trim() === heading);

  if (headingIndex < 0) {
    return '';
  }

  const nextHeadingIndex = lines.findIndex(
    (line, index) => index > headingIndex && isQuinnPacketSectionHeading(line)
  );

  return lines
    .slice(headingIndex + 1, nextHeadingIndex < 0 ? undefined : nextHeadingIndex)
    .join('\n')
    .trim();
}

export function getQuinnOutcomeLogMinimumCaptureStatus(
  packetText: string
): QuinnOutcomeLogMinimumCaptureStatus {
  const text = String(packetText || '');
  const isOutcomeLog = text.includes(QUINN_OUTCOME_LOG_MARKER);

  if (!isOutcomeLog) {
    return {
      isOutcomeLog: false,
      hasMinimumData: true,
      missingRequiredFields: [],
    };
  }

  const lines = text.split(/\r?\n/);
  const missingRequiredFields = QUINN_OUTCOME_LOG_MINIMUM_CAPTURE_FIELDS.filter(
    ({ heading, placeholder }) => {
      const value = getQuinnPacketSectionValue(lines, heading);
      return !value || value.includes(placeholder);
    }
  ).map(({ heading }) => heading);

  return {
    isOutcomeLog: true,
    hasMinimumData: missingRequiredFields.length === 0,
    missingRequiredFields,
  };
}

export const QUINNOS_INTAKE_FORMS: QuinnIntakeFormDefinition[] = [
  {
    id: 'intake-compass',
    label: 'Intake',
    icon: 'compass',
    template: [
      'QUINNOS INTAKE COMPASS',
      '',
      'PURPOSE:',
      'Classify this material before shaping it. Do not forge everything. Choose the heat the material can survive.',
      '',
      'MATERIAL TYPE GUESS:',
      '[identity / structure / language / judgment / removal / action / witness / not sure]',
      '',
      'DOMAIN:',
      '[work / relationship / grief / body / money / app / creative / conflict / decision / behavior / other]',
      '',
      'RAW MATERIAL:',
      '[Paste or describe the thing here.]',
      '',
      'CONTEXT:',
      '[What happened? What matters? What is the situation around it?]',
      '',
      'STATE:',
      '[What is my body/emotional weather right now? Activated, tired, avoidant, clear, grieving, wired, numb, etc.]',
      '',
      'RISK / TIME:',
      '[Is this urgent, delicate, high-stakes, or safe to process slowly?]',
      '',
      'WHAT I THINK I WANT:',
      '[The obvious ask.]',
      '',
      'WHAT I MAY ACTUALLY NEED:',
      '[The deeper need, if I can sense it.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'First classify this as one of: Name, Framework, Rewrite, Critique, Cut, Next Move, Witness-Line, or Default Map. Then apply only the heat it can survive. Do not over-process it. End with either the cleanest witness-line, the next best move, or the exact form I should use next.',
    ],
  },
  {
    id: 'decision-intake',
    label: 'Decision',
    icon: 'target',
    template: [
      'QUINNOS DECISION INTAKE',
      '',
      'PURPOSE:',
      'Turn this decision into the most probable best next move without pretending certainty.',
      '',
      'DECISION:',
      '[What am I deciding?]',
      '',
      'OPTIONS:',
      '[What are the real options, including doing nothing or delaying?]',
      '',
      'CONTEXT:',
      '[What happened? What matters around this decision?]',
      '',
      'STATE:',
      '[What is my body/emotional weather right now? Tired, activated, hopeful, ashamed, pressured, clear, avoidant, etc.]',
      '',
      'WHAT I WANT:',
      '[What do I want to happen?]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Time, money, dignity, stability, relationships, sleep, work, safety, clarity, momentum, etc.]',
      '',
      'RISKS / COSTS:',
      '[What could each option cost later?]',
      '',
      'HIDDEN PULLS:',
      '[What might be biasing me? Panic, longing, shame, novelty, revenge, relief, avoidance, being seen, proving something, etc.]',
      '',
      'TIMING:',
      '[Does this need action now, later today, this week, or not yet?]',
      '',
      'WHAT WOULD CHANGE THE ANSWER:',
      '[What missing information would matter?]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Give me the most probable best move, confidence level, what you are uncertain about, what Future Quinn needs protected, the smallest next action, and whether this decision should be acted on, delayed, or converted into another QuinnOS form.',
    ],
  },
  {
    id: 'feeling-intake',
    label: 'Feeling',
    icon: 'heart',
    template: [
      'QUINNOS FEELING INTAKE',
      '',
      'PURPOSE:',
      'Turn this feeling into structured signal without flattening it or immediately forcing it into action.',
      '',
      'FEELING / MOOD:',
      '[What am I feeling? Use messy words if needed.]',
      '',
      'BODY SIGNALS:',
      '[Where is it in my body? Tension, heat, heaviness, buzzing, numbness, pressure, etc.]',
      '',
      'WHAT HAPPENED:',
      '[What triggered or preceded this feeling?]',
      '',
      'WHAT I THINK IT MEANS:',
      '[The story my brain is attaching to the feeling.]',
      '',
      'WHAT IT MAY ACTUALLY BE:',
      '[Need, grief, fear, exhaustion, hope, shame, anger, loneliness, overstimulation, old pattern, etc.]',
      '',
      'URGE:',
      '[What does this feeling want me to do right now? Text, withdraw, spend, eat, fix, confess, avoid, spiral, clean, sleep, etc.]',
      '',
      'RISK:',
      '[Would acting from this feeling protect me, cost me, or both?]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Stability, dignity, money, sleep, work, relationships, recovery, momentum, truth, softness, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Name what this feeling probably is, what it is asking for, what urge should not drive the car, what need deserves care, and the smallest next move that honors the feeling without letting it hijack the day.',
    ],
  },
  {
    id: 'body-nervous-system-intake',
    label: 'Body',
    icon: 'activity',
    template: [
      'QUINNOS BODY / NERVOUS SYSTEM INTAKE',
      '',
      'PURPOSE:',
      'Turn body state into structured signal before Quinn mistakes physiology for prophecy, failure, danger, or truth.',
      '',
      'BODY STATE:',
      '[What is happening physically? Tired, wired, hungry, heavy, shaky, tense, numb, restless, overstimulated, sick, sore, etc.]',
      '',
      'ENERGY LEVEL:',
      '[Low, medium, high, unstable, crashing, artificially boosted, unknown.]',
      '',
      'SENSORY LOAD:',
      '[Noise, light, touch, temperature, crowds, music, screen time, car time, work stimulation, etc.]',
      '',
      'FOOD / CAFFEINE / NICOTINE / MEDS:',
      '[What have I eaten, drunk, smoked, taken, skipped, or overdone recently?]',
      '',
      'SLEEP / REST:',
      '[How much rest did I get? What kind of sleep? Any naps, crashes, or insomnia?]',
      '',
      'EMOTIONAL WEATHER:',
      '[What feelings are riding on top of the body state?]',
      '',
      'RECENT CONTEXT:',
      '[Work shift, therapy, conflict, grief, social time, errands, spending, creative sprint, transition, etc.]',
      '',
      'URGE:',
      '[What does my body want me to do right now? Collapse, scroll, spend, text, eat, avoid, clean, cry, drive, isolate, seek contact, etc.]',
      '',
      'RISK:',
      '[What might go wrong if I obey the urge immediately? What might go wrong if I ignore the body?]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Food, sleep, money, work, dignity, recovery, emotional stability, safety, momentum, nervous system, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Separate body signal from story. Tell me what is probably physiology, what may be emotion, what urge should not drive the car, what need deserves care, and the smallest regulation move I can do in the next 5 to 15 minutes.',
    ],
  },
  {
    id: 'grief-wave-intake',
    label: 'Grief',
    icon: 'cloud-rain',
    template: [
      'QUINNOS GRIEF WAVE INTAKE',
      '',
      'PURPOSE:',
      'Turn a grief wave into structured signal without treating it like a problem to solve, a text to send, or a truth Quinn has to obey.',
      '',
      'WHAT SET IT OFF:',
      '[What triggered the wave? A place, song, memory, person, date, dream, smell, object, silence, body feeling, social media, work moment, etc.]',
      '',
      'WHO / WHAT THIS GRIEF IS ABOUT:',
      '[Person, version of me, lost future, old home, relationship, safety, time, possibility, identity, etc.]',
      '',
      'WHAT I MISS:',
      '[What exactly hurts to not have?]',
      '',
      'WHAT I AM REACHING FOR:',
      '[Contact, proof, comfort, repair, explanation, fantasy, justice, being chosen, the old feeling, the old self, etc.]',
      '',
      'WHAT MY BODY IS DOING:',
      '[Chest, throat, stomach, hands, fatigue, tears, numbness, buzzing, ache, heaviness, etc.]',
      '',
      'THE STORY MY BRAIN IS TELLING:',
      '[What meaning is grief attaching to this?]',
      '',
      'WHAT IS TRUE EVEN IF THE STORY IS LOUD:',
      '[Grounded facts, current reality, what I know when I am not inside the wave.]',
      '',
      'URGE:',
      '[Text, check, search, reread, drive somewhere, isolate, spend, eat, smoke, spiral, romanticize, shut down, perform okay, etc.]',
      '',
      'RISK:',
      '[What could this grief wave make me do that Future Quinn may have to clean up?]',
      '',
      'WHAT THIS GRIEF NEEDS INSTEAD:',
      '[Witness, body care, ritual, music, crying, packet, walk, food, no action, Ashley, Ren, sleep, containment, memory without contact, etc.]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Dignity, boundaries, recovery, sleep, work, money, self-trust, emotional safety, current relationships, momentum, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Name what kind of grief wave this is. Separate memory from current reality, longing from evidence, and contact-seeking from actual need. Give me one witness-line, one body-based care move, and the smallest next step that lets the grief move without letting it drive the car.',
    ],
  },
  {
    id: 'work-situation-intake',
    label: 'Work',
    icon: 'briefcase',
    template: [
      'QUINNOS WORK SITUATION INTAKE',
      '',
      'PURPOSE:',
      'Turn a work situation into structured signal, clean judgment, and the next best move without collapsing into people-pleasing, over-functioning, or unnecessary escalation.',
      '',
      'SITUATION:',
      '[What happened at work?]',
      '',
      'PEOPLE INVOLVED:',
      '[Who is involved? Partners, customers, SSVs, ASM, SM, DM, etc.]',
      '',
      'ROLE I WAS IN:',
      '[Shift supervisor, partner, customer-facing mode, training mode, conflict mode, cleanup mode, etc.]',
      '',
      'WHAT I NOTICED:',
      '[What facts, patterns, behaviors, or inconsistencies stood out?]',
      '',
      'WHAT I FELT:',
      '[What did it bring up emotionally or physically?]',
      '',
      'WHAT I THINK IT MEANS:',
      '[The interpretation my brain is making.]',
      '',
      'WHAT ELSE COULD BE TRUE:',
      '[Alternate explanations, missing context, operational pressures, emotional distortion, etc.]',
      '',
      'RISK / STAKES:',
      '[What could go wrong if I act, avoid, escalate, confront, document, or let it go?]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Credibility, job stability, ASM path, energy, dignity, relationships, boundaries, money, schedule, nervous system, etc.]',
      '',
      'WHAT I WANT TO DO:',
      '[My immediate urge or preferred move.]',
      '',
      'WHAT I NEED HELP DECIDING:',
      '[Clarify the actual ask.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Give me the cleanest read of this work situation. Separate facts from interpretation, name the likely pattern, identify what Future Quinn needs protected, tell me whether to act, document, ask, wait, escalate, repair, or let it go, and give me the smallest professional next move.',
    ],
  },
  {
    id: 'relationship-read-intake',
    label: 'Relationship',
    icon: 'users',
    template: [
      'QUINNOS RELATIONSHIP READ INTAKE',
      '',
      'PURPOSE:',
      'Turn a relationship situation into structured signal without over-reading, self-abandoning, or flattening the emotional truth.',
      '',
      'PERSON / PEOPLE:',
      '[Who is involved?]',
      '',
      'RELATIONSHIP CONTEXT:',
      '[What is this relationship? Friend, coworker, family, romantic, ex, situationship, therapist, customer, etc.]',
      '',
      'WHAT HAPPENED:',
      '[What actually happened? Include observable facts.]',
      '',
      'WHAT I NOTICED:',
      '[Patterns, tone shifts, timing, body language, inconsistencies, repeated behaviors, or emotional charge.]',
      '',
      'WHAT I FELT:',
      '[What came up in me emotionally or physically?]',
      '',
      'WHAT I THINK IT MEANS:',
      '[The story or interpretation my brain is making.]',
      '',
      'WHAT ELSE COULD BE TRUE:',
      '[Alternate explanations, missing information, projection, old wound, ordinary human weirdness, context I may not have.]',
      '',
      'WHAT I WANT:',
      '[What do I want from this person or situation?]',
      '',
      'WHAT I AM AFRAID OF:',
      '[Rejection, abandonment, being wrong, being too much, being used, being unseen, losing control, etc.]',
      '',
      'EVIDENCE FOR:',
      '[What supports my interpretation?]',
      '',
      'EVIDENCE AGAINST:',
      '[What weakens or complicates my interpretation?]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Dignity, boundaries, clarity, emotional safety, job stability, recovery, money, time, self-trust, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Give me the cleanest read of this relationship situation. Separate facts from interpretation, name the likely pattern, identify what may be projection or old wound, tell me what Future Quinn needs protected, and give me the smallest next move: speak, wait, ask, document, repair, detach, or let it breathe.',
    ],
  },
  {
    id: 'creative-idea-intake',
    label: 'Creative',
    icon: 'pen-tool',
    template: [
      'QUINNOS CREATIVE IDEA INTAKE',
      '',
      'PURPOSE:',
      'Turn a creative spark into structured signal without overworking it, flattening it, or forcing it to become a finished thing too early.',
      '',
      'RAW IDEA:',
      '[What is the idea, image, line, scene, concept, title, app feature, metaphor, or strange little signal?]',
      '',
      'WHERE IT CAME FROM:',
      '[What triggered it? Conversation, dream, memory, work, grief, music, therapy, body state, joke, frustration, etc.]',
      '',
      'WHAT KIND OF MATERIAL THIS IS:',
      '[Book/memoir, QuinnOS, essay, scene, poem, title, app feature, framework, joke, packet, visual, unknown.]',
      '',
      'WHAT FEELS ALIVE:',
      '[What part has charge, texture, weirdness, truth, humor, beauty, ache, or momentum?]',
      '',
      'WHAT I THINK IT WANTS TO BECOME:',
      '[If I can sense it: chapter, framework, post, form, scene, packet, feature, title, line, or nothing yet.]',
      '',
      'WHAT I AM AFRAID WILL HAPPEN:',
      '[I will ruin it, over-explain it, forget it, make it too polished, make it too weird, never finish it, expose too much, etc.]',
      '',
      'WHAT IT DOES NOT NEED YET:',
      '[Editing, explanation, judgment, audience, structure, polish, monetization, final title, moral, productivity pressure, etc.]',
      '',
      'WHAT KIND OF HELP I WANT:',
      '[Name, Framework, Rewrite, Critique, Cut, Next Move, Witness-Line, Default Map, or not sure.]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Voice, originality, privacy, momentum, energy, time, emotional safety, coherence, play, honesty, weirdness, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Classify what kind of creative material this is. Tell me what is alive in it, what heat it can survive, what not to do yet, and the smallest next creative move. If it only needs witnessing, give me the witness-line and do not over-process it.',
    ],
  },
  {
    id: 'memory-capture-intake',
    label: 'Memory',
    icon: 'bookmark',
    template: [
      'QUINNOS MEMORY CAPTURE INTAKE',
      '',
      'PURPOSE:',
      'Save something that feels meaningful before Quinn forces it to become a conclusion, project, crisis, message, or performance too soon.',
      '',
      'WHAT I WANT TO SAVE:',
      '[The moment, thought, image, phrase, quote, dream, detail, memory, feeling, pattern, coincidence, or tiny signal.]',
      '',
      'WHERE IT CAME FROM:',
      '[When, where, who, what triggered it, what was happening around it?]',
      '',
      'WHY IT CAUGHT ME:',
      '[What made it glow, sting, echo, feel funny, feel important, or refuse to leave?]',
      '',
      'WHAT IT MIGHT CONNECT TO:',
      '[Person, place, pattern, project, grief, work, relationship, memoir, QuinnOS, old self, future self, unknown.]',
      '',
      'WHAT I DO NOT KNOW YET:',
      '[What feels unclear, unfinished, unprocessed, or too early to name?]',
      '',
      'WHAT I AM TEMPTED TO DO WITH IT:',
      '[Explain it, send it, archive it, overwork it, ignore it, turn it into art, make it a sign, make it a problem, etc.]',
      '',
      'WHAT IT DOES NOT NEED YET:',
      '[Action, certainty, analysis, audience, decision, repair, message, moral, full meaning, or a finished shape.]',
      '',
      'WHAT FUTURE QUINN MAY NEED FROM THIS:',
      '[Reminder, evidence, creative seed, pattern data, comfort, warning, title, therapy material, memory trace, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Capture this cleanly. Tell me what kind of memory/signal this appears to be, what should be preserved exactly, what not to force yet, and where it should go next: leave it as a saved fragment, turn it into Creative, Therapy, Grief, Relationship, Default Map, or Outcome material.',
    ],
  },
  {
    id: 'therapy-packet-intake',
    label: 'Therapy',
    icon: 'clipboard',
    template: [
      'QUINNOS THERAPY PACKET INTAKE',
      '',
      'PURPOSE:',
      'Turn raw internal material into a packet Ashley can read aloud so Quinn can receive the truth without having to perform it from inside the pressure.',
      '',
      'SESSION CONTEXT:',
      '[What is happening today? Where am I emotionally, physically, practically, or relationally?]',
      '',
      'THE THING I NEED ASHLEY TO UNDERSTAND:',
      '[What is the main truth, pattern, event, or pressure I do not want to lose in the room?]',
      '',
      'WHAT I MAY MINIMIZE OR JOKE AROUND:',
      '[What might I make smaller, deflect, intellectualize, or turn into a bit?]',
      '',
      'WHAT FEELS HARD TO SAY DIRECTLY:',
      '[The part that gets stuck, embarrassing, too intense, too tender, too complicated, or too alive.]',
      '',
      'WHAT I NEED READ ALOUD:',
      '[The exact truth I may need Ashley to say out loud for me.]',
      '',
      'WHAT I NEED HELP SORTING:',
      '[Pattern, decision, grief, relationship, work, body, avoidance, shame, anger, hope, fear, etc.]',
      '',
      'WHAT I DO NOT NEED:',
      '[What would flatten this? Generic reassurance, over-analysis, premature advice, moralizing, minimizing, etc.]',
      '',
      'WHAT FUTURE QUINN NEEDS PROTECTED:',
      '[Dignity, honesty, safety, agency, progress, softness, clarity, self-trust, recovery, momentum, etc.]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Turn this into a therapy packet Ashley can read aloud. Keep Quinn\'s voice alive. Name the core pattern, the emotional truth, what Quinn may avoid saying, what Ashley should notice, and the most useful questions for the session. Do not flatten it into generic therapy language.',
    ],
  },
  {
    id: 'default-map',
    label: 'Default Map',
    icon: 'file-text',
    template: [
      'QUINNOS DEFAULT MAP INTAKE',
      '',
      'CONSTITUTION:',
      'Quinn does not rise to her intentions. Quinn falls to her defaults.',
      'Therefore QuinnOS does not command Quinn to try harder.',
      'QuinnOS studies the slope, alters the terrain, and marks the next foothold.',
      '',
      'MODE: Strategist + Quinn Default Design',
      'DOMAIN: Behavior / Pattern / Default Redesign',
      '',
      '1. CURRENT DEFAULT',
      'What keeps happening?',
      '',
      '',
      '2. TRIGGER FIELD',
      'When, where, or under what emotional/internal conditions does it happen?',
      '',
      '',
      '3. HIDDEN REWARD',
      'What does this behavior give me immediately?',
      '',
      '',
      '4. PROTECTED NEED',
      'What valid need is hiding inside the messy behavior?',
      '',
      '',
      '5. DELAYED COST',
      'How does Future Quinn pay for this?',
      '',
      '',
      '6. BETTER REPLACEMENT',
      'What could meet the same need with less damage?',
      '',
      '',
      '7. EASE PATH',
      'How do we make the better behavior easier, smaller, closer, safer, or already-started?',
      '',
      '',
      '8. FRICTION PATH',
      'How do we make the old default slower, less automatic, or less convenient without punishment?',
      '',
      '',
      '9. MINIMUM VIABLE RETURN',
      'When I fall off, what is the smallest reset that counts?',
      '',
      '',
      '10. NEXT BEST MOVE',
      'What should I do next, specifically, in the next 5 to 15 minutes?',
      '',
      '',
      'OUTPUT I NEED FROM REN:',
      'Turn this into a Default Map. Do not stop at insight. Give me the named pattern, hidden function, cost signal, protected need, replacement path, ease path, friction path, minimum viable return, and the next best move.',
    ],
  },
  {
    id: 'outcome-log',
    label: 'Outcome',
    icon: 'activity',
    template: [
      'QUINNOS OUTCOME LOG',
      '',
      'PURPOSE:',
      'Feed the result back into QuinnOS so the system gets more accurate over time.',
      '',
      'ORIGINAL INTAKE / RECOMMENDATION:',
      '[What did QuinnOS/Ren suggest or help me decide?]',
      '',
      'WHAT I ACTUALLY DID:',
      '[What happened in real life?]',
      '',
      'IT CAUSED:',
      '[What changed afterward?]',
      '',
      'DID IT HELP?',
      '[yes / no / mixed / too soon to tell]',
      '',
      'WHAT WORKED:',
      '[What was useful, accurate, grounding, clarifying, or effective?]',
      '',
      'WHAT MISSED:',
      '[What was off, incomplete, too much, too little, generic, or badly timed?]',
      '',
      'WHAT QUINNOS SHOULD REMEMBER:',
      '[What should be weighted more strongly next time this pattern appears?]',
      '',
      'OUTPUT I NEED FROM REN:',
      'Turn this into a calibration note. Name what worked, what failed, what should change next time, and whether this should become a recurring pattern card.',
    ],
  },
];

export function buildQuinnOutcomeLogPacketFromRun(source: QuinnOutcomeLogPrefillSource) {
  const outcomeForm = QUINNOS_INTAKE_FORMS.find((form) => form.id === 'outcome-log');
  if (!outcomeForm) {
    return QUINNOS_RESPONSE_PROTOCOL.join('\n');
  }

  const originalIntake = String(source.packetText || '').trim();
  const renRecommendation = String(source.writtenResult || '').trim();
  const originalIntakePrompt = '[What did QuinnOS/Ren suggest or help me decide?]';
  const prefilledOriginalIntake = [
    'Original intake:',
    originalIntake || '[No original intake available.]',
    '',
    'Ren recommendation:',
    renRecommendation || '[No Ren recommendation available.]',
  ];
  const prefilledTemplate: string[] = [];

  for (const line of outcomeForm.template) {
    if (line === originalIntakePrompt) {
      prefilledTemplate.push(...prefilledOriginalIntake);
    } else {
      prefilledTemplate.push(line);
    }
  }

  return [...prefilledTemplate, ...QUINNOS_RESPONSE_PROTOCOL].join('\n');
}
