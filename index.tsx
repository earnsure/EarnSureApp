
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initApp } from './firebase-mock';

initApp();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
