// Constants
import { SSE_DATA_PREFIX } from '../constants';

/** Incremental SSE parser returning complete `data` payloads. */
export const createSseParser = () => {
  let buffer = '';
  let dataLines: string[] = [];

  const takeLines = (final: boolean): string[] => {
    const events: string[] = [];
    const lines = buffer.split(/\r?\n/);

    buffer = final ? '' : (lines.pop() ?? '');

    for (const line of lines) {
      if (line === '') {
        if (dataLines.length > 0) events.push(dataLines.join('\n'));

        dataLines = [];
        continue;
      }

      if (line.startsWith(SSE_DATA_PREFIX)) {
        dataLines.push(line.slice(SSE_DATA_PREFIX.length).replace(/^ /, ''));
      }
    }

    return events;
  };

  return {
    push(chunk: string): string[] {
      buffer += chunk;

      return takeLines(false);
    },
    flush(): string[] {
      const events = takeLines(true);

      if (dataLines.length > 0) events.push(dataLines.join('\n'));

      dataLines = [];

      return events;
    },
  };
};
