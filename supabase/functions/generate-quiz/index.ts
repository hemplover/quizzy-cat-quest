
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
  previousQuizzes?: number; // New parameter to track previous quizzes
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
      console.log('Request body:', JSON.stringify(body).substring(0, 200) + '...');
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
    
    // Log important information for debugging
    console.log('Generating quiz with Gemini');
    console.log(`Selected question types:`, settings.questionTypes);
    console.log(`Content length: ${content.length} characters`);
    console.log(`Previous quiz count: ${previousQuestions?.length || 0}`);
    
    // Always use backend Gemini API
    const result = await generateGeminiQuiz(content, settings, previousQuestions);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    // Provide detailed error information
    console.error('Error in generate-quiz function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        details: errorStack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Gemini quiz generation function
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
          temperature: 0.3, // Slightly higher temperature for more variety in questions
          maxOutputTokens: 2000  // Increased token limit for better quiz generation
        }
      })
    });

    // Check HTTP status and handle errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP error ${response.status}: ${response.statusText}`;
      console.error('Gemini API Error:', errorData);
      console.error('Response status:', response.status);
      console.error('Response text:', await response.text().catch(() => 'Unable to get response text'));
      throw new Error(`Gemini API Error: ${errorMessage}`);
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
      throw new Error('Unexpected response format from Gemini API');
    }
    
    console.log('Generated content length:', generatedContent.length);
    if (generatedContent.length < 50) {
      console.error('Generated content too short:', generatedContent);
      throw new Error('The AI generated content is too short. Please try with more detailed study material.');
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
          throw new Error('Failed to parse quiz from Gemini response. The AI response was not in valid JSON format.');
        }
      }
      
      throw new Error('Failed to parse quiz from Gemini response. Please try again with more detailed content.');
    }
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    throw error;
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
  
  return `You are a university professor responsible for creating exams for students. Based only on the provided study material, generate a realistic university-level exam.

### Rules:
- Only use information from the provided document.
- Do not create generic or overly simplistic questions.
- Structure the quiz like a real university exam.
- Ensure a variety of question types as specified below.
- Adjust difficulty according to the selected level: ${settings.difficulty}
- The quiz must feel like an official test, not a casual practice exercise.
- Return ONLY valid JSON with no additional text.
${languagePrompt ? `- ${languagePrompt}` : ''}
${settings.previousQuizzes && settings.previousQuizzes > 0 ? `- This is quiz number ${settings.previousQuizzes + 1} on this content. Make sure to create questions that explore different aspects than previous quizzes.` : ''}

${previousQuestionsPrompt}

### Question Types to Include:
${settings.questionTypes.map(type => `- ${type}`).join('\n')}

### Number of Questions:
${settings.numQuestions}

### Study Material:
${content}

### Output Format (JSON):
{
  "quiz": [
    {
      "type": "multiple_choice",
      "question": "According to the study material, what is the main cause of X?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "B",
      "explanation": "Explanation of why B is correct"
    },
    {
      "type": "true_false",
      "question": "Statement based on the document content.",
      "correct_answer": "True",
      "explanation": "Explanation of why this is true"
    },
    {
      "type": "open_ended",
      "question": "Explain concept Y in detail.",
      "correct_answer": "Expected answer format or key points",
      "explanation": "Detailed explanation"
    }
  ]
}`;
}
