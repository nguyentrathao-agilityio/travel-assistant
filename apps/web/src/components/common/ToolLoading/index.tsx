import { Loader2 } from 'lucide-react';

interface ToolLoadingProps {
  action?: string;
  target: string;
}

export const ToolLoading = ({ action = 'Searching for', target }: ToolLoadingProps) => {
  return (
    <div className="bg-background-primary text-text-primary flex h-10 items-center rounded-[28px] px-4 py-2 shadow">
      <div className="text-text-primary flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>
          {action} {target}...
        </span>
      </div>
    </div>
  );
};
