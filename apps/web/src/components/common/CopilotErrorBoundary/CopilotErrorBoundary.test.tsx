import { fireEvent, render, screen } from '@testing-library/react';

import { CopilotErrorBoundary } from '.';

const Broken = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('tool render failed');

  return <div>Chat recovered</div>;
};

describe('CopilotErrorBoundary', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => consoleError.mockRestore());

  it('retries rendering after containing a render error', () => {
    render(
      <CopilotErrorBoundary resetKey="thread-1">
        <Broken shouldThrow />
      </CopilotErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('resets automatically when the active thread changes', () => {
    const { rerender } = render(
      <CopilotErrorBoundary resetKey="thread-1">
        <Broken shouldThrow />
      </CopilotErrorBoundary>
    );

    rerender(
      <CopilotErrorBoundary resetKey="thread-2">
        <Broken shouldThrow={false} />
      </CopilotErrorBoundary>
    );

    expect(screen.getByText('Chat recovered')).toBeInTheDocument();
  });
});
