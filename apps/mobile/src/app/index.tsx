import { Redirect } from 'expo-router';

import { useOnboardingSeen } from '../hooks';
import { OnboardingScreen } from '../screens';

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
