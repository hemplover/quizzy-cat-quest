
import { QuizSettings } from '@/types/quiz';
import { getApiKey, getSelectedProvider } from './aiProviderService';
import { getSelectedModel } from './quizService';
import { toast } from 'sonner';

// Extract text from a file
export const extractTextFromFile = async (file: File): Promise<string> => {
  try {
    console.log(`Extracting text from file: ${file.name}`);
    
    if (file.type === 'application/pdf') {
      // For PDFs, we'll use a simple text extraction approach
      // In a real app, you'd use a PDF parsing library
      const text = await readFileAsText(file);
      return text || `Content of PDF file: ${file.name}`;
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      // For Word documents
      const text = await readFileAsText(file);
      return text || `Content of Word document: ${file.name}`;
    } else if (file.type === 'text/plain') {
      return await readFileAsText(file);
    } else {
      // For other file types, attempt to read as text
      return await readFileAsText(file);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return `Error extracting text from file: ${file.name}`;
  }
};

// Helper function to read file as text
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
};

// Helper function to read file as binary string
const readFileAsBinary = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file as binary'));
    };
    reader.readAsBinaryString(file);
  });
};

// Generate quiz using OpenAI
export const generateQuiz = async (
  content: string | File,
  settings: QuizSettings
): Promise<any> => {
  const apiKey = getApiKey('openai');
  if (!apiKey) {
    throw new Error('OpenAI API key is not set');
  }
  
  // Get the model to use (default to gpt-4o if not specified)
  const model = settings.model || getSelectedModel() || 'gpt-4o';
  console.log(`Using OpenAI model: ${model}`);
  
  try {
    let messages = [];
    let formData = null;
    let body = null;
    let response = null;
    
    // First, prepare the prompt with system instructions to generate the quiz
    const systemPrompt = `You are a university professor responsible for creating exams for students. Based only on the provided study material, generate a realistic university-level exam.

### Rules:
- Only use information from the provided document.
- Do not create generic or overly simplistic questions.
- Structure the quiz like a real university exam.
- Ensure a variety of question types:
  - Multiple-choice questions (4 options, 1 correct answer).
  - True/False questions.
  - Open-ended questions that test deep understanding.
- Adjust difficulty according to the selected level: ${settings.difficulty}
- The quiz must feel like an official test, not a casual practice exercise.
- Return ONLY valid JSON with no additional text.

### Question Types to Include:
${settings.questionTypes.map(type => `- ${type}`).join('\n')}

### Number of Questions:
${settings.numQuestions}

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

    // If the content is a File and the model supports vision (like gpt-4o)
    if (content instanceof File && (model === 'gpt-4o' || model === 'gpt-4o-mini')) {
      console.log(`Processing file upload for vision-capable model: ${model}`);
      
      // For supported file types, create a multipart/form-data request
      if (['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(content.type)) {
        console.log(`Preparing multipart request for ${content.type} file`);
        
        // Create FormData
        formData = new FormData();
        
        // Create the messages with file content
        messages = [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please create a quiz based on the content of this ${content.type.split('/')[1]} file. Make ${settings.numQuestions} questions with ${settings.difficulty} difficulty.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${content.type};base64,${await fileToBase64(content)}`
                }
              }
            ]
          }
        ];
        
        // Add messages to FormData
        formData.append('model', model);
        formData.append('messages', JSON.stringify(messages));
        formData.append('max_tokens', '1200');
        formData.append('temperature', '0.2');
        
        // Make the API request
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          body: formData
        });
      } else {
        console.log(`Using JSON request for ${content.type} file`);
        // For other file types, extract text and send it normally
        const text = await extractTextFromFile(content);
        
        messages = [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Please create a quiz based on the following content from a ${content.type} file: \n\n${text}`
          }
        ];
        
        body = {
          model,
          messages,
          max_tokens: 1200,
          temperature: 0.2
        };
        
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
      }
    } else {
      // For text content or models without vision capabilities
      console.log('Processing text content');
      
      let textContent = typeof content === 'string' ? content : await extractTextFromFile(content);
      
      messages = [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please create a quiz based on the following content: \n\n${textContent}`
        }
      ];
      
      body = {
        model,
        messages,
        max_tokens: 1200,
        temperature: 0.2
      };
      
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from OpenAI API:', errorData);
      throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('OpenAI API response:', data);
    
    // Extract the content from the response
    const content = data.choices[0].message.content;
    
    try {
      // Parse the response as JSON
      const parsedQuiz = JSON.parse(content);
      console.log('Successfully parsed quiz:', parsedQuiz);
      return parsedQuiz;
    } catch (parseError) {
      console.error('Error parsing quiz JSON:', parseError);
      console.error('Raw content:', content);
      
      // Try to extract JSON from the text
      const jsonMatch = content.match(/```json\n([\s\S]*)\n```/) || 
                         content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[1] || jsonMatch[0];
          const parsedExtractedQuiz = JSON.parse(extractedJson);
          console.log('Successfully parsed extracted quiz JSON:', parsedExtractedQuiz);
          return parsedExtractedQuiz;
        } catch (err) {
          console.error('Error parsing extracted quiz JSON:', err);
        }
      }
      
      throw new Error('Failed to parse quiz from OpenAI response');
    }
  } catch (error) {
    console.error('Error generating quiz with OpenAI:', error);
    throw error;
  }
};

// Grade quiz using OpenAI
export const gradeQuiz = async (questions: any[], userAnswers: any[]): Promise<any> => {
  const apiKey = getApiKey('openai');
  if (!apiKey) {
    throw new Error('OpenAI API key is not set');
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
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getSelectedModel() || 'gpt-4o',
        messages: [
          {
            role: "system",
            content: "You are a university professor grading an exam. Provide detailed feedback and score for each answer. Return your grading as JSON with the following format:\n{\n\"risultati\": [\n{\"domanda\": \"Question text\", \"risposta_utente\": \"User's answer\", \"corretto\": true/false, \"punteggio\": score (0 to 1), \"spiegazione\": \"Explanation\"}, ...\n],\n\"punteggio_totale\": total_score (0 to 1),\n\"feedback_generale\": \"General feedback\"\n}"
          },
          {
            role: "user",
            content: `Please grade the following quiz questions and answers: \n\n${formattedQuestions}`
          }
        ],
        max_tokens: 1000,
        temperature: 0,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('Grading response:', data);
    
    // Extract the content from the response
    const content = data.choices[0].message.content;
    
    try {
      // Parse the response as JSON
      return JSON.parse(content);
    } catch (error) {
      console.error('Error parsing grading JSON:', error);
      
      // Try to extract JSON from the text
      const jsonMatch = content.match(/```json\n([\s\S]*)\n```/) || 
                         content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const extractedJson = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(extractedJson);
      }
      
      throw new Error('Failed to parse grading response');
    }
  } catch (error) {
    console.error('Error grading quiz with OpenAI:', error);
    throw error;
  }
};

// Helper function to convert file to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Extract the base64 part without the data URL prefix
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
