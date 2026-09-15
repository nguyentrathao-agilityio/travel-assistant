import { ToolCallStatus, useRenderTool } from '@copilotkit/react-native/headless';
import { Moon, Sun } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { z } from 'zod';

// Constants
import {
  CHANGE_THEME_ACTION,
  CHANGE_THEME_ACTION_DESCRIPTION,
  THEME_VALUES,
} from '@repo/constants';

// Components
import { Card, Typography } from '../components/common';

// Utils
import { shellSpacing, useShellTheme } from '../theme';

const themeParameters = z.object({
  theme: z.enum([THEME_VALUES.TOGGLE, THEME_VALUES.LIGHT, THEME_VALUES.DARK]),
});

/** Lets the agent change the app theme on behalf of the user via chat. */
export const useThemeAction = () => {
  const { theme, setTheme, colors } = useShellTheme();

  useRenderTool(
    {
      name: CHANGE_THEME_ACTION,
      description: CHANGE_THEME_ACTION_DESCRIPTION,
      parameters: themeParameters,
      handler: async ({ theme: requested }) => {
        const next =
          requested === THEME_VALUES.TOGGLE
            ? theme === THEME_VALUES.DARK
              ? THEME_VALUES.LIGHT
              : THEME_VALUES.DARK
            : requested;

        setTheme(next);

        return next;
      },
      render: ({ status, result }) => {
        if (status !== ToolCallStatus.Complete || !result) return <></>;

        const isDark = result === THEME_VALUES.DARK;

        return (
          <Card style={styles.row}>
            {isDark ? (
              <Moon color={colors.textOnDark} size={16} />
            ) : (
              <Sun color={colors.textOnDark} size={16} />
            )}
            <Typography>Switched to {isDark ? 'dark' : 'light'} mode</Typography>
          </Card>
        );
      },
    },
    [theme, setTheme, colors]
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: shellSpacing.sm,
  },
});
