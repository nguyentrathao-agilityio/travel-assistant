import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThreadItem } from '../ThreadItem';

describe('ThreadItem', () => {
  describe('rendering', () => {
    it('renders the thread title', () => {
      render(
        <ThreadItem
          id="t1"
          title="Trip to Da Nang"
          isActive={false}
          onSelect={jest.fn()}
          onDelete={jest.fn()}
        />
      );
      expect(screen.getByText('Trip to Da Nang')).toBeInTheDocument();
    });

    it('renders "New chat" when title is null', () => {
      render(
        <ThreadItem
          id="t1"
          title={null}
          isActive={false}
          onSelect={jest.fn()}
          onDelete={jest.fn()}
        />
      );
      expect(screen.getByText('New chat')).toBeInTheDocument();
    });

    it('renders the delete button', () => {
      render(
        <ThreadItem
          id="t1"
          title="Trip"
          isActive={false}
          onSelect={jest.fn()}
          onDelete={jest.fn()}
        />
      );
      expect(screen.getByLabelText('Delete conversation')).toBeInTheDocument();
    });

    it('renders a dot indicator', () => {
      const { container } = render(
        <ThreadItem
          id="t1"
          title="Trip"
          isActive={false}
          onSelect={jest.fn()}
          onDelete={jest.fn()}
        />
      );
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('applies active classes when isActive is true', () => {
      const { container } = render(
        <ThreadItem id="t1" title="Trip" isActive onSelect={jest.fn()} onDelete={jest.fn()} />
      );
      expect(container.querySelector('.bg-sidebar-item-active')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onSelect with the thread id when row is clicked', async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      render(
        <ThreadItem
          id="thread-7"
          title="Trip"
          isActive={false}
          onSelect={onSelect}
          onDelete={jest.fn()}
        />
      );
      await user.click(screen.getByText('Trip'));
      expect(onSelect).toHaveBeenCalledWith('thread-7');
    });

    it('calls onSelect when Enter key is pressed on the row', async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      const { container } = render(
        <ThreadItem
          id="thread-7"
          title="Trip"
          isActive={false}
          onSelect={onSelect}
          onDelete={jest.fn()}
        />
      );
      // Focus the outer row element (first child), not the delete button
      (container.firstChild as HTMLElement).focus();
      await user.keyboard('{Enter}');
      expect(onSelect).toHaveBeenCalledWith('thread-7');
    });

    it('calls onDelete with the thread id when delete button is clicked', async () => {
      const onDelete = jest.fn();
      const user = userEvent.setup();
      render(
        <ThreadItem
          id="thread-7"
          title="Trip"
          isActive={false}
          onSelect={jest.fn()}
          onDelete={onDelete}
        />
      );
      await user.click(screen.getByLabelText('Delete conversation'));
      expect(onDelete).toHaveBeenCalledWith('thread-7');
    });

    it('does not call onSelect when delete button is clicked', async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      render(
        <ThreadItem
          id="t1"
          title="Trip"
          isActive={false}
          onSelect={onSelect}
          onDelete={jest.fn()}
        />
      );
      await user.click(screen.getByLabelText('Delete conversation'));
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
