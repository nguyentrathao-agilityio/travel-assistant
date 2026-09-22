import { useCallback, useEffect, useState } from 'react';

// Services
import { clearApiKey, getApiKey, setApiKey } from '../services/apiKeyStorage';
import { verifyOpenAiApiKey } from '../services/openaiApiKey';

// Constants
import { API_KEY_STATUS } from '../constants';

type ApiKeyStatus =
  | { status: typeof API_KEY_STATUS.LOADING }
  | { status: typeof API_KEY_STATUS.MISSING }
  | { status: typeof API_KEY_STATUS.READY; apiKey: string };

interface UseApiKeyResult {
  status: ApiKeyStatus['status'];
  apiKey: string | null;
  isVerifying: boolean;
  error: string | null;
  verifyAndSave: (candidateKey: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useApiKey = (): UseApiKeyResult => {
  const [state, setState] = useState<ApiKeyStatus>({ status: API_KEY_STATUS.LOADING });
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getApiKey().then((storedKey) => {
      if (cancelled) return;
      setState(
        storedKey
          ? { status: API_KEY_STATUS.READY, apiKey: storedKey }
          : { status: API_KEY_STATUS.MISSING }
      );
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
      setState({ status: API_KEY_STATUS.READY, apiKey: trimmed });
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
    setState({ status: API_KEY_STATUS.MISSING });
  }, []);

  return {
    status: state.status,
    apiKey: state.status === API_KEY_STATUS.READY ? state.apiKey : null,
    isVerifying,
    error,
    verifyAndSave,
    clear,
  };
};
