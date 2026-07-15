import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { Moon, Sun } from 'lucide-react';

// Constants
import { ACTIONS, THEME } from '@/constants';

// Components
import { useTheme } from '@/components/ThemeProvider';

/** Lets the agent change the app theme on behalf of the user via chat. */
export const useThemeAction = () => {
  const { theme, setTheme } = useTheme();

  useCopilotReadable({
    description:
      'The current UI theme of the app ("light" or "dark"). When the user asks to toggle or change the theme, switch to the opposite of this value.',
    value: theme,
  });

  useCopilotAction({
    name: ACTIONS.CHANGE_THEME,
    description:
      'Change the app theme. ALWAYS pass theme="toggle" unless the user explicitly says "light mode" or "dark mode".',
    parameters: [
      {
        name: 'theme',
        type: 'string',
        description:
          'MUST be "toggle" by default. Only use "light" or "dark" if the user explicitly requests a specific theme by name.',
        required: true,
      },
    ],
    handler: async ({ theme: requested }) => {
      const next =
        requested === THEME.TOGGLE ? (theme === THEME.DARK ? THEME.LIGHT : THEME.DARK) : requested;
      if (next === THEME.LIGHT || next === THEME.DARK) setTheme(next);
      return next;
    },
    render: ({ status, result }) => {
      if (status !== 'complete' || !result) return <></>;

      const isDark = result === THEME.DARK;

      return (
        <div className="border-border-secondary bg-background-primary flex items-center gap-3 rounded-lg border px-4 py-3">
          {isDark ? (
            <Moon size={16} className="text-text-secondary" />
          ) : (
            <Sun size={16} className="text-text-secondary" />
          )}
          <p className="text-body font-regular text-text-primary">
            Switched to {isDark ? 'dark' : 'light'} mode
          </p>
        </div>
      );
    },
  });
};
