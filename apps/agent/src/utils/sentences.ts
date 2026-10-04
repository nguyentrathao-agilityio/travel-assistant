const SENTENCE_END = /[.!?…。]/;
const MARKDOWN_NOISE = /[*_`#>|]/g;
const WHITESPACE = /\s/;
const WHITESPACE_RUN = /\s+/g;
const LIST_MARKER = /^\s*\d+$/;

const normalize = (text: string): string =>
  text.replace(MARKDOWN_NOISE, '').replace(WHITESPACE_RUN, ' ').trim();

const isBoundary = (input: string, index: number, sentenceStart: number): boolean => {
  const character = input[index]!;

  if (character === '\n') return true;
  if (!SENTENCE_END.test(character)) return false;

  const next = input[index + 1];

  if (next === undefined || !WHITESPACE.test(next)) return false;

  return !LIST_MARKER.test(input.slice(sentenceStart, index));
};

/** Splits streamed text into speakable segments of at least `minLength` characters. */
export const createSentenceSegmenter = ({ minLength = 0 }: { minLength?: number } = {}) => {
  let pending = '';

  const take = (): string[] => {
    const segments: string[] = [];
    let segmentStart = 0;
    let sentenceStart = 0;

    for (let index = 0; index < pending.length; index += 1) {
      if (!isBoundary(pending, index, sentenceStart)) continue;

      sentenceStart = index + 1;

      const segment = normalize(pending.slice(segmentStart, index + 1));

      if (!segment) {
        segmentStart = index + 1;
        continue;
      }

      if (segment.length < minLength) continue;

      segments.push(segment);
      segmentStart = index + 1;
    }

    pending = pending.slice(segmentStart);

    return segments;
  };

  return {
    push(text: string): string[] {
      pending += text;

      return take();
    },
    flush(): string[] {
      const rest = normalize(pending);
      pending = '';

      return rest ? [rest] : [];
    },
  };
};
