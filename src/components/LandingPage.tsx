import React from 'react';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export default function LandingPage({ onLogin, onSignUp }: LandingPageProps) {
  return (
    <div className="landing-page" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center'
    }}>
      <h1>Welcome to Agentic AI</h1>
      <p style={{ margin: '1rem 0' }}>Your full-stack agentic AI assistant with Groq & Gemini.</p>
      <div className="landing-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button onClick={onLogin} className="btn primary" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Login</button>
        <button onClick={onSignUp} className="btn secondary" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Sign Up</button>
      </div>
    </div>
  );
}
