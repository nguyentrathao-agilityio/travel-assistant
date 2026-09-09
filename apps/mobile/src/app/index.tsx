import { Redirect } from 'expo-router';

import { OnboardingScreen } from '../components';
import { useOnboardingSeen } from '../hooks';

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
