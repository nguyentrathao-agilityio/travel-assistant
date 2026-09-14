import { ToolCallStatus, useRenderTool } from '@copilotkit/react-native/headless';
import { Moon, Sun } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { z } from 'zod';

// Components
import { Card, Typography } from '../components/common';

// Utils
import { shellSpacing, useShellTheme } from '../theme';

const CHANGE_THEME_TOOL_NAME = 'changeTheme';

const themeParameters = z.object({
  theme: z.enum(['toggle', 'light', 'dark']),
});

/** Lets the agent change the app theme on behalf of the user via chat. */
export const useThemeAction = () => {
  const { theme, setTheme, colors } = useShellTheme();

  useRenderTool(
    {
      name: CHANGE_THEME_TOOL_NAME,
      description:
        'Change the app theme. ALWAYS pass theme="toggle" unless the user explicitly says "light mode" or "dark mode".',
      parameters: themeParameters,
      handler: async ({ theme: requested }) => {
        const next = requested === 'toggle' ? (theme === 'dark' ? 'light' : 'dark') : requested;

        setTheme(next);

        return next;
      },
      render: ({ status, result }) => {
        if (status !== ToolCallStatus.Complete || !result) return <></>;

        const isDark = result === 'dark';

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
