import { CopilotKitProvider } from '@copilotkit/react-native/headless';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { RuntimeSetup } from '../src/components';
import { resolveRuntimeUrl } from '../src/config';
import { shellColors } from '../src/theme';

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
  if (runtimeConfiguration.status === 'error') {
    return (
      <>
        <RuntimeSetup message={runtimeConfiguration.message} />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <CopilotKitProvider
      headers={() => ({
        'x-client-date': new Date().toISOString().slice(0, 10),
        'x-client-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      })}
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
