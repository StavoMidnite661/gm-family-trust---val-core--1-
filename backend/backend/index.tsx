
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('❌ No element with id="root"');

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
