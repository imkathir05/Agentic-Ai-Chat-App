import React from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export default function LandingPage({ onLogin, onSignUp }: LandingPageProps) {
  return (
    <div className="landing-container">
      <div className="landing-grid"></div>
      <div className="landing-glow"></div>
      
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          Agentic AI
        </div>
        <div className="landing-nav-actions">
          <button onClick={onLogin} className="landing-btn-ghost">Log in</button>
          <button onClick={onSignUp} className="landing-btn-primary">Sign up</button>
        </div>
      </nav>

      <main className="landing-hero">
        <div className="landing-badge">Next-Gen AI Assistant</div>
        <h1 className="landing-title">
          Build & chat with <br />
          <span className="landing-title-gradient">Agentic Workspaces</span>
        </h1>
        <p className="landing-subtitle">
          Create powerful AI agents with custom instructions and tool sets. Powered by state-of-the-art models like Gemini 2.5 and Llama 3.3.
        </p>
        <div className="landing-cta-group">
          <button onClick={onSignUp} className="landing-cta-main">
            Get Started Free
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <button onClick={onLogin} className="landing-cta-secondary">
            Sign In
          </button>
        </div>
      </main>
    </div>
  );
}
