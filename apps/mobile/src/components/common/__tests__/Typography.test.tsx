import { render, screen } from '@testing-library/react-native';

import { Typography } from '../Typography';
import { ThemeProvider } from '../../../theme';

test('renders its text content', async () => {
  await render(
    <ThemeProvider>
      <Typography>Hello Hanoi</Typography>
    </ThemeProvider>
  );

  expect(screen.getByText('Hello Hanoi')).toBeOnTheScreen();
});
