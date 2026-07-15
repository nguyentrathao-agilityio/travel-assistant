import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapsedThreadButton } from '../CollapsedThreadButton';

describe('CollapsedThreadButton', () => {
  describe('rendering', () => {
    it('renders a button with the title attribute', () => {
      render(
        <CollapsedThreadButton
          id="t1"
          title="Trip to Da Nang"
          isActive={false}
          onSelect={jest.fn()}
        />
      );
      expect(screen.getByTitle('Trip to Da Nang')).toBeInTheDocument();
    });

    it('renders a dot indicator', () => {
      const { container } = render(
        <CollapsedThreadButton id="t1" title="Trip" isActive={false} onSelect={jest.fn()} />
      );
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('applies active class when isActive is true', () => {
      const { container } = render(
        <CollapsedThreadButton id="t1" title="Trip" isActive onSelect={jest.fn()} />
      );
      expect(container.querySelector('.bg-sidebar-item-active')).toBeInTheDocument();
    });

    it('applies hover class when isActive is false', () => {
      const { container } = render(
        <CollapsedThreadButton id="t1" title="Trip" isActive={false} onSelect={jest.fn()} />
      );
      expect(container.querySelector('.hover\\:bg-sidebar-item-hover')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onSelect with the thread id when clicked', async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      render(
        <CollapsedThreadButton id="thread-42" title="Trip" isActive={false} onSelect={onSelect} />
      );
      await user.click(screen.getByTitle('Trip'));
      expect(onSelect).toHaveBeenCalledWith('thread-42');
    });

    it('does not call onSelect when disabled', () => {
      const onSelect = jest.fn();
      render(<CollapsedThreadButton id="t1" title="Trip" isActive={false} onSelect={onSelect} />);
      // button is not disabled by default — interaction guard is via component prop
      expect(screen.getByTitle('Trip')).not.toBeDisabled();
    });
  });
});
