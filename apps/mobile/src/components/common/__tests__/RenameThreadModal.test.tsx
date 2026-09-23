import { render, screen, userEvent } from '@testing-library/react-native';

import { RenameThreadModal } from '../RenameThreadModal';
import { ThemeProvider } from '../../../theme';

const renderModal = async (props: Partial<Parameters<typeof RenameThreadModal>[0]> = {}) => {
  const merged = {
    initialTitle: 'Da Nang trip',
    isSaving: false,
    onCancel: jest.fn(),
    onSave: jest.fn(),
    visible: true,
    ...props,
  };

  await render(
    <ThemeProvider>
      <RenameThreadModal {...merged} />
    </ThemeProvider>
  );

  return merged;
};

test('pre-fills the input with the current title', async () => {
  await renderModal({ initialTitle: 'Da Nang trip' });

  expect(screen.getByDisplayValue('Da Nang trip')).toBeOnTheScreen();
});

test('calls onSave with the trimmed edited title', async () => {
  const user = userEvent.setup();
  const { onSave } = await renderModal({ initialTitle: 'Da Nang trip' });

  const input = screen.getByDisplayValue('Da Nang trip');

  await user.clear(input);
  await user.type(input, '  Hoi An getaway  ');
  await user.press(screen.getByText('Save'));

  expect(onSave).toHaveBeenCalledWith('Hoi An getaway');
});

test('calls onCancel when Cancel is pressed', async () => {
  const user = userEvent.setup();
  const { onCancel } = await renderModal();

  await user.press(screen.getByText('Cancel'));

  expect(onCancel).toHaveBeenCalledTimes(1);
});

test('disables Save when the title is blank', async () => {
  const user = userEvent.setup();
  await renderModal({ initialTitle: 'Da Nang trip' });

  const input = screen.getByDisplayValue('Da Nang trip');

  await user.clear(input);

  expect(screen.getByText('Save')).toBeDisabled();
});

test('disables Save while a rename is in flight', async () => {
  await renderModal({ isSaving: true });

  expect(screen.getByText('Save')).toBeDisabled();
});
