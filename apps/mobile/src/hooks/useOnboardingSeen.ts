import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

// Constants
import { ONBOARDING_STATUS } from '../constants';

// Utils
import { getOnboardingSeen, markOnboardingSeen } from '../storage';

// Types
import type { OnboardingStatus } from '../constants';

export const useOnboardingSeen = () => {
  const [status, setStatus] = useState<OnboardingStatus>(ONBOARDING_STATUS.LOADING);

  useEffect(() => {
    let cancelled = false;

    getOnboardingSeen(AsyncStorage).then((seen) => {
      if (!cancelled) {
        setStatus(seen ? ONBOARDING_STATUS.SEEN : ONBOARDING_STATUS.UNSEEN);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const markSeen = useCallback(async () => {
    await markOnboardingSeen(AsyncStorage);
    setStatus(ONBOARDING_STATUS.SEEN);
  }, []);

  return { status, markSeen };
};
