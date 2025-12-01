import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

function Login({ onLogin }) {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      const errorMessages = {
        'session_expired': 'Your session expired. Please try again.',
        'invalid_state': 'Security validation failed. Please try again.',
        'access_denied': 'You denied access to the application.',
        'invalid_request': 'Invalid OAuth request. Please check your configuration.',
        'no_verifier': 'Session verification failed. Please try again.',
        'auth_failed': 'Authentication failed. Please try again.',
        'OAuth failed:': 'OAuth authentication failed. Please check your credentials.'
      };
      setError(errorMessages[errorParam] || `Authentication error: ${errorParam}`);
      console.error('OAuth error:', errorParam);
    }
    
  }, [searchParams]);

  const handleLogin = () => {
    setError(null);
    window.location.href = '/api/auth/airtable';
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
      <div className="card">
        <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>Airtable Form Builder</h1>
        <p style={{ marginBottom: '20px', textAlign: 'center', color: '#666' }}>
          Log in with your Airtable account to get started
        </p>
        {error && (
          <div className="error" style={{ 
            padding: '10px', 
            marginBottom: '20px', 
            backgroundColor: '#fee',
            borderRadius: '4px',
            border: '1px solid #fcc'
          }}>
            {error}
          </div>
        )}
        <button className="btn btn-primary" onClick={handleLogin} style={{ width: '100%' }}>
          Login with Airtable
        </button>
        <p style={{ marginTop: '20px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
          Make sure your Airtable OAuth app is configured correctly
        </p>
      </div>
    </div>
  );
}

export default Login;

