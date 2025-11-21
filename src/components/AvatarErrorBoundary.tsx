// components/AvatarErrorBoundary.tsx
import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class AvatarErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("Avatar Error Boundary caught an error:", error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error boundary if children change
    if (prevProps.children !== this.props.children) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500/20 text-xs text-gray-400">
            ?
          </div>
        )
      );
    }

    return this.props.children;
  }
}
