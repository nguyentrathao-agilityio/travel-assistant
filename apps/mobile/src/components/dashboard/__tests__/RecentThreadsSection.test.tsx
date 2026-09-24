import { render, screen, userEvent } from '@testing-library/react-native';

import { ThemeProvider } from '../../../theme';
import { makeThread } from '../../../test/fixtures';
import { RecentThreadsSection } from '../RecentThreadsSection';

test('keeps stale trips visible and allows retry after a refresh failure', async () => {
  const user = userEvent.setup();
  const onOpenThread = jest.fn();
  const onRetry = jest.fn();

  await render(
    <ThemeProvider>
      <RecentThreadsSection
        onOpenThread={onOpenThread}
        onRetry={onRetry}
        onSeeAll={jest.fn()}
        status="ready"
        syncFailed
        threads={[makeThread('r1', 'Hoi An weekend')]}
      />
    </ThemeProvider>
  );

  expect(screen.getByText("Couldn't refresh recent trips.")).toBeOnTheScreen();
  await user.press(screen.getByText('Hoi An weekend'));
  await user.press(screen.getByRole('button', { name: 'Retry' }));

  expect(onOpenThread).toHaveBeenCalledWith('r1');
  expect(onRetry).toHaveBeenCalledTimes(1);
});
