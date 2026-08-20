import React from 'react';
import { render, screen } from '@testing-library/react';
import { CopilotKit } from '@copilotkit/react-core/v2';
import { Providers } from '../providers';

const clearApiKeyMock = jest.fn();
let activeThreadId = 'thread-1';
let activeThreadRevision = 0;

jest.mock('@/stores/threadStore', () => ({
  useThreadStore: (sel: (s: object) => unknown) => sel({ activeThreadId, activeThreadRevision }),
}));

jest.mock('@/stores/apiKeyStore', () => ({
  useApiKeyStore: (sel: (s: object) => unknown) =>
    sel({ apiKey: 'sk-test', clearApiKey: clearApiKeyMock }),
}));

jest.mock('@/utils', () => ({
  todayClientIso: () => '2026-06-04',
  clientTimezone: () => 'Asia/Ho_Chi_Minh',
}));

jest.mock('sonner', () => ({ Toaster: () => null, toast: { error: jest.fn() } }));

jest.mock('@/constants', () => ({
  AGENT_NAME: 'travelAgent',
  COPILOTKIT_PUBLIC_LICENSE_KEY: 'test-key',
  RUNTIME_URL: 'http://localhost',
  THEME: { LIGHT: 'light', DARK: 'dark', TOGGLE: 'toggle' },
  THEME_STORAGE_KEY: 'vite-ui-theme',
}));

describe('Providers', () => {
  beforeEach(() => {
    clearApiKeyMock.mockClear();
    activeThreadId = 'thread-1';
    activeThreadRevision = 0;
    jest
      .mocked(CopilotKit)
      .mockImplementation(({ children }: { children?: React.ReactNode }) => <>{children}</>);
  });

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

  it('clears the verified key after an OpenAI authentication error', () => {
    render(<Providers>{null}</Providers>);
    const props = jest.mocked(CopilotKit).mock.calls.at(-1)?.[0] as {
      onError?: (event: { error?: Error }) => void;
    };

    props.onError?.({ error: new Error('401 Incorrect API key provided') });

    expect(clearApiKeyMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the key after a transient stream error', () => {
    render(<Providers>{null}</Providers>);
    const props = jest.mocked(CopilotKit).mock.calls.at(-1)?.[0] as {
      onError?: (event: { error?: Error }) => void;
    };

    props.onError?.({ error: new Error('Network request failed') });

    expect(clearApiKeyMock).not.toHaveBeenCalled();
  });

  it('remounts CopilotKit when the active thread changes or is reset', () => {
    const mounted = jest.fn();
    const unmounted = jest.fn();

    jest.mocked(CopilotKit).mockImplementation(({ children }: { children?: React.ReactNode }) => {
      React.useEffect(() => {
        mounted();

        return unmounted;
      }, []);

      return <>{children}</>;
    });

    const { rerender } = render(<Providers>chat</Providers>);

    activeThreadId = 'thread-2';
    rerender(<Providers>chat</Providers>);
    activeThreadRevision = 1;
    rerender(<Providers>chat</Providers>);

    expect(mounted).toHaveBeenCalledTimes(3);
    expect(unmounted).toHaveBeenCalledTimes(2);
  });
});
