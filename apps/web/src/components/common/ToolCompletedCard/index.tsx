import { CheckCircle2 } from 'lucide-react';

// Components
import { Card } from '../Card';
import { Typography } from '../Typography';

interface ToolCompletedCardProps {
  message: string;
}

/** Confirms that a tool without a dedicated result card finished successfully. */
export const ToolCompletedCard = ({ message }: ToolCompletedCardProps) => (
  <Card className="w-full max-w-md shadow" paddingClass="px-4 py-3">
    <div className="flex items-center gap-3">
      <span className="bg-badge-success-bg flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <CheckCircle2
          size={17}
          className="text-badge-success-text"
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </span>
      <Typography variant="body" color="secondary">
        {message}
      </Typography>
    </div>
  </Card>
);
