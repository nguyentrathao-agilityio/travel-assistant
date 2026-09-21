export const RUNTIME_CONFIG_STATUS = {
  READY: 'ready',
  ERROR: 'error',
} as const;

// `URL.hostname` keeps the brackets on IPv6 literals, so the loopback entry must too.
export const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

export const RUNTIME_URL_ERRORS = {
  REQUIRED: 'EXPO_PUBLIC_RUNTIME_URL is required. Copy .env.example to .env.local.',
  INVALID: 'EXPO_PUBLIC_RUNTIME_URL must be a valid URL.',
  PROTOCOL: 'EXPO_PUBLIC_RUNTIME_URL must use HTTP or HTTPS.',
  LOCALHOST:
    'EXPO_PUBLIC_RUNTIME_URL must use a device-reachable host, not localhost. Use your LAN IP, an emulator host alias, or HTTPS deployment.',
} as const;
