import { useEffect } from 'react';
import { useSuggestionStore } from '@/stores';

interface SetLastToolProps {
  toolName: string;
}

export const SetLastTool = ({ toolName }: SetLastToolProps) => {
  const setLastTool = useSuggestionStore((s) => s.setLastTool);

  useEffect(() => {
    setLastTool(toolName);
  }, [toolName, setLastTool]);

  return null;
};
