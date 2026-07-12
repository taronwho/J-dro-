import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import './styles/global.css';

const rootEl = document.getElementById('root');
if (rootEl === null) throw new Error('Chybí element #root');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline režim (a požadavek TWA pro Google Play) — jen v produkčním buildu
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // bez service workeru hra běží dál, jen ne offline
    });
  });
}
