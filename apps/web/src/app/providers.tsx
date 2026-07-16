import { type ReactNode, useMemo } from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ThemeProvider';

import { AGENT_NAME, COPILOTKIT_PUBLIC_LICENSE_KEY, RUNTIME_URL } from '@/constants';
import { useThreadStore } from '@/stores/threadStore';
import { useApiKeyStore } from '@/stores/apiKeyStore';
import { todayClientIso, clientTimezone } from '@/utils';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  const sessionId = useThreadStore((state) => state.activeThreadId);
  const apiKey = useApiKeyStore((state) => state.apiKey);

  const headers = useMemo(
    () => ({
      'x-openai-api-key': apiKey,
      'x-client-date': todayClientIso(),
      'x-client-timezone': clientTimezone(),
    }),
    [apiKey, sessionId]
  );

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <CopilotKit
        publicLicenseKey={COPILOTKIT_PUBLIC_LICENSE_KEY}
        key={sessionId}
        runtimeUrl={RUNTIME_URL}
        agent={AGENT_NAME}
        threadId={sessionId}
        headers={headers}
        useSingleEndpoint={false}
      >
        {children}
        <Toaster richColors position="bottom-center" offset="80px" />
      </CopilotKit>
    </ThemeProvider>
  );
};
