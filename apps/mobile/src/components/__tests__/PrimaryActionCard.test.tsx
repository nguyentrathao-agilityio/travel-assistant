import { render, screen, userEvent } from '@testing-library/react-native';

import { PrimaryActionCard } from '../PrimaryActionCard';
import { ThemeProvider } from '../../theme';

test('renders title, description and button label when title is provided', async () => {
  await render(
    <ThemeProvider>
      <PrimaryActionCard
        buttonLabel="Start"
        description="Plan your next trip"
        icon="✈️"
        onPress={jest.fn()}
        title="Explore"
      />
    </ThemeProvider>
  );

  expect(screen.getByText('Explore')).toBeOnTheScreen();
  expect(screen.getByText('Plan your next trip')).toBeOnTheScreen();
  expect(screen.getByText('Start')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Voice waveform')).not.toBeOnTheScreen();
});

test('renders the voice waveform instead of a title when no title is given', async () => {
  await render(
    <ThemeProvider>
      <PrimaryActionCard
        buttonLabel="Talk"
        description="Ask by voice"
        icon="🎙️"
        onPress={jest.fn()}
      />
    </ThemeProvider>
  );

  expect(screen.getByLabelText('Voice waveform')).toBeOnTheScreen();
});

test('calls onPress when the button is pressed', async () => {
  const user = userEvent.setup();
  const onPress = jest.fn();

  await render(
    <ThemeProvider>
      <PrimaryActionCard
        buttonLabel="Start"
        description="Plan your next trip"
        icon="✈️"
        onPress={onPress}
        title="Explore"
      />
    </ThemeProvider>
  );

  await user.press(screen.getByRole('button'));

  expect(onPress).toHaveBeenCalledTimes(1);
});

test('is disabled when the disabled prop is true', async () => {
  await render(
    <ThemeProvider>
      <PrimaryActionCard
        buttonLabel="Start"
        description="Plan your next trip"
        disabled
        icon="✈️"
        onPress={jest.fn()}
        title="Explore"
      />
    </ThemeProvider>
  );

  expect(screen.getByRole('button')).toBeDisabled();
});
