
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
    const { content, settings, previousQuestions } = await req.json();
    
    if (!content || !settings) {
      throw new Error('Missing required parameters: content or settings');
    }
    
    console.log('Generating quiz with Gemini');
    console.log(`Selected question types:`, settings.questionTypes);
    console.log(`Content length: ${content.length} characters`);
    console.log(`Previous quiz count: ${previousQuestions?.length || 0}`);
    
    // Always use backend Gemini API
    const result = await generateGeminiQuiz(content, settings, previousQuestions);
    
    // Validate that we got the right question types
    if (result && result.quiz && Array.isArray(result.quiz)) {
      console.log(`Generated ${result.quiz.length} questions with types: ${result.quiz.map(q => q.type).join(', ')}`);
      
      // Check if the requested number of questions was returned
      if (result.quiz.length !== settings.numQuestions) {
        console.warn(`Generated ${result.quiz.length} questions, but ${settings.numQuestions} were requested`);
        
        // If too many questions, trim the array
        if (result.quiz.length > settings.numQuestions) {
          result.quiz = result.quiz.slice(0, settings.numQuestions);
          console.log(`Trimmed quiz to ${result.quiz.length} questions`);
        }
      }
      
      // Verify all questions match the requested types
      if (settings.questionTypes && settings.questionTypes.length > 0) {
        const allowedTypes = new Set(settings.questionTypes.map(type => {
          // Convert from frontend format to backend format
          if (type === 'multiple-choice') return 'multiple_choice';
          if (type === 'true-false') return 'true_false';
          if (type === 'open-ended') return 'open_ended';
          return type;
        }));
        
        const allTypes = result.quiz.map(q => q.type);
        const invalidQuestions = result.quiz.filter(q => !allowedTypes.has(q.type));
        
        if (invalidQuestions.length > 0) {
          console.error(`Generated quiz contains ${invalidQuestions.length} questions with invalid types: ${invalidQuestions.map(q => q.type).join(', ')}`);
          
          // Force questions to be of the right type if possible
          if (settings.questionTypes.length === 1) {
            // If only one type is requested, convert all questions to that type
            const targetType = Array.from(allowedTypes)[0];
            result.quiz = result.quiz.map(q => {
              if (q.type !== targetType) {
                console.log(`Converting question from ${q.type} to ${targetType}`);
                return convertQuestionType(q, targetType);
              }
              return q;
            });
          } else {
            // Remove questions with invalid types
            result.quiz = result.quiz.filter(q => allowedTypes.has(q.type));
            console.log(`Filtered quiz to ${result.quiz.length} questions with valid types`);
          }
        }
      }
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

// Helper function to convert question types
function convertQuestionType(question, targetType) {
  const newQuestion = { ...question };
  newQuestion.type = targetType;
  
  if (targetType === 'multiple_choice' && !newQuestion.options) {
    // Convert to multiple choice
    newQuestion.options = ['Option A', 'Option B', 'Option C', 'Option D'];
    newQuestion.correct_answer = 0;
  } else if (targetType === 'true_false') {
    // Convert to true/false
    newQuestion.options = undefined;
    newQuestion.correct_answer = Math.random() < 0.5;
  } else if (targetType === 'open_ended') {
    // Convert to open-ended
    newQuestion.options = undefined;
    newQuestion.correct_answer = `The answer should address: ${question.question}`;
  }
  
  return newQuestion;
}

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
  if (content.trim().length < 100) {
    throw new Error('The provided content is too short. Please provide more detailed study material.');
  }
  
  // Handle large documents by trimming if they exceed Gemini's token limit
  // Gemini can handle roughly a maximum of 30,000 characters
  const MAX_CONTENT_LENGTH = 30000;
  let processedContent = content;
  
  if (content.length > MAX_CONTENT_LENGTH) {
    console.log(`Content too large (${content.length} chars), truncating to ${MAX_CONTENT_LENGTH} chars`);
    processedContent = content.substring(0, MAX_CONTENT_LENGTH);
    console.log(`Truncated content to ${processedContent.length} characters`);
  }
  
  // Prepare prompt for Gemini with STRONG emphasis on question types
  const prompt = buildPrompt(processedContent, settings, languagePrompt, previousQuestions);
  
  // Default to Gemini 2.0 Flash model for better performance
  const modelName = 'gemini-2.0-flash';
  
  console.log(`Using Gemini model: ${modelName}`);

  // Use the updated Google AI API URL for the Gemini 2.0 models
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  
  console.log(`Making request to Gemini API: ${apiUrl}`);
  
  try {
    // Set retry counter
    let retries = 0;
    const maxRetries = 2;
    let generatedContent = null;
    
    while (retries <= maxRetries) {
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
            temperature: 0.2,  // Lower temperature for more deterministic output
            maxOutputTokens: 2000
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
      let content;
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        // Format for newer Gemini versions
        content = data.candidates[0].content.parts[0].text;
      } else if (data.text) {
        // Simplified response format in some versions
        content = data.text;
      } else {
        console.error('Unexpected Gemini response format:', data);
        throw new Error('Unexpected response format from Gemini API');
      }
      
      console.log('Generated content length:', content.length);
      if (content.length < 50) {
        console.error('Generated content too short:', content);
        retries++;
        if (retries <= maxRetries) {
          console.log(`Retrying quiz generation (attempt ${retries} of ${maxRetries})...`);
          continue;
        } else {
          throw new Error('The AI generated content is too short. Please try with more detailed study material.');
        }
      }
      
      generatedContent = content;
      break;
    }
    
    if (!generatedContent) {
      throw new Error('Failed to generate quiz after multiple attempts');
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

// Build prompt for AI providers with STRONGER emphasis on question types
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
  
  // Get the specific question types for the prompt
  const questionTypesPart = settings.questionTypes.map(type => {
    if (type === 'multiple-choice') return 'multiple_choice';
    if (type === 'true-false') return 'true_false';
    if (type === 'open-ended') return 'open_ended';
    return type;
  });
  
  // Format the question type specific instructions
  let typeInstructions = '';
  if (questionTypesPart.includes('multiple_choice')) {
    typeInstructions += '- For multiple_choice questions: Include 4 options and indicate the correct one.\n';
  }
  if (questionTypesPart.includes('true_false')) {
    typeInstructions += '- For true_false questions: Provide a statement and indicate if it is true or false.\n';
  }
  if (questionTypesPart.includes('open_ended')) {
    typeInstructions += '- For open_ended questions: Ask a question that requires a short explanation as an answer.\n';
  }
  
  // Very explicit instructions about using ONLY the specified question types
  let questionTypesSpecificInstructions = '';
  if (settings.questionTypes.length === 1) {
    const singleType = questionTypesPart[0];
    questionTypesSpecificInstructions = `
### EXTREMELY IMPORTANT:
- This quiz must ONLY include questions of type "${singleType}".
- Do NOT create any questions of other types.
- You MUST generate exactly ${settings.numQuestions} questions of type "${singleType}".
`;
  } else {
    questionTypesSpecificInstructions = `
### EXTREMELY IMPORTANT:
- This quiz must ONLY include questions of the following types: ${questionTypesPart.join(', ')}.
- Do NOT create any questions of types not listed above.
- You MUST generate exactly ${settings.numQuestions} questions using ONLY the specified types.
- Try to include an approximately equal number of each question type.
`;
  }
  
  return `You are a university professor responsible for creating exams for students. Based only on the provided study material, generate a realistic university-level exam.

${questionTypesSpecificInstructions}

### Rules:
- Only use information from the provided document.
- Do not create generic or overly simplistic questions.
- Structure the quiz like a real university exam.
- Adjust difficulty according to the selected level: ${settings.difficulty}
- The quiz must feel like an official test, not a casual practice exercise.
- Return ONLY valid JSON with no additional text.
${languagePrompt ? `- ${languagePrompt}` : ''}
${settings.previousQuizzes && settings.previousQuizzes > 0 ? `- This is quiz number ${settings.previousQuizzes + 1} on this content. Make sure to create questions that explore different aspects than previous quizzes.` : ''}

${previousQuestionsPrompt}

### Question Types to Include:
${questionTypesPart.map(type => `- ${type}`).join('\n')}

${typeInstructions}

### Number of Questions (EXACTLY this many):
${settings.numQuestions}

### Study Material:
${content}

### Output Format (JSON):
{
  "quiz": [
    {
      "type": "${questionTypesPart[0]}",
      "question": "According to the study material, what is the main cause of X?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "B",
      "explanation": "Explanation of why B is correct"
    }
  ]
}`;
}
