import { render, screen } from '@testing-library/react';

import { CustomUserMessage } from '../index';

describe('CustomUserMessage', () => {
  it('uses the compact body typography token for user messages', () => {
    render(
      <CustomUserMessage
        message={{ id: 'user-1', role: 'user', content: 'A compact question.' } as never}
        ImageRenderer={() => null}
        rawData={null}
      />
    );

    expect(screen.getByText('A compact question.')).toHaveClass(
      'text-body',
      'conversation-user-message'
    );
  });
});
