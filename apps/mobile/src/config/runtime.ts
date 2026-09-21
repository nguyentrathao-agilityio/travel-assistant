import { LOCALHOST_HOSTNAMES, RUNTIME_URL_ERRORS } from '../constants/runtime';

const platformOverride = (platform: string | undefined): string | undefined => {
  if (platform === 'ios') return process.env.EXPO_PUBLIC_RUNTIME_URL_IOS;
  if (platform === 'android') return process.env.EXPO_PUBLIC_RUNTIME_URL_ANDROID;

  return undefined;
};

const parseHttpUrl = (value: string): URL => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(RUNTIME_URL_ERRORS.INVALID);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(RUNTIME_URL_ERRORS.PROTOCOL);
  }

  return url;
};

export const resolveRuntimeUrl = (
  configuredUrl: string | undefined,
  platform: string | undefined = process.env.EXPO_OS
): string => {
  const override = platformOverride(platform);
  const value = (override ?? configuredUrl)?.trim();

  if (!value) throw new Error(RUNTIME_URL_ERRORS.REQUIRED);

  const url = parseHttpUrl(value);

  const allowsLocalhost = Boolean(override) && platform === 'ios';

  if (!allowsLocalhost && LOCALHOST_HOSTNAMES.has(url.hostname)) {
    throw new Error(RUNTIME_URL_ERRORS.LOCALHOST);
  }

  return value.replace(/\/+$/, '');
};
