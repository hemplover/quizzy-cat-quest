
export interface QuizQuestion {
  id?: number;
  type?: string;
  tipo?: string;
  question?: string;
  domanda?: string;
  options?: string[];
  opzioni?: string[];
  risposta_corretta?: string | boolean;
  correct_answer?: string | boolean;
  spiegazione?: string;
  explanation?: string;
  correctAnswer?: number | string; // Add this property for local usage
}

export interface GeneratedQuiz {
  quiz: QuizQuestion[];
}

export interface QuizResults {
  risultati: Array<{
    domanda: string;
    risposta_utente: string | number;
    corretto: boolean | string;
    punteggio: number;
    spiegazione: string;
  }>;
  punteggio_totale: number;
  feedback_generale?: string;
  total_points?: number;
  max_points?: number;
}

export interface QuizSettings {
  difficulty: string;
  questionTypes: string[];
  numQuestions: number;
  model?: string;
  previousQuizzes?: number;
}

export interface ProcessedFile {
  file: File;
  text?: string;
}

export interface QuizData {
  source: string;
  difficulty: string;
  questionTypes: string[];
  numQuestions: number;
  createdAt: string;
  model?: string;
}

// Add this interface to represent a quiz from the database
export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  created_at?: string;
  settings?: any;
  results?: any;
  subject_id?: string;
  user_id?: string;
  document_id?: string;
}
