
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { checkEnvironmentVariables, getSetupInstructions } from './utils/envChecker'
import { debugEnvironmentVariables } from './utils/debugEnv'

// Global error handler to catch URL construction errors
const originalURL = window.URL;
window.URL = class extends originalURL {
  constructor(url: string | URL, base?: string | URL) {
    try {
      super(url, base);
    } catch (error) {
      console.warn('URL construction failed, using fallback:', error);
      // Return a mock URL object
      const mockUrl = new originalURL('https://placeholder.com');
      Object.setPrototypeOf(mockUrl, this.constructor.prototype);
      return mockUrl;
    }
  }
} as any;

// Global error handlers to catch any remaining errors
window.addEventListener('error', (event) => {
  if (event.error && event.error.message && event.error.message.includes('URL')) {
    console.warn('URL-related error caught and handled:', event.error.message);
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && 
      ((typeof event.reason === 'string' && 
        (event.reason.includes('message channel') || event.reason.includes('URL'))) ||
       (event.reason.message && 
        (event.reason.message.includes('message channel') || 
         event.reason.message.includes('asynchronous response') ||
         event.reason.message.includes('URL'))))) {
    console.warn('Unhandled promise rejection caught and handled:', event.reason);
    event.preventDefault();
  }
});

// Additional handler for message channel errors
window.addEventListener('message', (event) => {
  // Prevent message channel errors from propagating
  if (event.data && typeof event.data === 'object' && event.data.type === 'error') {
    console.warn('Message channel error intercepted:', event.data);
    event.stopPropagation();
  }
});

// Check environment variables on app startup
console.log('🚀 Cosmo Agents - Starting up...');
checkEnvironmentVariables();
getSetupInstructions();
debugEnvironmentVariables();

// Error boundary for better error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          fontFamily: 'Arial, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ maxWidth: '500px' }}>
            <h1 style={{ color: '#1e293b', marginBottom: '16px' }}>Something went wrong</h1>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              We encountered an unexpected error. This might be due to missing configuration.
            </p>
            <div style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Technical Details:</h3>
              <p style={{ color: '#7f1d1d', fontSize: '14px', margin: '0' }}>
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Refresh Page
            </button>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '16px' }}>
              If the problem persists, please check your environment configuration.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
