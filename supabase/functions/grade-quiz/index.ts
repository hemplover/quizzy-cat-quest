
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
    console.log('Questions count:', questions.length);
    console.log('User answers count:', userAnswers.length);
    
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
      
      // Create a fallback response for grading failures - use our own grading logic
      result = manualGradeQuiz(questions, processedUserAnswers);
      
      console.log('Using fallback manual grading result due to error');
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
      
      // Create a fallback response using our manual grading
      result = manualGradeQuiz(questions, processedUserAnswers);
      
      console.log('Using fallback manual grading result due to invalid format');
    }
    
    // Make sure we have the same number of results as questions
    if (result.risultati.length !== questions.length) {
      console.warn(`Result count mismatch: ${result.risultati.length} results for ${questions.length} questions`);
      
      // Pad or truncate results to match question count
      if (result.risultati.length < questions.length) {
        // Use our manual grading to get complete results
        result = manualGradeQuiz(questions, processedUserAnswers);
      } else {
        // Truncate if we have too many
        result.risultati = result.risultati.slice(0, questions.length);
      }
    }
    
    // Calculate total weighted score based on question types
    // Open-ended worth 5 points, others worth 1 point
    let totalPoints = 0;
    let maxPoints = 0;
    
    // Validate each question result
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
        
        // Special validation for open-ended questions: check if answer is meaningful
        const userAnswer = processedUserAnswers[i]?.toString() || '';
        if (userAnswer.length < 10 || 
            /^[a-z]{10,}$/i.test(userAnswer) || // Just random letters
            /(.)\1{5,}/.test(userAnswer))      // Repeated characters
        {
          console.log(`Open-ended answer appears to be nonsense: "${userAnswer}"`);
          score = 0;
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
        // For multiple-choice and true-false, do our own grading to ensure accuracy
        const correctAnswer = questions[i].correctAnswer;
        const userAnswer = processedUserAnswers[i];
        
        // Check if the user gave the correct answer
        const isCorrect = userAnswer === correctAnswer;
        
        // Override whatever the AI graded with our own grading for objective questions
        r.corretto = isCorrect;
        r.punteggio = isCorrect ? 1 : 0;
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

// Create a manual grading function that does correct grading without relying on AI
function manualGradeQuiz(questions, userAnswers) {
  console.log('Performing manual quiz grading');
  
  const rezultati = questions.map((question, index) => {
    const userAnswer = userAnswers[index];
    let isCorrect = false;
    let score = 0;
    let explanation = '';
    
    // Grade based on question type
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      // For multiple-choice or true-false
      isCorrect = userAnswer === question.correctAnswer;
      score = isCorrect ? 1 : 0;
      explanation = isCorrect ? 
        "Your answer is correct." : 
        `Your answer is incorrect. The correct answer is: ${
          question.options ? question.options[question.correctAnswer] : question.correctAnswer
        }`;
    } else if (question.type === 'open-ended') {
      // For open-ended questions, we can only do basic checks
      const answer = String(userAnswer || '');
      
      // Check if the answer is long enough to be meaningful
      if (answer.length < 10) {
        score = 0;
        isCorrect = false;
        explanation = "Your answer is too short to be considered valid.";
      } 
      // Check for nonsense answers (repeated characters, etc.)
      else if (/^[a-z]{10,}$/i.test(answer) || /(.)\1{5,}/.test(answer)) {
        score = 0;
        isCorrect = false;
        explanation = "Your answer appears to be random text rather than a meaningful response.";
      }
      // Basic check for keyword presence in the answer
      else {
        const correctAnswerText = String(question.correctAnswer || '');
        const keywords = correctAnswerText
          .split(/\s+/)
          .filter(word => word.length > 5)
          .map(word => word.toLowerCase());
        
        const answerWords = answer.toLowerCase().split(/\s+/);
        const matchedKeywords = keywords.filter(keyword => 
          answerWords.some(word => word.includes(keyword) || keyword.includes(word))
        );
        
        const percentageMatched = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
        
        // Score based on keyword matches
        if (percentageMatched > 0.7) {
          score = 5;
          isCorrect = true;
          explanation = "Your answer covers all the key points and is correct.";
        } else if (percentageMatched > 0.5) {
          score = 4;
          isCorrect = "Parzialmente";
          explanation = "Your answer covers most of the key points but could be more comprehensive.";
        } else if (percentageMatched > 0.3) {
          score = 3;
          isCorrect = "Parzialmente";
          explanation = "Your answer addresses some key points but misses important details.";
        } else if (percentageMatched > 0.1) {
          score = 2;
          isCorrect = "Parzialmente";
          explanation = "Your answer mentions a few relevant points but lacks depth and accuracy.";
        } else if (answer.length > 20) {
          score = 1;
          isCorrect = "Parzialmente";
          explanation = "Your answer is mostly off-topic or incorrect, but shows some effort.";
        } else {
          score = 0;
          isCorrect = false;
          explanation = "Your answer doesn't address the question correctly.";
        }
      }
    }
    
    return {
      domanda: question.question,
      risposta_utente: String(userAnswer || ''),
      corretto: isCorrect,
      punteggio: score,
      spiegazione: explanation
    };
  });
  
  // Calculate total points and maximum possible points
  let totalPoints = 0;
  let maxPoints = 0;
  
  rezultati.forEach((result, index) => {
    const questionType = questions[index].type;
    const pointValue = questionType === 'open-ended' ? 5 : 1;
    
    maxPoints += pointValue;
    totalPoints += result.punteggio;
  });
  
  // Calculate overall score as a ratio between 0 and 1
  const overallScore = maxPoints > 0 ? totalPoints / maxPoints : 0;
  
  // Prepare overall feedback based on score
  let generalFeedback = '';
  if (overallScore >= 0.9) {
    generalFeedback = "Excellent work! You've demonstrated a strong understanding of the material.";
  } else if (overallScore >= 0.7) {
    generalFeedback = "Good job! You have a solid grasp of most concepts.";
  } else if (overallScore >= 0.5) {
    generalFeedback = "Satisfactory performance. Review the areas where you made mistakes.";
  } else {
    generalFeedback = "You should review the material more thoroughly before retaking the quiz.";
  }
  
  return {
    risultati: rezultati,
    punteggio_totale: overallScore,
    total_points: totalPoints,
    max_points: maxPoints,
    feedback_generale: generalFeedback
  };
}

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

For multiple-choice and true/false questions, you MUST:
1. Grade with 0 points for incorrect answers and 1 point for correct answers
2. Mark as "corretto": true only for EXACTLY correct answers
3. Be extremely strict with grading - the answer must match exactly 

For open-ended questions, you MUST:
1. Grade on a scale from 0 to 5 points (use integers only: 0, 1, 2, 3, 4, or 5)
2. Provide detailed feedback explaining why you assigned that score
3. Be fair but rigorous - a score of 5/5 should only be for truly excellent, comprehensive answers
4. Give a score of 0 if the answer is nonsensical, extremely short, or completely off-topic

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
      const parsed = JSON.parse(generatedContent);
      
      // Manually check the multiple-choice and true-false questions
      // to ensure AI didn't make grading errors
      parsed.risultati.forEach((result, index) => {
        const question = questions[index];
        
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          const correctAnswer = question.correctAnswer;
          const userAnswer = userAnswers[index];
          
          // Check if the user gave the correct answer
          const isCorrect = userAnswer === correctAnswer;
          
          // Override whatever OpenAI graded with our direct comparison for objective questions
          result.corretto = isCorrect;
          result.punteggio = isCorrect ? 1 : 0;
        }
      });
      
      return parsed;
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

For multiple-choice and true/false questions:
1. Grade with 0 points for incorrect answers and 1 point for correct answers
2. Mark as "corretto": true only for EXACTLY correct answers
3. Be extremely strict - the answer must match exactly

For open-ended questions:
1. Grade on scale 0-5
2. Give 0 for nonsensical, extremely short, or off-topic answers
3. Be fair but rigorous - a 5/5 needs excellent depth and accuracy

ONLY RETURN THIS JSON STRUCTURE, NOTHING ELSE:
{
  "risultati": [
    {
      "domanda": "Question text",
      "risposta_utente": "User answer",
      "corretto": true/false/\"Parzialmente\",
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
    const modelName = 'gemini-2.0-flash';
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
    
    try {
      // Parse the JSON
      const parsedResult = JSON.parse(cleanedContent);
      
      // Validate the expected structure
      if (!parsedResult.risultati || !Array.isArray(parsedResult.risultati)) {
        throw new Error('Invalid response structure: missing or invalid risultati array');
      }
      
      // Manually check the multiple-choice and true-false questions
      // to ensure AI didn't make grading errors
      parsedResult.risultati.forEach((result, index) => {
        const question = questions[index];
        
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          const correctAnswer = question.correctAnswer;
          const userAnswer = userAnswers[index];
          
          // Check if the user gave the correct answer
          const isCorrect = userAnswer === correctAnswer;
          
          // Override whatever Gemini graded with our direct comparison for objective questions
          result.corretto = isCorrect;
          result.punteggio = isCorrect ? 1 : 0;
        }
      });
      
      return parsedResult;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Content that failed to parse:', cleanedContent.substring(0, 500));
      
      // If we can't parse the JSON, use our manual grading
      return manualGradeQuiz(questions, userAnswers);
    }
  } catch (error) {
    console.error('Primary Gemini grading error:', error);
    
    // Return our manual grading as a fallback
    return manualGradeQuiz(questions, userAnswers);
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
      const userAnswer = userAnswers[i] !== null && userAnswers[i] !== undefined && q.options[userAnswers[i]] 
        ? q.options[userAnswers[i]] 
        : 'No answer provided';
      questionText += `\nUser's answer: ${userAnswer}`;
    } else if (q.type === 'true-false') {
      questionText += `\nCorrect answer: ${q.correctAnswer === 0 ? 'True' : 'False'}`;
      const userAnswer = userAnswers[i] === 0 ? 'True' : userAnswers[i] === 1 ? 'False' : 'No answer provided';
      questionText += `\nUser's answer: ${userAnswer}`;
    } else {
      questionText += `\nExpected answer: ${q.correctAnswer}`;
      questionText += `\nUser's answer: ${userAnswers[i] || 'No answer provided'}`;
    }
    
    return questionText;
  }).join('\n\n');
}
