import { render, screen, userEvent } from '@testing-library/react-native';

import { GridActionCard } from '../GridActionCard';
import { ThemeProvider } from '../../theme';

test('renders the label and icon', async () => {
  await render(
    <ThemeProvider>
      <GridActionCard icon="🎯" label="Explore" onPress={jest.fn()} />
    </ThemeProvider>
  );

  expect(screen.getByText('Explore')).toBeOnTheScreen();
  expect(screen.getByText('🎯')).toBeOnTheScreen();
});

test('calls onPress when pressed', async () => {
  const user = userEvent.setup();
  const onPress = jest.fn();

  await render(
    <ThemeProvider>
      <GridActionCard icon="🎯" label="Explore" onPress={onPress} />
    </ThemeProvider>
  );

  await user.press(screen.getByRole('button'));

  expect(onPress).toHaveBeenCalledTimes(1);
});

test('is disabled when the disabled prop is true', async () => {
  await render(
    <ThemeProvider>
      <GridActionCard disabled icon="🎯" label="Explore" onPress={jest.fn()} />
    </ThemeProvider>
  );

  expect(screen.getByRole('button')).toBeDisabled();
});
