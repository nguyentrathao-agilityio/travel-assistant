import { useCallback, useEffect, useState } from 'react';

import { clearApiKey, getApiKey, setApiKey } from '../services/apiKeyStorage';
import { verifyOpenAiApiKey } from '../services/openaiApiKey';

type ApiKeyStatus =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; apiKey: string };

interface UseApiKeyResult {
  status: ApiKeyStatus['status'];
  apiKey: string | null;
  isVerifying: boolean;
  error: string | null;
  verifyAndSave: (candidateKey: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useApiKey = (): UseApiKeyResult => {
  const [state, setState] = useState<ApiKeyStatus>({ status: 'loading' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getApiKey().then((storedKey) => {
      if (cancelled) return;
      setState(storedKey ? { status: 'ready', apiKey: storedKey } : { status: 'missing' });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const verifyAndSave = useCallback(async (candidateKey: string) => {
    const trimmed = candidateKey.trim();

    if (!trimmed.startsWith('sk-')) {
      setError('Key must start with "sk-"');

      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      await verifyOpenAiApiKey(trimmed);
      await setApiKey(trimmed);
      setState({ status: 'ready', apiKey: trimmed });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Could not verify the key right now. Please try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const clear = useCallback(async () => {
    await clearApiKey();
    setState({ status: 'missing' });
  }, []);

  return {
    status: state.status,
    apiKey: state.status === 'ready' ? state.apiKey : null,
    isVerifying,
    error,
    verifyAndSave,
    clear,
  };
};
