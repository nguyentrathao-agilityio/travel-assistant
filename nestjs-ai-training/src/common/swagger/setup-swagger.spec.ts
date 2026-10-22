import { isSwaggerEnabled } from './setup-swagger.js';

describe('isSwaggerEnabled', () => {
  it('is enabled by default', () => {
    expect(isSwaggerEnabled({})).toBe(true);
  });

  it('is disabled in production', () => {
    expect(isSwaggerEnabled({ NODE_ENV: 'production' })).toBe(false);
  });

  it('can be enabled in production with SWAGGER_ENABLED=true', () => {
    expect(
      isSwaggerEnabled({ NODE_ENV: 'production', SWAGGER_ENABLED: 'true' }),
    ).toBe(true);
  });

  it('can be disabled outside production with SWAGGER_ENABLED=false', () => {
    expect(
      isSwaggerEnabled({ NODE_ENV: 'development', SWAGGER_ENABLED: 'false' }),
    ).toBe(false);
  });

  it('treats an unrecognised SWAGGER_ENABLED value as false', () => {
    expect(
      isSwaggerEnabled({ NODE_ENV: 'production', SWAGGER_ENABLED: 'yes' }),
    ).toBe(false);
  });

  it('falls back to NODE_ENV when SWAGGER_ENABLED is empty', () => {
    expect(
      isSwaggerEnabled({ NODE_ENV: 'production', SWAGGER_ENABLED: '' }),
    ).toBe(false);
    expect(isSwaggerEnabled({ SWAGGER_ENABLED: '' })).toBe(true);
  });
});
