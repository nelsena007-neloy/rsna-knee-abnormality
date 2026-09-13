// Suppress unhandled WebSocket rejection errors (e.g. Vite HMR in containerized preview)
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('WebSocket') || event.reason?.includes?.('WebSocket')) {
    event.preventDefault();
  }
});

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
