import { Text } from 'react-native';

import { render, screen, userEvent } from '@testing-library/react-native';

import { Card } from '../Card';
import { ThemeProvider } from '../../../theme';

test('renders its children', async () => {
  await render(
    <ThemeProvider>
      <Card>
        <Text>Card content</Text>
      </Card>
    </ThemeProvider>
  );

  expect(screen.getByText('Card content')).toBeOnTheScreen();
});

test('renders as a button and fires onPress when pressable', async () => {
  const user = userEvent.setup();
  const onPress = jest.fn();

  await render(
    <ThemeProvider>
      <Card onPress={onPress}>
        <Text>Press me</Text>
      </Card>
    </ThemeProvider>
  );

  const button = screen.getByRole('button');

  await user.press(button);

  expect(onPress).toHaveBeenCalledTimes(1);
});

test('does not render a button role when onPress is omitted', async () => {
  await render(
    <ThemeProvider>
      <Card>
        <Text>Static</Text>
      </Card>
    </ThemeProvider>
  );

  expect(screen.queryByRole('button')).not.toBeOnTheScreen();
});
