
export type Language = 'en' | 'it' | 'fr' | 'de';

export interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

export const translations: Translations = {
  en: {
    // Common
    appName: 'QuizAI',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    submit: 'Submit',
    back: 'Back',
    next: 'Next',
    close: 'Close',
    
    // Navigation
    home: 'Home',
    upload: 'Create Quiz',
    quiz: 'Take Quiz',
    dashboard: 'Dashboard',
    subjects: 'Subjects',
    quizzes: 'Quizzes',
    
    // Upload page
    uploadTitle: 'Create Quiz',
    uploadSubtitle: 'Upload materials or paste text to generate quiz questions',
    chooseSource: 'Choose Source',
    configureQuiz: 'Configure Quiz',
    apiKeyInstruction: 'Please set your API key first',
    uploadDocument: 'Upload Document',
    pasteText: 'Or Paste Your Text',
    processText: 'Process Text',
    contentReady: 'Content Ready',
    quizSettings: 'Quiz Settings',
    difficultyLevel: 'Difficulty Level',
    questionTypes: 'Question Types',
    numberOfQuestions: 'Number of Questions:',
    createQuiz: 'Create Quiz',
    generatingQuiz: 'Generating Quiz...',
    
    // Difficulty levels
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    basicRecall: 'Basic recall questions',
    applicationConcepts: 'Application of concepts',
    analysisSynthesis: 'Analysis and synthesis',
    
    // Question types
    multipleChoice: 'Multiple Choice',
    trueFalse: 'True/False',
    openEnded: 'Open Ended',
    
    // Dashboard
    recentQuizzes: 'Recent Quizzes',
    skillsProgress: 'Skills Progress',
    quickActions: 'Quick Actions',
    areasToImprove: 'Areas to Improve',
    createNewQuiz: 'Create New Quiz',
    continueLearning: 'Continue Learning',
    
    // Subjects
    subjectManager: 'Subject Manager',
    subjectManagerSubtitle: 'Create, edit, and manage your subjects and associated documents and quizzes',
    newSubject: 'New Subject',
    subjectName: 'Subject Name',
    subjectDescription: 'Description',
    icon: 'Icon',
    color: 'Color',
    documents: 'Documents',
    noSubjectsFound: 'No subjects found',
    createYourFirstSubject: 'Create Your First Subject',
    addDocument: 'Add Document',
    noDocumentsFound: 'No documents found in this subject',
    addYourFirstDocument: 'Add Your First Document',
    
    // Toast messages
    subjectCreated: 'Subject created successfully',
    subjectUpdated: 'Subject updated successfully',
    subjectDeleted: 'Subject deleted successfully',
    documentDeleted: 'Document deleted successfully',
    quizDeleted: 'Quiz deleted successfully',
    
    // File upload
    dragDropFile: 'Drag and drop your file here',
    dropFileHere: 'Drop your file here',
    selectFromComputer: 'Select from computer',
    maxSize: 'Max size:',
    supportFor: 'Support for',
    files: 'files',
    fileUploadNotSupported: 'File Upload Not Supported',
    fileUploadNotSupportedMsg: 'The selected AI provider does not support direct file uploads. Please switch to OpenAI or paste your text directly.',
    selectedFileSuccess: 'selected successfully!',
    
    // AI Providers
    selectAIProvider: 'Select AI Provider',
    openai: 'OpenAI',
    gemini: 'Google Gemini',
    claude: 'Anthropic Claude',
    mistral: 'Mistral AI',
    apiKey: 'API Key',
    enterApiKey: 'Enter your API key',
    apiKeyRequired: 'API key required',
    
    // Models
    selectModel: 'Select Model',
    defaultModel: 'Default Model',
    
    // Quiz page
    questionOf: 'Question {current} of {total}',
    submitAnswer: 'Submit Answer',
    reviewQuiz: 'Review Quiz',
    quizResults: 'Quiz Results',
    correctAnswers: 'Correct Answers',
    incorrectAnswers: 'Incorrect Answers',
    yourAnswer: 'Your Answer',
    correctAnswer: 'Correct Answer',
    explanation: 'Explanation',
    score: 'Score',
    retakeQuiz: 'Retake Quiz',
    backToDashboard: 'Back to Dashboard',
    
    // Errors
    errorProcessingFile: 'Error processing file',
    errorCreatingQuiz: 'Error creating quiz',
    errorLoadingQuiz: 'Error loading quiz',
    errorSavingQuiz: 'Error saving quiz',
  },
  
  it: {
    // Common
    appName: 'QuizAI',
    loading: 'Caricamento...',
    save: 'Salva',
    cancel: 'Annulla',
    delete: 'Elimina',
    edit: 'Modifica',
    create: 'Crea',
    submit: 'Invia',
    back: 'Indietro',
    next: 'Avanti',
    close: 'Chiudi',
    
    // Navigation
    home: 'Home',
    upload: 'Crea Quiz',
    quiz: 'Fai il Quiz',
    dashboard: 'Dashboard',
    subjects: 'Materie',
    quizzes: 'Quiz',
    
    // Upload page
    uploadTitle: 'Crea Quiz',
    uploadSubtitle: 'Carica materiali o incolla il testo per generare domande del quiz',
    chooseSource: 'Scegli Fonte',
    configureQuiz: 'Configura Quiz',
    apiKeyInstruction: 'Imposta prima la tua API key',
    uploadDocument: 'Carica Documento',
    pasteText: 'O Incolla il tuo Testo',
    processText: 'Elabora Testo',
    contentReady: 'Contenuto Pronto',
    quizSettings: 'Impostazioni Quiz',
    difficultyLevel: 'Livello di Difficoltà',
    questionTypes: 'Tipi di Domande',
    numberOfQuestions: 'Numero di Domande:',
    createQuiz: 'Crea Quiz',
    generatingQuiz: 'Generando Quiz...',
    
    // Difficulty levels
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzato',
    basicRecall: 'Domande di memoria base',
    applicationConcepts: 'Applicazione di concetti',
    analysisSynthesis: 'Analisi e sintesi',
    
    // Question types
    multipleChoice: 'Scelta Multipla',
    trueFalse: 'Vero/Falso',
    openEnded: 'Risposta Aperta',
    
    // Dashboard
    recentQuizzes: 'Quiz Recenti',
    skillsProgress: 'Progressi delle Competenze',
    quickActions: 'Azioni Rapide',
    areasToImprove: 'Aree da Migliorare',
    createNewQuiz: 'Crea Nuovo Quiz',
    continueLearning: 'Continua a Imparare',
    
    // Subjects
    subjectManager: 'Gestore Materie',
    subjectManagerSubtitle: 'Crea, modifica e gestisci le tue materie e i documenti e quiz associati',
    newSubject: 'Nuova Materia',
    subjectName: 'Nome Materia',
    subjectDescription: 'Descrizione',
    icon: 'Icona',
    color: 'Colore',
    documents: 'Documenti',
    noSubjectsFound: 'Nessuna materia trovata',
    createYourFirstSubject: 'Crea la tua Prima Materia',
    addDocument: 'Aggiungi Documento',
    noDocumentsFound: 'Nessun documento trovato in questa materia',
    addYourFirstDocument: 'Aggiungi il tuo Primo Documento',
    
    // Toast messages
    subjectCreated: 'Materia creata con successo',
    subjectUpdated: 'Materia aggiornata con successo',
    subjectDeleted: 'Materia eliminata con successo',
    documentDeleted: 'Documento eliminato con successo',
    quizDeleted: 'Quiz eliminato con successo',
    
    // File upload
    dragDropFile: 'Trascina e rilascia il tuo file qui',
    dropFileHere: 'Rilascia il tuo file qui',
    selectFromComputer: 'Seleziona dal computer',
    maxSize: 'Dimensione massima:',
    supportFor: 'Supporto per',
    files: 'file',
    fileUploadNotSupported: 'Caricamento File Non Supportato',
    fileUploadNotSupportedMsg: 'Il provider AI selezionato non supporta il caricamento diretto di file. Passa a OpenAI o incolla direttamente il tuo testo.',
    selectedFileSuccess: 'selezionato con successo!',
    
    // AI Providers
    selectAIProvider: 'Seleziona Provider AI',
    openai: 'OpenAI',
    gemini: 'Google Gemini',
    claude: 'Anthropic Claude',
    mistral: 'Mistral AI',
    apiKey: 'API Key',
    enterApiKey: 'Inserisci la tua API key',
    apiKeyRequired: 'API key richiesta',
    
    // Models
    selectModel: 'Seleziona Modello',
    defaultModel: 'Modello Predefinito',
    
    // Quiz page
    questionOf: 'Domanda {current} di {total}',
    submitAnswer: 'Invia Risposta',
    reviewQuiz: 'Rivedi Quiz',
    quizResults: 'Risultati Quiz',
    correctAnswers: 'Risposte Corrette',
    incorrectAnswers: 'Risposte Errate',
    yourAnswer: 'La tua Risposta',
    correctAnswer: 'Risposta Corretta',
    explanation: 'Spiegazione',
    score: 'Punteggio',
    retakeQuiz: 'Rifai Quiz',
    backToDashboard: 'Torna alla Dashboard',
    
    // Errors
    errorProcessingFile: 'Errore durante l\'elaborazione del file',
    errorCreatingQuiz: 'Errore durante la creazione del quiz',
    errorLoadingQuiz: 'Errore durante il caricamento del quiz',
    errorSavingQuiz: 'Errore durante il salvataggio del quiz',
  },
  
  fr: {
    // Common
    appName: 'QuizAI',
    loading: 'Chargement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    create: 'Créer',
    submit: 'Soumettre',
    back: 'Retour',
    next: 'Suivant',
    close: 'Fermer',
    
    // Navigation
    home: 'Accueil',
    upload: 'Créer Quiz',
    quiz: 'Faire le Quiz',
    dashboard: 'Tableau de Bord',
    subjects: 'Matières',
    quizzes: 'Quiz',
    
    // Upload page
    uploadTitle: 'Créer Quiz',
    uploadSubtitle: 'Téléchargez des documents ou collez du texte pour générer des questions de quiz',
    chooseSource: 'Choisir Source',
    configureQuiz: 'Configurer Quiz',
    apiKeyInstruction: 'Veuillez d\'abord définir votre clé API',
    uploadDocument: 'Télécharger Document',
    pasteText: 'Ou Collez votre Texte',
    processText: 'Traiter Texte',
    contentReady: 'Contenu Prêt',
    quizSettings: 'Paramètres du Quiz',
    difficultyLevel: 'Niveau de Difficulté',
    questionTypes: 'Types de Questions',
    numberOfQuestions: 'Nombre de Questions:',
    createQuiz: 'Créer Quiz',
    generatingQuiz: 'Génération du Quiz...',
    
    // Difficulty levels
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
    basicRecall: 'Questions de rappel basique',
    applicationConcepts: 'Application de concepts',
    analysisSynthesis: 'Analyse et synthèse',
    
    // Question types
    multipleChoice: 'Choix Multiple',
    trueFalse: 'Vrai/Faux',
    openEnded: 'Question Ouverte',
    
    // Dashboard
    recentQuizzes: 'Quiz Récents',
    skillsProgress: 'Progression des Compétences',
    quickActions: 'Actions Rapides',
    areasToImprove: 'Domaines à Améliorer',
    createNewQuiz: 'Créer Nouveau Quiz',
    continueLearning: 'Continuer l\'Apprentissage',
    
    // Subjects
    subjectManager: 'Gestionnaire de Matières',
    subjectManagerSubtitle: 'Créez, modifiez et gérez vos matières et les documents et quiz associés',
    newSubject: 'Nouvelle Matière',
    subjectName: 'Nom de la Matière',
    subjectDescription: 'Description',
    icon: 'Icône',
    color: 'Couleur',
    documents: 'Documents',
    noSubjectsFound: 'Aucune matière trouvée',
    createYourFirstSubject: 'Créez votre Première Matière',
    addDocument: 'Ajouter Document',
    noDocumentsFound: 'Aucun document trouvé dans cette matière',
    addYourFirstDocument: 'Ajoutez votre Premier Document',
    
    // Toast messages
    subjectCreated: 'Matière créée avec succès',
    subjectUpdated: 'Matière mise à jour avec succès',
    subjectDeleted: 'Matière supprimée avec succès',
    documentDeleted: 'Document supprimé avec succès',
    quizDeleted: 'Quiz supprimé avec succès',
    
    // File upload
    dragDropFile: 'Glissez-déposez votre fichier ici',
    dropFileHere: 'Déposez votre fichier ici',
    selectFromComputer: 'Sélectionner depuis l\'ordinateur',
    maxSize: 'Taille maximale:',
    supportFor: 'Support pour',
    files: 'fichiers',
    fileUploadNotSupported: 'Téléchargement de Fichier Non Pris en Charge',
    fileUploadNotSupportedMsg: 'Le fournisseur d\'IA sélectionné ne prend pas en charge le téléchargement direct de fichiers. Veuillez passer à OpenAI ou coller directement votre texte.',
    selectedFileSuccess: 'sélectionné avec succès!',
    
    // AI Providers
    selectAIProvider: 'Sélectionner Fournisseur d\'IA',
    openai: 'OpenAI',
    gemini: 'Google Gemini',
    claude: 'Anthropic Claude',
    mistral: 'Mistral AI',
    apiKey: 'Clé API',
    enterApiKey: 'Entrez votre clé API',
    apiKeyRequired: 'Clé API requise',
    
    // Models
    selectModel: 'Sélectionner Modèle',
    defaultModel: 'Modèle par Défaut',
    
    // Quiz page
    questionOf: 'Question {current} sur {total}',
    submitAnswer: 'Soumettre Réponse',
    reviewQuiz: 'Revoir Quiz',
    quizResults: 'Résultats du Quiz',
    correctAnswers: 'Réponses Correctes',
    incorrectAnswers: 'Réponses Incorrectes',
    yourAnswer: 'Votre Réponse',
    correctAnswer: 'Réponse Correcte',
    explanation: 'Explication',
    score: 'Score',
    retakeQuiz: 'Refaire le Quiz',
    backToDashboard: 'Retour au Tableau de Bord',
    
    // Errors
    errorProcessingFile: 'Erreur lors du traitement du fichier',
    errorCreatingQuiz: 'Erreur lors de la création du quiz',
    errorLoadingQuiz: 'Erreur lors du chargement du quiz',
    errorSavingQuiz: 'Erreur lors de l\'enregistrement du quiz',
  },
  
  de: {
    // Common
    appName: 'QuizAI',
    loading: 'Wird geladen...',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    create: 'Erstellen',
    submit: 'Absenden',
    back: 'Zurück',
    next: 'Weiter',
    close: 'Schließen',
    
    // Navigation
    home: 'Startseite',
    upload: 'Quiz erstellen',
    quiz: 'Quiz ablegen',
    dashboard: 'Dashboard',
    subjects: 'Fächer',
    quizzes: 'Quizze',
    
    // Upload page
    uploadTitle: 'Quiz erstellen',
    uploadSubtitle: 'Materialien hochladen oder Text einfügen, um Quizfragen zu generieren',
    chooseSource: 'Quelle wählen',
    configureQuiz: 'Quiz konfigurieren',
    apiKeyInstruction: 'Bitte zuerst Ihren API-Schlüssel festlegen',
    uploadDocument: 'Dokument hochladen',
    pasteText: 'Oder Text einfügen',
    processText: 'Text verarbeiten',
    contentReady: 'Inhalt bereit',
    quizSettings: 'Quiz-Einstellungen',
    difficultyLevel: 'Schwierigkeitsgrad',
    questionTypes: 'Fragetypen',
    numberOfQuestions: 'Anzahl der Fragen:',
    createQuiz: 'Quiz erstellen',
    generatingQuiz: 'Quiz wird generiert...',
    
    // Difficulty levels
    beginner: 'Anfänger',
    intermediate: 'Mittelstufe',
    advanced: 'Fortgeschritten',
    basicRecall: 'Grundlegende Erinnerungsfragen',
    applicationConcepts: 'Anwendung von Konzepten',
    analysisSynthesis: 'Analyse und Synthese',
    
    // Question types
    multipleChoice: 'Multiple Choice',
    trueFalse: 'Wahr/Falsch',
    openEnded: 'Offene Frage',
    
    // Dashboard
    recentQuizzes: 'Kürzliche Quizze',
    skillsProgress: 'Fortschritt der Fähigkeiten',
    quickActions: 'Schnellaktionen',
    areasToImprove: 'Verbesserungsbereiche',
    createNewQuiz: 'Neues Quiz erstellen',
    continueLearning: 'Weiterlernen',
    
    // Subjects
    subjectManager: 'Fachverwaltung',
    subjectManagerSubtitle: 'Erstellen, bearbeiten und verwalten Sie Ihre Fächer und zugehörigen Dokumente und Quizze',
    newSubject: 'Neues Fach',
    subjectName: 'Fachname',
    subjectDescription: 'Beschreibung',
    icon: 'Symbol',
    color: 'Farbe',
    documents: 'Dokumente',
    noSubjectsFound: 'Keine Fächer gefunden',
    createYourFirstSubject: 'Erstellen Sie Ihr erstes Fach',
    addDocument: 'Dokument hinzufügen',
    noDocumentsFound: 'Keine Dokumente in diesem Fach gefunden',
    addYourFirstDocument: 'Fügen Sie Ihr erstes Dokument hinzu',
    
    // Toast messages
    subjectCreated: 'Fach erfolgreich erstellt',
    subjectUpdated: 'Fach erfolgreich aktualisiert',
    subjectDeleted: 'Fach erfolgreich gelöscht',
    documentDeleted: 'Dokument erfolgreich gelöscht',
    quizDeleted: 'Quiz erfolgreich gelöscht',
    
    // File upload
    dragDropFile: 'Ziehen und ablegen Sie Ihre Datei hier',
    dropFileHere: 'Legen Sie Ihre Datei hier ab',
    selectFromComputer: 'Vom Computer auswählen',
    maxSize: 'Maximale Größe:',
    supportFor: 'Unterstützung für',
    files: 'Dateien',
    fileUploadNotSupported: 'Datei-Upload nicht unterstützt',
    fileUploadNotSupportedMsg: 'Der ausgewählte KI-Anbieter unterstützt keinen direkten Datei-Upload. Bitte wechseln Sie zu OpenAI oder fügen Sie Ihren Text direkt ein.',
    selectedFileSuccess: 'erfolgreich ausgewählt!',
    
    // AI Providers
    selectAIProvider: 'KI-Anbieter auswählen',
    openai: 'OpenAI',
    gemini: 'Google Gemini',
    claude: 'Anthropic Claude',
    mistral: 'Mistral AI',
    apiKey: 'API-Schlüssel',
    enterApiKey: 'Geben Sie Ihren API-Schlüssel ein',
    apiKeyRequired: 'API-Schlüssel erforderlich',
    
    // Models
    selectModel: 'Modell auswählen',
    defaultModel: 'Standardmodell',
    
    // Quiz page
    questionOf: 'Frage {current} von {total}',
    submitAnswer: 'Antwort einreichen',
    reviewQuiz: 'Quiz überprüfen',
    quizResults: 'Quiz-Ergebnisse',
    correctAnswers: 'Richtige Antworten',
    incorrectAnswers: 'Falsche Antworten',
    yourAnswer: 'Ihre Antwort',
    correctAnswer: 'Richtige Antwort',
    explanation: 'Erklärung',
    score: 'Punktzahl',
    retakeQuiz: 'Quiz wiederholen',
    backToDashboard: 'Zurück zum Dashboard',
    
    // Errors
    errorProcessingFile: 'Fehler bei der Verarbeitung der Datei',
    errorCreatingQuiz: 'Fehler beim Erstellen des Quiz',
    errorLoadingQuiz: 'Fehler beim Laden des Quiz',
    errorSavingQuiz: 'Fehler beim Speichern des Quiz',
  }
};
