import { render, screen, userEvent } from '@testing-library/react-native';

import { SuggestionChips } from '../SuggestionChips';
import { ThemeProvider } from '../../theme';

import type { Suggestion } from '@copilotkit/react-native/headless';

const suggestions: Suggestion[] = [
  { isLoading: false, message: 'Show hotels in Hoi An', title: 'Find hotels' },
  { isLoading: false, message: 'Check the weather', title: 'Weather forecast' },
];

test('renders a chip per suggestion title', async () => {
  await render(
    <ThemeProvider>
      <SuggestionChips onSelect={jest.fn()} suggestions={suggestions} />
    </ThemeProvider>
  );

  expect(screen.getByText('Find hotels')).toBeOnTheScreen();
  expect(screen.getByText('Weather forecast')).toBeOnTheScreen();
});

test('calls onSelect with the suggestion message, not the title', async () => {
  const user = userEvent.setup();
  const onSelect = jest.fn();

  await render(
    <ThemeProvider>
      <SuggestionChips onSelect={onSelect} suggestions={suggestions} />
    </ThemeProvider>
  );

  await user.press(screen.getByText('Find hotels'));

  expect(onSelect).toHaveBeenCalledWith('Show hotels in Hoi An');
});

test('disables a chip still being generated', async () => {
  await render(
    <ThemeProvider>
      <SuggestionChips
        onSelect={jest.fn()}
        suggestions={[{ isLoading: true, message: 'Show hotels', title: 'Find hotels' }]}
      />
    </ThemeProvider>
  );

  expect(screen.getByRole('button')).toBeDisabled();
});

test('disables every chip when the disabled prop is true', async () => {
  await render(
    <ThemeProvider>
      <SuggestionChips disabled onSelect={jest.fn()} suggestions={suggestions} />
    </ThemeProvider>
  );

  for (const button of screen.getAllByRole('button')) {
    expect(button).toBeDisabled();
  }
});
