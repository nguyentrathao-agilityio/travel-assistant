import { render, screen } from '@testing-library/react-native';

import { RuntimeSetup } from '../RuntimeSetup';

test('renders the title, status and message', async () => {
  await render(<RuntimeSetup message="Waiting for the backend to come online" />);

  expect(screen.getByRole('header')).toHaveTextContent('Travel Planner Mobile');
  expect(screen.getByText('Day 1 setup')).toBeOnTheScreen();
  expect(screen.getByText('Waiting for the backend to come online')).toBeOnTheScreen();
});
