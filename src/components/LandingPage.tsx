import React, { useState } from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export default function LandingPage({ onLogin, onSignUp }: LandingPageProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { q: "How do I create a new AI Agent?", a: "Simply navigate to the Agents tab, click 'Create Agent', and provide a name and system prompt. You can then attach any of your custom tools to give the agent its capabilities." },
    { q: "Can I connect my own custom APIs?", a: "Yes! You can build custom tools with any HTTP endpoint. Just define the API URL, method, headers, and body, and your agent will be able to interact with your business logic." },
    { q: "Which LLM models are supported?", a: "We currently support state-of-the-art models including Gemini 2.5 Flash, Gemini 2.5 Pro, Llama 3.3 70B, and Mixtral 8x7B. You can seamlessly switch between them based on your needs." },
    { q: "How do workspaces isolate my chats?", a: "Each workspace creates a dedicated sandbox for an agent. The chat history and context are isolated, allowing you to test specific tasks without interference from other sessions." },
    { q: "Can I view the tool execution traces?", a: "Absolutely. When an agent executes a tool, you can expand the tool trace in the chat to see exactly what arguments were passed and what response the API returned." },
    { q: "Is my API key stored securely?", a: "Yes, your API keys for providers like Groq and Gemini are stored securely and only used to authenticate requests to the respective AI models." }
  ];

  return (
    <div className="landing-container">
      
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <span className="c1"></span>
            <span className="c2"></span>
            <span className="c3"></span>
          </div>
          Agentic AI
        </div>
        <div className="landing-nav-links">
          <a href="#">Agents</a>
          <a href="#">Tools</a>
          <a href="#">Workspaces</a>
          <a href="#">Models</a>
          <a href="#">Pricing</a>
          <a href="#">About</a>
        </div>
        <div className="landing-nav-actions">
          <button onClick={onLogin} className="landing-btn-login">Login</button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="landing-hero-bg"></div>
        <div className="landing-badge">
          <span className="landing-badge-highlight">New</span>
          <span className="landing-badge-text">Next-Gen AI Assistant</span>
        </div>
        
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <button onClick={onLogin} className="landing-cta-secondary">
            Sign In 
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ fill: "currentColor", color: "white", background: "black" }}>
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
        </div>
      </main>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-left">
          <div className="landing-badge">Why Agentic AI</div>
          <h2>Automate tasks securely with custom AI Agents and tools</h2>
          <p>
            Build agents with customized tools, test them in isolated workspaces, and deploy powerful automated workflows seamlessly.
          </p>
        </div>
        <div className="features-right">
          <div className="feature-item">
            <div className="feature-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div className="feature-content">
              <h3>Custom Tool Creation</h3>
              <p>Build tools with built-in or custom HTTP endpoints to easily interact with your own data, APIs, and business logic.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
            <div className="feature-content">
              <h3>Multiple LLM Support</h3>
              <p>Seamlessly switch between powerful state-of-the-art models like Gemini 2.5 Flash and Llama 3.3 to get the best results.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </div>
            <div className="feature-content">
              <h3>Isolated Workspaces</h3>
              <p>Test and iterate your agents in secure chat sessions with full tool execution tracing and execution visibility.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-left">
          <div className="landing-badge">FAQs</div>
          <h2>Common questions about building with Agentic AI</h2>
          <p>
            Learn how our platform empowers developers to create intelligent, tool-using agents easily.
          </p>
        </div>
        <div className="faq-right">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className={`faq-item ${expandedFaq === i ? 'expanded' : ''}`}
              onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {expandedFaq === i && (
                <div className="faq-answer">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="landing-logo">
              <div className="landing-logo-icon">
                <span className="c1"></span>
                <span className="c2"></span>
                <span className="c3"></span>
              </div>
              Agentic AI
            </div>
            <p>The ultimate platform for creating, testing, and deploying intelligent AI agents with custom tool sets and secure isolated workspaces.</p>
          </div>
          <div className="footer-links">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Contact Us</a>
          </div>
          <div className="footer-links">
            <h4>Usage</h4>
            <a href="#">Terms & Conditions</a>
            <a href="#">Privacy Policy</a>
            <a href="#">API Documentation</a>
          </div>
          <div className="footer-apps">
            <h4>Download App</h4>
            <div className="app-badges">
              <div style={{ background: '#000', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', display: 'flex', gap: '8px', alignItems: 'center', width: 'fit-content' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5h15c.83 0 1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5h-15c-.83 0-1.5-.67-1.5-1.5z"/></svg>
                <div>
                  <div style={{ fontSize: '8px' }}>GET IT ON</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Google Play</div>
                </div>
              </div>
              <div style={{ background: '#000', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', display: 'flex', gap: '8px', alignItems: 'center', width: 'fit-content' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/></svg>
                <div>
                  <div style={{ fontSize: '8px' }}>Download on the</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>App Store</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div>2026© Agentic AI. All rights reserved.</div>
          <div className="social-icons">
            <a href="#"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path></svg></a>
            <a href="#"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path></svg></a>
            <a href="#"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path></svg></a>
            <a href="#"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33 2.78 2.78 0 001.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg></a>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <button className="fab-chat">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        Need Help?
      </button>

    </div>
  );
}
