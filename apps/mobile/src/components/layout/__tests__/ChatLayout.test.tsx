import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { render, screen } from '@testing-library/react-native';

import { ChatLayout } from '../ChatLayout';
import { ThemeProvider } from '../../../theme';
import { SAFE_AREA_INITIAL_METRICS } from '../../../test/fixtures';

const renderLayout = async (props: Partial<Parameters<typeof ChatLayout>[0]> = {}) =>
  render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_INITIAL_METRICS}>
      <ThemeProvider>
        <ChatLayout composer={<Text>Composer</Text>} messages={<Text>Messages</Text>} {...props} />
      </ThemeProvider>
    </SafeAreaProvider>
  );

test('renders the messages and composer content', async () => {
  await renderLayout();

  expect(screen.getByText('Messages')).toBeOnTheScreen();
  expect(screen.getByText('Composer')).toBeOnTheScreen();
});

test('renders the header when provided', async () => {
  await renderLayout({ header: <Text>Header</Text> });

  expect(screen.getByText('Header')).toBeOnTheScreen();
});

test('omits the header when not provided', async () => {
  await renderLayout();

  expect(screen.queryByText('Header')).not.toBeOnTheScreen();
});
