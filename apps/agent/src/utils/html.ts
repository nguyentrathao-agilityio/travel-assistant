const NAMED_HTML_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
};

/** Converts a validated decimal or hexadecimal value into its Unicode character. */
const decodeCodePoint = (rawValue: string, radix: 10 | 16): string | undefined => {
  const codePoint = Number.parseInt(rawValue, radix);

  return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : undefined;
};

/** Decodes supported named entities and all valid numeric HTML entities. */
const decodeHtmlEntities = (value: string): string =>
  value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi,
    (
      entity,
      decimal: string | undefined,
      hexadecimal: string | undefined,
      named: string | undefined
    ) => {
      if (decimal) return decodeCodePoint(decimal, 10) ?? entity;
      if (hexadecimal) return decodeCodePoint(hexadecimal, 16) ?? entity;

      return named ? (NAMED_HTML_ENTITIES[named.toLowerCase()] ?? entity) : entity;
    }
  );

/** Removes markup whose contents should never enter retrieval documents. */
const removeExecutableMarkup = (value: string): string =>
  value
    .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

/** Preserves useful block boundaries while removing remaining HTML tags. */
const htmlToPlainText = (value: string): string =>
  value
    .replace(/<(br|hr)\s*\/?>/gi, '\n')
    .replace(/<\/(article|div|h[1-6]|li|main|p|section)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

/** Produces stable spacing and line breaks for chunking and embedding. */
const normalizeWhitespace = (value: string): string =>
  value
    .replace(/\r/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/** Converts fetched HTML or text into normalized plain text. */
export const sanitizeSourceContent = (rawContent: string, contentType = ''): string => {
  const safeContent = removeExecutableMarkup(rawContent);
  const plainText = contentType.includes('html') ? htmlToPlainText(safeContent) : safeContent;

  return normalizeWhitespace(decodeHtmlEntities(plainText));
};
