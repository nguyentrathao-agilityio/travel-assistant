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

test('renders the brand name and headline', async () => {
  await renderScreen();

  expect(screen.getByText('Chattie Travel')).toBeOnTheScreen();
  expect(screen.getByText('Say hello to your new travel companion!')).toBeOnTheScreen();
});

test('pressing continue invokes onContinue', async () => {
  const user = userEvent.setup();
  const { onContinue } = await renderScreen();

  await user.press(screen.getByRole('button', { name: 'Continue' }));

  expect(onContinue).toHaveBeenCalledTimes(1);
});
