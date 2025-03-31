import { toast } from 'sonner';

/**
 * Parses the content of various document types
 */
export async function parseDocument(file: File): Promise<string | null> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  console.log(`Parsing document: ${fileName} (${fileType})`);
  
  try {
    // Plain text files
    if (fileType.includes('text/plain')) {
      return await readTextFile(file);
    }
    
    // PDF files
    else if (fileType.includes('application/pdf') || fileName.endsWith('.pdf')) {
      console.log('Detected PDF file, beginning extraction...');
      try {
        return await extractTextFromPdf(file);
      } catch (pdfError) {
        console.error('PDF extraction failed, falling back to text extraction:', pdfError);
        toast.error('PDF extraction failed. Some content may be missing.');
        // Try to extract as plain text as fallback
        try {
          return await readTextFile(file);
        } catch (textError) {
          console.error('Text fallback also failed:', textError);
          throw new Error('Could not extract text from this PDF file.');
        }
      }
    }
    
    // Word documents
    else if (
      fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || 
      fileType.includes('application/msword') ||
      fileName.endsWith('.docx') || 
      fileName.endsWith('.doc')
    ) {
      try {
        return await extractTextFromWord(file);
      } catch (wordError) {
        console.error('Word extraction failed, falling back to text extraction:', wordError);
        toast.error('Word document extraction failed. Some content may be missing.');
        // Try to extract as plain text as fallback
        try {
          return await readTextFile(file);
        } catch (textError) {
          console.error('Text fallback also failed:', textError);
          throw new Error('Could not extract text from this Word document.');
        }
      }
    }
    
    // PowerPoint presentations
    else if (
      fileType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation') ||
      fileType.includes('application/vnd.ms-powerpoint') ||
      fileName.endsWith('.pptx') || 
      fileName.endsWith('.ppt')
    ) {
      try {
        return await extractTextFromPowerPoint(file);
      } catch (pptError) {
        console.error('PowerPoint extraction failed, falling back to text extraction:', pptError);
        toast.error('PowerPoint extraction failed. Some content may be missing.');
        // Try to extract as plain text as fallback
        try {
          return await readTextFile(file);
        } catch (textError) {
          console.error('Text fallback also failed:', textError);
          throw new Error('Could not extract text from this PowerPoint file.');
        }
      }
    }
    
    // HTML files
    else if (fileType.includes('text/html') || fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      return await readTextFile(file).then(htmlText => {
        // Simple HTML text extraction by removing tags
        return htmlText ? htmlText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : null;
      });
    }
    
    else {
      console.warn(`Unsupported file type: ${fileType}`);
      toast.error(`Unsupported file type: ${fileType}`);
      return null;
    }
  } catch (error) {
    console.error('Error parsing document:', error);
    toast.error(`Error processing document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

// Read a text file
async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read text file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading text file'));
    };
    
    reader.readAsText(file);
  });
}

// Extract text from PDF using PDF.js with a simpler, more reliable approach
async function extractTextFromPdf(file: File): Promise<string> {
  try {
    console.log('Starting PDF text extraction with simplified approach...', file.name, file.size);
    
    // Importa la libreria PDF.js
    const pdfjs = await import('pdfjs-dist');
    console.log('PDF.js library loaded successfully');
    
    // Specifica un worker valido usando un CDN pubblico che sicuramente funziona
    const cdnWorkerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js';
    
    if (pdfjs.default && typeof pdfjs.default.getDocument === 'function') {
      // Per PDF.js v3.x
      pdfjs.default.GlobalWorkerOptions.workerSrc = cdnWorkerUrl;
      console.log('PDF.js v3.x - Worker configurato con CDN:', cdnWorkerUrl);
    } else {
      // Per PDF.js v2.x
      pdfjs.GlobalWorkerOptions.workerSrc = cdnWorkerUrl;
      console.log('PDF.js v2.x - Worker configurato con CDN:', cdnWorkerUrl);
    }
    
    // Leggi il file come ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log(`File loaded as ArrayBuffer, size: ${arrayBuffer.byteLength} bytes`);
    
    // Crea il loading task in base alla versione
    const getDocument = pdfjs.default?.getDocument || pdfjs.getDocument;
    const loadingTask = getDocument({ data: arrayBuffer });
    
    // Carica il documento PDF
    const pdf = await loadingTask.promise;
    console.log(`PDF document loaded successfully with ${pdf.numPages} pages`);
    
    // Array di termini da escludere (metadati tecnici e termini in altre lingue)
    const blacklist = [
      // PDF specifici
      '/ProcSet', '/PDF', '/Text', '/ImageB', '/ImageC', '/MediaBox', '/Resources',
      '/Font', '/XObject', 'endobj', 'obj', 'startxref', '/Type', '/Filter',
      'BitsPerComponent', 'ColorSpace',
      
      // Francese e spagnolo
      'composante', 'résolution', 'espace', 'compresión', 'página', 'objeto',
      'longitud', 'altura', 'anchura', 'espacio', 'color', 'imagen', 'DeviceGray',
      'DeviceRGB', 'DeviceCMYK', 'Composante', 'Résolution',
      
      // Termini aggiuntivi frequenti nei metadati
      'bit', 'pixel', 'filter', 'byte', 'compression', 'image', 'object'
    ];
    
    // Estrai il testo pagina per pagina
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        console.log(`Processing page ${i} of ${pdf.numPages}`);
        const page = await pdf.getPage(i);
        
        // Metodo 1: Usa getTextContent() - più affidabile
        const content = await page.getTextContent();
        
        // Filtra e unisci gli elementi di testo
        const filteredItems = content.items
          .map((item: any) => (item.str || item.text || '').trim())
          .filter((text: string) => 
            text.length > 1 && // Salta elementi troppo brevi
            !blacklist.some(term => text.includes(term)) // Escludi metadati
          );
        
        // Aggiungi il testo filtrato
        if (filteredItems.length > 0) {
          fullText += filteredItems.join(' ') + '\n\n';
          console.log(`Extracted ${filteredItems.length} text items from page ${i}`);
        }
      } catch (error) {
        console.error(`Error extracting text from page ${i}:`, error);
        // Continua con le altre pagine
      }
    }
    
    // Pulisci il testo
    let cleanedText = fullText
      .replace(/\s+/g, ' ') // Rimuovi spazi multipli
      .trim();
    
    console.log(`Extracted ${cleanedText.length} characters of text`);
    
    // Ultimo passo di pulizia per rimuovere caratteri problematici
    cleanedText = cleanedText
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Rimuovi caratteri di controllo
      .replace(/\\u[0-9a-fA-F]{4}/g, '') // Rimuovi sequenze Unicode escape
      .replace(/\\/g, '') // Rimuovi backslash
      .replace(/\u0000/g, ''); // Rimuovi caratteri nulli
    
    if (cleanedText.length === 0) {
      throw new Error('No text could be extracted from this PDF');
    }
    
    return cleanedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Extract text from Word documents using mammoth.js with improved error handling
async function extractTextFromWord(file: File): Promise<string> {
  try {
    console.log('Loading mammoth.js for Word document extraction');
    const mammoth = await import('mammoth');
    
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log(`Word document loaded as ArrayBuffer, size: ${arrayBuffer.byteLength} bytes`);
    
    // Extract text using mammoth
    console.log('Extracting text from Word document...');
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    const extractedText = result.value.trim();
    console.log(`Word document text extracted: ${extractedText.length} characters`);
    
    if (extractedText.length === 0) {
      throw new Error('No text could be extracted from this Word document');
    }
    
    if (result.messages && result.messages.length > 0) {
      console.warn('Mammoth extraction warnings:', result.messages);
    }
    
    return extractedText;
  } catch (error) {
    console.error('Error extracting text from Word document:', error);
    throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Extract text from PowerPoint presentations with improved error handling
async function extractTextFromPowerPoint(file: File): Promise<string> {
  try {
    console.log('Starting PowerPoint extraction process');
    // For PowerPoint, we use browser's FileReader to first get the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log(`PowerPoint loaded as ArrayBuffer, size: ${arrayBuffer.byteLength} bytes`);
    
    // Use a simpler approach for PPTX extraction since pptxgenjs lacks direct text extraction
    // Instead, we'll use a basic approach to extract text from XML parts
    let textContent = '';
    
    // Import jszip dynamically
    console.log('Loading JSZip for PowerPoint extraction');
    const JSZip = (await import('jszip')).default;
    
    // Load the file as a zip
    console.log('Opening PowerPoint as zip file');
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Try to extract text from slides
    const slideRegex = /ppt\/slides\/slide[0-9]+\.xml/;
    const slideKeys = Object.keys(zip.files).filter(key => slideRegex.test(key));
    
    console.log(`Found ${slideKeys.length} slides in PowerPoint`);
    
    for (const slideKey of slideKeys) {
      console.log(`Extracting text from slide: ${slideKey}`);
      try {
        const slideContent = await zip.files[slideKey].async('text');
        // Simple regex to extract text between <a:t> tags (text elements in PPTX XML)
        const textMatches = slideContent.match(/<a:t>([^<]*)<\/a:t>/g) || [];
        for (const match of textMatches) {
          const text = match.replace(/<a:t>/, '').replace(/<\/a:t>/, '');
          if (text.trim()) {
            textContent += text.trim() + '\n';
          }
        }
      } catch (slideError) {
        console.error(`Error extracting text from slide ${slideKey}:`, slideError);
        // Continue with next slide instead of failing the entire process
      }
    }
    
    const result = textContent.trim();
    console.log(`Total extracted text from PowerPoint: ${result.length} characters`);
    
    if (!result) {
      throw new Error('Could not extract text from PowerPoint file');
    }
    
    return result;
  } catch (error) {
    console.error('Error extracting text from PowerPoint:', error);
    throw new Error(`Failed to extract text from PowerPoint presentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
