import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'tailwindcss/tailwind.css';

import App from './App';
import reportWebVitals from './reportWebVitals';
import AuthProvider from './features/auth/context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);

reportWebVitals();
