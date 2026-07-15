import { AlertCircle } from 'lucide-react';

import { Card } from '../Card';
import { Typography } from '../Typography';

interface ErrorCardProps {
  message?: string;
}

const ErrorCard = ({ message = 'Something went wrong. Please try again.' }: ErrorCardProps) => (
  <Card className="w-full max-w-sm shadow">
    <div className="flex items-center gap-2">
      <AlertCircle size={16} className="text-text-danger shrink-0" aria-hidden="true" />
      <Typography variant="body" color="secondary">
        {message}
      </Typography>
    </div>
  </Card>
);

export { ErrorCard };
export type { ErrorCardProps };
