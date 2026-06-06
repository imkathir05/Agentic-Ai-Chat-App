import React, { useState } from 'react';
import type { Theme } from '../theme';

interface LandingPageProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onLogin: () => void;
  onSignUp: () => void;
}

export default function LandingPage({ theme, onThemeChange, onLogin, onSignUp }: LandingPageProps) {
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
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans relative overflow-x-hidden dark:bg-zinc-950 dark:text-zinc-100">
      
      {/* Navigation */}
      <nav className="flex justify-between items-center py-4 px-6 md:px-16 border-b border-gray-100 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="text-xl font-extrabold flex items-center gap-2.5 tracking-wider text-gray-800 dark:text-zinc-100 uppercase">
          <div className="flex gap-0.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span>
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500"></span>
            <span className="w-2.5 h-2.5 rounded-sm bg-green-500"></span>
          </div>
          Agentic AI
        </div>
        <div className="hidden md:flex gap-6 items-center">
          <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 text-sm font-medium transition-colors">Agents</a>
          <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 text-sm font-medium transition-colors">Tools</a>
          <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 text-sm font-medium transition-colors">Workspaces</a>
          <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 text-sm font-medium transition-colors">Models</a>
          <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 text-sm font-medium transition-colors">Pricing</a>
          <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 text-sm font-medium transition-colors">About</a>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 rounded-lg text-text-secondary hover:text-text hover:bg-surface-hover transition-colors cursor-pointer border border-border/40 bg-surface/50"
            onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
            title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            )}
          </button>
          <button 
            onClick={onLogin} 
            className="bg-transparent text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 px-5 py-1.5 text-sm font-medium rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all cursor-pointer"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center text-center py-24 px-6 max-w-4xl mx-auto relative z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-full bg-[radial-gradient(circle_at_center_top,rgba(219,234,254,0.3)_0%,rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_center_top,rgba(59,130,246,0.08)_0%,rgba(0,0,0,0)_60%)] -z-10 pointer-events-none"></div>
        <div className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 shadow-sm">
          <span className="bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent font-bold">New</span>
          <span className="text-gray-500 dark:text-zinc-450">Next-Gen AI Assistant</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-none mb-6 text-gray-900 dark:text-zinc-50">
          Build & chat with <br />
          <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">Agentic Workspaces</span>
        </h1>
        
        <p className="text-lg text-gray-650 dark:text-zinc-400 mb-10 max-w-2xl leading-relaxed">
          Create powerful AI agents with custom instructions and tool sets. Powered by state-of-the-art models like Gemini 2.5 and Llama 3.3.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onSignUp} 
            className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-zinc-100 px-8 py-3.5 text-base font-semibold rounded-full flex items-center gap-2 transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer"
          >
            Get Started Free 
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <button 
            onClick={onLogin} 
            className="bg-white text-gray-950 dark:bg-zinc-900 dark:text-white border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 px-8 py-3.5 text-base font-semibold rounded-full flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            Sign In 
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="fill-current text-white bg-black rounded-full p-0.5">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-start">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 text-purple-750 dark:text-purple-400">
            Why Agentic AI
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight mb-6 text-gray-900 dark:text-zinc-50">
            Automate tasks securely with custom AI Agents and tools
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 text-lg leading-relaxed">
            Build agents with customized tools, test them in isolated workspaces, and deploy powerful automated workflows seamlessly.
          </p>
        </div>
        <div className="flex-1 flex flex-col gap-8 w-full">
          <div className="flex gap-4 items-start pl-6 border-l-2 border-gray-200 dark:border-zinc-800 relative hover:border-blue-500 dark:hover:border-blue-400 transition-colors group">
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0 absolute -left-[17px] top-0 border border-blue-100 dark:border-blue-900/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div className="pt-0.5">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-450 transition-colors">
                Custom Tool Creation
              </h3>
              <p className="text-gray-500 dark:text-zinc-450 text-[15px] leading-relaxed">
                Build tools with built-in or custom HTTP endpoints to easily interact with your own data, APIs, and business logic.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start pl-6 border-l-2 border-gray-200 dark:border-zinc-800 relative hover:border-blue-500 dark:hover:border-blue-400 transition-colors group">
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0 absolute -left-[17px] top-0 border border-blue-100 dark:border-blue-900/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <div className="pt-0.5">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-450 transition-colors">
                Multiple LLM Support
              </h3>
              <p className="text-gray-500 dark:text-zinc-450 text-[15px] leading-relaxed">
                Seamlessly switch between powerful state-of-the-art models like Gemini 2.5 Flash and Llama 3.3 to get the best results.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start pl-6 border-l-2 border-gray-200 dark:border-zinc-800 relative hover:border-blue-500 dark:hover:border-blue-400 transition-colors group">
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0 absolute -left-[17px] top-0 border border-blue-100 dark:border-blue-900/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <div className="pt-0.5">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-450 transition-colors">
                Isolated Workspaces
              </h3>
              <p className="text-gray-500 dark:text-zinc-450 text-[15px] leading-relaxed">
                Test and iterate your agents in secure chat sessions with full tool execution tracing and execution visibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-start bg-gradient-to-b from-white to-gray-50 dark:from-zinc-950 dark:to-zinc-900/20">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 text-purple-750 dark:text-purple-400">
            FAQs
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight mb-6 text-gray-900 dark:text-zinc-50">
            Common questions about building with Agentic AI
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 text-lg leading-relaxed">
            Learn how our platform empowers developers to create intelligent, tool-using agents easily.
          </p>
        </div>
        <div className="flex-1 flex flex-col gap-4 w-full">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className={`border border-gray-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-900 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all flex flex-col ${expandedFaq === i ? 'ring-1 ring-blue-500/20 border-blue-500/35 dark:border-blue-550/35' : ''}`}
              onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-base font-semibold text-gray-700 dark:text-zinc-300">{faq.q}</span>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`text-gray-400 dark:text-zinc-500 transition-transform duration-200 ${expandedFaq === i ? 'rotate-180 text-blue-500' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {expandedFaq === i && (
                <div className="mt-4 text-[15px] text-gray-550 dark:text-zinc-450 leading-relaxed border-t border-gray-100 dark:border-zinc-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 md:px-16 border-t border-gray-200 dark:border-zinc-900 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 lg:gap-16 flex-wrap">
          <div className="flex-[1.5] min-w-[250px]">
            <div className="text-xl font-extrabold flex items-center gap-2.5 tracking-wider text-gray-800 dark:text-zinc-100 uppercase">
              <div className="flex gap-0.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span>
                <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500"></span>
                <span className="w-2.5 h-2.5 rounded-sm bg-green-500"></span>
              </div>
              Agentic AI
            </div>
            <p className="text-gray-500 dark:text-zinc-450 text-sm mt-4 leading-relaxed max-w-sm">
              The ultimate platform for creating, testing, and deploying intelligent AI agents with custom tool sets and secure isolated workspaces.
            </p>
          </div>
          <div className="flex-1 min-w-[150px] flex flex-col gap-3">
            <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-200 uppercase tracking-widest mb-2">Company</h4>
            <a href="#" className="text-gray-550 hover:text-gray-900 dark:text-zinc-450 dark:hover:text-zinc-200 text-sm transition-colors">About Us</a>
            <a href="#" className="text-gray-550 hover:text-gray-900 dark:text-zinc-450 dark:hover:text-zinc-200 text-sm transition-colors">Contact Us</a>
          </div>
          <div className="flex-1 min-w-[150px] flex flex-col gap-3">
            <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-200 uppercase tracking-widest mb-2">Usage</h4>
            <a href="#" className="text-gray-550 hover:text-gray-900 dark:text-zinc-450 dark:hover:text-zinc-200 text-sm transition-colors">Terms & Conditions</a>
            <a href="#" className="text-gray-550 hover:text-gray-900 dark:text-zinc-450 dark:hover:text-zinc-200 text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-550 hover:text-gray-900 dark:text-zinc-450 dark:hover:text-zinc-200 text-sm transition-colors">API Documentation</a>
          </div>
          <div className="flex-1 min-w-[150px]">
            <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-200 uppercase tracking-widest mb-4">Download App</h4>
            <div className="flex flex-col gap-3">
              <div className="bg-black dark:bg-zinc-900 border border-transparent dark:border-zinc-800 text-white p-2.5 px-4 rounded-xl text-xs flex gap-3 items-center w-fit cursor-pointer hover:bg-gray-900 dark:hover:bg-zinc-800 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5h15c.83 0 1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5h-15c-.83 0-1.5-.67-1.5-1.5z"/>
                </svg>
                <div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider">GET IT ON</div>
                  <div className="text-[13px] font-bold">Google Play</div>
                </div>
              </div>
              <div className="bg-black dark:bg-zinc-900 border border-transparent dark:border-zinc-800 text-white p-2.5 px-4 rounded-xl text-xs flex gap-3 items-center w-fit cursor-pointer hover:bg-gray-900 dark:hover:bg-zinc-800 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                <div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider">Download on the</div>
                  <div className="text-[13px] font-bold">App Store</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-100 dark:border-zinc-900/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-400 dark:text-zinc-500 text-xs">
          <div>2026© Agentic AI. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path></svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path></svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path></svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33 2.78 2.78 0 001.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 bg-green-500 hover:bg-green-655 text-white px-5 py-3 rounded-full text-[15px] font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer z-50">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        Need Help?
      </button>

    </div>
  );
}
