import { render, screen, userEvent } from '@testing-library/react-native';

import { ThemeProvider } from '../../../theme';
import { TripsSearchBar } from '../TripsSearchBar';

test('updates the query and reports focus changes', async () => {
  const user = userEvent.setup();
  const onChangeQuery = jest.fn();
  const onFocusChange = jest.fn();

  await render(
    <ThemeProvider>
      <TripsSearchBar onChangeQuery={onChangeQuery} onFocusChange={onFocusChange} query="" />
    </ThemeProvider>
  );

  const input = screen.getByPlaceholderText('Search your trips');
  await user.press(input);
  await user.type(input, 'Hanoi');
  input.props.onBlur();

  expect(onFocusChange).toHaveBeenNthCalledWith(1, true);
  expect(onFocusChange).toHaveBeenLastCalledWith(false);
  expect(onChangeQuery).toHaveBeenLastCalledWith('i');
});
