"use client"; // Indica que este é um Client Component

import { Component, ReactNode } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error in Chat component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong in the Chat component.</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
