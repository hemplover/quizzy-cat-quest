
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
      return await extractTextFromPdf(file);
    }
    
    // Word documents
    else if (
      fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || 
      fileType.includes('application/msword') ||
      fileName.endsWith('.docx') || 
      fileName.endsWith('.doc')
    ) {
      return await extractTextFromWord(file);
    }
    
    // PowerPoint presentations
    else if (
      fileType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation') ||
      fileType.includes('application/vnd.ms-powerpoint') ||
      fileName.endsWith('.pptx') || 
      fileName.endsWith('.ppt')
    ) {
      return await extractTextFromPowerPoint(file);
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
    toast.error(`Error parsing document: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

// Extract text from PDF using PDF.js
async function extractTextFromPdf(file: File): Promise<string> {
  try {
    // Using PDF.js in browser context
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source path
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let textContent = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      
      // Concatenate text items with spaces
      const pageText = text.items
        .map((item: any) => item.str)
        .join(' ');
      
      textContent += pageText + '\n\n';
    }
    
    return textContent.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// Extract text from Word documents using mammoth.js
async function extractTextFromWord(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return result.value;
  } catch (error) {
    console.error('Error extracting text from Word document:', error);
    throw new Error('Failed to extract text from Word document');
  }
}

// Extract text from PowerPoint presentations
async function extractTextFromPowerPoint(file: File): Promise<string> {
  try {
    // For PowerPoint, we use browser's FileReader to first get the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Use PPTX.js to extract text
    const PptxGenJS = await import('pptxgenjs');
    
    // This is a basic implementation - for more complete text extraction
    // we would need a more specialized library for PPTX parsing
    // For now, we'll extract what we can
    const pptx = await PptxGenJS.default.fromBuffer(arrayBuffer);
    
    let textContent = '';
    
    // Extract text from each slide
    pptx.getSlides().forEach((slide: any) => {
      if (slide.text) {
        textContent += slide.text + '\n\n';
      }
    });
    
    if (!textContent) {
      throw new Error('Could not extract text from PowerPoint file');
    }
    
    return textContent.trim();
  } catch (error) {
    console.error('Error extracting text from PowerPoint:', error);
    throw new Error('Failed to extract text from PowerPoint presentation');
  }
}
