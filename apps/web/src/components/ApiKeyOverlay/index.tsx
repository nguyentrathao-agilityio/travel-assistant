import { useState, useCallback, useId } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

import { cn } from '@/utils';
import { Button } from '@/components/common';
import { useApiKeyStore } from '@/stores';
import { verifyOpenAiApiKey } from '@/services/openaiApiKey';

const ApiKeyOverlay = () => {
  const setVerifiedApiKey = useApiKeyStore((state) => state.setVerifiedApiKey);
  const [value, setValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputId = useId();

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setError('');
  }, []);

  const handleToggleVisibility = useCallback(() => {
    setShowKey((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = value.trim();

      if (!trimmed.startsWith('sk-')) {
        setError('Key must start with "sk-"');

        return;
      }

      setIsVerifying(true);
      setError('');

      try {
        await verifyOpenAiApiKey(trimmed);
        setVerifiedApiKey(trimmed);
      } catch (verificationError) {
        setError(
          verificationError instanceof Error
            ? verificationError.message
            : 'Could not verify the key right now. Please try again.'
        );
      } finally {
        setIsVerifying(false);
      }
    },
    [value, setVerifiedApiKey]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-background-primary border-border-tertiary flex w-full max-w-sm flex-col gap-5 rounded-lg border px-5 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-text-secondary" />
            <p className="text-card-title text-text-primary font-medium">OpenAI API key</p>
          </div>
          <p className="text-body font-regular text-text-secondary">
            Your key is stored locally in this browser and sent securely to OpenAI through the local
            agent runtime. It is not persisted by the runtime.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1">
            <label
              htmlFor={inputId}
              className="text-label text-text-tertiary font-medium uppercase tracking-widest"
            >
              API key
            </label>
            <div
              className={cn(
                'bg-background-primary flex items-center gap-2 rounded-md border px-3 py-2 transition-colors',
                'focus-within:border-border-info focus-within:ring-border-info focus-within:ring-1',
                error
                  ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-400'
                  : 'border-border-secondary hover:border-border-secondary'
              )}
            >
              <input
                id={inputId}
                type={showKey ? 'text' : 'password'}
                value={value}
                onChange={handleChange}
                disabled={isVerifying}
                placeholder="sk-..."
                autoComplete="off"
                spellCheck={false}
                className="text-body font-regular text-text-primary placeholder:text-text-tertiary min-w-0 flex-1 bg-transparent outline-none"
              />
              <button
                type="button"
                onClick={handleToggleVisibility}
                disabled={isVerifying}
                className="text-text-tertiary flex-shrink-0 cursor-pointer outline-none"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {error && <p className="text-meta font-regular text-red-500">{error}</p>}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={!value.trim() || isVerifying}
          >
            {isVerifying ? 'Verifying…' : 'Continue'}
          </Button>
        </form>

        <p className="text-meta font-regular text-text-tertiary">
          Don't have a key?{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-border-info underline underline-offset-2"
          >
            Get one from OpenAI
          </a>
        </p>
      </div>
    </div>
  );
};

export { ApiKeyOverlay };
