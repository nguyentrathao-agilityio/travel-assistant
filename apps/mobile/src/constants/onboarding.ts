interface OnboardingSlide {
  bubble: string;
  headlinePrefix: string;
  headlineAccent: string;
  subcopy: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    bubble: 'Hi! Ready to plan your next adventure?',
    headlineAccent: 'Chat',
    headlinePrefix: 'Your Next Adventure Starts With a Simple',
    subcopy: "Tell us where you want to go, and we'll handle the rest.",
  },
  {
    bubble: 'How can I help you plan your trip?',
    headlineAccent: 'Assistant',
    headlinePrefix: 'Smarter Trips Start Here — Meet Your',
    subcopy: 'Say hello to your new travel companion!',
  },
  {
    bubble: 'Flights, hotels, itineraries — all in one place.',
    headlineAccent: 'Minutes',
    headlinePrefix: 'From Flights to Full Itineraries, Done in',
    subcopy: "Let's turn your travel ideas into a real plan.",
  },
];

export const ONBOARDING_STATUS = {
  LOADING: 'loading',
  SEEN: 'seen',
  UNSEEN: 'unseen',
} as const;

export type OnboardingStatus = (typeof ONBOARDING_STATUS)[keyof typeof ONBOARDING_STATUS];
