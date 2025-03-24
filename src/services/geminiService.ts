
import { getApiKey, isBackendOnlyProvider } from './aiProviderService';
import { GeneratedQuiz, QuizResults, QuizSettings } from '@/types/quiz';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const generateQuizWithGemini = async (
  content: string,
  settings: QuizSettings
): Promise<GeneratedQuiz> => {
  // Check if we should use backend Gemini API
  if (isBackendOnlyProvider('gemini')) {
    console.log('Using backend Gemini API key from Supabase secrets');
    
    // Call the edge function for quiz generation
    const { data, error } = await supabase.functions.invoke('generate-quiz', {
      body: {
        content,
        settings,
        provider: 'gemini',
        apiKey: null // Don't send API key, use backend key
      }
    });
    
    if (error) {
      console.error('Error calling generate-quiz function:', error);
      toast.error(`Error generating quiz: ${error.message}`);
      throw new Error(`Error generating quiz: ${error.message}`);
    }
    
    if (!data || !data.quiz || data.quiz.length === 0) {
      console.error('Failed to generate quiz: Empty or invalid response from API');
      throw new Error('Failed to generate quiz: Empty or invalid response from API');
    }
    
    return data;
  }
  
  // Original frontend implementation is kept but won't be used
  // when Gemini is set to backend-only mode
  const apiKey = getApiKey('gemini');
  console.log('Gemini API Key exists:', !!apiKey);
  
  if (!apiKey) {
    console.error('Gemini API key is not set');
    toast.error('Gemini API key is not set. Please add your API key in the settings.');
    throw new Error('Gemini API key is not set');
  }
  
  try {
    // Prepare prompt for Gemini
    const prompt = `You are a university professor responsible for creating exams for students. Based only on the provided study material, generate a realistic university-level exam.

### Rules:
- Only use information from the provided document.
- Do not create generic or overly simplistic questions.
- Structure the quiz like a real university exam.
- Ensure a variety of question types as specified below.
- Adjust difficulty according to the selected level: ${settings.difficulty}
- The quiz must feel like an official test, not a casual practice exercise.
- Return ONLY valid JSON with no additional text.
- Please detect the language of the content and create the quiz in that same language. Preserve all terminology and concepts in their original language.

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

    // Determine which model endpoint to use
    const model = settings.model === 'gemini-2-flash' ? 'gemini-2.0-flash' : 'gemini-pro';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    
    console.log(`Using Gemini model: ${model}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
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
      console.error('Gemini API Error details:', errorData);
      throw new Error(`Gemini API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');
    
    // Extract the content based on the response format
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
      const parsedQuiz = JSON.parse(generatedContent);
      return parsedQuiz;
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
  } catch (error) {
    console.error('Error generating quiz with Gemini:', error);
    throw error;
  }
};

export const gradeQuizWithGemini = async (
  questions: any[], 
  userAnswers: any[]
): Promise<QuizResults> => {
  // Check if we should use backend Gemini API
  if (isBackendOnlyProvider('gemini')) {
    console.log('Using backend Gemini API key from Supabase secrets for grading');
    
    try {
      // Clean up answers before sending to the edge function
      const processedAnswers = userAnswers.map(answer => {
        if (answer === null || answer === undefined) {
          return '';
        }
        return answer;
      });
      
      // Call the edge function for quiz grading
      const { data, error } = await supabase.functions.invoke('grade-quiz', {
        body: {
          questions,
          userAnswers: processedAnswers,
          provider: 'gemini'
        }
      });
      
      if (error) {
        console.error('Error calling grade-quiz function:', error);
        toast.error(`Error grading quiz: ${error.message}`);
        throw new Error(`Error grading quiz: ${error.message}`);
      }
      
      if (!data) {
        console.error('No data returned from grade-quiz function');
        throw new Error('No data returned from grade-quiz function');
      }
      
      if (!data.risultati || !Array.isArray(data.risultati)) {
        console.error('Invalid quiz results format returned by API:', data);
        throw new Error('Invalid quiz results format returned by API');
      }
      
      return data;
    } catch (error) {
      console.error('Error in gradeQuizWithGemini:', error);
      throw error;
    }
  }
  
  // Original frontend implementation is kept but won't be used
  // when Gemini is set to backend-only mode
  const apiKey = getApiKey('gemini');
  if (!apiKey) {
    throw new Error('Gemini API key is not set');
  }
  
  try {
    // Format questions and answers for grading
    const formattedQuestions = questions.map((q, i) => {
      let questionText = `Question ${i + 1}: ${q.question}`;
      
      // Add question type and point value
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
    
    const prompt = `You are a university professor grading an exam. 

DIFFERENT QUESTION TYPES HAVE DIFFERENT POINT VALUES:
- True/False questions: Worth 1 point maximum (0 = incorrect, 1 = correct)
- Multiple-choice questions: Worth 1 point maximum (0 = incorrect, 1 = correct)
- Open-ended questions: Worth 5 points maximum (grade on a scale from 0-5 where 5 is perfect)

For open-ended questions, you MUST:
1. Grade on a scale from 0 to 5 points (use integers only: 0, 1, 2, 3, 4, or 5)
2. Provide detailed feedback explaining why you assigned that score
3. Be fair but rigorous - a score of 5/5 should only be for truly excellent, comprehensive answers

Return your grading as JSON with the following format:
{
  "risultati": [
    {"domanda": "Question text", "risposta_utente": "User's answer", "corretto": true/false, "punteggio": score (based on question type), "spiegazione": "Detailed explanation of the score"}, 
    ...
  ],
  "punteggio_totale": total_score (0 to 1),
  "feedback_generale": "General feedback on overall performance"
}

Here are the questions and answers to grade:

${formattedQuestions}`;

    // Use the Gemini 2.0 Flash model by default
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
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
      throw new Error(`Gemini API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Gemini grading response:', data);
    
    // Extract the content based on response format
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
      console.error('Error parsing grading JSON from Gemini:', error);
      
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
    console.error('Error grading quiz with Gemini:', error);
    throw error;
  }
};
