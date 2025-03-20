
import { toast } from 'sonner';
import { QuizQuestion, GeneratedQuiz, QuizResults, QuizSettings } from '@/types/quiz';
import { getSelectedModel } from './quizService';

// Get API key from localStorage
const getOpenAIKey = (): string => {
  const key = localStorage.getItem('openai_api_key');
  if (!key) {
    toast.error("OpenAI API key not found. Please set your API key.");
    return '';
  }
  return key;
};

// Transform generated questions to our app format
export const transformQuizQuestions = (generatedQuiz: GeneratedQuiz) => {
  return generatedQuiz.quiz.map((q, index) => {
    if (q.tipo === 'scelta_multipla' || q.tipo === 'multiple_choice') {
      return {
        id: index,
        type: 'multiple-choice',
        question: q.domanda || q.question,
        options: q.opzioni || q.options || [],
        correctAnswer: q.opzioni ? q.opzioni.indexOf(q.risposta_corretta) : 
                      (q.options ? q.options.indexOf(q.correct_answer) : 0),
        explanation: q.spiegazione || q.explanation || ''
      };
    } else if (q.tipo === 'vero_falso' || q.tipo === 'true_false') {
      return {
        id: index,
        type: 'true-false',
        question: q.domanda || q.question,
        options: ['True', 'False'],
        correctAnswer: (q.risposta_corretta === 'Vero' || q.correct_answer === 'True') ? 0 : 1,
        explanation: q.spiegazione || q.explanation || ''
      };
    } else {
      return {
        id: index,
        type: 'open-ended',
        question: q.domanda || q.question,
        correctAnswer: q.risposta_corretta || q.correct_answer || '',
        explanation: q.spiegazione || q.explanation || ''
      };
    }
  });
};

// Generate quiz from content
export const generateQuiz = async (
  content: string | File, 
  settings: QuizSettings
): Promise<GeneratedQuiz | null> => {
  try {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      return null;
    }
    
    // Get the selected model
    const selectedModel = getSelectedModel();
    console.log(`Using OpenAI model: ${selectedModel}`);
    
    // Initialize a base prompt that includes quiz settings
    const { difficulty, questionTypes, numQuestions } = settings;
    
    // Create a base system prompt with emphasis on content relevance
    const systemPrompt = `You are a university professor responsible for creating exams for students. Based only on the provided study material, generate a realistic university-level exam.

### Rules:
- Only use information from the provided document.
- Do not create generic or overly simplistic questions.
- Structure the quiz like a real university exam.
- Ensure a variety of question types according to user's selection.
- Adjust difficulty level to: ${difficulty}
- The quiz must feel like an official test, not a casual practice exercise.
- Total questions requested: ${numQuestions}
- Do NOT invent facts that are not in the document.`;

    // Create the prompt based on whether we're using text or direct file upload
    const userPrompt = `Create a university-level exam with ${numQuestions} questions based EXCLUSIVELY on the provided study material.

### Question Types Requested:
${questionTypes.map(type => `- ${type}`).join('\n')}

### Difficulty Level:
${difficulty} (${difficulty === 'beginner' ? 'Basic questions testing recall' : 
                 difficulty === 'intermediate' ? 'Questions testing application of concepts' : 
                 'Advanced questions testing analysis and critical thinking'})

### Important Guidelines:
- Only use information explicitly present in the provided content.
- Do not invent or assume information not present in the material.
- Create university-level, professional exam questions.
- If the content doesn't have enough information for ${numQuestions} questions, create as many quality questions as possible.

### Format Your Response as JSON:
{
  "quiz": [
    {
      "tipo": "multiple_choice",
      "question": "Specific question from the document",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option that's correct based on document"
    },
    {
      "tipo": "true_false",
      "question": "Statement based directly on document content",
      "correct_answer": "True or False based on document"
    },
    {
      "tipo": "open_ended",
      "question": "Question requiring explanation from document",
      "correct_answer": "Model/reference answer based on document content"
    }
  ]
}

Now, create a university exam based on the following study material:`;

    // If content is a File, send it directly to OpenAI
    if (content instanceof File) {
      console.log(`Sending file ${content.name} directly to OpenAI`);
      
      // For vision models like GPT-4o, we need to encode file as base64
      const fileArrayBuffer = await content.arrayBuffer();
      const fileBase64 = btoa(
        new Uint8Array(fileArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      // Set up the request
      const requestBody = {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${content.type};base64,${fileBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 4000 // Increased token limit for better responses
      };
      
      console.log('Making API request with file content...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        throw new Error(`OpenAI API returned ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log("OpenAI response received");
      
      // Log the first part of the response for debugging
      const responseContent = data.choices[0].message.content;
      console.log("Response content (first 200 chars):", responseContent.substring(0, 200) + "...");
      
      // Extract JSON from the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Could not parse JSON from API response");
        console.log("Full response:", responseContent);
        throw new Error('Could not parse JSON from API response');
      }
      
      try {
        const parsedJson = JSON.parse(jsonMatch[0]);
        
        // Validate that we have at least some questions
        if (!parsedJson.quiz || parsedJson.quiz.length === 0) {
          console.error("No questions generated in the response");
          console.log("Full response content:", responseContent);
          toast.error("Non è stato possibile generare domande dal contenuto fornito. Il contenuto potrebbe essere troppo breve o non specifico.");
          return null;
        }
        
        console.log(`Generated ${parsedJson.quiz.length} questions`);
        return parsedJson;
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.log("Content that failed to parse:", jsonMatch[0]);
        throw new Error('Error parsing quiz data from API response');
      }
    } else {
      // Text-based content flow
      console.log("Sending text content to OpenAI");
      
      // Check if content is sufficient
      if (content.trim().length < 200) {
        toast.error("Il contenuto fornito è troppo breve per generare un quiz significativo. Fornisci più testo o carica un file più completo.");
        return null;
      }

      const requestBody = {
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt + `\n\n### Study Material:\n${content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000 // Increased token limit for better responses
      };
      
      console.log('Making API request with text content...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        throw new Error(`OpenAI API returned ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log("OpenAI response received");
      
      const responseContent = data.choices[0].message.content;
      console.log("Response content (first 200 chars):", responseContent.substring(0, 200) + "...");
      
      // Extract JSON from the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Could not parse JSON from API response");
        console.log("Full response:", responseContent);
        throw new Error('Could not parse JSON from API response');
      }
      
      try {
        const parsedJson = JSON.parse(jsonMatch[0]);
        
        // Validate that we have at least some questions
        if (!parsedJson.quiz || parsedJson.quiz.length === 0) {
          console.error("No questions generated in the response");
          console.log("Full response content:", responseContent);
          toast.error("Non è stato possibile generare domande dal testo fornito. Il contenuto potrebbe essere troppo breve o non specifico.");
          return null;
        }
        
        console.log(`Generated ${parsedJson.quiz.length} questions`);
        return parsedJson;
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        console.log("Content that failed to parse:", jsonMatch[0]);
        throw new Error('Error parsing quiz data from API response');
      }
    }
  } catch (error) {
    console.error('Error generating quiz:', error);
    toast.error('Failed to generate quiz. Please try again with more specific content.');
    return null;
  }
};

// Grade quiz based on the selected AI provider
export const gradeQuiz = async (
  questions: any[], 
  userAnswers: any[]
): Promise<QuizResults | null> => {
  try {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      return null;
    }

    // Get the selected model - using simpler model for grading to save tokens
    const selectedModel = 'gpt-4o-mini';

    // Format the questions and answers for the API
    const formattedQuestions = questions.map(q => {
      return {
        domanda: q.question,
        tipo: q.type,
        opzioni: q.options,
        risposta_corretta: q.type === 'open-ended' ? q.correctAnswer : q.options[q.correctAnswer]
      };
    });

    const formattedAnswers = userAnswers.map(a => {
      const question = questions.find(q => q.id === a.questionId);
      return {
        domanda: question.question,
        risposta_utente: question.type === 'open-ended' ? a.userAnswer : question.options[a.userAnswer]
      };
    });

    const prompt = `You are a university professor grading student exams. The student has completed the quiz below, and you need to provide a fair and detailed assessment.

### Grading Rules:
- Evaluate each answer with academic rigor.
- Assign a score from 0 to 1 for each question (partial credit allowed for partial answers).
- Provide detailed, constructive feedback for each answer.
- Be particularly thorough when grading open-ended responses.
- Explain why answers are wrong when they are, and what the correct answer should be.

### Exam Questions and Correct Answers:
${JSON.stringify(formattedQuestions, null, 2)}

### Student's Answers:
${JSON.stringify(formattedAnswers, null, 2)}

### Response Format (JSON):
{
  "risultati": [
    {
      "domanda": "Question from the exam",
      "risposta_utente": "Student's answer",
      "corretto": boolean or "Partially Correct",
      "punteggio": number (0-1),
      "spiegazione": "Detailed feedback explaining the evaluation"
    },
    // Additional question results...
  ],
  "punteggio_totale": sum of all scores,
  "feedback_generale": "Overall assessment of the student's performance"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are a university professor providing detailed and fair assessment of student exam answers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const responseContent = data.choices[0].message.content;
    
    // Extract JSON from the response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not parse JSON from API response");
      console.log("Full response:", responseContent);
      throw new Error('Could not parse JSON from API response');
    }
    
    try {
      return JSON.parse(jsonMatch[0]) as QuizResults;
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      console.log("Content that failed to parse:", jsonMatch[0]);
      throw new Error('Error parsing quiz results from API response');
    }
  } catch (error) {
    console.error('Error grading quiz:', error);
    toast.error('Failed to grade quiz with AI. Using basic grading instead.');
    return null;
  }
};

// Extract text from files - for compatibility with older code paths
export const extractTextFromFile = async (file: File): Promise<string> => {
  console.log(`Extracting text from ${file.name}, type: ${file.type}`);
  
  // Handle text files directly
  if (file.type === 'text/plain') {
    const text = await file.text();
    console.log(`Extracted ${text.length} characters from text file`);
    return text;
  }
  
  // For other file types, return a placeholder that indicates direct file upload is preferred
  return `This file (${file.name}) will be processed directly by the AI service for better results.`;
};
