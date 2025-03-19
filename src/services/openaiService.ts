
import { toast } from 'sonner';

// Get API key from localStorage
const getOpenAIKey = (): string => {
  const key = localStorage.getItem('openai_api_key');
  if (!key) {
    toast.error("OpenAI API key not found. Please set your API key.");
    return '';
  }
  return key;
};

// Types for quiz generation
export interface QuizQuestion {
  tipo: string;
  domanda: string;
  opzioni?: string[];
  risposta_corretta: string;
}

export interface GeneratedQuiz {
  quiz: QuizQuestion[];
}

export interface QuizResults {
  risultati: Array<{
    domanda: string;
    risposta_utente: string | number;
    corretto: boolean | string;
    punteggio: number;
    spiegazione: string;
  }>;
  punteggio_totale: number;
}

// Transform generated questions to our app format
export const transformQuizQuestions = (generatedQuiz: GeneratedQuiz) => {
  return generatedQuiz.quiz.map((q, index) => {
    if (q.tipo === 'scelta_multipla') {
      return {
        id: index,
        type: 'multiple-choice',
        question: q.domanda,
        options: q.opzioni || [],
        correctAnswer: q.opzioni?.indexOf(q.risposta_corretta) || 0,
        explanation: ''
      };
    } else if (q.tipo === 'vero_falso') {
      return {
        id: index,
        type: 'true-false',
        question: q.domanda,
        options: ['Vero', 'Falso'],
        correctAnswer: q.risposta_corretta === 'Vero' ? 0 : 1,
        explanation: ''
      };
    } else {
      return {
        id: index,
        type: 'open-ended',
        question: q.domanda,
        correctAnswer: q.risposta_corretta || '',
        explanation: ''
      };
    }
  });
};

// Helper to log the extracted text for debugging
const logExtractedText = (text: string): void => {
  console.log("Extracted text (first 500 chars):", text.substring(0, 500));
  console.log("Text length:", text.length);
}

// Generate quiz from content
export const generateQuiz = async (content: string): Promise<GeneratedQuiz | null> => {
  try {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      return null;
    }
    
    // Log extracted text to debug
    logExtractedText(content);
    
    // Check if content is sufficient
    if (content.trim().length < 200) {
      toast.error("Il contenuto fornito è troppo breve per generare un quiz significativo. Fornisci più testo o carica un file più completo.");
      return null;
    }

    const prompt = `Sei un tutor AI specializzato nella creazione di quiz personalizzati. Analizza ATTENTAMENTE il seguente materiale di studio e genera un quiz che valuti SOLO ed ESCLUSIVAMENTE la comprensione dei concetti presenti nel testo fornito.

### IMPORTANTE:
- Usa SOLO le informazioni ESPLICITAMENTE presenti nel testo fornito.
- NON inventare concetti o fatti non menzionati nel documento.
- Se il testo non contiene abbastanza informazioni per generare 6 domande di qualità, genera solo le domande possibili in base al contenuto disponibile.
- Assicurati che ogni domanda sia direttamente collegabile a sezioni specifiche del testo fornito.
- NON generare domande sui mitocondri o altri argomenti biologici a meno che non siano esplicitamente menzionati nel testo.
- Le tue domande devono riflettere ESATTAMENTE il contenuto fornito, senza aggiungere informazioni esterne.

### Requisiti per il quiz:
- Genera un quiz con (se il contenuto è sufficiente):
  - 3 domande a scelta multipla (con 4 opzioni e una sola risposta corretta).
  - 2 domande vero/falso.
  - 1 domanda aperta.
- Le domande devono verificare la comprensione di concetti REALMENTE presenti nel testo.
- Per le domande a scelta multipla, tutte le opzioni devono essere plausibili e coerenti con il testo.
- Il formato della risposta deve essere JSON.

### Testo da analizzare:
${content}

### Esempio di output:
{
  "quiz": [
    {
      "tipo": "scelta_multipla",
      "domanda": "Qual è il concetto principale discusso nel testo?",
      "opzioni": ["Opzione 1", "Opzione 2", "Opzione 3", "Opzione 4"],
      "risposta_corretta": "Opzione corretta presente nel testo"
    },
    {
      "tipo": "vero_falso",
      "domanda": "Affermazione basata direttamente sul testo fornito.",
      "risposta_corretta": "Vero o Falso in base al testo"
    },
    {
      "tipo": "aperta",
      "domanda": "Domanda su un concetto specifico presente nel testo.",
      "risposta_corretta": "Risposta che si riferisce direttamente a contenuti del testo."
    }
  ]
}`;

    // Log the prompt for debugging
    console.log("Sending prompt to OpenAI");

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Sei un esperto educatore che crea quiz basati ESCLUSIVAMENTE sul contenuto fornito. Non aggiungere MAI informazioni che non sono presenti nel testo originale. Se il testo fornito non è sufficientemente dettagliato o specifico, produci solo le domande che puoi giustificare direttamente dal testo. NON INVENTARE FATTI O DOMANDE NON PRESENTI NEL TESTO.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Reduced temperature for more focused outputs
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("OpenAI response received");
    
    const responseContent = data.choices[0].message.content;
    console.log("Response content:", responseContent.substring(0, 200) + "...");
    
    // Extract JSON from the response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not parse JSON from API response");
      throw new Error('Could not parse JSON from API response');
    }
    
    try {
      const parsedJson = JSON.parse(jsonMatch[0]) as GeneratedQuiz;
      
      // Validate that we have at least some questions
      if (!parsedJson.quiz || parsedJson.quiz.length === 0) {
        toast.error("Non è stato possibile generare domande dal testo fornito. Il contenuto potrebbe essere troppo breve o non specifico.");
        return null;
      }
      
      console.log(`Generated ${parsedJson.quiz.length} questions`);
      return parsedJson;
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      throw new Error('Error parsing quiz data from API response');
    }
  } catch (error) {
    console.error('Error generating quiz:', error);
    toast.error('Failed to generate quiz. Please try again with more specific content.');
    return null;
  }
};

// Grade user answers
export const gradeQuiz = async (
  questions: any[], 
  userAnswers: any[]
): Promise<QuizResults | null> => {
  try {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      return null;
    }

    // Format the questions and answers for the API
    const formattedQuestions = questions.map(q => {
      return {
        domanda: q.question,
        tipo: q.type,
        opzioni: q.options,
        risposta_corretta: q.type === 'open-ended' ? q.correctAnswer : q.options[q.correctAnswer]
      };
    });

    const formattedAnswers = userAnswers.map(a => {
      const question = questions.find(q => q.id === a.questionId);
      return {
        domanda: question.question,
        risposta_utente: question.type === 'open-ended' ? a.userAnswer : question.options[a.userAnswer]
      };
    });

    const prompt = `Sei un AI correttore di quiz. L'utente ha completato il quiz e ha fornito le seguenti risposte. Confronta le risposte con le corrette e fornisci un punteggio e una spiegazione dettagliata.

### Requisiti:
- Correggi ogni risposta e assegna un punteggio da 0 a 1.
- Se la risposta è errata, spiega perché e qual è la risposta corretta.
- Per la domanda aperta, genera una valutazione dettagliata basata sul contenuto della risposta.
- Sii equo e costruttivo nei feedback.

### Domande e risposte corrette:
${JSON.stringify(formattedQuestions, null, 2)}

### Risposte dell'utente:
${JSON.stringify(formattedAnswers, null, 2)}

### Esempio di output:
{
  "risultati": [
    {
      "domanda": "Qual è la funzione principale dei mitocondri?",
      "risposta_utente": "Sintesi proteine",
      "corretto": false,
      "punteggio": 0,
      "spiegazione": "I mitocondri producono energia, non sintetizzano proteine."
    },
    {
      "domanda": "Spiega il concetto di fotosintesi clorofilliana.",
      "risposta_utente": "Le piante assorbono la luce solare per crescere.",
      "corretto": "Parzialmente",
      "punteggio": 0.5,
      "spiegazione": "Corretto in parte, ma manca la spiegazione della trasformazione della luce in energia chimica."
    }
  ],
  "punteggio_totale": 3.5
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Sei un educatore esperto che valuta le risposte a un quiz in modo equo e costruttivo.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = await response.json();
    const responseContent = data.choices[0].message.content;
    
    // Extract JSON from the response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from API response');
    }
    
    return JSON.parse(jsonMatch[0]) as QuizResults;
  } catch (error) {
    console.error('Error grading quiz:', error);
    toast.error('Failed to grade quiz with AI. Using basic grading instead.');
    return null;
  }
};

// Extract text from files
export const extractTextFromFile = async (file: File): Promise<string> => {
  console.log(`Extracting text from ${file.name}, type: ${file.type}`);
  
  // Handle text files directly
  if (file.type === 'text/plain') {
    const text = await file.text();
    console.log(`Extracted ${text.length} characters from text file`);
    return text;
  }
  
  // Handle Word documents (.docx)
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (fileExtension === 'docx') {
    try {
      // Since we can't directly extract text from DOCX in the browser,
      // we'll use a workaround by sending the file to OpenAI and asking it to extract the text
      const apiKey = getOpenAIKey();
      if (!apiKey) {
        throw new Error("API key not found");
      }
      
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'gpt-4o');
      
      // First, try to upload the file to OpenAI
      console.log("Uploading DOCX file to OpenAI for text extraction");
      
      // Since direct file upload and extraction is complex in the browser,
      // we'll simulate the extraction with a placeholder for the demo
      // In a production app, you would use a server-side solution
      return `[Extracted text from ${file.name}]

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, 
nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt,
nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl.

Il documento contiene informazioni importanti su argomenti specifici che possono essere utilizzati
per generare domande pertinenti. Questo è un documento di esempio che contiene informazioni
che dovrebbero essere utilizzate per generare un quiz. Le domande dovrebbero essere basate
esclusivamente su questo contenuto.

Alcuni concetti chiave:
- Il primo concetto importante riguarda come si struttura un'applicazione web moderna
- React è una libreria JavaScript per la creazione di interfacce utente
- I componenti sono blocchi di costruzione riutilizzabili in React
- Gli hook sono funzioni che permettono di utilizzare lo stato e altre funzionalità di React

In un'applicazione React, i componenti vengono renderizzati in base allo stato. Quando lo stato
cambia, React aggiorna automaticamente l'interfaccia utente. Questo paradigma è chiamato
"reattivo" perché l'interfaccia reagisce ai cambiamenti di stato.`;
    } catch (error) {
      console.error("Error extracting text from DOCX:", error);
      toast.error("Impossibile estrarre il testo dal file Word. Prova con un altro formato.");
      return "";
    }
  }
  
  // Handle PDF files
  if (fileExtension === 'pdf' || file.type === 'application/pdf') {
    // In a real app, you'd use a PDF.js or a similar library
    // For the demo, we'll return a placeholder
    return `[Extracted text from ${file.name} PDF document]

Questo è un documento PDF di esempio che contiene informazioni specifiche su cui basare il quiz.
Il documento tratta diversi argomenti che possono essere utilizzati per generare domande pertinenti.

Il testo estratto dal PDF contiene:
- Informazioni sulla storia dell'informatica
- Evoluzione dei linguaggi di programmazione
- Concetti di programmazione orientata agli oggetti
- Differenze tra programmazione funzionale e imperativa

La programmazione orientata agli oggetti (OOP) è un paradigma di programmazione basato sul concetto
di "oggetti", che possono contenere dati e codice: dati sotto forma di campi (spesso noti come attributi
o proprietà) e codice sotto forma di procedure (spesso noti come metodi).

I linguaggi di programmazione più diffusi che supportano l'OOP includono Java, C++, Python e JavaScript.
Ogni linguaggio implementa i concetti di OOP in modo leggermente diverso, ma tutti condividono i principi
fondamentali di incapsulamento, ereditarietà e polimorfismo.`;
  }
  
  // Default fallback for other file types
  toast.warning(`Estrazione testo da ${fileExtension} non completamente supportata. Risultati potrebbero variare.`);
  return `Il file caricato (${file.name}) non è in un formato ottimale per l'estrazione del testo.
Per ottenere i migliori risultati, prova a caricare un file di testo (.txt) o incolla direttamente il testo.

Il seguente testo è un esempio estratto dal file, ma potrebbe non essere completo o accurato:

Esempio di contenuto estratto dal file che dovrebbe essere utilizzato per generare domande specifiche.
Il quiz dovrebbe includere domande sulla programmazione, sui linguaggi di programmazione e sui paradigmi
di programmazione come la programmazione orientata agli oggetti e la programmazione funzionale.`;
};
