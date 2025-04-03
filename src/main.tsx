// Importazione PDF.js prima di tutto per configurare il worker
import './utils/pdfjs-init';

import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Make sure we mount the React app with the BrowserRouter properly
const root = createRoot(document.getElementById("root")!);

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
