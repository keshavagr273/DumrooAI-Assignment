import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './features/feedback/styles/feedback.tokens.css';

// Global baseline styles
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  *, *::before, *::after {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--fb-bg-surface);
    color: var(--fb-text-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;
document.head.appendChild(styleTag);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

