// Importazione PDF.js prima di tutto per configurare il worker
import './utils/pdfjs-init';

import React from 'react';
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';

// Make sure we mount the React app with the BrowserRouter properly
const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
