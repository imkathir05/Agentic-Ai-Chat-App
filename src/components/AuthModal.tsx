import React, { useState, useEffect } from 'react';
import { login, register } from '../api';
import './AuthModal.css';

interface AuthModalProps {
  open: boolean;
  initialMode: "login" | "register";
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ open, initialMode, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setStep(1);
    setError('');
    setUsername('');
    setPassword('');
    setEmail('');
  }, [open, initialMode]);

  if (!open) return null;

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter an email address');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        // For login, we try to use the email as the username if the backend supports it, 
        // or they might have to enter their actual username if they differ.
        // We'll pass email as username to the login API.
        await login(username || email, password);
      } else {
        await register(username, email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-container">
        <button className="auth-modal-close" onClick={onClose}>
          ×
        </button>

        <h2 className="auth-modal-title">Log in or sign up</h2>
        
        {error && <div className="auth-modal-error">{error}</div>}

        {step === 1 ? (
          <>
            <button type="button" className="auth-modal-social-btn">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button type="button" className="auth-modal-social-btn">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" fill="#1877F2"/>
              </svg>
              Continue with Facebook
            </button>
            <button type="button" className="auth-modal-social-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.636 12.001c0-2.88 2.29-4.228 2.394-4.293-1.341-1.97-3.415-2.245-4.148-2.277-1.758-.179-3.43 1.042-4.327 1.042-.897 0-2.273-1.01-3.738-.981-1.921.03-3.693 1.127-4.685 2.871-2.008 3.513-.513 8.705 1.439 11.555.955 1.393 2.08 2.96 3.585 2.903 1.444-.061 1.996-.941 3.738-.941 1.737 0 2.247.941 3.754.912 1.552-.032 2.528-1.42 3.473-2.808 1.096-1.61 1.547-3.17 1.571-3.25-.035-.015-3.056-1.176-3.056-4.734zM15.421 4.545c.789-.964 1.322-2.302 1.177-3.642-1.134.047-2.545.764-3.355 1.727-.723.856-1.365 2.228-1.196 3.535 1.272.1 2.584-.664 3.374-1.62z" />
              </svg>
              Continue with Apple
            </button>

            <div className="auth-modal-divider">
              <span>OR</span>
            </div>

            <form onSubmit={handleContinue}>
              <div className="auth-modal-input-group">
                {email && <label className="auth-modal-label">Email address</label>}
                <input 
                  type="email" 
                  className="auth-modal-input" 
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="auth-modal-continue-btn">
                Continue
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <button type="button" className="auth-modal-back" onClick={() => setStep(1)}>
              ← Back
            </button>
            
            <div className="auth-modal-input-group" style={{ marginTop: '12px' }}>
              {email && <label className="auth-modal-label">Email address</label>}
              <input 
                type="email" 
                className="auth-modal-input" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled
              />
            </div>
            
            <div className="auth-modal-input-group">
              {username && <label className="auth-modal-label">Username</label>}
              <input 
                type="text" 
                className="auth-modal-input" 
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required={mode === 'register'}
              />
            </div>

            <div className="auth-modal-input-group">
              {password && <label className="auth-modal-label">Password</label>}
              <input 
                type="password" 
                className="auth-modal-input" 
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="auth-modal-continue-btn">
              {loading ? 'Submitting...' : (mode === 'login' ? 'Login' : 'Sign Up')}
            </button>
            
            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px' }}>
              {mode === 'login' ? (
                <p>Don't have an account? <button type="button" onClick={() => setMode('register')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>Sign Up</button></p>
              ) : (
                <p>Already have an account? <button type="button" onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>Login</button></p>
              )}
            </div>
          </form>
        )}

        <div className="auth-modal-footer">
          <a href="#">Terms of Use</a> | <a href="#">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
