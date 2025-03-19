
import { toast } from 'sonner';
import { getApiKey } from './aiProviderService';
import { GeneratedQuiz, QuizResults, QuizSettings } from '@/types/quiz';

// Get API key from localStorage
const getGeminiKey = (): string => {
  return getApiKey('gemini');
};

// Generate quiz from content using Gemini API
export const generateQuizWithGemini = async (
  content: string | File,
  settings: QuizSettings
): Promise<GeneratedQuiz | null> => {
  try {
    const apiKey = getGeminiKey();
    if (!apiKey) {
      return null;
    }
    
    // If content is a File, we need to extract its text since Gemini doesn't support direct file upload yet
    let textContent: string;
    if (content instanceof File) {
      // For files, return a message that we'll use the file name in the prompt
      textContent = `Analysis of file: ${content.name}`;
      
      try {
        // Try to read the file as text if it's a text file
        if (content.type === 'text/plain') {
          textContent = await content.text();
        } else {
          // For non-text files, we'll rely on the API to handle them
          textContent = `Please analyze the content of this ${content.type} file named ${content.name}.`;
        }
      } catch (error) {
        console.error('Error reading file:', error);
        textContent = `File upload: ${content.name} (${content.type})`;
      }
    } else {
      textContent = content;
    }
    
    // Check if content is sufficient
    if (textContent.trim().length < 200 && !(content instanceof File)) {
      toast.error("Il contenuto fornito è troppo breve per generare un quiz significativo. Fornisci più testo o carica un file più completo.");
      return null;
    }

    const { difficulty, questionTypes, numQuestions } = settings;
    
    const prompt = `Sei un tutor AI specializzato nella creazione di quiz personalizzati. Analizza ATTENTAMENTE il seguente materiale di studio e genera un quiz che valuti SOLO ed ESCLUSIVAMENTE la comprensione dei concetti presenti nel testo fornito.

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

### Testo da analizzare:
${textContent}

### Formato risposta:
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

    console.log("Sending prompt to Gemini API");

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("Gemini response received");
    
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      const responseText = data.candidates[0].content.parts[0].text;
      console.log("Response content:", responseText.substring(0, 200) + "...");
      
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
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
      throw new Error('Invalid response from Gemini API');
    }
  } catch (error) {
    console.error('Error generating quiz with Gemini:', error);
    toast.error('Failed to generate quiz with Gemini. Please try again with more specific content.');
    return null;
  }
};

// Grade quiz using Gemini API
export const gradeQuizWithGemini = async (
  questions: any[], 
  userAnswers: any[]
): Promise<QuizResults | null> => {
  try {
    const apiKey = getGeminiKey();
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

### Formato risposta:
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

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from API response');
      }
      
      return JSON.parse(jsonMatch[0]) as QuizResults;
    } else {
      throw new Error('Invalid response from Gemini API');
    }
  } catch (error) {
    console.error('Error grading quiz with Gemini:', error);
    toast.error('Failed to grade quiz with Gemini. Using basic grading instead.');
    return null;
  }
};
