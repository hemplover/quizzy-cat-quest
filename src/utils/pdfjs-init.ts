// Inizializzazione di PDF.js - QUESTO FILE DEVE ESSERE IMPORTATO ALL'AVVIO DELL'APP

// Importa sia la libreria principale sia il worker come modulo ES
import * as pdfjsLib from 'pdfjs-dist';
// Importa il worker come modulo - Vite lo gestirà
// Aggiungiamo `?url` per dire a Vite di darci solo l'URL del worker ottimizzato
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

console.log('Initializing PDF.js worker using Vite import...');

// Configura il worker usando l'URL gestito da Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = PdfjsWorker;

console.log(`PDF.js worker configured successfully with Vite, worker URL: ${PdfjsWorker}`);

// Esporta la libreria pdfjs se serve altrove (opzionale)
export { pdfjsLib }; 