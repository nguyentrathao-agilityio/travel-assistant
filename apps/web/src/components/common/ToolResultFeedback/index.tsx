import { AlertCircle, SearchX } from 'lucide-react';

import { Card } from '../Card';
import { Typography } from '../Typography';
import { getToolError, getToolErrorMessage } from '@/utils/toolResult';

export const ToolErrorCard = ({ result }: { result: unknown }) => {
  const error = getToolError(result);

  if (!error) return null;
  const errorMessage = getToolErrorMessage(error);

  return (
    <Card className="w-full max-w-sm shadow">
      <div className="flex items-start gap-2">
        <AlertCircle size={16} className="text-text-danger mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <Typography variant="body" color="secondary">
            {errorMessage}
          </Typography>
          {error.retryable && (
            <Typography variant="meta" color="tertiary">
              You can try again.
            </Typography>
          )}
        </div>
      </div>
    </Card>
  );
};

export const ToolEmptyCard = ({ message }: { message: string }) => (
  <Card className="w-full max-w-sm shadow">
    <div className="flex items-center gap-2">
      <SearchX size={16} className="text-text-secondary shrink-0" aria-hidden="true" />
      <Typography variant="body" color="secondary">
        {message}
      </Typography>
    </div>
  </Card>
);

export const ToolInvalidResultCard = ({ message }: { message: string }) => (
  <Card className="w-full max-w-sm shadow">
    <div className="flex items-start gap-2">
      <AlertCircle size={16} className="text-text-danger mt-0.5 shrink-0" aria-hidden="true" />
      <Typography variant="body" color="secondary">
        {message}
      </Typography>
    </div>
  </Card>
);
