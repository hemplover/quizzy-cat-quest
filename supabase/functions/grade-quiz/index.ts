
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { questions, userAnswers, provider } = requestBody;
    
    // Validate input parameters
    if (!questions || !Array.isArray(questions)) {
      console.error('Missing or invalid questions parameter:', questions);
      return new Response(
        JSON.stringify({ error: 'Missing or invalid questions parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!userAnswers || !Array.isArray(userAnswers)) {
      console.error('Missing or invalid userAnswers parameter:', userAnswers);
      return new Response(
        JSON.stringify({ error: 'Missing or invalid userAnswers parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!provider) {
      console.error('Missing provider parameter');
      return new Response(
        JSON.stringify({ error: 'Missing provider parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Grading quiz with provider: ${provider}`);
    console.log('Questions received:', JSON.stringify(questions).substring(0, 200) + '...');
    console.log('User answers received:', JSON.stringify(userAnswers).substring(0, 200) + '...');
    
    // Ensure userAnswers has the same length as questions
    if (userAnswers.length !== questions.length) {
      console.warn(`Answer count mismatch: ${userAnswers.length} answers for ${questions.length} questions`);
      
      // Pad with empty answers if needed
      while (userAnswers.length < questions.length) {
        userAnswers.push('');
      }
      
      // Truncate if too many answers
      if (userAnswers.length > questions.length) {
        userAnswers = userAnswers.slice(0, questions.length);
      }
    }
    
    let result = null;
    
    try {
      switch (provider) {
        case 'openai':
          result = await gradeWithOpenAI(questions, userAnswers);
          break;
        case 'gemini':
          // Always use backend key for Gemini
          result = await gradeWithGemini(questions, userAnswers);
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
    } catch (gradingError) {
      console.error(`Error grading with ${provider}:`, gradingError);
      return new Response(
        JSON.stringify({ error: `Error grading with ${provider}: ${gradingError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if we got a valid result
    if (!result) {
      console.error('No result returned from grading function');
      return new Response(
        JSON.stringify({ error: 'No result returned from grading function' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate the quiz results
    if (!result.risultati || !Array.isArray(result.risultati)) {
      console.error('Invalid quiz results format returned by AI:', JSON.stringify(result).substring(0, 200));
      
      // Create a fallback response if needed
      result = {
        risultati: questions.map((q, i) => ({
          domanda: q.question,
          risposta_utente: String(userAnswers[i]),
          corretto: false,
          punteggio: 0,
          spiegazione: 'Error: Could not evaluate this answer'
        })),
        punteggio_totale: 0,
        feedback_generale: 'There was an error grading your quiz. Please try again.'
      };
    }
    
    // Make sure we have the same number of results as questions
    if (result.risultati.length !== questions.length) {
      console.warn(`Result count mismatch: ${result.risultati.length} results for ${questions.length} questions`);
      
      // Pad or truncate results to match question count
      if (result.risultati.length < questions.length) {
        // Pad with dummy results if we have too few
        const padding = Array(questions.length - result.risultati.length).fill(0).map((_, i) => ({
          domanda: questions[result.risultati.length + i].question,
          risposta_utente: String(userAnswers[result.risultati.length + i]),
          corretto: false,
          punteggio: 0,
          spiegazione: 'Answer could not be evaluated'
        }));
        
        result.risultati = [...result.risultati, ...padding];
      } else {
        // Truncate if we have too many
        result.risultati = result.risultati.slice(0, questions.length);
      }
    }
    
    // Calculate total weighted score based on question types
    // Open-ended worth 5 points, others worth 1 point
    let totalPoints = 0;
    let maxPoints = 0;
    
    result.risultati.forEach((r, i) => {
      const questionType = questions[i].type;
      const pointValue = questionType === 'open-ended' ? 5 : 1;
      
      maxPoints += pointValue;
      
      // For open-ended questions, score can be 0-5
      // For other questions, score is 0 or 1
      if (questionType === 'open-ended') {
        // Ensure the score is properly formatted as a number between 0-5
        let score = 0;
        
        // If the AI returned a score between 0-1, multiply by 5 to get 0-5 range
        if (typeof r.punteggio === 'number' && r.punteggio <= 1) {
          score = Math.round(r.punteggio * 5);
        } 
        // If the AI returned a score already in 0-5 range, use it directly
        else if (typeof r.punteggio === 'number') {
          score = Math.min(5, Math.max(0, Math.round(r.punteggio)));
        }
        // If punteggio is not a number, default to 0
        else if (r.punteggio === undefined || r.punteggio === null || isNaN(Number(r.punteggio))) {
          score = 0;
        }
        // If it's a string that can be converted to a number
        else if (typeof r.punteggio === 'string') {
          const parsed = parseFloat(r.punteggio);
          if (!isNaN(parsed)) {
            score = Math.min(5, Math.max(0, Math.round(parsed)));
          }
        }
        
        r.punteggio = score;
        totalPoints += score;
        
        // Make sure corretto field is set appropriately based on score
        if (score === 5) {
          r.corretto = true;
        } else if (score === 0) {
          r.corretto = false;
        } else {
          r.corretto = "Parzialmente";
        }
      } else {
        // For multiple-choice and true-false, either 0 or 1
        // Ensure boolean for corretto field
        r.corretto = r.corretto === true || r.corretto === "true" || r.corretto === "Completamente";
        r.punteggio = r.corretto ? 1 : 0;
        totalPoints += r.punteggio;
      }
      
      // Log the scoring for debugging
      console.log(`Question ${i+1} (${questionType}): ${r.punteggio}/${pointValue} points`);
    });
    
    // Calculate weighted total score as a ratio (0-1)
    const weightedScore = maxPoints > 0 ? totalPoints / maxPoints : 0;
    result.punteggio_totale = weightedScore;
    result.max_points = maxPoints;
    result.total_points = totalPoints;
    
    console.log(`Total score: ${totalPoints}/${maxPoints} (${weightedScore.toFixed(2)})`);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in grade-quiz function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        stack: error.stack,
        info: 'There was an error processing your request. Please try again.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Grade quiz with OpenAI
async function gradeWithOpenAI(questions, userAnswers) {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not set in environment variables');
  }
  
  // Format questions and answers for grading
  const formattedQuestions = formatQuestionsForGrading(questions, userAnswers);
  
  const prompt = `You are a university professor grading an exam. 

DIFFERENT QUESTION TYPES HAVE DIFFERENT POINT VALUES:
- True/False questions: Worth 1 point maximum (0 = incorrect, 1 = correct)
- Multiple-choice questions: Worth 1 point maximum (0 = incorrect, 1 = correct)
- Open-ended questions: Worth 5 points maximum (grade on a scale from 0-5 where 5 is perfect)

For open-ended questions, you MUST:
1. Grade on a scale from 0 to 5 points (use integers only: 0, 1, 2, 3, 4, or 5)
2. Provide detailed feedback explaining why you assigned that score
3. Be fair but rigorous - a score of 5/5 should only be for truly excellent, comprehensive answers
4. Always include what the correct answer should have included

Return your grading as JSON with the following format:
{
  "risultati": [
    {"domanda": "Question text", "risposta_utente": "User's answer", "corretto": true/false or "Parzialmente", "punteggio": score (based on question type), "spiegazione": "Detailed explanation of the score, including what the correct answer should be"}, 
    ...
  ],
  "punteggio_totale": total_score (0 to 1),
  "feedback_generale": "General feedback on overall performance"
}

Here are the questions and answers to grade:

${formattedQuestions}`;

  try {
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant that grades quizzes and provides feedback.' 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('OpenAI grading response received');
    
    // Extract the content
    const generatedContent = data.choices[0].message.content;
    
    try {
      // Parse the response as JSON
      return JSON.parse(generatedContent);
    } catch (error) {
      console.error('Error parsing grading JSON from OpenAI:', error);
      console.log('Raw content from OpenAI:', generatedContent.substring(0, 500));
      
      // Try to extract JSON from the text
      const jsonMatch = generatedContent.match(/```json\n([\s\S]*)\n```/) || 
                       generatedContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const extractedJson = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(extractedJson);
      }
      
      throw new Error('Failed to parse grading response from OpenAI');
    }
  } catch (error) {
    console.error('OpenAI grading error:', error);
    throw error;
  }
}

// Grade quiz with Gemini
async function gradeWithGemini(questions, userAnswers) {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not set in environment variables');
  }
  
  console.log('Using Gemini API key from Supabase secrets for grading');
  
  // Format questions and answers for grading
  const formattedQuestions = formatQuestionsForGrading(questions, userAnswers);
  
  const prompt = `You are a university professor grading an exam. 

DIFFERENT QUESTION TYPES HAVE DIFFERENT POINT VALUES:
- True/False questions: Worth 1 point maximum (0 = incorrect, 1 = correct)
- Multiple-choice questions: Worth 1 point maximum (0 = incorrect, 1 = correct)
- Open-ended questions: Worth 5 points maximum (grade on a scale from 0-5 where 5 is perfect)

For open-ended questions, you MUST:
1. Grade on a scale from 0 to 5 points (use integers only: 0, 1, 2, 3, 4, or 5)
2. Provide detailed feedback explaining why you assigned that score
3. Be fair but rigorous - a score of 5/5 should only be for truly excellent, comprehensive answers
4. Always include what the correct answer should have included

Return your grading as JSON with the following format:
{
  "risultati": [
    {"domanda": "Question text", "risposta_utente": "User's answer", "corretto": true/false or "Parzialmente", "punteggio": score (based on question type), "spiegazione": "Detailed explanation of the score, including what the correct answer should be"}, 
    ...
  ],
  "punteggio_totale": total_score (0 to 1),
  "feedback_generale": "General feedback on overall performance"
}

Here are the questions and answers to grade:

${formattedQuestions}`;

  try {
    // Use the updated Gemini 2.0 Flash model by default
    const modelName = 'gemini-2.0-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

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
          temperature: 0,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error details:', errorData);
      throw new Error(`Gemini API Error: ${errorData.error?.message || JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Gemini grading response received');
    
    // Extract the content - handle different response formats
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
    
    try {
      // Parse the response as JSON
      return JSON.parse(generatedContent);
    } catch (error) {
      console.error('Error parsing grading JSON from Gemini:', error);
      console.log('Raw content from Gemini:', generatedContent.substring(0, 500));
      
      // Try to extract JSON from the text
      const jsonMatch = generatedContent.match(/```json\n([\s\S]*)\n```/) || 
                       generatedContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const extractedJson = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(extractedJson);
      }
      
      throw new Error('Failed to parse grading response from Gemini');
    }
  } catch (error) {
    console.error('Gemini grading error:', error);
    throw error;
  }
}

// Helper to format questions for grading
function formatQuestionsForGrading(questions, userAnswers) {
  return questions.map((q, i) => {
    let questionText = `Question ${i + 1}: ${q.question}`;
    
    // Add question type 
    questionText += `\nQuestion Type: ${q.type}`;
    questionText += q.type === 'open-ended' ? ' (worth 5 points)' : ' (worth 1 point)';
    
    if (q.type === 'multiple-choice') {
      questionText += `\nOptions: ${q.options.join(', ')}`;
      questionText += `\nCorrect answer: ${q.options[q.correctAnswer]}`;
      questionText += `\nUser's answer: ${q.options[userAnswers[i]]}`;
    } else if (q.type === 'true-false') {
      questionText += `\nCorrect answer: ${q.correctAnswer === 0 ? 'True' : 'False'}`;
      questionText += `\nUser's answer: ${userAnswers[i] === 0 ? 'True' : 'False'}`;
    } else {
      questionText += `\nExpected answer: ${q.correctAnswer}`;
      questionText += `\nUser's answer: ${userAnswers[i]}`;
    }
    
    return questionText;
  }).join('\n\n');
}
