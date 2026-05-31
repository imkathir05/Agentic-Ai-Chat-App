import React, { useState, useEffect } from 'react';
import { login, register } from '../api';

interface AuthModalProps {
  open: boolean;
  initialMode: "login" | "register";
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ open, initialMode, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setUsername('');
    setPassword('');
    setEmail('');
  }, [open, initialMode]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
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
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="modal-content" style={{
        background: 'var(--bg-panel, #fff)', padding: '2rem', borderRadius: '8px',
        width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        color: 'var(--fg, #000)'
      }}>
        <h2 style={{ marginTop: 0 }}>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
        {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ marginBottom: '0.25rem' }}>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          {mode === 'register' && (
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ marginBottom: '0.25rem' }}>Email (optional)</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          )}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ marginBottom: '0.25rem' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          
          <div className="modal-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} disabled={loading} className="btn" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn primary" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
              {loading ? 'Submitting...' : (mode === 'login' ? 'Login' : 'Sign Up')}
            </button>
          </div>
        </form>
        
        <div className="auth-switch" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          {mode === 'login' ? (
            <p>Don't have an account? <button type="button" onClick={() => setMode('register')} className="link-btn" style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>Sign Up</button></p>
          ) : (
            <p>Already have an account? <button type="button" onClick={() => setMode('login')} className="link-btn" style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>Login</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
