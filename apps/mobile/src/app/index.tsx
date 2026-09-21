import { Redirect } from 'expo-router';

// Constants
import { DASHBOARD_PATH, ONBOARDING_STATUS } from '../constants';

// Components
import { OnboardingScreen } from '../screens';

// Hooks
import { useOnboardingSeen } from '../hooks';

export default function OnboardingRoute() {
  const { status, markSeen } = useOnboardingSeen();

  if (status === ONBOARDING_STATUS.LOADING) {
    return null;
  }

  if (status === ONBOARDING_STATUS.SEEN) {
    return <Redirect href={DASHBOARD_PATH} />;
  }

  return <OnboardingScreen onContinue={markSeen} />;
}
