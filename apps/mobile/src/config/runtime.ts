const LOCALHOST_NAMES = new Set(['localhost', '127.0.0.1', '::1']);

// EXPO_OS avoids importing 'react-native' Platform, which breaks plain-Node tests.
// Per-platform URL overrides win over the shared one, since simulator/emulator
// often need a different host than physical devices for the same dev machine.
const platformOverride = (): string | undefined => {
  if (process.env.EXPO_OS === 'ios') return process.env.EXPO_PUBLIC_RUNTIME_URL_IOS;
  if (process.env.EXPO_OS === 'android') return process.env.EXPO_PUBLIC_RUNTIME_URL_ANDROID;
  return undefined;
};

export const resolveRuntimeUrl = (configuredUrl: string | undefined): string => {
  const override = platformOverride();
  const value = (override ?? configuredUrl)?.trim();

  if (!value) {
    throw new Error('EXPO_PUBLIC_RUNTIME_URL is required. Copy .env.example to .env.local.');
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('EXPO_PUBLIC_RUNTIME_URL must be a valid URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_RUNTIME_URL must use HTTP or HTTPS.');
  }

  // Only the explicit iOS override may use localhost — the shared value is also
  // used for physical-device builds, where localhost would point at the device itself.
  const isTrustedIosLocalhost = Boolean(override) && process.env.EXPO_OS === 'ios';

  if (!isTrustedIosLocalhost && LOCALHOST_NAMES.has(url.hostname)) {
    throw new Error(
      'EXPO_PUBLIC_RUNTIME_URL must use a device-reachable host, not localhost. Use your LAN IP, an emulator host alias, or HTTPS deployment.'
    );
  }

  return value.replace(/\/+$/, '');
};
