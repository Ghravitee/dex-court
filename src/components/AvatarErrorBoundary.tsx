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
    // Don't log AbortErrors
    if (error.name !== "AbortError") {
      console.error("Avatar Error Boundary caught an error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs">
            ️
          </div>
        )
      );
    }

    return this.props.children;
  }
}
