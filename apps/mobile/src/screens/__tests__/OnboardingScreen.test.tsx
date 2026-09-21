import { render, screen, userEvent } from '@testing-library/react-native';

import { OnboardingScreen } from '../OnboardingScreen';
import { ThemeProvider } from '../../theme';

const renderScreen = async (onContinue = jest.fn()) => {
  await render(
    <ThemeProvider>
      <OnboardingScreen onContinue={onContinue} />
    </ThemeProvider>
  );

  return { onContinue };
};

test('renders the brand name and the first slide, with no back button', async () => {
  await renderScreen();

  expect(screen.getByText('Travel Assistant')).toBeOnTheScreen();
  expect(
    screen.getByText("Tell us where you want to go, and we'll handle the rest.")
  ).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
});

test('continue advances through all 3 slides, then invokes onContinue on the last one', async () => {
  const user = userEvent.setup();
  const { onContinue } = await renderScreen();

  await user.press(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByText('Say hello to your new travel companion!')).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByText("Let's turn your travel ideas into a real plan.")).toBeOnTheScreen();
  expect(onContinue).not.toHaveBeenCalled();

  await user.press(screen.getByRole('button', { name: 'Get Started' }));
  expect(onContinue).toHaveBeenCalledTimes(1);
});

test('back returns to the previous slide and disappears on the first slide', async () => {
  const user = userEvent.setup();
  await renderScreen();

  await user.press(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByRole('button', { name: 'Back' })).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Back' }));
  expect(
    screen.getByText("Tell us where you want to go, and we'll handle the rest.")
  ).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
});
