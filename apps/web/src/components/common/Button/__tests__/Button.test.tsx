import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/common/Button';

// Prevents import.meta error from constants/agent.ts loaded via @/utils barrel
jest.mock('@/constants', () => ({}));

describe('Button', () => {
  describe('rendering', () => {
    it('renders children as button text', () => {
      render(<Button>Plan trip</Button>);
      expect(screen.getByRole('button', { name: 'Plan trip' })).toBeInTheDocument();
    });

    it('defaults to type="button" to prevent accidental form submission', () => {
      render(<Button>Click</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('accepts type="submit"', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('renders left icon with aria-hidden', () => {
      render(<Button leftIcon={<span data-testid="left-icon">★</span>}>Click</Button>);
      const icon = screen.getByTestId('left-icon');
      expect(icon).toBeInTheDocument();
      expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders right icon with aria-hidden', () => {
      render(<Button rightIcon={<span data-testid="right-icon">→</span>}>Click</Button>);
      const icon = screen.getByTestId('right-icon');
      expect(icon).toBeInTheDocument();
      expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Click</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is enabled by default', () => {
      render(<Button>Click</Button>);
      expect(screen.getByRole('button')).toBeEnabled();
    });
  });

  describe('click interactions', () => {
    it('calls onClick when clicked', async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();
      render(<Button onClick={onClick}>Click</Button>);
      await user.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const onClick = jest.fn();
      const user = userEvent.setup();
      render(
        <Button disabled onClick={onClick}>
          Click
        </Button>
      );
      await user.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not throw when clicked without onClick handler', async () => {
      const user = userEvent.setup();
      render(<Button>Click</Button>);
      await expect(user.click(screen.getByRole('button'))).resolves.not.toThrow();
    });
  });

  describe('className merging', () => {
    it('applies additional className via props', () => {
      render(<Button className="custom-class">Click</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });
});
