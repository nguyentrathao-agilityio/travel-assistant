import { render, screen, userEvent } from '@testing-library/react-native';

import { ConfirmBanner } from '../ConfirmBanner';
import { ThemeProvider } from '../../../theme';

const renderBanner = async (props: Partial<Parameters<typeof ConfirmBanner>[0]> = {}) => {
  const onChangeClick = jest.fn();
  const onConfirmClick = jest.fn();

  await render(
    <ThemeProvider>
      <ConfirmBanner
        description="One way, economy"
        onChangeClick={onChangeClick}
        onConfirmClick={onConfirmClick}
        title="Flight to Hanoi"
        {...props}
      />
    </ThemeProvider>
  );

  return { onChangeClick, onConfirmClick };
};

test('renders title and description', async () => {
  await renderBanner();

  expect(screen.getByText('Flight to Hanoi')).toBeOnTheScreen();
  expect(screen.getByText('One way, economy')).toBeOnTheScreen();
});

test('renders price when provided', async () => {
  await renderBanner({ price: '$120' });

  expect(screen.getByText('$120')).toBeOnTheScreen();
});

test('omits price when not provided', async () => {
  await renderBanner();

  expect(screen.queryByText('$120')).not.toBeOnTheScreen();
});

test('fires onChangeClick when Change is pressed', async () => {
  const user = userEvent.setup();
  const { onChangeClick } = await renderBanner();

  await user.press(screen.getByText('Change'));

  expect(onChangeClick).toHaveBeenCalledTimes(1);
});

test('fires onConfirmClick when Confirm is pressed', async () => {
  const user = userEvent.setup();
  const { onConfirmClick } = await renderBanner();

  await user.press(screen.getByText('Confirm'));

  expect(onConfirmClick).toHaveBeenCalledTimes(1);
});

test('disables the Confirm button when confirmDisabled is true', async () => {
  const user = userEvent.setup();
  const { onConfirmClick } = await renderBanner({ confirmDisabled: true });

  const confirmButton = screen.getByRole('button', { name: 'Confirm' });

  expect(confirmButton).toBeDisabled();

  await user.press(confirmButton);

  expect(onConfirmClick).not.toHaveBeenCalled();
});
