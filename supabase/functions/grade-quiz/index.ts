
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
    
    // Validate input parameters with better error handling
    if (!questions) {
      console.error('Missing questions parameter');
      return new Response(
        JSON.stringify({ error: 'Missing questions parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!Array.isArray(questions)) {
      console.error('Invalid questions parameter, not an array:', typeof questions);
      return new Response(
        JSON.stringify({ error: 'Invalid questions parameter, must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!userAnswers) {
      console.error('Missing userAnswers parameter');
      return new Response(
        JSON.stringify({ error: 'Missing userAnswers parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!Array.isArray(userAnswers)) {
      console.error('Invalid userAnswers parameter, not an array:', typeof userAnswers);
      return new Response(
        JSON.stringify({ error: 'Invalid userAnswers parameter, must be an array' }),
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
    console.log('Questions count:', questions.length);
    console.log('User answers count:', userAnswers.length);
    console.log('First question sample:', JSON.stringify(questions[0]).substring(0, 200));
    console.log('First answer sample:', JSON.stringify(userAnswers[0]).substring(0, 200));
    
    // Ensure userAnswers has the same length as questions
    let processedUserAnswers = [...userAnswers];
    if (processedUserAnswers.length !== questions.length) {
      console.warn(`Answer count mismatch: ${processedUserAnswers.length} answers for ${questions.length} questions`);
      
      // Pad with empty answers if needed
      while (processedUserAnswers.length < questions.length) {
        processedUserAnswers.push('');
      }
      
      // Truncate if too many answers
      if (processedUserAnswers.length > questions.length) {
        processedUserAnswers = processedUserAnswers.slice(0, questions.length);
      }
    }
    
    // Check for null or undefined values in answers and convert them to empty strings
    processedUserAnswers = processedUserAnswers.map(answer => 
      answer === null || answer === undefined ? '' : answer
    );
    
    let result = null;
    
    try {
      switch (provider) {
        case 'openai':
          result = await gradeWithOpenAI(questions, processedUserAnswers);
          break;
        case 'gemini':
          // Always use backend key for Gemini
          result = await gradeWithGemini(questions, processedUserAnswers);
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
      
      // Create a fallback response for grading failures
      result = {
        risultati: questions.map((q, i) => ({
          domanda: q.question || 'Unknown question',
          risposta_utente: String(processedUserAnswers[i] || ''),
          corretto: false,
          punteggio: 0,
          spiegazione: `Error grading this answer: ${gradingError.message || 'Unknown error'}`
        })),
        punteggio_totale: 0,
        total_points: 0,
        max_points: questions.length,
        feedback_generale: 'There was an error grading your quiz. Some questions may not have been properly evaluated.'
      };
      
      console.log('Using fallback grading result due to error');
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
      console.error('Invalid quiz results format returned by AI:', result);
      
      // Create a fallback response if needed
      result = {
        risultati: questions.map((q, i) => ({
          domanda: q.question || 'Unknown question',
          risposta_utente: String(processedUserAnswers[i] || ''),
          corretto: false,
          punteggio: 0,
          spiegazione: 'Error: Could not evaluate this answer'
        })),
        punteggio_totale: 0,
        total_points: 0,
        max_points: questions.length,
        feedback_generale: 'There was an error grading your quiz. Please try again.'
      };
      
      console.log('Using fallback grading result due to invalid format');
    }
    
    // Make sure we have the same number of results as questions
    if (result.risultati.length !== questions.length) {
      console.warn(`Result count mismatch: ${result.risultati.length} results for ${questions.length} questions`);
      
      // Pad or truncate results to match question count
      if (result.risultati.length < questions.length) {
        // Pad with dummy results if we have too few
        const padding = Array(questions.length - result.risultati.length).fill(0).map((_, i) => ({
          domanda: questions[result.risultati.length + i].question || 'Unknown question',
          risposta_utente: String(processedUserAnswers[result.risultati.length + i] || ''),
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
      const questionType = questions[i]?.type || 'multiple-choice';
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
  
  // Create a simpler, more direct prompt focused on JSON output
  const prompt = `You are a professor grading an exam with different question types. Grade each question and return ONLY valid JSON with no preamble or explanations outside the JSON.

Question Types and Points:
- True/False: 1 point (0=incorrect, 1=correct)
- Multiple-choice: 1 point (0=incorrect, 1=correct)
- Open-ended: 5 points (grade 0-5, where 5 is perfect)

For open-ended questions:
1. Grade on scale 0-5
2. Provide detailed feedback
3. Be fair but rigorous

ONLY RETURN THIS JSON STRUCTURE, NOTHING ELSE:
{
  "risultati": [
    {
      "domanda": "Question text",
      "risposta_utente": "User answer",
      "corretto": true/false/"Parzialmente",
      "punteggio": number,
      "spiegazione": "Explanation"
    }
    // Additional results...
  ],
  "punteggio_totale": number,
  "feedback_generale": "Overall feedback"
}

Questions to grade:
${formattedQuestions}`;

  try {
    // Use the updated Gemini 2.0 Flash model
    const modelName = 'gemini-1.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    console.log(`Making request to Gemini API with model: ${modelName}`);
    
    // First attempt with strict parameters to get clean JSON
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
          maxOutputTokens: 2048,
          topP: 0.1,
          topK: 1,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error - Status:', response.status);
      console.error('Error Response:', errorText);
      throw new Error(`Gemini API Error: Status ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini grading response received');
    
    // Extract the content from Gemini response
    let generatedContent;
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      generatedContent = data.candidates[0].content.parts[0].text;
    } else if (data.text) {
      generatedContent = data.text;
    } else {
      console.error('Unexpected Gemini response format:', JSON.stringify(data).substring(0, 200));
      throw new Error('Unexpected response format from Gemini API');
    }
    
    // Clean up the response text and remove any non-JSON content
    let cleanedContent = generatedContent.trim();
    
    // Remove markdown code blocks if present
    cleanedContent = cleanedContent.replace(/```json\s*|\s*```/g, '');
    
    // Handle case where response might have text before or after JSON
    // Find JSON by looking for opening and closing braces
    const jsonStartIndex = cleanedContent.indexOf('{');
    const jsonEndIndex = cleanedContent.lastIndexOf('}');
    
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
      cleanedContent = cleanedContent.substring(jsonStartIndex, jsonEndIndex + 1);
    }
    
    // Try to parse the JSON
    try {
      const parsedResult = JSON.parse(cleanedContent);
      
      // Validate the expected structure
      if (!parsedResult.risultati || !Array.isArray(parsedResult.risultati)) {
        throw new Error('Invalid response structure: missing or invalid risultati array');
      }
      
      return parsedResult;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Content that failed to parse:', cleanedContent.substring(0, 500));
      
      // If we can't parse the JSON, make a second attempt with a different prompt
      return await fallbackGrading(questions, userAnswers, GEMINI_API_KEY);
    }
  } catch (error) {
    console.error('Primary Gemini grading error:', error);
    
    // Try the fallback method
    try {
      return await fallbackGrading(questions, userAnswers, GEMINI_API_KEY);
    } catch (fallbackError) {
      console.error('Fallback grading also failed:', fallbackError);
      
      // If all attempts fail, create a manual grading response
      return createManualGradingResponse(questions, userAnswers);
    }
  }
}

// Fallback grading method with a simplified approach
async function fallbackGrading(questions, userAnswers, apiKey) {
  console.log('Attempting fallback grading method');
  
  // Create a simpler prompt focused entirely on json output
  const simplifiedPrompt = `Grade each question and output ONLY JSON:
${questions.map((q, i) => {
  const type = q.type || 'multiple-choice';
  const userAnswer = userAnswers[i] || 'No answer';
  const maxPoints = type === 'open-ended' ? 5 : 1;
  let correctAnswer = '';
  
  if (type === 'multiple-choice' && q.options && Array.isArray(q.options) && q.correctAnswer !== undefined) {
    correctAnswer = q.options[q.correctAnswer] || '';
  } else {
    correctAnswer = q.correctAnswer || '';
  }
  
  return `Question ${i+1}: ${q.question || 'Unknown question'} (Type: ${type}, Worth: ${maxPoints} points)
Correct answer: ${correctAnswer}
User answer: ${userAnswer}`;
}).join('\n\n')}

Output format (ONLY JSON):
{"risultati":[{"domanda":"Q1","risposta_utente":"A1","corretto":true/false,"punteggio":5,"spiegazione":"E1"}],"punteggio_totale":0.5,"feedback_generale":"F"}`;

  const modelName = 'gemini-1.5-flash';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: simplifiedPrompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Fallback API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Extract content
  let content;
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    content = data.candidates[0].content.parts[0].text;
  } else {
    throw new Error('Unexpected response format in fallback method');
  }
  
  // Clean and extract JSON
  content = content.trim();
  
  // Remove markdown code blocks if present
  content = content.replace(/```json\s*|\s*```/g, '');
  
  // Find JSON by looking for opening and closing braces
  const jsonStartIndex = content.indexOf('{');
  const jsonEndIndex = content.lastIndexOf('}');
  
  if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
    content = content.substring(jsonStartIndex, jsonEndIndex + 1);
  }
  
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Fallback JSON parsing failed:', parseError);
    console.error('Content that failed to parse:', content.substring(0, 200));
    throw new Error('Failed to parse JSON in fallback method');
  }
}

// Create a manual grading response when all else fails
function createManualGradingResponse(questions, userAnswers) {
  console.log('Creating manual grading response');
  
  const results = questions.map((question, index) => {
    const userAnswer = userAnswers[index] || '';
    let isCorrect = false;
    let score = 0;
    
    // Simple automated grading for multiple-choice and true-false
    if (question.type !== 'open-ended') {
      // For multiple-choice or true-false
      if (typeof userAnswer === 'number' && userAnswer === question.correctAnswer) {
        isCorrect = true;
        score = 1;
      }
    }
    
    return {
      domanda: question.question || `Question ${index + 1}`,
      risposta_utente: String(userAnswer),
      corretto: isCorrect,
      punteggio: score,
      spiegazione: isCorrect ? 
        "Your answer is correct." : 
        "The system couldn't evaluate this answer in detail, but it doesn't match the expected answer."
    };
  });
  
  // Calculate total score
  const totalPoints = results.reduce((sum, r) => sum + r.punteggio, 0);
  const maxPoints = questions.reduce((sum, q) => sum + (q.type === 'open-ended' ? 5 : 1), 0);
  
  return {
    risultati: results,
    punteggio_totale: maxPoints > 0 ? totalPoints / maxPoints : 0,
    total_points: totalPoints,
    max_points: maxPoints,
    feedback_generale: "Your quiz was graded using a basic evaluation method due to AI service issues."
  };
}

// Helper to format questions for grading
function formatQuestionsForGrading(questions, userAnswers) {
  return questions.map((q, i) => {
    let questionText = `Question ${i + 1}: ${q.question || 'Unknown question'}`;
    
    // Add question type 
    questionText += `\nQuestion Type: ${q.type || 'multiple-choice'}`;
    questionText += (q.type === 'open-ended') ? ' (worth 5 points)' : ' (worth 1 point)';
    
    if (q.type === 'multiple-choice' && q.options && Array.isArray(q.options)) {
      questionText += `\nOptions: ${q.options.join(', ')}`;
      const correctAnswerText = (q.correctAnswer !== undefined && q.options[q.correctAnswer]) 
        ? q.options[q.correctAnswer] 
        : 'Unknown';
      questionText += `\nCorrect answer: ${correctAnswerText}`;
      
      let userAnswerText = 'No answer provided';
      if (userAnswers[i] !== null && userAnswers[i] !== undefined) {
        if (typeof userAnswers[i] === 'number' && q.options[userAnswers[i]]) {
          userAnswerText = q.options[userAnswers[i]];
        } else {
          userAnswerText = String(userAnswers[i]);
        }
      }
      questionText += `\nUser's answer: ${userAnswerText}`;
    } else if (q.type === 'true-false') {
      questionText += `\nCorrect answer: ${q.correctAnswer === 0 ? 'True' : 'False'}`;
      const userAnswerText = userAnswers[i] === 0 ? 'True' : 
                            userAnswers[i] === 1 ? 'False' : 
                            'No answer provided';
      questionText += `\nUser's answer: ${userAnswerText}`;
    } else {
      questionText += `\nExpected answer: ${q.correctAnswer || 'Unknown'}`;
      questionText += `\nUser's answer: ${userAnswers[i] || 'No answer provided'}`;
    }
    
    return questionText;
  }).join('\n\n');
}
