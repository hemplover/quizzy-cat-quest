
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

// Extract text from PDF using PDF.js with more detailed logging and better error handling
async function extractTextFromPdf(file: File): Promise<string> {
  try {
    console.log('Starting PDF text extraction process...', file.name, file.size);
    
    // Import PDF.js dynamically with explicit version to avoid potential conflicts
    console.log('Loading PDF.js library...');
    const pdfjsLib = await import('pdfjs-dist');
    console.log('PDF.js library loaded successfully');
    
    // Set worker source path - Using URL for the worker to avoid issues
    console.log('Configuring PDF.js worker...');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
    console.log('PDF.js worker configured successfully with CDN worker');
    
    // Read file as ArrayBuffer
    console.log('Loading file as ArrayBuffer...');
    const arrayBuffer = await file.arrayBuffer();
    console.log(`File loaded as ArrayBuffer, size: ${arrayBuffer.byteLength} bytes`);
    
    // Load PDF document with proper error handling
    console.log('Creating PDF loading task...');
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    
    loadingTask.onProgress = (progressData) => {
      console.log(`PDF loading progress: ${progressData.loaded} of ${progressData.total}`);
    };
    
    console.log('Waiting for PDF document to load...');
    const pdf = await loadingTask.promise;
    console.log(`PDF document loaded successfully with ${pdf.numPages} pages`);
    
    let textContent = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i} of ${pdf.numPages}...`);
      try {
        const page = await pdf.getPage(i);
        console.log(`Extracting text content from page ${i}...`);
        const content = await page.getTextContent();
        
        // Concatenate text items with spaces
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');
        
        textContent += pageText + '\n\n';
        console.log(`Extracted ${pageText.length} characters from page ${i}`);
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        // Continue with next page instead of failing the entire process
      }
    }
    
    const result = textContent.trim();
    console.log(`Total extracted text: ${result.length} characters`);
    
    if (result.length === 0) {
      throw new Error('No text could be extracted from this PDF');
    }
    
    return result;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error 
      ? `Failed to extract text from PDF: ${error.message}` 
      : 'Failed to extract text from PDF: Unknown error';
    console.error('PDF extraction error details:', errorMessage);
    throw new Error(errorMessage);
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
