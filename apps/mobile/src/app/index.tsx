import { Redirect } from 'expo-router';

// Constants
import { DASHBOARD_PATH } from '../constants';

// Components
import { OnboardingScreen } from '../screens';

// Hooks
import { useOnboardingSeen } from '../hooks';

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
