import { CopilotKitProvider } from '@copilotkit/react-native/headless';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { RuntimeSetup } from '../components';
import { resolveRuntimeUrl } from '../config';
import { OPENAI_API_KEY_HEADER } from '@repo/constants';
import { useApiKey } from '../hooks';
import { isApiKeyError } from '../services/openaiApiKey';
import { ApiKeyScreen } from '../screens';
import { shellColors } from '../theme';
import { clientTimezone, todayClientIso } from '@repo/utils';

type RuntimeConfiguration =
  | { status: 'ready'; runtimeUrl: string }
  | { status: 'error'; message: string };

const runtimeConfiguration: RuntimeConfiguration = (() => {
  try {
    return {
      status: 'ready',
      runtimeUrl: resolveRuntimeUrl(process.env.EXPO_PUBLIC_RUNTIME_URL),
    };
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof Error ? error.message : 'Unable to configure the CopilotKit runtime.',
    };
  }
})();

export default function RootLayout() {
  const apiKey = useApiKey();

  if (runtimeConfiguration.status === 'error') {
    return (
      <>
        <RuntimeSetup message={runtimeConfiguration.message} />
        <StatusBar style="auto" />
      </>
    );
  }

  if (apiKey.status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: shellColors.backgroundGradientEnd }} />;
  }

  if (apiKey.status === 'missing') {
    return (
      <>
        <ApiKeyScreen
          error={apiKey.error}
          isVerifying={apiKey.isVerifying}
          onSubmit={apiKey.verifyAndSave}
        />
        <StatusBar style="light" />
      </>
    );
  }

  return (
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
        <Stack.Screen name="index" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen
          name="chat"
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
            headerStyle: { backgroundColor: shellColors.backgroundGradientEnd },
            headerTintColor: shellColors.textOnDark,
            title: 'Chat',
          }}
        />
        <Stack.Screen
          name="threads"
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
            headerStyle: { backgroundColor: shellColors.backgroundGradientEnd },
            headerTintColor: shellColors.textOnDark,
            title: 'All trips',
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </CopilotKitProvider>
  );
}
