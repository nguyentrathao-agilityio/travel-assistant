import { createSseParser } from '../sse';

describe('createSseParser', () => {
  it('handles events split across chunks and several events per chunk', () => {
    const parser = createSseParser();

    expect(parser.push('data: {"a"')).toEqual([]);
    expect(parser.push(':1}\n\ndata: {"b":2}\n\ndata: {"c"')).toEqual(['{"a":1}', '{"b":2}']);
    expect(parser.push(':3}\n\n')).toEqual(['{"c":3}']);
  });

  it('joins multi-line data, ignores comments and CRLF, flushes a trailing event', () => {
    const parser = createSseParser();

    expect(parser.push(': ping\r\ndata: line1\r\ndata: line2\r\n\r\n')).toEqual(['line1\nline2']);
    expect(parser.push('data: tail')).toEqual([]);
    expect(parser.flush()).toEqual(['tail']);
  });
});
