import { type ReactNode, useCallback, useMemo } from 'react';
import { CopilotKit } from '@copilotkit/react-core/v2';
import { Toaster, toast } from 'sonner';
import { CopilotErrorBoundary } from '@/components';
import { ThemeProvider } from '@/components/ThemeProvider';

import {
  AGENT_NAME,
  COPILOTKIT_PUBLIC_LICENSE_KEY,
  ERROR_MESSAGES,
  OPENAI_API_KEY_HEADER,
  RUNTIME_URL,
} from '@/constants';
import { useThreadStore } from '@/stores/threadStore';
import { useApiKeyStore } from '@/stores/apiKeyStore';
import { todayClientIso, clientTimezone } from '@/utils';

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  const sessionId = useThreadStore((state) => state.activeThreadId);
  const sessionRevision = useThreadStore((state) => state.activeThreadRevision);
  const apiKey = useApiKeyStore((state) => state.apiKey);
  const clearApiKey = useApiKeyStore((state) => state.clearApiKey);

  const headers = useMemo(
    () => ({
      [OPENAI_API_KEY_HEADER]: apiKey,
      'x-client-date': todayClientIso(),
      'x-client-timezone': clientTimezone(),
    }),
    [apiKey, sessionId]
  );

  const handleError = useCallback(
    (errorEvent: { error?: Error }) => {
      const message = errorEvent.error?.message || ERROR_MESSAGES.STREAM;

      if (/\b401\b|incorrect api key|invalid api key|openai api key is required/i.test(message)) {
        clearApiKey();
      }

      toast.error(message);
    },
    [clearApiKey]
  );

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <CopilotErrorBoundary resetKey={`${sessionId}:${sessionRevision}`}>
        <CopilotKit
          publicLicenseKey={COPILOTKIT_PUBLIC_LICENSE_KEY}
          key={`${sessionId}:${sessionRevision}`}
          runtimeUrl={RUNTIME_URL}
          agent={AGENT_NAME}
          threadId={sessionId}
          headers={headers}
          onError={handleError}
        >
          {children}
          <Toaster richColors position="bottom-center" offset="80px" />
        </CopilotKit>
      </CopilotErrorBoundary>
    </ThemeProvider>
  );
};
