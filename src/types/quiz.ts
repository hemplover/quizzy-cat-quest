
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
}

export interface QuizSettings {
  difficulty: string;
  questionTypes: string[];
  numQuestions: number;
  model?: string;
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
