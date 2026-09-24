import { render, screen, userEvent } from '@testing-library/react-native';

import { ThemeProvider } from '../../../theme';
import { makeThread } from '../../../test/fixtures';
import { TripRow } from '../TripRow';

test('opens, renames, and deletes the rendered trip', async () => {
  const user = userEvent.setup();
  const thread = makeThread('t1', 'Hanoi trip');
  const onDelete = jest.fn();
  const onOpen = jest.fn();
  const onRename = jest.fn();

  await render(
    <ThemeProvider>
      <TripRow
        deleting={false}
        index={0}
        onDelete={onDelete}
        onOpen={onOpen}
        onRename={onRename}
        thread={thread}
      />
    </ThemeProvider>
  );

  await user.press(screen.getByText('Hanoi trip'));
  await user.press(screen.getByLabelText('Rename trip'));
  await user.press(screen.getByLabelText('Delete trip'));

  expect(onOpen).toHaveBeenCalledWith('t1');
  expect(onRename).toHaveBeenCalledWith(thread);
  expect(onDelete).toHaveBeenCalledWith(thread);
});

test('disables deletion only for the trip being deleted', async () => {
  await render(
    <ThemeProvider>
      <TripRow
        deleting
        index={0}
        onDelete={jest.fn()}
        onOpen={jest.fn()}
        onRename={jest.fn()}
        thread={makeThread('t1', 'Hanoi trip')}
      />
    </ThemeProvider>
  );

  expect(screen.getByLabelText('Delete trip')).toBeDisabled();
});
