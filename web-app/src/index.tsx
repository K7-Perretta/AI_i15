import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ✅ Enable PWA support
// To make your app work offline and load faster, change unregister() to register() below.
// Learn more: https://cra.link/PWA
serviceWorkerRegistration.register();