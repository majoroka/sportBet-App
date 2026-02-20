import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { applyThemeToDocument, getInitialTheme } from './lib/theme';
import './index.css';

applyThemeToDocument(getInitialTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
