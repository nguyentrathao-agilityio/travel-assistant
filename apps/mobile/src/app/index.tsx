import { Redirect } from 'expo-router';

import { DASHBOARD_PATH } from '../constants';
import { useOnboardingSeen } from '../hooks';
import { OnboardingScreen } from '../screens';

export default function OnboardingRoute() {
  const { status, markSeen } = useOnboardingSeen();

  if (status === 'loading') {
    return null;
  }

  if (status === 'seen') {
    return <Redirect href={DASHBOARD_PATH} />;
  }

  return <OnboardingScreen onContinue={markSeen} />;
}
