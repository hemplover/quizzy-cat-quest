
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { content, settings, provider } = await req.json();
    
    if (!content || !settings || !provider) {
      throw new Error('Missing required parameters: content, settings, or provider');
    }
    
    console.log(`Generating quiz with provider: ${provider}`);
    console.log(`Selected question types:`, settings.questionTypes);
    
    let result = null;
    
    switch (provider) {
      case 'openai':
        result = await generateOpenAIQuiz(content, settings);
        break;
      case 'gemini':
        result = await generateGeminiQuiz(content, settings);
        break;
      case 'claude':
      case 'mistral':
        return new Response(
          JSON.stringify({ error: `Integration with ${provider} is coming soon!` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown AI provider' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
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

// OpenAI quiz generation function
async function generateOpenAIQuiz(content: string, settings: QuizSettings) {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not set in environment variables');
  }
  
  const model = settings.model || 'gpt-4o-mini';
  
  // Prepare prompt
  const prompt = buildPrompt(content, settings);

  // Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful assistant that creates quizzes based on educational material.' 
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  console.log('OpenAI API response received');
  
  // Extract the content
  const generatedContent = data.choices[0].message.content;
  
  try {
    // Parse the response as JSON
    return JSON.parse(generatedContent);
  } catch (error) {
    console.error('Error parsing quiz JSON from OpenAI:', error);
    
    // Try to extract JSON from the text
    const jsonMatch = generatedContent.match(/```json\n([\s\S]*)\n```/) || 
                       generatedContent.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const extractedJson = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(extractedJson);
    }
    
    throw new Error('Failed to parse quiz from OpenAI response');
  }
}

// Gemini quiz generation function
async function generateGeminiQuiz(content: string, settings: QuizSettings) {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not set in environment variables');
  }
  
  // Prepare prompt for Gemini
  const prompt = buildPrompt(content, settings);

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
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
    throw new Error(`Gemini API Error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  console.log('Gemini API response received');
  
  // Extract the content
  const generatedContent = data.candidates[0].content.parts[0].text;
  
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
function buildPrompt(content: string, settings: QuizSettings): string {
  return `You are a university professor responsible for creating exams for students. Based only on the provided study material, generate a realistic university-level exam.

### Rules:
- Only use information from the provided document.
- Do not create generic or overly simplistic questions.
- Structure the quiz like a real university exam.
- Ensure a variety of question types as specified below.
- Adjust difficulty according to the selected level: ${settings.difficulty}
- The quiz must feel like an official test, not a casual practice exercise.
- Return ONLY valid JSON with no additional text.

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
