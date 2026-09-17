import { Plane } from 'lucide-react-native';

import { render, screen } from '@testing-library/react-native';

import { IconBadge } from '../IconBadge';
import { ThemeProvider } from '../../theme';

test('renders a lucide icon', async () => {
  await render(
    <ThemeProvider>
      <IconBadge icon={Plane} />
    </ThemeProvider>
  );

  expect(screen.root).toBeOnTheScreen();
});

test('renders a string fallback', async () => {
  await render(
    <ThemeProvider>
      <IconBadge icon="✈" />
    </ThemeProvider>
  );

  expect(screen.getByText('✈')).toBeOnTheScreen();
});
