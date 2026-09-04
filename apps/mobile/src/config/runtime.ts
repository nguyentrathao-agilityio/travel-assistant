const LOCALHOST_NAMES = new Set(['localhost', '127.0.0.1', '::1']);

export const resolveRuntimeUrl = (configuredUrl: string | undefined): string => {
  const value = configuredUrl?.trim();

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

  if (LOCALHOST_NAMES.has(url.hostname)) {
    throw new Error(
      'EXPO_PUBLIC_RUNTIME_URL must use a device-reachable host, not localhost. Use your LAN IP, an emulator host alias, or HTTPS deployment.'
    );
  }

  return value.replace(/\/+$/, '');
};
