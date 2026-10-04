import { describe, expect, it } from 'vitest';

import { isVoiceModeConfig } from '../system-prompt';

describe('isVoiceModeConfig', () => {
  it('is true only when the voice gateway flags the run', () => {
    expect(isVoiceModeConfig({ configurable: { voiceMode: true } })).toBe(true);
    expect(isVoiceModeConfig({ configurable: { voiceMode: 'true' } })).toBe(false);
    expect(isVoiceModeConfig({ configurable: {} })).toBe(false);
    expect(isVoiceModeConfig(undefined)).toBe(false);
  });
});
