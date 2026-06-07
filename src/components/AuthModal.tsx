import React, { useState, useEffect } from 'react';
import { login, register, googleLogin, healthCheck, checkEmail } from '../api';
import logoUrl from '../logo.png';

interface AuthModalProps {
  open: boolean;
  initialMode: "login" | "register";
  onClose: () => void;
  onSuccess: () => void;
  googleClientId?: string;
  theme?: string;
}

export default function AuthModal({ open, initialMode, onClose, onSuccess, googleClientId, theme }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [localGoogleClientId, setLocalGoogleClientId] = useState(googleClientId || '');

  const handleGoogleCallback = async (response: any) => {
    const idToken = response.credential;
    console.log("Google ID Token:", idToken);
    if (!idToken) return;

    setError('');
    setLoading(true);
    try {
      await googleLogin(idToken);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMode(initialMode);
    setStep(1);
    setError('');
    setUsername('');
    setPassword('');
    setEmail('');
  }, [open, initialMode]);

  useEffect(() => {
    if (googleClientId) {
      setLocalGoogleClientId(googleClientId);
    }
  }, [googleClientId]);

  useEffect(() => {
    if (!open) return;
    if (!localGoogleClientId) {
      healthCheck()
        .then((h) => {
          if (h.google_client_id) {
            setLocalGoogleClientId(h.google_client_id);
          }
        })
        .catch((err) => console.error("Error fetching health check in AuthModal:", err));
    }
  }, [open, localGoogleClientId]);

  useEffect(() => {
    if (!open) return;

    if (localGoogleClientId) {
      const scriptId = 'google-gsi-client-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;

      const initializeGoogle = () => {
        const google = (window as any).google;
        if (google?.accounts?.id) {
          google.accounts.id.initialize({
            client_id: localGoogleClientId,
            callback: handleGoogleCallback,
          });

          const container = document.getElementById('google-signin-btn');
          if (container) {
            google.accounts.id.renderButton(container, {
              theme: theme === 'dark' ? 'filled_black' : 'outline',
              size: 'large',
              width: container.offsetWidth || 376,
              shape: 'pill',
              text: 'continue_with',
            });
          }
        }
      };

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogle;
        document.body.appendChild(script);
      } else {
        if ((window as any).google?.accounts?.id) {
          initializeGoogle();
        } else {
          script.onload = initializeGoogle;
        }
      }
    }
  }, [open, localGoogleClientId, theme]);

  if (!open) return null;

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter an email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { exists } = await checkEmail(email);
      if (exists) {
        setMode('login');
      } else {
        setMode('register');
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Error checking email');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-[440px] px-8 pt-10 pb-8 relative shadow-xl text-black dark:text-white font-sans box-border border border-gray-100 dark:border-zinc-800">
        <button 
          className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer text-gray-400 dark:text-zinc-500 hover:text-gray-650 dark:hover:text-zinc-350 p-1 flex items-center justify-center transition-colors" 
          onClick={onClose}
        >
          ×
        </button>

        <div className="flex flex-col items-center mb-6">
          <img src={logoUrl} alt="Agentic AI Logo" className="h-14 w-auto object-contain mb-3" />
          <h2 className="text-2xl font-bold text-center m-0 text-gray-900 dark:text-zinc-100">
            Log in or sign up
          </h2>
        </div>
        
        {error && (
          <div className="text-red-650 dark:text-red-400 text-sm text-center mb-4 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        {step === 1 ? (
          <>
            <div className="relative mb-4">
              <button 
                type="button" 
                className="flex items-center w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-full text-[15px] font-medium cursor-pointer relative justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-gray-900 dark:text-zinc-100"
                onClick={() => {
                  if (!localGoogleClientId) {
                    setError('Google Client ID not loaded yet');
                  }
                }}
              >
                <svg className="absolute left-5 w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              {localGoogleClientId && (
                <div 
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    zIndex: 10,
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                >
                  <div id="google-signin-btn" style={{ width: '100%', height: '100%' }} />
                </div>
              )}
            </div>
            <button type="button" className="flex items-center w-full px-4 py-3 mb-4 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-full text-[15px] font-medium cursor-pointer relative justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-gray-900 dark:text-zinc-100">
              <svg className="absolute left-5 w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" fill="#1877F2"/>
              </svg>
              Continue with Facebook
            </button>
            <button type="button" className="flex items-center w-full px-4 py-3 mb-4 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-full text-[15px] font-medium cursor-pointer relative justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-gray-900 dark:text-zinc-100">
              <svg className="absolute left-5 w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.636 12.001c0-2.88 2.29-4.228 2.394-4.293-1.341-1.97-3.415-2.245-4.148-2.277-1.758-.179-3.43 1.042-4.327 1.042-.897 0-2.273-1.01-3.738-.981-1.921.03-3.693 1.127-4.685 2.871-2.008 3.513-.513 8.705 1.439 11.555.955 1.393 2.08 2.96 3.585 2.903 1.444-.061 1.996-.941 3.738-.941 1.737 0 2.247.941 3.754.912 1.552-.032 2.528-1.42 3.473-2.808 1.096-1.61 1.547-3.17 1.571-3.25-.035-.015-3.056-1.176-3.056-4.734zM15.421 4.545c.789-.964 1.322-2.302 1.177-3.642-1.134.047-2.545.764-3.355 1.727-.723.856-1.365 2.228-1.196 3.535 1.272.1 2.584-.664 3.374-1.62z" />
              </svg>
              Continue with Apple
            </button>

            <div className="flex items-center text-center my-6 text-gray-400 dark:text-zinc-500 text-xs font-semibold after:content-[''] after:flex-1 after:border-b after:border-gray-200 dark:after:border-zinc-800 before:content-[''] before:flex-1 before:border-b before:border-gray-200 dark:before:border-zinc-800">
              <span className="px-4">OR</span>
            </div>

            <form onSubmit={handleContinue}>
              <div className="relative mb-5">
                {email && (
                  <label className="absolute left-5 -top-2 bg-white dark:bg-zinc-900 px-1 text-xs text-blue-500 dark:text-blue-400 pointer-events-none">
                    Email address
                  </label>
                )}
                <input 
                  type="email" 
                  className="w-full px-5 py-3 border border-gray-300 dark:border-zinc-700 rounded-full text-[15px] outline-none box-border bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors" 
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 px-4 bg-gray-900 dark:bg-zinc-100 text-white dark:text-black border-none rounded-full text-[15px] font-semibold cursor-pointer mt-2 hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Continue
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <button 
              type="button" 
              className="bg-transparent border-none text-blue-500 dark:text-blue-400 text-sm cursor-pointer mb-4 inline-flex items-center gap-1 hover:underline" 
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
            
            <div className="relative mb-5 mt-3">
              {email && (
                <label className="absolute left-5 -top-2 bg-white dark:bg-zinc-900 px-1 text-xs text-blue-500 dark:text-blue-400 pointer-events-none">
                  Email address
                </label>
              )}
              <input 
                type="email" 
                className="w-full px-5 py-3 border border-gray-300 dark:border-zinc-700 rounded-full text-[15px] outline-none box-border bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 cursor-not-allowed" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled
              />
            </div>
            
            {mode === 'register' && (
              <div className="relative mb-5">
                {username && (
                  <label className="absolute left-5 -top-2 bg-white dark:bg-zinc-900 px-1 text-xs text-blue-500 dark:text-blue-400 pointer-events-none">
                    Username
                  </label>
                )}
                <input 
                  type="text" 
                  className="w-full px-5 py-3 border border-gray-300 dark:border-zinc-700 rounded-full text-[15px] outline-none box-border bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors" 
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required={mode === 'register'}
                />
              </div>
            )}

            <div className="relative mb-5">
              {password && (
                <label className="absolute left-5 -top-2 bg-white dark:bg-zinc-900 px-1 text-xs text-blue-500 dark:text-blue-400 pointer-events-none">
                  Password
                </label>
              )}
              <input 
                type="password" 
                className="w-full px-5 py-3 border border-gray-300 dark:border-zinc-700 rounded-full text-[15px] outline-none box-border bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors" 
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3.5 px-4 bg-gray-900 dark:bg-zinc-100 text-white dark:text-black border-none rounded-full text-[15px] font-semibold cursor-pointer mt-2 hover:bg-gray-800 dark:hover:bg-zinc-200 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : (mode === 'login' ? 'Login' : 'Sign Up')}
            </button>
            
            <div className="mt-4 text-center text-sm">
              {mode === 'login' ? (
                <p className="text-gray-605 dark:text-zinc-400">
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => setMode('register')} 
                    className="bg-transparent border-none text-blue-500 dark:text-blue-400 cursor-pointer underline hover:text-blue-600"
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p className="text-gray-605 dark:text-zinc-400">
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => setMode('login')} 
                    className="bg-transparent border-none text-blue-500 dark:text-blue-400 cursor-pointer underline hover:text-blue-600"
                  >
                    Login
                  </button>
                </p>
              )}
            </div>
          </form>
        )}

        <div className="text-center mt-8 text-xs text-gray-500 dark:text-zinc-500">
          <a href="#" className="text-gray-500 dark:text-zinc-500 underline cursor-pointer mx-1 hover:text-gray-750 dark:hover:text-zinc-350">Terms of Use</a> | <a href="#" className="text-gray-500 dark:text-zinc-500 underline cursor-pointer mx-1 hover:text-gray-750 dark:hover:text-zinc-350">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
