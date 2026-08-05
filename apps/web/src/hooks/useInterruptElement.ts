import { useEffect, useState } from 'react';
import { useCopilotKit } from '@copilotkit/react-core/v2';

/** Subscribe to HITL UI without starting another agent connection. */
export const useInterruptElement = () => {
  const { copilotkit } = useCopilotKit();
  const [interrupt, setInterrupt] = useState(copilotkit.interruptElement);

  useEffect(() => {
    setInterrupt(copilotkit.interruptElement);
    const subscription = copilotkit.subscribe({
      onInterruptElementChanged: ({ interruptElement }) => setInterrupt(interruptElement),
    });
    return () => subscription.unsubscribe();
  }, [copilotkit]);

  return interrupt;
};
