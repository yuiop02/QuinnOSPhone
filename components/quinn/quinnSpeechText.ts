export function normalizeSpeechText(input: string): string {
  return String(input || '')
    .replace(/\s+/g, ' ')
    .replace(/…/g, '...')
    .trim();
}

const SPOKEN_OPTION_WORDS: Record<number, string> = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
};

function toSpokenOptionLabel(rawIndex: string) {
  const parsed = Number(rawIndex);

  if (Number.isInteger(parsed) && Object.prototype.hasOwnProperty.call(SPOKEN_OPTION_WORDS, parsed)) {
    return SPOKEN_OPTION_WORDS[parsed];
  }

  return String(rawIndex || '').trim();
}

function normalizeSpeechInlineFormatting(input: string) {
  return String(input || '')
    .replace(/(^|\n)\s{0,3}#{1,6}\s+/g, '$1')
    .replace(/^\s*>\s?/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1');
}

function normalizeSpeechStructureForTts(input: string) {
  const lines = normalizeSpeechInlineFormatting(input).split('\n');
  const output: string[] = [];
  let lastListType: 'numbered' | 'bullet' | null = null;

  const appendToPrevious = (extra: string) => {
    if (!output.length) {
      output.push(extra);
      return;
    }

    output[output.length - 1] = `${output[output.length - 1]} ${extra}`
      .replace(/\s+/g, ' ')
      .trim();
  };

  for (const rawLine of lines) {
    const line = String(rawLine || '').trim();

    if (!line) {
      output.push('');
      lastListType = null;
      continue;
    }

    const numberedMatch = line.match(/^(\d{1,2})[.)]\s+(.+)$/);

    if (numberedMatch) {
      output.push(`Option ${toSpokenOptionLabel(numberedMatch[1])}: ${numberedMatch[2].trim()}`);
      lastListType = 'numbered';
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);

    if (bulletMatch) {
      output.push(`${lastListType === 'bullet' ? 'Next point' : 'Point'}: ${bulletMatch[1].trim()}`);
      lastListType = 'bullet';
      continue;
    }

    if (lastListType && /^\s+/.test(rawLine) && output.length) {
      appendToPrevious(line);
      continue;
    }

    output.push(line);
    lastListType = null;
  }

  return output.join('\n');
}

export function normalizeSpeechChunkSource(input: string): string {
  return normalizeSpeechStructureForTts(
    String(input || '')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/…/g, '...')
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildSpokenSummary(summary: string, written: string): string {
  const cleanSummary = normalizeSpeechText(summary);
  const cleanWritten = normalizeSpeechText(written);

  const summaryLooksClipped =
    !cleanSummary ||
    /\.\.\.\s*$/.test(cleanSummary) ||
    /[:;,—-]\s*$/.test(cleanSummary);

  const source = summaryLooksClipped ? cleanWritten : cleanSummary;
  return shortenSpokenSummary(source);
}

function shortenSpokenSummary(input: string): string {
  const clean = normalizeSpeechText(input).replace(/\.\.\.\s*$/, '').trim();

  if (!clean) {
    return '';
  }

  const maxChars = 420;

  if (clean.length <= maxChars) {
    return clean;
  }

  const shortened = clean.slice(0, maxChars);

  const lastPunctuation = Math.max(
    shortened.lastIndexOf('.'),
    shortened.lastIndexOf('!'),
    shortened.lastIndexOf('?')
  );

  if (lastPunctuation > 120) {
    return shortened.slice(0, lastPunctuation + 1).trim();
  }

  const lastComma = shortened.lastIndexOf(',');

  if (lastComma > 180) {
    return `${shortened.slice(0, lastComma).trim()}.`;
  }

  const lastSpace = shortened.lastIndexOf(' ');

  if (lastSpace > 120) {
    return `${shortened.slice(0, lastSpace).trim()}.`;
  }

  return `${shortened.trim()}.`;
}

function finalizeSpeechChunk(input: string) {
  return String(input || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,;:.!?])/g, '$1')
    .replace(/…/g, '...')
    .replace(/\.\.\.\s*$/, '')
    .trim();
}

const STRONG_PAUSE_PATTERN = /[^.!?]+(?:[.!?]+(?:["')\]]+)?(?=\s|$)|$)/g;
const MEDIUM_PAUSE_PATTERN = /[^;:—]+(?:\s-\s|[;:—]+(?:["')\]]+)?(?=\s|$)|$)/g;
const COMMA_PAUSE_PATTERN = /[^,]+(?:,+(?:["')\]]+)?(?=\s|$)|$)/g;

function splitBySpeechPattern(input: string, pattern: RegExp) {
  const clean = finalizeSpeechChunk(input);

  if (!clean) {
    return [];
  }

  const parts =
    clean.match(pattern)?.map((part) => finalizeSpeechChunk(part)).filter(Boolean) || [];

  return parts.length ? parts : [clean];
}

function mergeDetachedListLeadClauses(input: string[]) {
  const merged: string[] = [];

  for (let i = 0; i < input.length; i += 1) {
    const current = finalizeSpeechChunk(input[i]);
    const next = finalizeSpeechChunk(input[i + 1] || '');

    if (
      current &&
      next &&
      /^(?:\d+[.)]?|option (?:\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve):?)$/i.test(
        current
      )
    ) {
      merged.push(finalizeSpeechChunk(`${current} ${next}`));
      i += 1;
      continue;
    }

    if (current) {
      merged.push(current);
    }
  }

  return merged;
}

function splitIntoSpeechClauses(input: string, maxChars = 175) {
  const clean = finalizeSpeechChunk(input);

  if (!clean) {
    return [];
  }

  const clauses: string[] = [];
  const sentences = splitBySpeechPattern(clean, STRONG_PAUSE_PATTERN);

  for (const sentence of sentences) {
    if (sentence.length <= maxChars) {
      clauses.push(sentence);
      continue;
    }

    const mediumParts = splitBySpeechPattern(sentence, MEDIUM_PAUSE_PATTERN);

    if (mediumParts.length === 1) {
      clauses.push(...splitBySpeechPattern(sentence, COMMA_PAUSE_PATTERN));
      continue;
    }

    for (const mediumPart of mediumParts) {
      if (mediumPart.length <= maxChars) {
        clauses.push(mediumPart);
      } else {
        clauses.push(...splitBySpeechPattern(mediumPart, COMMA_PAUSE_PATTERN));
      }
    }
  }

  return mergeDetachedListLeadClauses(clauses.filter(Boolean));
}

function endsWithStrongPause(input: string) {
  return /[.!?]["')\]]?$/.test(input);
}

function endsWithMediumPause(input: string) {
  return /(?:[,;:—]| -)["')\]]?$/.test(input);
}

function startsWithWeakLead(input: string) {
  return /^(and|but|or|so|because|which|that|then|also|plus|except|especially|while|when|if|like)\b/i.test(
    input
  );
}

function endsWithWeakTail(input: string) {
  return /\b(and|but|or|so|because|that|if|when)\b$/i.test(finalizeSpeechChunk(input));
}

function splitLongClauseByWords(input: string, maxChars = 175, minChars = 48) {
  const words = finalizeSpeechChunk(input).split(' ').filter(Boolean);

  if (!words.length) {
    return [];
  }

  const parts: string[] = [];
  let wordChunk = '';

  const pushWordChunk = (nextWord = '') => {
    let chunkToPush = finalizeSpeechChunk(wordChunk);
    let carry = nextWord;

    if (endsWithWeakTail(chunkToPush)) {
      const chunkWords = chunkToPush.split(' ');

      if (chunkWords.length > 2) {
        const trailingWord = chunkWords[chunkWords.length - 1];
        const shortened = finalizeSpeechChunk(chunkWords.slice(0, -1).join(' '));

        if (shortened.length >= minChars) {
          chunkToPush = shortened;
          carry = `${trailingWord} ${nextWord}`.trim();
        }
      }
    }

    if (chunkToPush) {
      parts.push(chunkToPush);
    }

    wordChunk = carry;
  };

  for (const word of words) {
    const candidate = `${wordChunk} ${word}`.trim();

    if (!wordChunk || candidate.length <= maxChars) {
      wordChunk = candidate;
      continue;
    }

    pushWordChunk(word);
  }

  if (wordChunk) {
    parts.push(finalizeSpeechChunk(wordChunk));
  }

  return parts.filter(Boolean);
}

function rebalanceSpeechChunks(chunks: string[], maxChars = 175) {
  const output = chunks.map((chunk) => finalizeSpeechChunk(chunk)).filter(Boolean);

  if (output.length < 2) {
    return output;
  }

  for (let i = 1; i < output.length; i += 1) {
    const current = output[i];
    const previous = output[i - 1];
    const merged = finalizeSpeechChunk(`${previous} ${current}`);

    if (startsWithWeakLead(current) && merged.length <= maxChars + 12) {
      output.splice(i - 1, 2, merged);
      i = Math.max(0, i - 2);
    }
  }

  for (let i = 1; i < output.length - 1; i += 1) {
    const current = output[i];
    const previous = output[i - 1];
    const next = output[i + 1];
    const mergedWithPrevious = finalizeSpeechChunk(`${previous} ${current}`);
    const mergedWithNext = finalizeSpeechChunk(`${current} ${next}`);
    const currentIsTiny = current.length < 48;

    if (!currentIsTiny && !startsWithWeakLead(current)) {
      continue;
    }

    if (mergedWithPrevious.length <= maxChars + 18) {
      output.splice(i - 1, 2, mergedWithPrevious);
      i = Math.max(0, i - 2);
      continue;
    }

    if (mergedWithNext.length <= maxChars + 18) {
      output.splice(i, 2, mergedWithNext);
      i = Math.max(0, i - 1);
    }
  }

  if (output.length >= 2) {
    const last = output[output.length - 1];
    const prev = output[output.length - 2];
    const merged = finalizeSpeechChunk(`${prev} ${last}`);

    if (last.length < 60 && merged.length <= maxChars + 18) {
      output.splice(output.length - 2, 2, merged);
    }
  }

  return output;
}

function splitTextForSpeech(input: string, maxChars = 175, firstChunkMax = 160) {
  const clean = normalizeSpeechChunkSource(input);

  if (!clean) {
    return [];
  }

  const paragraphParts = clean
    .split(/\n\s*\n/)
    .map((part) => finalizeSpeechChunk(part))
    .filter(Boolean);

  const targetMin = 95;
  const targetIdeal = 135;
  const chunks: string[] = [];
  const activeChunkMax = () => (chunks.length === 0 ? firstChunkMax : maxChars);

  for (const paragraph of paragraphParts.length ? paragraphParts : [clean]) {
    const clauses = splitIntoSpeechClauses(paragraph, maxChars);
    let current = '';

    for (const clause of clauses) {
      if (!clause) {
        continue;
      }

      if (!current) {
        const currentMax = activeChunkMax();

        if (clause.length <= currentMax) {
          current = clause;
        } else {
          const wordChunks = splitLongClauseByWords(clause, currentMax);
          current = finalizeSpeechChunk(wordChunks.pop() || '');
          chunks.push(...wordChunks.map((chunk) => finalizeSpeechChunk(chunk)));
        }

        continue;
      }

      const candidate = finalizeSpeechChunk(`${current} ${clause}`);
      const currentMax = activeChunkMax();

      if (candidate.length <= currentMax) {
        current = candidate;

        const currentLen = current.length;
        const strong = endsWithStrongPause(current);
        const medium = endsWithMediumPause(current);

        if (
          (strong && currentLen >= targetMin) ||
          (medium && currentLen >= targetIdeal)
        ) {
          chunks.push(finalizeSpeechChunk(current));
          current = '';
        }

        continue;
      }

      chunks.push(finalizeSpeechChunk(current));

      const nextMax = activeChunkMax();

      if (clause.length <= nextMax) {
        current = clause;
      } else {
        const wordChunks = splitLongClauseByWords(clause, nextMax);
        current = finalizeSpeechChunk(wordChunks.pop() || '');
        chunks.push(...wordChunks.map((chunk) => finalizeSpeechChunk(chunk)));
      }
    }

    if (current) {
      chunks.push(finalizeSpeechChunk(current));
    }
  }

  return rebalanceSpeechChunks(chunks, maxChars).filter(Boolean);
}

export function buildRealtimeSpeechChunks(input: string) {
  return splitTextForSpeech(input, 175, 160)
    .map((chunk) => finalizeSpeechChunk(chunk))
    .filter(Boolean);
}
