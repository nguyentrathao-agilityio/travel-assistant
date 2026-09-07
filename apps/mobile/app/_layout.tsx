import { CopilotKitProvider } from '@copilotkit/react-native/headless';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { ApiKeyScreen, RuntimeSetup } from '../src/components';
import { resolveRuntimeUrl } from '../src/config';
import { OPENAI_API_KEY_HEADER } from '../src/constants';
import { useApiKey } from '../src/hooks';
import { isApiKeyError } from '../src/services/openaiApiKey';
import { shellColors } from '../src/theme';
import { clientTimezone, todayClientIso } from '../src/utils/date';

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
            headerStyle: { backgroundColor: shellColors.backgroundGradientEnd },
            headerTintColor: shellColors.textOnDark,
            title: 'Chat',
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </CopilotKitProvider>
  );
}
