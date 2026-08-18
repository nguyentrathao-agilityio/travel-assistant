import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CustomAssistantMessage } from '../index';

// Mock Markdown from @copilotkit/react-ui which isn't needed for unit rendering
jest.mock('@copilotkit/react-ui', () => ({
  Markdown: ({ content }: { content: unknown }) => <span>{String(content ?? '')}</span>,
}));

const BASE_MESSAGE = {
  id: 'assistant-1',
  role: 'assistant',
  content: 'Hello from assistant',
};

describe('CustomAssistantMessage', () => {
  it('uses the compact body typography token for assistant responses', () => {
    render(
      <CustomAssistantMessage
        message={{ ...BASE_MESSAGE, content: 'A compact response.' } as any}
        isLoading={false}
        isGenerating={false}
        rawData={null}
      />
    );

    const response = screen.getByText('A compact response.').closest('.text-body');

    expect(response).toBeInTheDocument();
    expect(response).toHaveClass('assistant-message-text');
  });

  it('renders message content and action buttons', () => {
    render(
      <CustomAssistantMessage
        message={BASE_MESSAGE as any}
        isLoading={false}
        isGenerating={false}
        rawData={null}
      />
    );

    expect(screen.getByText('Hello from assistant')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Regenerate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thumbs up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thumbs down/i })).toBeInTheDocument();
  });

  it('calls handlers for actions', async () => {
    const user = userEvent.setup();
    const onRegenerate = jest.fn();
    const onCopy = jest.fn();
    const onThumbsUp = jest.fn();
    const onThumbsDown = jest.fn();

    render(
      <CustomAssistantMessage
        message={BASE_MESSAGE as any}
        onRegenerate={onRegenerate}
        onCopy={onCopy}
        onThumbsUp={onThumbsUp}
        onThumbsDown={onThumbsDown}
        isLoading={false}
        isGenerating={false}
        rawData={null}
      />
    );

    await user.click(screen.getByRole('button', { name: /Regenerate/i }));
    expect(onRegenerate).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Copy/i }));
    expect(onCopy).toHaveBeenCalledWith('Hello from assistant');

    await user.click(screen.getByRole('button', { name: /Thumbs up/i }));
    expect(onThumbsUp).toHaveBeenCalledWith(BASE_MESSAGE);

    await user.click(screen.getByRole('button', { name: /Thumbs down/i }));
    expect(onThumbsDown).toHaveBeenCalledWith(BASE_MESSAGE);
  });

  it('renders typing indicator when loading and no content', () => {
    render(<CustomAssistantMessage isLoading={true} isGenerating={false} rawData={null} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByLabelText('Assistant avatar')).not.toBeInTheDocument();
  });

  it.each([
    ['null', null],
    ['an empty fragment', <></>],
    ['an empty element', <div />],
    ['an empty string', ''],
    ['whitespace', '   '],
  ])('does not render an avatar for %s generative UI', (_label, generativeUI) => {
    render(
      <CustomAssistantMessage
        message={{ ...BASE_MESSAGE, content: '', generativeUI: () => generativeUI } as any}
        isLoading={false}
        isGenerating={false}
        rawData={null}
      />
    );

    expect(screen.queryByLabelText('Assistant avatar')).not.toBeInTheDocument();
  });

  it('does not render an avatar when a custom card component renders an empty fragment', () => {
    const EmptyCard = () => <></>;

    render(
      <CustomAssistantMessage
        message={
          {
            ...BASE_MESSAGE,
            content: '',
            generativeUI: () => <EmptyCard />,
          } as any
        }
        isLoading={false}
        isGenerating={false}
        rawData={null}
      />
    );

    expect(screen.queryByLabelText('Assistant avatar')).not.toBeInTheDocument();
  });

  it('does not render an avatar when generative UI contains only an empty styled wrapper', () => {
    render(
      <CustomAssistantMessage
        message={
          {
            ...BASE_MESSAGE,
            content: '',
            generativeUI: () => <div className="empty-card-wrapper" />,
          } as any
        }
        isLoading={false}
        isGenerating={false}
        rawData={null}
      />
    );

    expect(screen.queryByLabelText('Assistant avatar')).not.toBeInTheDocument();
  });

  it('renders an avatar when a card is present without message content', () => {
    render(
      <CustomAssistantMessage
        message={
          {
            ...BASE_MESSAGE,
            content: '',
            generativeUI: () => <div>Travel card</div>,
          } as any
        }
        isLoading={false}
        isGenerating={false}
        rawData={null}
      />
    );

    expect(screen.getByText('Travel card')).toBeInTheDocument();
    expect(screen.getByLabelText('Assistant avatar')).toBeInTheDocument();
  });

  it('applies feedback styles when provided', () => {
    render(
      <CustomAssistantMessage
        message={BASE_MESSAGE as any}
        feedback="thumbsUp"
        isLoading={false}
        isGenerating={false}
        rawData={null}
      />
    );
    const up = screen.getByRole('button', { name: /Thumbs up/i });

    expect(up).toHaveClass('text-brand-600');
  });
});
