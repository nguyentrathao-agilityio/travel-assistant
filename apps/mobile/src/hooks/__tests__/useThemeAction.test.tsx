import { renderHook } from '@testing-library/react-native';

import { CHANGE_THEME_ACTION, THEME_VALUES } from '@repo/constants';

import { useThemeAction } from '../useThemeAction';

const mockSetTheme = jest.fn();
const mockUseRenderTool = jest.fn();

jest.mock('@copilotkit/react-native/headless', () => ({
  ToolCallStatus: { InProgress: 'inProgress', Executing: 'executing', Complete: 'complete' },
  useRenderTool: (config: unknown, deps: unknown[]) => mockUseRenderTool(config, deps),
}));

jest.mock('../../theme', () => ({
  shellSpacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  useShellTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
    colors: { textOnDark: '#fff' },
  }),
}));

beforeEach(() => {
  mockSetTheme.mockClear();
  mockUseRenderTool.mockClear();
});

test('registers changeTheme as a render tool', async () => {
  await renderHook(() => useThemeAction());

  expect(mockUseRenderTool).toHaveBeenCalledTimes(1);
  expect(mockUseRenderTool.mock.calls[0][0]).toMatchObject({ name: CHANGE_THEME_ACTION });
});

test('toggle handler switches from light to dark', async () => {
  await renderHook(() => useThemeAction());
  const { handler } = mockUseRenderTool.mock.calls[0][0];

  await expect(handler({ theme: THEME_VALUES.TOGGLE })).resolves.toBe(THEME_VALUES.DARK);
  expect(mockSetTheme).toHaveBeenCalledWith(THEME_VALUES.DARK);
});

test('explicit theme is applied directly without toggling', async () => {
  await renderHook(() => useThemeAction());
  const { handler } = mockUseRenderTool.mock.calls[0][0];

  await expect(handler({ theme: THEME_VALUES.LIGHT })).resolves.toBe(THEME_VALUES.LIGHT);
  expect(mockSetTheme).toHaveBeenCalledWith(THEME_VALUES.LIGHT);
});

test('render returns nothing until the tool call completes', async () => {
  await renderHook(() => useThemeAction());
  const { render } = mockUseRenderTool.mock.calls[0][0];

  const result = render({ status: 'inProgress', result: undefined });

  expect(result.type).toBe(Symbol.for('react.fragment'));
});

test('render shows the switched-to mode once complete', async () => {
  await renderHook(() => useThemeAction());
  const { render } = mockUseRenderTool.mock.calls[0][0];

  const result = render({ status: 'complete', result: THEME_VALUES.DARK });

  expect(result.type).not.toBe(Symbol.for('react.fragment'));
});
