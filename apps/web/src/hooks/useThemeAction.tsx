import { useAgentContext, useFrontendTool } from '@copilotkit/react-core/v2';
import { Moon, Sun } from 'lucide-react';
import { z } from 'zod';

// Constants
import { CHANGE_THEME_ACTION_DESCRIPTION, THEME_VALUES } from '@repo/constants';
import { ACTIONS } from '@/constants';

// Components
import { useTheme } from '@/components/ThemeProvider';

/** Lets the agent change the app theme on behalf of the user via chat. */
export const useThemeAction = () => {
  const { theme, setTheme } = useTheme();

  useAgentContext({
    description:
      'The current UI theme of the app ("light" or "dark"). When the user asks to toggle or change the theme, switch to the opposite of this value.',
    value: theme,
  });

  useFrontendTool(
    {
      name: ACTIONS.CHANGE_THEME,
      description: CHANGE_THEME_ACTION_DESCRIPTION,
      parameters: z.object({
        theme: z
          .enum([THEME_VALUES.TOGGLE, THEME_VALUES.LIGHT, THEME_VALUES.DARK])
          .describe(
            'MUST be "toggle" by default. Only use "light" or "dark" if the user explicitly requests a specific theme by name.'
          ),
      }),
      handler: async ({ theme: requested }) => {
        const next =
          requested === THEME_VALUES.TOGGLE
            ? theme === THEME_VALUES.DARK
              ? THEME_VALUES.LIGHT
              : THEME_VALUES.DARK
            : requested;

        if (next === THEME_VALUES.LIGHT || next === THEME_VALUES.DARK) setTheme(next);

        return next;
      },
      render: ({ status, result }) => {
        if (status !== 'complete' || !result) return <></>;

        const isDark = result === THEME_VALUES.DARK;

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
    },
    [setTheme, theme]
  );
};
