import { Component } from 'react';

/**
 * ErrorBoundary — catches any render/lifecycle error in child components
 * so one broken page can't white-screen the entire app.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomePageComponent />
 *   </ErrorBoundary>
 *
 * Or with a custom fallback:
 *   <ErrorBoundary fallback={<p>Something broke</p>}>
 *     <SomePageComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you'd send this to Sentry/LogRocket/etc.
    console.error('[ErrorBoundary] caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    // If a custom fallback was provided, use it
    if (this.props.fallback) return this.props.fallback;

    // Default premium fallback UI — matches the app's dark galaxy aesthetic
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'radial-gradient(ellipse 90% 70% at 50% 0%, #241A2E 0%, #170F22 45%, #0A0710 100%)',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
        }}
      >
        {/* Glowing icon */}
        <div style={{ fontSize: '3rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 12px rgba(255,150,195,0.6))' }}>
          💔
        </div>

        <h1 style={{ color: '#F4ECE3', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Something went wrong
        </h1>

        <p style={{ color: '#9A8FA0', fontSize: '0.95rem', maxWidth: '360px', lineHeight: 1.6, marginBottom: '2rem' }}>
          This page ran into an unexpected error. Your data is safe — only this section crashed.
        </p>

        {/* Show error in development only */}
        {import.meta.env.DEV && this.state.error && (
          <pre
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.75rem',
              color: '#FF9FC4',
              maxWidth: '480px',
              overflowX: 'auto',
              textAlign: 'left',
              marginBottom: '2rem',
            }}
          >
            {this.state.error.toString()}
          </pre>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={this.handleReset}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #C9A876, #A8875A)',
              color: '#1A1622',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#F4ECE3',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Go home
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
