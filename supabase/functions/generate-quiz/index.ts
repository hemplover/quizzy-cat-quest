import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface QuizSettings {
  difficulty: string;
  questionTypes: string[];
  numQuestions: number;
  model?: string;
  previousQuizzes?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request body and structure
    let body;
    try {
      body = await req.json();
      console.log('Request body received:', JSON.stringify(body).substring(0, 200) + '...');
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: error.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { content, settings, previousQuestions } = body;
    
    // Validate required parameters with detailed error responses
    if (!content) {
      console.error('Missing required parameter: content');
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!settings) {
      console.error('Missing required parameter: settings');
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: settings' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (typeof content !== 'string') {
      console.error('Invalid content type, expected string but got:', typeof content);
      return new Response(
        JSON.stringify({ error: 'Invalid content type, expected string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Sanitize the content - remove any problematic characters
    const sanitizedContent = content.replace(/\u0000/g, '').trim();
    
    if (sanitizedContent.length < 50) {
      console.error('Content too short:', sanitizedContent.length, 'characters');
      return new Response(
        JSON.stringify({ error: 'Content too short to generate a quiz' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log important information for debugging
    console.log('Generating quiz with Gemini');
    console.log(`Selected question types:`, settings.questionTypes);
    console.log(`Content length: ${sanitizedContent.length} characters`);
    console.log(`Previous quiz count: ${previousQuestions?.length || 0}`);
    
    // Always use backend Gemini API
    const result = await generateGeminiQuiz(sanitizedContent, settings, previousQuestions);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    // Provide detailed error information and fallback response
    console.error('Error in generate-quiz function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    // Return a fallback response with simple quiz structure instead of failing completely
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        quiz: [
          {
            type: "multiple_choice",
            question: "Could not generate quiz due to an error. Please try again.",
            options: ["Try again", "Use different content", "Contact support"],
            correct_answer: "Try again",
            explanation: "There was an error with the quiz generation. Please try again with clearer content."
          }
        ]
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Gemini quiz generation function with improved error handling and fallbacks
async function generateGeminiQuiz(content: string, settings: QuizSettings, previousQuestions?: any[]) {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured in Supabase secrets. Please add GEMINI_API_KEY to your Supabase secrets.');
  }
  
  console.log('Using Gemini API key from Supabase secrets');
  
  // Detect language and preserve it
  const languagePrompt = "Please detect the language of the content and create the quiz in that same language. Preserve all terminology and concepts in their original language.";
  
  // Ensure sufficient content for quiz generation
  if (!content || typeof content !== 'string') {
    throw new Error('Invalid content format. Expected a non-empty string.');
  }
  
  if (content.trim().length < 100) {
    throw new Error('The provided content is too short. Please provide more detailed study material.');
  }
  
  // Handle large documents by trimming if they exceed Gemini's token limit
  // Gemini can handle roughly 30,000 characters safely
  const MAX_CONTENT_LENGTH = 30000;
  let processedContent = content;
  
  if (content.length > MAX_CONTENT_LENGTH) {
    console.log(`Content too large (${content.length} chars), truncating to ${MAX_CONTENT_LENGTH} chars`);
    processedContent = content.substring(0, MAX_CONTENT_LENGTH);
    console.log(`Truncated content to ${processedContent.length} characters`);
  }
  
  // Prepare prompt for Gemini
  const prompt = buildPrompt(processedContent, settings, languagePrompt, previousQuestions);
  
  // Default to Gemini 2.0 Flash model for better performance
  const modelName = 'gemini-2.0-flash';
  
  console.log(`Using Gemini model: ${modelName}`);

  // Use the updated Google AI API URL for the Gemini 2.0 models
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  
  console.log(`Making request to Gemini API: ${apiUrl}`);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.6, // Aumentata leggermente per più varietà
          maxOutputTokens: 2000  // Increased token limit for better quiz generation
        }
      })
    });

    // Check HTTP status and handle errors
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: { message: `HTTP error ${response.status}` } };
      }
      
      const errorMessage = errorData.error?.message || `HTTP error ${response.status}: ${response.statusText}`;
      console.error('Gemini API Error:', errorData);
      console.error('Response status:', response.status);
      
      let responseText;
      try {
        responseText = await response.text();
        console.error('Response text:', responseText);
      } catch (e) {
        console.error('Unable to get response text');
      }
      
      // Return a fallback quiz structure instead of failing completely
      return {
        quiz: [
          {
            type: "multiple_choice",
            question: "Could not connect to AI service. Please try again later.",
            options: ["Try again", "Use different content", "Contact support"],
            correct_answer: "Try again",
            explanation: "There was an error connecting to the AI service. Please try again later."
          }
        ],
        error: errorMessage
      };
    }

    const data = await response.json();
    console.log('Gemini API response received');
    console.log('Response status:', response.status);
    
    // Extract the content - handle different response formats for different Gemini versions
    let generatedContent;
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      // Format for newer Gemini versions
      generatedContent = data.candidates[0].content.parts[0].text;
    } else if (data.text) {
      // Simplified response format in some versions
      generatedContent = data.text;
    } else {
      console.error('Unexpected Gemini response format:', JSON.stringify(data).substring(0, 500));
      
      // Return a fallback quiz structure instead of failing
      return {
        quiz: [
          {
            type: "multiple_choice",
            question: "Unexpected response format from AI service.",
            options: ["Try again", "Use different content", "Contact support"],
            correct_answer: "Try again",
            explanation: "There was an issue with the AI service response. Please try again later."
          }
        ]
      };
    }
    
    console.log('Generated content length:', generatedContent.length);
    if (generatedContent.length < 50) {
      console.error('Generated content too short:', generatedContent);
      
      // Return a fallback quiz structure instead of failing
      return {
        quiz: [
          {
            type: "multiple_choice",
            question: "AI generated content was too short.",
            options: ["Try again", "Use different content", "Contact support"],
            correct_answer: "Use different content",
            explanation: "The AI couldn't generate enough content based on your input. Try providing more detailed study material."
          }
        ]
      };
    }
    
    try {
      // Parse the response as JSON
      return JSON.parse(generatedContent);
    } catch (error) {
      console.error('Error parsing quiz JSON from Gemini:', error);
      
      // Try to extract JSON from the text
      const jsonMatch = generatedContent.match(/```json\n([\s\S]*)\n```/) || 
                       generatedContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const extractedJson = jsonMatch[1] || jsonMatch[0];
        console.log('Extracted JSON content:', extractedJson.substring(0, 100) + '...');
        try {
          return JSON.parse(extractedJson);
        } catch (jsonError) {
          console.error('Failed to parse extracted JSON:', jsonError);
          // Return a fallback quiz structure instead of failing
          return {
            quiz: [
              {
                type: "multiple_choice",
                question: "Could not parse AI response.",
                options: ["Try again", "Use different content", "Contact support"],
                correct_answer: "Try again",
                explanation: "There was an error parsing the AI response. Please try again with clearer content."
              }
            ]
          };
        }
      }
      
      // Return a fallback quiz structure instead of failing
      return {
        quiz: [
          {
            type: "multiple_choice",
            question: "Could not parse AI response to generate quiz.",
            options: ["Try again", "Use different content", "Contact support"],
            correct_answer: "Try again",
            explanation: "There was an error parsing the AI response. Please try again with clearer content."
          }
        ]
      };
    }
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    
    // Return a fallback response instead of failing completely
    return {
      quiz: [
        {
          type: "multiple_choice",
          question: "Could not generate quiz due to an API error. Please try again.",
          options: ["Try again", "Use different content", "Check your connection"],
          correct_answer: "Try again",
          explanation: "There was an error with the AI service. Please try again later."
        }
      ],
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Build prompt for AI providers
function buildPrompt(content: string, settings: QuizSettings, languagePrompt: string = "", previousQuestions?: any[]): string {
  // Add instructions to avoid repeating questions if previousQuestions exist
  let previousQuestionsPrompt = "";
  if (previousQuestions && previousQuestions.length > 0) {
    previousQuestionsPrompt = `
### Important:
- Below is a list of previously asked questions for this content. DO NOT repeat these exact questions.
- Create entirely new questions that cover different aspects or ask about the same concepts differently.
- Ensure the new questions have NO OVERLAP with the previous ones in both content and wording.

### Previous Questions:
${previousQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}

`;
  }
  
  // Avvertimento sui metadati PDF in italiano
  const pdfMetadataWarning = `
### ATTENZIONE - METADATI TECNICI:
Se nel testo trovi riferimenti a '/ProcSet', '/PDF', '/Text', '/ImageB', '/MediaBox', '/Resources', '/XObject', '/Font', 'interpolation', 'obj', 'endobj' o termini simili, questi sono metadati tecnici del file PDF e NON sono parte del materiale di studio. Ignora completamente questi termini durante la creazione delle domande.
`;
  
  return `Sei un professore universitario che sta creando esami per gli studenti. Crea un esame basandoti SOLO sul materiale di studio fornito.
${pdfMetadataWarning}

### Regole:
- Utilizza SOLO informazioni dal documento fornito.
- **IMPORTANTE: Seleziona argomenti e dettagli in modo casuale da QUALSIASI PARTE del materiale di studio. NON seguire l'ordine sequenziale del documento.**
- NON creare domande generiche o troppo semplici.
- Struttura il quiz come un vero esame universitario.
- Assicurati di utilizzare le tipologie di domanda specificate di seguito.
- **IMPORTANTE: Ogni volta che generi un quiz per questo materiale, crea domande VERAMENTE NUOVE. Cambia gli argomenti principali trattati, il livello di dettaglio richiesto e la formulazione. Non limitarti a riformulare domande precedenti o a chiedere dello stesso concetto specifico.**
- Regola la difficoltà in base al livello selezionato: ${settings.difficulty}
- Il quiz deve sembrare un test ufficiale, non un esercizio casuale.
- IMPORTANTE: Restituisci SOLO JSON valido senza testo aggiuntivo.
- IMPORTANTE: Rileva la lingua del contenuto e crea il quiz nella stessa lingua. Se il documento è in italiano, crea domande in italiano, se è in inglese, crea domande in inglese.
${settings.previousQuizzes && settings.previousQuizzes > 0 ? `- Questo è il quiz numero ${settings.previousQuizzes + 1} su questo contenuto. Assicurati di creare domande che esplorino aspetti diversi rispetto ai quiz precedenti.` : ''}

${previousQuestionsPrompt}

### Tipologie di domande da includere:
${settings.questionTypes.map(type => {
  if (type === 'multiple-choice') return '- scelta_multipla';
  if (type === 'true-false') return '- vero_falso';
  if (type === 'open-ended') return '- risposta_aperta';
  return `- ${type}`;
}).join('\n')}

### Numero di domande:
${settings.numQuestions}

### Materiale di studio:
${content}

### Formato di output (JSON):
{
  "quiz": [
    {
      "tipo": "scelta_multipla",
      "domanda": "Secondo il materiale di studio, qual è la causa principale di X?",
      "opzioni": ["A", "B", "C", "D"],
      "risposta_corretta": "B",
      "spiegazione": "Spiegazione del perché B è corretto"
    },
    {
      "tipo": "vero_falso",
      "domanda": "Affermazione basata sul contenuto del documento.",
      "risposta_corretta": "Vero",
      "spiegazione": "Spiegazione del perché è vero"
    },
    {
      "tipo": "risposta_aperta",
      "domanda": "Spiega il concetto Y in dettaglio.",
      "risposta_corretta": "Formato di risposta previsto o punti chiave",
      "spiegazione": "Spiegazione dettagliata"
    }
  ]
}`;
}
