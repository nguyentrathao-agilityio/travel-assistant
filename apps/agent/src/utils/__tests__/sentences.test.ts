import { describe, expect, it } from 'vitest';

// Utils
import { createSentenceSegmenter } from '@/utils/sentences';

describe('createSentenceSegmenter', () => {
  it('emits completed sentences as text streams in and flushes the remainder', () => {
    const segmenter = createSentenceSegmenter();

    expect(segmenter.push('Chào bạn')).toEqual([]);
    expect(segmenter.push('! Tôi tìm được 3 chuyến')).toEqual(['Chào bạn!']);
    expect(segmenter.push(' bay. Giá từ 1.200.000đ')).toEqual(['Tôi tìm được 3 chuyến bay.']);
    expect(segmenter.flush()).toEqual(['Giá từ 1.200.000đ']);
    expect(segmenter.flush()).toEqual([]);
  });

  it('does not split decimals or times and splits on newlines', () => {
    const segmenter = createSentenceSegmenter();

    expect(segmenter.push('Departs 10.30 tomorrow.\nArrives at 12:45')).toEqual([
      'Departs 10.30 tomorrow.',
    ]);
    expect(segmenter.flush()).toEqual(['Arrives at 12:45']);
  });

  it('strips markdown symbols that should not be read aloud', () => {
    const segmenter = createSentenceSegmenter();

    expect(segmenter.push('**Option 1** - Vietnam Airlines. ')).toEqual([
      'Option 1 - Vietnam Airlines.',
    ]);
  });
});

describe('createSentenceSegmenter with minLength', () => {
  it('merges short sentences until the segment reaches minLength', () => {
    const segmenter = createSentenceSegmenter({ minLength: 20 });

    expect(segmenter.push('Sure! Here you go. ')).toEqual([]);
    expect(segmenter.push('I found three flights. Next')).toEqual([
      'Sure! Here you go. I found three flights.',
    ]);
    expect(segmenter.flush()).toEqual(['Next']);
  });

  it('does not split after a numbered list marker', () => {
    const segmenter = createSentenceSegmenter();

    expect(segmenter.push('Options:\n1. Hà Nội trip.\n2. Đà Nẵng trip.\n')).toEqual([
      'Options:',
      '1. Hà Nội trip.',
      '2. Đà Nẵng trip.',
    ]);
  });
});
