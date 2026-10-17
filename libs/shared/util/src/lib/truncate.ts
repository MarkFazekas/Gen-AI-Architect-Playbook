const ELLIPSIS = '…';

/**
 * Shortens a text to the given length, ending it with an ellipsis when it was cut.
 * @param text The text to shorten.
 * @param maxLength The maximum length of the returned text, including the ellipsis.
 * @returns The original text, or its shortened form.
 */
export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength
    ? text
    : `${text.slice(0, Math.max(0, maxLength - ELLIPSIS.length)).trimEnd()}${ELLIPSIS}`;
}
