import '@testing-library/jest-dom';

// jsdom does not implement crypto.randomUUID — polyfill for stores that call it at module load
if (!global.crypto?.randomUUID) {
  let counter = 0;
  Object.defineProperty(global, 'crypto', {
    value: { randomUUID: () => `test-uuid-${++counter}` },
    configurable: true,
  });
}

if (!global.IntersectionObserver) {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
}
