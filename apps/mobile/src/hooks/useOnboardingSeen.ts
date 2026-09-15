import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

// Utils
import { getOnboardingSeen, markOnboardingSeen } from '../storage';

type OnboardingStatus = 'loading' | 'seen' | 'unseen';

export const useOnboardingSeen = () => {
  const [status, setStatus] = useState<OnboardingStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    getOnboardingSeen(AsyncStorage).then((seen) => {
      if (!cancelled) {
        setStatus(seen ? 'seen' : 'unseen');
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const markSeen = useCallback(async () => {
    await markOnboardingSeen(AsyncStorage);
    setStatus('seen');
  }, []);

  return { status, markSeen };
};
