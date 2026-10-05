import { encodeWav, pcmDurationMs } from '../wav';

const pcm = (samples: number[]) => {
  const view = new DataView(new ArrayBuffer(samples.length * 2));

  samples.forEach((sample, index) => view.setInt16(index * 2, sample, true));

  return view.buffer;
};

describe('encodeWav', () => {
  it('writes a 44-byte PCM16 mono header followed by the samples in order', () => {
    const chunks = [pcm([1, 2]), pcm([3])];
    const wav = encodeWav({ byteLength: 6, chunks }, 24000);
    const view = new DataView(wav.buffer);
    const text = (start: number) => String.fromCharCode(...wav.slice(start, start + 4));

    expect(wav.length).toBe(44 + 6);
    expect(text(0)).toBe('RIFF');
    expect(view.getUint32(4, true)).toBe(36 + 6);
    expect(text(8)).toBe('WAVE');
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(24000);
    expect(view.getUint32(28, true)).toBe(48000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(text(36)).toBe('data');
    expect(view.getUint32(40, true)).toBe(6);
    expect([view.getInt16(44, true), view.getInt16(46, true), view.getInt16(48, true)]).toEqual([
      1, 2, 3,
    ]);
  });
});

describe('pcmDurationMs', () => {
  it('converts 16-bit mono bytes to milliseconds', () => {
    expect(pcmDurationMs(48000, 24000)).toBe(1000);
    expect(pcmDurationMs(24000, 24000)).toBe(500);
  });
});
