
export interface QuizQuestion {
  tipo: string;
  domanda: string;
  opzioni?: string[];
  risposta_corretta: string;
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
}

export interface QuizSettings {
  difficulty: string;
  questionTypes: string[];
  numQuestions: number;
}

export interface ProcessedFile {
  file: File;
  text?: string;
}
