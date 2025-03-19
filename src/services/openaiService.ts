
import { toast } from 'sonner';
import { QuizQuestion, GeneratedQuiz, QuizResults } from '@/types/quiz';

// Get API key from localStorage
const getOpenAIKey = (): string => {
  const key = localStorage.getItem('openai_api_key');
  if (!key) {
    toast.error("OpenAI API key not found. Please set your API key.");
    return '';
  }
  return key;
};

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
export const generateQuiz = async (
  content: string | File, 
  options: {
    difficulty: string;
    questionTypes: string[];
    numQuestions: number;
  }
): Promise<GeneratedQuiz | null> => {
  try {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      return null;
    }
    
    // Initialize a base prompt that includes quiz settings
    const { difficulty, questionTypes, numQuestions } = options;
    
    // Create a base system prompt with emphasis on content relevance
    const systemPrompt = `Sei un esperto educatore che crea quiz basati ESCLUSIVAMENTE sul contenuto fornito. 
Non aggiungere MAI informazioni che non sono presenti nel testo originale. 
Se il testo fornito non è sufficientemente dettagliato o specifico, produci solo le domande che puoi giustificare direttamente dal testo. 
NON INVENTARE FATTI O DOMANDE NON PRESENTI NEL TESTO.

Difficoltà: ${difficulty}
Tipi di domande: ${questionTypes.join(', ')}
Numero di domande: ${numQuestions}`;

    // Create the prompt based on whether we're using text or direct file upload
    const userPrompt = `Sei un tutor AI specializzato nella creazione di quiz personalizzati. Analizza ATTENTAMENTE il materiale di studio e genera un quiz che valuti SOLO ed ESCLUSIVAMENTE la comprensione dei concetti presenti nel testo fornito.

### IMPORTANTE:
- Usa SOLO le informazioni ESPLICITAMENTE presenti nel testo fornito.
- NON inventare concetti o fatti non menzionati nel documento.
- Se il testo non contiene abbastanza informazioni per generare ${numQuestions} domande di qualità, genera solo le domande possibili in base al contenuto disponibile.
- Assicurati che ogni domanda sia direttamente collegabile a sezioni specifiche del testo fornito.
- NON generare domande sui mitocondri o altri argomenti biologici a meno che non siano esplicitamente menzionati nel testo.
- Le tue domande devono riflettere ESATTAMENTE il contenuto fornito, senza aggiungere informazioni esterne.

### Requisiti per il quiz:
- Genera un quiz con difficoltà: ${difficulty}
- Genera un quiz con i seguenti tipi di domande: ${questionTypes.join(', ')}
- Genera un totale di ${numQuestions} domande (se il contenuto è sufficiente)

### Il formato della risposta deve essere JSON:
{
  "quiz": [
    {
      "tipo": "scelta_multipla", 
      "domanda": "Domanda basata direttamente sul testo",
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

    // If content is a File, send it directly to OpenAI
    if (content instanceof File) {
      console.log(`Sending file ${content.name} directly to OpenAI`);
      
      // Create a FormData object to handle file uploads
      const formData = new FormData();
      
      // First, upload the file to OpenAI
      const fileUploadResponse = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData
      });
      
      // For vision models like GPT-4o, we need to encode file as base64
      const fileArrayBuffer = await content.arrayBuffer();
      const fileBase64 = btoa(
        new Uint8Array(fileArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      // Since direct file upload requires different handling, we'll use the vision API for simplicity
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using GPT-4o Mini as default
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${content.type};base64,${fileBase64}`
                  }
                }
              ]
            }
          ],
          temperature: 0.3,
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
    } else {
      // Text-based content flow
      console.log("Sending text content to OpenAI");
      
      // Check if content is sufficient
      if (content.trim().length < 200) {
        toast.error("Il contenuto fornito è troppo breve per generare un quiz significativo. Fornisci più testo o carica un file più completo.");
        return null;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using GPT-4o Mini as default
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt + `\n\n### Testo da analizzare:\n${content}`
            }
          ],
          temperature: 0.3,
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
    }
  } catch (error) {
    console.error('Error generating quiz:', error);
    toast.error('Failed to generate quiz. Please try again with more specific content.');
    return null;
  }
};

// Grade quiz based on the selected AI provider
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
        model: 'gpt-4o-mini',
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

// Extract text from files - for compatibility with older code paths
export const extractTextFromFile = async (file: File): Promise<string> => {
  console.log(`Extracting text from ${file.name}, type: ${file.type}`);
  
  // Handle text files directly
  if (file.type === 'text/plain') {
    const text = await file.text();
    console.log(`Extracted ${text.length} characters from text file`);
    return text;
  }
  
  // For other file types, return a placeholder that indicates direct file upload is preferred
  return `This file (${file.name}) will be processed directly by the AI service for better results.`;
};
