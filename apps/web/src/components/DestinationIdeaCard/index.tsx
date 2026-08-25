import { Compass, CalendarDays, Sparkles } from 'lucide-react';
import { Card, Typography } from '@/components';

export interface DestinationIdeaCardProps {
  destination: string;
  headline: string;
  description: string;
  suggestedDays: number;
  bestFor?: string;
}

/** A display-only destination suggestion supplied by the travel agent. */
export const DestinationIdeaCard = ({
  destination,
  headline,
  description,
  suggestedDays,
  bestFor,
}: DestinationIdeaCardProps) => (
  <Card className="w-full max-w-2xl shadow" paddingClass="p-0">
    <div className="bg-user-gradient px-5 py-3 text-white">
      <div className="flex items-center gap-2">
        <Compass size={16} aria-hidden="true" className="text-white/70" />
        <Typography variant="card-title" weight="medium" className="text-white">
          {destination}
        </Typography>
      </div>
      <Typography variant="meta" className="mt-0.5 text-white/70">
        A travel idea picked for you
      </Typography>
    </div>
    <div className="space-y-3 px-5 py-4">
      <Typography variant="option-title" weight="medium">
        {headline}
      </Typography>
      <Typography variant="body" color="secondary" className="leading-relaxed">
        {description}
      </Typography>
      <div className="flex flex-wrap gap-2">
        <span className="bg-badge-primary-bg text-badge-primary-text text-badge inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium">
          <CalendarDays size={12} aria-hidden="true" />
          {suggestedDays} day{suggestedDays === 1 ? '' : 's'}
        </span>
        {bestFor && (
          <span className="bg-badge-accent-bg text-badge-accent-text text-badge inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium">
            <Sparkles size={12} aria-hidden="true" />
            {bestFor}
          </span>
        )}
      </div>
    </div>
  </Card>
);
