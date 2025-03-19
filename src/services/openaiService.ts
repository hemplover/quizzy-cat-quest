
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

// Generate quiz from content
export const generateQuiz = async (content: string): Promise<GeneratedQuiz | null> => {
  try {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      return null;
    }
    
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
      "domanda": "Qual è la funzione principale dei mitocondri?",
      "opzioni": ["Sintesi proteine", "Produzione energia", "Memorizzazione dati", "Digestione cellulare"],
      "risposta_corretta": "Produzione energia"
    },
    {
      "tipo": "vero_falso",
      "domanda": "L'acqua bolle a 90°C al livello del mare.",
      "risposta_corretta": "Falso"
    },
    {
      "tipo": "aperta",
      "domanda": "Spiega il concetto di fotosintesi clorofilliana.",
      "risposta_corretta": "È il processo attraverso cui le piante convertono la luce solare in energia chimica, utilizzando acqua e anidride carbonica per produrre glucosio e ossigeno."
    }
  ]
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
            content: 'Sei un esperto educatore che crea quiz basati ESCLUSIVAMENTE sul contenuto fornito. Non aggiungere mai informazioni che non sono presenti nel testo originale.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5, // Reduced temperature for more focused outputs
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
    
    return JSON.parse(jsonMatch[0]) as GeneratedQuiz;
  } catch (error) {
    console.error('Error generating quiz:', error);
    toast.error('Failed to generate quiz. Using sample questions instead.');
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
  // In a production app, you'd handle this server-side
  // This is a simplified version for the demo
  
  if (file.type === 'text/plain') {
    return await file.text();
  }
  
  // For non-text files, we'd normally need server processing
  // For demo purposes, we'll return a message
  return `[This is a placeholder for extracted text from ${file.name}. 
In a production application, we would use server-side processing to extract text from PDFs, DOCX files, etc.]

Sample content for demo purposes:
The mitochondrion (plural mitochondria) is a double-membrane-bound organelle found in most eukaryotic organisms. Mitochondria generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.

The word "mitochondrion" comes from the Greek μίτος, mitos, "thread", and χονδρίον, chondrion, "granule" or "grain-like". Mitochondria are commonly between 0.75 and 3 μm in diameter but vary considerably in size and structure. Unless specifically stained, they are not visible. Mitochondrial biogenesis is in turn temporally coordinated with these cellular processes.`;
};

