
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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, settings } = await req.json();
    
    if (!content || !settings) {
      throw new Error('Missing required parameters: content or settings');
    }
    
    console.log('Generating quiz with Gemini');
    console.log(`Selected question types:`, settings.questionTypes);
    
    // Always use backend Gemini API
    const result = await generateGeminiQuiz(content, settings);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in generate-quiz function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Gemini quiz generation function
async function generateGeminiQuiz(content: string, settings: QuizSettings) {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured in Supabase secrets. Please add GEMINI_API_KEY to your Supabase secrets.');
  }
  
  console.log('Using Gemini API key from Supabase secrets');
  
  // Detect language and preserve it
  const languagePrompt = "Please detect the language of the content and create the quiz in that same language. Preserve all terminology and concepts in their original language.";
  
  // Prepare prompt for Gemini
  const prompt = buildPrompt(content, settings, languagePrompt);
  
  // Default to Gemini 2.0 Flash model
  const modelName = 'gemini-2.0-flash';
  
  console.log(`Using Gemini model: ${modelName}`);

  // Use the updated Google AI API URL for the Gemini 2.0 models
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  
  console.log(`Making request to Gemini API: ${apiUrl}`);
  
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
        temperature: 0.2,
        maxOutputTokens: 1200
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.error?.message || 'Unknown error';
    console.error('Gemini API Error:', errorData);
    throw new Error(`Gemini API Error: ${errorMessage}`);
  }

  const data = await response.json();
  console.log('Gemini API response received');
  
  // Extract the content - handle different response formats for different Gemini versions
  let generatedContent;
  
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    // Format for newer Gemini versions
    generatedContent = data.candidates[0].content.parts[0].text;
  } else if (data.text) {
    // Simplified response format in some versions
    generatedContent = data.text;
  } else {
    console.error('Unexpected Gemini response format:', data);
    throw new Error('Unexpected response format from Gemini API');
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
      return JSON.parse(extractedJson);
    }
    
    throw new Error('Failed to parse quiz from Gemini response');
  }
}

// Build prompt for AI providers
function buildPrompt(content: string, settings: QuizSettings, languagePrompt: string = ""): string {
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
