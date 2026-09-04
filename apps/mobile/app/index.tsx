import { Redirect } from 'expo-router';

import { OnboardingScreen } from '../src/components';
import { useOnboardingSeen } from '../src/hooks';

export default function OnboardingRoute() {
  const { status, markSeen } = useOnboardingSeen();

  if (status === 'loading') {
    return null;
  }

  if (status === 'seen') {
    return <Redirect href="/dashboard" />;
  }

  return <OnboardingScreen onContinue={markSeen} />;
}
