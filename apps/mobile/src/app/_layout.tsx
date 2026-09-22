import { CopilotKitProvider } from '@copilotkit/react-native/headless';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

// Services
import { isApiKeyError } from '../services/openaiApiKey';

// Constants
import { OPENAI_API_KEY_HEADER } from '@repo/constants';
import {
  API_KEY_STATUS,
  CHAT_ROUTE,
  DASHBOARD_ROUTE,
  INDEX_ROUTE,
  RUNTIME_CONFIG_STATUS,
  THREADS_ROUTE,
} from '../constants';

// Components
import { RuntimeSetup } from '../components';
import { ApiKeyScreen } from '../screens';

// Hooks
import { useApiKey } from '../hooks';

// Utils
import { resolveRuntimeUrl } from '../config';
import { ThemeProvider, useShellTheme } from '../theme';
import { clientTimezone, todayClientIso } from '@repo/utils';

type RuntimeConfiguration =
  | { status: typeof RUNTIME_CONFIG_STATUS.READY; runtimeUrl: string }
  | { status: typeof RUNTIME_CONFIG_STATUS.ERROR; message: string };

const runtimeConfiguration: RuntimeConfiguration = (() => {
  try {
    return {
      status: RUNTIME_CONFIG_STATUS.READY,
      runtimeUrl: resolveRuntimeUrl(process.env.EXPO_PUBLIC_RUNTIME_URL),
    };
  } catch (error) {
    return {
      status: RUNTIME_CONFIG_STATUS.ERROR,
      message:
        error instanceof Error ? error.message : 'Unable to configure the CopilotKit runtime.',
    };
  }
})();

const RootLayoutContent = () => {
  const apiKey = useApiKey();
  const { colors } = useShellTheme();

  if (runtimeConfiguration.status === RUNTIME_CONFIG_STATUS.ERROR) {
    return (
      <KeyboardProvider navigationBarTranslucent statusBarTranslucent>
        <RuntimeSetup message={runtimeConfiguration.message} />
        <StatusBar style="auto" />
      </KeyboardProvider>
    );
  }

  if (apiKey.status === API_KEY_STATUS.LOADING) {
    return <View style={{ flex: 1, backgroundColor: colors.backgroundGradientEnd }} />;
  }

  if (apiKey.status === API_KEY_STATUS.MISSING) {
    return (
      <KeyboardProvider navigationBarTranslucent statusBarTranslucent>
        <ApiKeyScreen
          error={apiKey.error}
          isVerifying={apiKey.isVerifying}
          onSubmit={apiKey.verifyAndSave}
        />
        <StatusBar style="light" />
      </KeyboardProvider>
    );
  }

  return (
    <KeyboardProvider navigationBarTranslucent statusBarTranslucent>
      <CopilotKitProvider
        headers={() => ({
          [OPENAI_API_KEY_HEADER]: apiKey.apiKey ?? '',
          'x-client-date': todayClientIso(),
          'x-client-timezone': clientTimezone(),
        })}
        onError={(event) => {
          if (isApiKeyError(event.error.message)) {
            apiKey.clear();
          }
        }}
        runtimeUrl={runtimeConfiguration.runtimeUrl}
      >
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name={INDEX_ROUTE} />
          <Stack.Screen name={DASHBOARD_ROUTE} />
          <Stack.Screen name={CHAT_ROUTE} />
          <Stack.Screen name={THREADS_ROUTE} />
        </Stack>
        <StatusBar style="light" />
      </CopilotKitProvider>
    </KeyboardProvider>
  );
};

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
