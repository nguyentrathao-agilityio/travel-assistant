import React from 'react';
import { render, screen } from '@testing-library/react';
import { Providers } from '../providers';

jest.mock('@/stores/threadStore', () => ({
  useThreadStore: (sel: (s: object) => unknown) => sel({ activeThreadId: 'thread-1' }),
}));

jest.mock('@/stores/apiKeyStore', () => ({
  useApiKeyStore: (sel: (s: object) => unknown) => sel({ apiKey: 'sk-test' }),
}));

jest.mock('@/utils', () => ({
  todayClientIso: () => '2026-06-04',
  clientTimezone: () => 'Asia/Ho_Chi_Minh',
}));

jest.mock('sonner', () => ({ Toaster: () => null }));

jest.mock('@/constants', () => ({
  AGENT_NAME: 'travelAgent',
  COPILOTKIT_PUBLIC_LICENSE_KEY: 'test-key',
  RUNTIME_URL: 'http://localhost',
  THEME: { LIGHT: 'light', DARK: 'dark', TOGGLE: 'toggle' },
  THEME_STORAGE_KEY: 'vite-ui-theme',
}));

describe('Providers', () => {
  it('renders children', () => {
    render(
      <Providers>
        <div data-testid="child-content">Hello World</div>
      </Providers>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <Providers>
        <span data-testid="child-1">First</span>
        <span data-testid="child-2">Second</span>
      </Providers>
    );
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('renders without crashing when no children', () => {
    const { container } = render(<Providers>{null}</Providers>);

    expect(container).toBeDefined();
  });
});
