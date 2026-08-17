import React from 'react';
import { renderHook } from '@testing-library/react';

// Hooks
import { useThemeAction } from '@/hooks/useThemeAction';

const mockSetTheme = jest.fn();
const mockUseAgentContext = jest.fn();
const mockUseFrontendTool = jest.fn();

jest.mock('@copilotkit/react-core/v2', () => ({
  useAgentContext: (...args: unknown[]) => mockUseAgentContext(...args),
  useFrontendTool: (...args: unknown[]) => mockUseFrontendTool(...args),
}));

jest.mock('@/components/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'light', setTheme: mockSetTheme }),
}));

beforeEach(() => {
  mockSetTheme.mockClear();
  mockUseAgentContext.mockClear();
  mockUseFrontendTool.mockClear();
});

describe('useThemeAction', () => {
  it('publishes the current theme through agent context', () => {
    renderHook(() => useThemeAction());

    expect(mockUseAgentContext).toHaveBeenCalledWith({
      description: expect.stringContaining('current UI theme'),
      value: 'light',
    });
  });

  it('registers theme changes as a frontend tool', () => {
    renderHook(() => useThemeAction());

    expect(mockUseFrontendTool).toHaveBeenCalledTimes(1);
    expect(mockUseFrontendTool.mock.calls[0][0]).toMatchObject({ name: 'changeTheme' });
  });

  it('toggles the current theme', async () => {
    renderHook(() => useThemeAction());
    const tool = mockUseFrontendTool.mock.calls[0][0];

    await expect(tool.handler({ theme: 'toggle' })).resolves.toBe('dark');
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('renders the completed theme result', () => {
    renderHook(() => useThemeAction());
    const tool = mockUseFrontendTool.mock.calls[0][0];
    const result = tool.render({ status: 'complete', result: 'dark', args: { theme: 'dark' } });

    expect(React.isValidElement(result)).toBe(true);
    expect(result.type).not.toBe(React.Fragment);
  });
});
