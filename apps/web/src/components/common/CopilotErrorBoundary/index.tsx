import { Component, type ErrorInfo, type ReactNode } from 'react';

// Components
import { Button } from '../Button';

interface CopilotErrorBoundaryProps {
  children: ReactNode;
  resetKey: string;
}

interface CopilotErrorBoundaryState {
  error: Error | null;
}

export class CopilotErrorBoundary extends Component<
  CopilotErrorBoundaryProps,
  CopilotErrorBoundaryState
> {
  state: CopilotErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): CopilotErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Copilot chat render failed', error, info);
  }

  componentDidUpdate(previousProps: CopilotErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  private retry = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 p-6">
        <p className="text-text-primary font-medium">Something went wrong with the travel chat.</p>
        <p className="text-text-secondary text-body">Your conversation is still saved.</p>
        <Button variant="primary" onClick={this.retry}>
          Try again
        </Button>
      </div>
    );
  }
}
