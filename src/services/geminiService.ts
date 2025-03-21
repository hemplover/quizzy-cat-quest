
import { getApiKey } from './aiProviderService';
import { GeneratedQuiz, QuizResults, QuizSettings } from '@/types/quiz';

export const generateQuizWithGemini = async (
  content: string,
  settings: QuizSettings
): Promise<GeneratedQuiz> => {
  const apiKey = getApiKey('gemini');
  if (!apiKey) {
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

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
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
      throw new Error(`Gemini API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);
    
    // Extract the content
    const generatedContent = data.candidates[0].content.parts[0].text;
    
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
  const apiKey = getApiKey('gemini');
  if (!apiKey) {
    throw new Error('Gemini API key is not set');
  }
  
  try {
    // Format questions and answers for grading
    const formattedQuestions = questions.map((q, i) => {
      let questionText = `Question ${i + 1}: ${q.question}`;
      
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
    
    const prompt = `You are a university professor grading an exam. Provide detailed feedback and score for each answer. Return your grading as JSON with the following format:
{
  "risultati": [
    {"domanda": "Question text", "risposta_utente": "User's answer", "corretto": true/false, "punteggio": score (0 to 1), "spiegazione": "Explanation"}, 
    ...
  ],
  "punteggio_totale": total_score (0 to 1),
  "feedback_generale": "General feedback"
}

Here are the questions and answers to grade:

${formattedQuestions}`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
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
      throw new Error(`Gemini API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Gemini grading response:', data);
    
    // Extract the content
    const generatedContent = data.candidates[0].content.parts[0].text;
    
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
