export type Language = 'en' | 'it' | 'fr' | 'de';

export interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

export const translations: Translations = {
  en: {
    // Common
    appName: 'Quizzy Cat',
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
    change: 'Change',
    characters: 'characters',
    language: 'Language',
    languageChanged: 'Language changed successfully',
    
    // Navigation
    home: 'Home',
    upload: 'Create Quiz',
    quiz: 'Take Quiz',
    dashboard: 'Dashboard',
    subjects: 'Subjects',
    quizzes: 'Quizzes',
    
    // User Menu
    'My Dashboard': 'My Dashboard',
    'Manage Subjects': 'Manage Subjects',
    'Sign out': 'Sign out',
    'Sign in': 'Sign in',
    
    // Homepage
    heroTitle: 'Learn Smarter with Your',
    heroTitleHighlight: 'Feline Tutor',
    heroSubtitle: 'Upload your notes and let our AI create personalized quizzes. Study with style, earn XP, and level up with the help of your cat friend.',
    uploadMaterials: 'Upload Your Materials',
    seeHowItWorks: 'See How It Works',
    tutorWelcomeMessage: 'Hi there! I\'m your feline tutor. Let me help you ace those exams!',
    learningJourney: 'Your Learning Journey',
    howItWorks: 'How Quizzy Cat Works',
    platformDescription: 'Our intelligent cat-powered platform makes studying effective and surprisingly fun',
    readyToStart: 'Ready to Start Learning with Your Cat Tutor?',
    ctaDescription: 'Upload your study materials and let our AI generate personalized quiz questions. Rise through the ranks from Scholarly Kitten to Wisdom Tiger!',
    
    // Features
    aiQuizGeneration: 'AI Quiz Generation',
    aiQuizGenerationDesc: 'Upload your study materials and our AI will create personalized quizzes tailored to your content.',
    felineTutor: 'Feline Tutor',
    felineTutorDesc: 'Study with our intelligent and ironic cat tutor that provides feedback with a touch of humor.',
    progressTracking: 'Progress Tracking',
    progressTrackingDesc: 'Track your progress and identify weak areas to focus your study efforts efficiently.',
    
    // XP Levels
    scholarlyKitten: 'Scholarly Kitten',
    scholarlyKittenDesc: 'Just starting out on your learning journey',
    curiousCat: 'Curious Cat',
    curiousCatDesc: 'Building knowledge and asking good questions',
    cleverFeline: 'Clever Feline',
    cleverFelineDesc: 'Mastering concepts and connecting ideas',
    academicTabby: 'Academic Tabby',
    academicTabbyDesc: 'Applying knowledge in complex scenarios',
    wisdomTiger: 'Wisdom Tiger',
    wisdomTigerDesc: 'Teaching others and mastering difficult subjects',
    
    // Fixed missing translations - both camelCase and lowercase versions
    scholarlykitten: 'Scholarly Kitten',
    curiouscat: 'Curious Cat',
    cleverFeline: 'Clever Feline',
    cleverfeline: 'Clever Feline',
    academicTabby: 'Academic Tabby',
    academictabby: 'Academic Tabby',
    wisdomTiger: 'Wisdom Tiger',
    wisdomtiger: 'Wisdom Tiger',
    
    // XP Bar
    experienceProgress: 'Experience Progress',
    currentLevel: 'Current Level',
    toNextLevel: 'to next level',
    
    // New missing translations from logs
    enterTextToCreateQuiz: 'Enter text to create a quiz',
    enterContent: 'Enter content',
    usingAI: 'Using AI',
    
    // Upload page
    uploadTitle: 'Create Quiz',
    uploadSubtitle: 'Upload materials or paste text to generate quiz questions',
    chooseSource: 'Choose Source',
    configureQuiz: 'Configure Quiz',
    apiKeyInstruction: 'Please set your API key first',
    uploadDocument: 'Upload Document',
    pasteText: 'Or Paste Your Text',
    pasteTextPlaceholder: 'Paste your study notes, text or content here...',
    processText: 'Process Text',
    contentReady: 'Content Ready',
    quizSettings: 'Quiz Settings',
    difficultyLevel: 'Difficulty Level',
    questionTypes: 'Question Types',
    numberOfQuestions: 'Number of Questions:',
    createQuiz: 'Create Quiz',
    generatingQuiz: 'Generating Quiz...',
    textInput: 'Text Input',
    uploadInstructions: 'Upload your notes or paste your text. I\'ll help create the perfect quiz!',
    processingFile: 'Processing "{file}"... This file will be sent directly to the API for analysis.',
    fileReadyForQuiz: 'File "{file}" ready for quiz generation',
    fileAnalysisReady: 'Great! "{file}" will be sent directly to the AI for analysis. You can now configure your quiz settings.',
    errorProcessingFileMsg: 'Failed to process file. Please try again or paste text directly.',
    fileProcessingError: 'Sorry, I had trouble processing that file. Could you try a different format or paste your text directly?',
    enoughText: 'That\'s a good amount of text! I can definitely create some challenging questions from this.',
    textProcessed: 'Great! I\'ve processed your text. You can now configure your quiz settings.',
    textProcessedSuccess: 'Text processed successfully!',
    enterMoreText: 'Please enter more text (at least 100 characters).',
    needMoreText: 'I need more text to work with. Please enter at least a paragraph or two.',
    provideContent: 'Please provide content to generate a quiz',
    needMaterialsForQuiz: 'I need some material to work with! Please upload a file or add more text.',
    selectSubject: 'Please select a subject first',
    apiKeyRequiredMsg: 'Please set your {provider} API key first',
    processingMaterials: 'Processing your materials... This is exciting! I\'m creating challenging university-level questions based exactly on your content.',
    quizCreatedSuccess: 'Quiz created successfully!',
    couldNotCreateQuiz: 'I couldn\'t create a good quiz from this content. Please provide more detailed study material.',
    unableToGenerateQuiz: 'Unable to generate quiz. Please provide more detailed content or try a different file.',
    errorCreatingQuizMsg: 'Failed to create quiz. Please try again.',
    quizCreationError: 'Oops! Something went wrong. Let\'s try again, shall we?',
    creatingQuizFor: 'Creating a quiz for {subject}',
    fileWillBeSent: 'The file will be sent directly to the AI for analysis. This provides the most accurate quiz generation.',
    textContentReady: 'Your text content is ready for quiz generation. Configure the settings below to customize your quiz.',
    documentLoaded: 'I\'ve loaded "{document}" for you. You can now configure your quiz settings.',
    switchedToModel: 'Switched to {model}',
    aiModel: 'AI Model',
    selectAIModel: 'Select AI Model',
    selectModelDesc: 'Select a model to generate your quiz',
    usingModel: 'Using <span class="font-medium">{model}</span> to generate university-level quiz questions.',
    
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
    viewAllQuizzes: 'View All Quizzes',
    viewAllSubjects: 'View All Subjects',
    yourTopSubjects: 'Your Top Subjects',
    welcomeBack: 'Welcome back to Quizzy Cat!',
    dashboardSubtitle: 'Track your progress, review past quizzes, and create new ones',
    noRecentQuizzes: 'No recent quizzes found',
    takeYourFirstQuiz: 'Take your first quiz to see your results here',
    averageScore: 'Average Score',
    quizzesCompleted: 'Quizzes Completed',
    subjectsStudied: 'Subjects Studied',
    questionsAnswered: 'Questions Answered',
    
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
    errorLoadingQuiz: 'Error loading quiz',
    errorSavingQuiz: 'Error saving quiz'
  },
  
  it: {
    // Common
    appName: 'Quizzy Cat',
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
    change: 'Cambia',
    characters: 'caratteri',
    language: 'Lingua',
    languageChanged: 'Lingua modificata con successo',
    
    // Navigation
    home: 'Home',
    upload: 'Crea Quiz',
    quiz: 'Fai il Quiz',
    dashboard: 'Dashboard',
    subjects: 'Materie',
    quizzes: 'Quiz',
    
    // Homepage
    heroTitle: 'Impara in Modo Intelligente con il Tuo',
    heroTitleHighlight: 'Tutor Felino',
    heroSubtitle: 'Carica i tuoi appunti e lascia che la nostra IA crei quiz personalizzati. Studia con stile, guadagna XP, e sali di livello con l\'aiuto del tuo amico gatto.',
    uploadMaterials: 'Carica i Tuoi Materiali',
    seeHowItWorks: 'Vedi Come Funziona',
    tutorWelcomeMessage: 'Ciao! Sono il tuo tutor felino. Lascia che ti aiuti a superare quegli esami!',
    learningJourney: 'Il Tuo Percorso di Apprendimento',
    howItWorks: 'Come Funziona Quizzy Cat',
    platformDescription: 'La nostra piattaforma intelligente alimentata da gatti rende lo studio efficace e sorprendentemente divertente',
    readyToStart: 'Pronto a Iniziare a Imparare con il Tuo Tutor Felino?',
    ctaDescription: 'Carica i tuoi materiali di studio e lascia che la nostra IA generi domande di quiz personalizzate. Sali di rango da Gattino Studioso a Tigre della Saggezza!',
    
    // Features
    aiQuizGeneration: 'Generazione Quiz con IA',
    aiQuizGenerationDesc: 'Carica i tuoi materiali di studio e la nostra IA creerà quiz personalizzati adattati al tuo contenuto.',
    felineTutor: 'Tutor Felino',
    felineTutorDesc: 'Studia con il nostro tutor gatto intelligente e ironico che fornisce feedback con un tocco di umorismo.',
    progressTracking: 'Monitoraggio Progressi',
    progressTrackingDesc: 'Tieni traccia dei tuoi progressi e identifica le aree deboli per concentrare i tuoi sforzi di studio in modo efficiente.',
    
    // XP Levels
    scholarlyKitten: 'Gattino Studioso',
    scholarlyKittenDesc: 'Stai appena iniziando il tuo percorso di apprendimento',
    curiousCat: 'Gatto Curioso',
    curiousCatDesc: 'Costruisci conoscenza e fai buone domande',
    cleverFeline: 'Felino Intelligente',
    cleverFelineDesc: 'Padroneggi concetti e colleghi idee',
    academicTabby: 'Gatto Accademico',
    academicTabbyDesc: 'Applichi conoscenza in scenari complessi',
    wisdomTiger: 'Tigre della Saggezza',
    wisdomTigerDesc: 'Insegni agli altri e padroneggi materie difficili',
    
    // XP Bar
    experienceProgress: 'Progresso Esperienza',
    currentLevel: 'Livello Attuale',
    toNextLevel: 'al prossimo livello',
    
    // Upload page
    uploadTitle: 'Crea Quiz',
    uploadSubtitle: 'Carica materiali o incolla il testo per generare domande del quiz',
    chooseSource: 'Scegli Fonte',
    configureQuiz: 'Configura Quiz',
    apiKeyInstruction: 'Imposta prima la tua API key',
    uploadDocument: 'Carica Documento',
    pasteText: 'O Incolla il tuo Testo',
    pasteTextPlaceholder: 'Incolla qui i tuoi appunti di studio, testo o contenuto...',
    processText: 'Elabora Testo',
    contentReady: 'Contenuto Pronto',
    quizSettings: 'Impostazioni Quiz',
    difficultyLevel: 'Livello di Difficoltà',
    questionTypes: 'Tipi di Domande',
    numberOfQuestions: 'Numero di Domande:',
    createQuiz: 'Crea Quiz',
    generatingQuiz: 'Generando Quiz...',
    textInput: 'Testo Input',
    uploadInstructions: 'Carica i tuoi appunti o incolla il tuo testo. Ti aiuterò a creare il quiz perfetto!',
    processingFile: 'Elaborazione di "{file}"... Questo file verrà inviato direttamente all\'API per l\'analisi.',
    fileReadyForQuiz: 'File "{file}" pronto per la generazione del quiz',
    fileAnalysisReady: 'Ottimo! "{file}" verrà inviato direttamente all\'IA per l\'analisi. Ora puoi configurare le impostazioni del tuo quiz.',
    errorProcessingFileMsg: 'Errore nell\'elaborazione del file. Riprova o incolla direttamente il testo.',
    fileProcessingError: 'Mi dispiace, ho avuto problemi a elaborare quel file. Potresti provare un formato diverso o incollare direttamente il tuo testo?',
    enoughText: 'Questa è una buona quantità di testo! Posso sicuramente creare alcune domande stimolanti da questo.',
    textProcessed: 'Ottimo! Ho elaborato il tuo testo. Ora puoi configurare le impostazioni del tuo quiz.',
    textProcessedSuccess: 'Testo elaborato con successo!',
    enterMoreText: 'Inserisci più testo (almeno 100 caratteri).',
    needMoreText: 'Ho bisogno di più testo su cui lavorare. Inserisci almeno un paio di paragrafi.',
    provideContent: 'Fornisci contenuto per generare un quiz',
    needMaterialsForQuiz: 'Ho bisogno di materiale su cui lavorare! Carica un file o aggiungi più testo.',
    selectSubject: 'Seleziona prima una materia',
    apiKeyRequiredMsg: 'Imposta prima la tua chiave API {provider}',
    processingMaterials: 'Elaborazione dei tuoi materiali... Questo è emozionante! Sto creando domande impegnative di livello universitario basate esattamente sul tuo contenuto.',
    quizCreatedSuccess: 'Quiz creato con successo!',
    couldNotCreateQuiz: 'Non sono riuscito a creare un buon quiz da questo contenuto. Fornisci materiale di studio più dettagliato.',
    unableToGenerateQuiz: 'Impossibile generare il quiz. Fornisci contenuto più dettagliato o prova un file diverso.',
    errorCreatingQuizMsg: 'Errore nella creazione del quiz. Riprova.',
    quizCreationError: 'Ops! Qualcosa è andato storto. Riproviamo, va bene?',
    creatingQuizFor: 'Creazione di un quiz per {subject}',
    fileWillBeSent: 'Il file verrà inviato direttamente all\'IA per l\'analisi. Questo fornisce la generazione di quiz più accurata.',
    textContentReady: 'Il tuo contenuto di testo è pronto per la generazione del quiz. Configura le impostazioni qui sotto per personalizzare il tuo quiz.',
    documentLoaded: 'Ho caricato "{document}" per te. Ora puoi configurare le impostazioni del tuo quiz.',
    switchedToModel: 'Passato a {model}',
    aiModel: 'Modello IA',
    selectAIModel: 'Seleziona Modello IA',
    selectModelDesc: 'Seleziona un modello per generare il tuo quiz',
    usingModel: 'Utilizzo di <span class="font-medium">{model}</span> per generare domande di quiz di livello universitario.',
    
    // Difficulty levels
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzato',
    basicRecall: 'Domande di richiamo base',
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
    continueLearning: 'Continua ad Apprendere',
    viewAllQuizzes: 'Visualizza Tutti i Quiz',
    viewAllSubjects: 'Visualizza Tutte le Materie',
    yourTopSubjects: 'Le Tue Materie Principali',
    welcomeBack: 'Bentornato su Quizzy Cat!',
    dashboardSubtitle: 'Monitora i tuoi progressi, rivedi i quiz passati e creane di nuovi',
    noRecentQuizzes: 'Nessun quiz recente trovato',
    takeYourFirstQuiz: 'Fai il tuo primo quiz per vedere i risultati qui',
    averageScore: 'Punteggio Medio',
    quizzesCompleted: 'Quiz Completati',
    subjectsStudied: 'Materie Studiate',
    questionsAnswered: 'Domande Risposte',
    
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
    createYourFirstSubject: 'Crea la Tua Prima Materia',
    addDocument: 'Aggiungi Documento',
    noDocumentsFound: 'Nessun documento trovato in questa materia',
    addYourFirstDocument: 'Aggiungi il Tuo Primo Documento',
    
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
    fileUploadNotSupportedMsg: 'Il provider IA selezionato non supporta caricamenti diretti di file. Passa a OpenAI o incolla direttamente il tuo testo.',
    selectedFileSuccess: 'selezionato con successo!',
    
    // AI Providers
    selectAIProvider: 'Seleziona Provider IA',
    openai: 'OpenAI',
    gemini: 'Google Gemini',
    claude: 'Anthropic Claude',
    mistral: 'Mistral AI',
    apiKey: 'Chiave API',
    enterApiKey: 'Inserisci la tua chiave API',
    apiKeyRequired: 'Chiave API richiesta',
    
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
    yourAnswer: 'La Tua Risposta',
    correctAnswer: 'Risposta Corretta',
    explanation: 'Spiegazione',
    score: 'Punteggio',
    retakeQuiz: 'Rifai il Quiz',
    backToDashboard: 'Torna alla Dashboard',
    
    // Errors
    errorProcessingFile: 'Errore nell\'elaborazione del file',
    errorLoadingQuiz: 'Errore nel caricamento del quiz',
    errorSavingQuiz: 'Errore nel salvataggio del quiz'
  },
  
  fr: {
    // Common
    appName: 'Quizzy Cat',
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
    change: 'Changer',
    characters: 'caractères',
    language: 'Langue',
    languageChanged: 'Langue modifiée avec succès',
    
    // Navigation
    home: 'Accueil',
    upload: 'Créer Quiz',
    quiz: 'Faire le Quiz',
    dashboard: 'Tableau de Bord',
    subjects: 'Matières',
    quizzes: 'Quiz',
    
    // Homepage
    heroTitle: 'Apprenez plus intelligemment avec votre',
    heroTitleHighlight: 'Tuteur Félin',
    heroSubtitle: 'Téléchargez vos notes et laissez notre IA créer des quiz personnalisés. Étudiez avec style, gagnez de l\'XP et passez au niveau supérieur avec l\'aide de votre ami félin.',
    uploadMaterials: 'Téléchargez vos documents',
    seeHowItWorks: 'Voyez comment ça marche',
    tutorWelcomeMessage: 'Salut ! Je suis votre tuteur félin. Laissez-moi vous aider à réussir ces examens !',
    learningJourney: 'Votre parcours d\'apprentissage',
    howItWorks: 'Comment fonctionne Quizzy Cat',
    platformDescription: 'Notre plateforme intelligente alimentée par des chats rend l\'étude efficace et étonnamment amusante',
    readyToStart: 'Prêt à commencer à apprendre avec votre tuteur félin ?',
    ctaDescription: 'Téléchargez vos supports d\'étude et laissez notre IA générer des questions de quiz personnalisées. Montez en grade, du chaton érudit au tigre de la sagesse !',
    
    // Features
    aiQuizGeneration: 'Génération de quiz par l\'IA',
    aiQuizGenerationDesc: 'Téléchargez vos supports d\'étude et notre IA créera des quiz personnalisés adaptés à votre contenu.',
    felineTutor: 'Tuteur Félin',
    felineTutorDesc: 'Étudiez avec notre tuteur chat intelligent et ironique qui fournit des commentaires avec une touche d\'humour.',
    progressTracking: 'Suivi de progression',
    progressTrackingDesc: 'Suivez vos progrès et identifiez les domaines faibles pour concentrer vos efforts d\'étude efficacement.',
    
    // XP Levels
    scholarlyKitten: 'Chaton Érudit',
    scholarlyKittenDesc: 'Vous débutez tout juste votre parcours d\'apprentissage',
    curiousCat: 'Neugierige Katze',
    curiousCatDesc: 'Vous développez vos connaissances et posez de bonnes questions',
    cleverFeline: 'Clevere Katze',
    cleverFelineDesc: 'Vous maîtrisez des concepts et établissez des liens entre les idées',
    academicTabby: 'Tabby Académique',
    academicTabbyDesc: 'Vous appliquez vos connaissances dans des scénarios complexes',
    wisdomTiger: 'Tigre de la Sagesse',
    wisdomTigerDesc: 'Vous enseignez aux autres et maîtrisez des sujets difficiles',
    
    // Fixed missing translations
    scholarlykitten: 'Chaton Érudit',
    curiouscat: 'Neugierige Katze',
    cleverFeline: 'Clevere Katze',
    cleverfeline: 'Clevere Katze',
    academicTabby: 'Tabby Académique',
    academictabby: 'Tabby Académique',
    wisdomTiger: 'Tigre de la Sagesse',
    wisdomtiger: 'Tigre de la Sagesse',
    
    // Upload page
    uploadTitle: 'Créer Quiz',
    uploadSubtitle: 'Téléchargez des documents ou collez du texte pour générer des questions de quiz',
    chooseSource: 'Choisir Source',
    configureQuiz: 'Configurer Quiz',
    apiKeyInstruction: 'Veuillez d\'abord définir votre clé API',
    uploadDocument: 'Télécharger Document',
    pasteText: 'Ou Collez Votre Texte',
    pasteTextPlaceholder: 'Collez ici vos notes d\'étude, texte ou contenu...',
    processText: 'Traiter le Texte',
    contentReady: 'Contenu Prêt',
    quizSettings: 'Paramètres du Quiz',
    difficultyLevel: 'Niveau de Difficulté',
    questionTypes: 'Types de Questions',
    numberOfQuestions: 'Nombre de Questions:',
    createQuiz: 'Créer Quiz',
    generatingQuiz: 'Génération du Quiz...',
    textInput: 'Saisie de Texte',
    enterTextToCreateQuiz: 'Entrez du texte pour créer un quiz',
    enterContent: 'Entrez du contenu',
    usingAI: 'Utilisation de l\'IA'
  },
  
  de: {
    // Common
    appName: 'Quizzy Cat',
    loading: 'Laden...',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    create: 'Erstellen',
    submit: 'Absenden',
    back: 'Zurück',
    next: 'Weiter',
    close: 'Schließen',
    change: 'Ändern',
    characters: 'Zeichen',
    language: 'Sprache',
    languageChanged: 'Sprache erfolgreich geändert',
    
    // Navigation
    home: 'Startseite',
    upload: 'Quiz erstellen',
    quiz: 'Quiz nehmen',
    dashboard: 'Dashboard',
    subjects: 'Fächer',
    quizzes: 'Quizze',
    
    // User Menu
    'My Dashboard': 'Mein Dashboard',
    'Manage Subjects': 'Fächer verwalten',
    'Sign out': 'Abmelden',
    'Sign in': 'Anmelden',
    
    // Homepage
    heroTitle: 'Lerne intelligenter mit deinem',
    heroTitleHighlight: 'Katzen-Tutor',
    heroSubtitle: 'Lade deine Notizen hoch und lass unsere KI personalisierte Quizze erstellen. Lerne mit Stil, verdiene XP und steige mit Hilfe deines Katzenfreundes auf.',
    uploadMaterials: 'Lade deine Materialien hoch',
    seeHowItWorks: 'Sieh wie es funktioniert',
    tutorWelcomeMessage: 'Hallo! Ich bin dein Katzen-Tutor. Lass mich dir helfen, diese Prüfungen zu meistern!',
    learningJourney: 'Deine Lernreise',
    howItWorks: 'Wie Quizzy Cat funktioniert',
    platformDescription: 'Unsere intelligente katzengesteuerte Plattform macht das Lernen effektiv und überraschend unterhaltsam',
    readyToStart: 'Bereit, mit deinem Katzen-Tutor zu lernen?',
    ctaDescription: 'Lade deine Lernmaterialien hoch und lass unsere KI personalisierte Quizfragen generieren. Steige in den Rängen vom Gelehrten Kätzchen zum Weisheitstiger auf!',
    
    // Features
    aiQuizGeneration: 'KI-Quiz-Generierung',
    aiQuizGenerationDesc: 'Lade deine Lernmaterialien hoch und unsere KI erstellt personalisierte Quizze, die auf deine Inhalte zugeschnitten sind.',
    felineTutor: 'Katzen-Tutor',
    felineTutorDesc: 'Lerne mit unserem intelligenten und ironischen Katzen-Tutor, der Feedback mit einem Hauch von Humor gibt.',
    progressTracking: 'Fortschrittsverfolgung',
    progressTrackingDesc: 'Verfolge deinen Fortschritt und identifiziere Schwachstellen, um deine Lernbemühungen effizient zu fokussieren.',
    
    // XP Levels
    scholarlyKitten: 'Gelehrtes Kätzchen',
    scholarlyKittenDesc: 'Gerade erst am Anfang deiner Lernreise',
    curiousCat: 'Neugierige Katze',
    curiousCatDesc: 'Baut Wissen auf und stellt gute Fragen',
    cleverFeline: 'Clevere Katze',
    cleverFelineDesc: 'Beherrscht Konzepte und verbindet Ideen',
    academicTabby: 'Akademische Tabby',
    academicTabbyDesc: 'Wendet Wissen in komplexen Szenarien an',
    wisdomTiger: 'Weisheitstiger',
    wisdomTigerDesc: 'Unterrichtet andere und beherrscht schwierige Themen',
    
    // Fixed missing translations
    scholarlykitten: 'Gelehrtes Kätzchen',
    curiouscat: 'Neugierige Katze',
    cleverFeline: 'Clevere Katze',
    cleverfeline: 'Clevere Katze',
    academicTabby: 'Akademische Tabby',
    academictabby: 'Akademische Tabby',
    wisdomTiger: 'Weisheitstiger',
    wisdomtiger: 'Weisheitstiger',
    
    // Upload page
    uploadTitle: 'Quiz erstellen',
    uploadSubtitle: 'Materialien hochladen oder Text einfügen, um Quizfragen zu generieren',
    chooseSource: 'Quelle wählen',
    configureQuiz: 'Quiz konfigurieren',
    apiKeyInstruction: 'Bitte zuerst deinen API-Schlüssel festlegen',
    uploadDocument: 'Dokument hochladen',
    pasteText: 'Oder füge deinen Text ein',
    pasteTextPlaceholder: 'Füge hier deine Lernnotizen, Texte oder Inhalte ein...',
    processText: 'Text verarbeiten',
    contentReady: 'Inhalt bereit',
    quizSettings: 'Quiz Einstellungen',
    difficultyLevel: 'Schwierigkeitsgrad',
    questionTypes: 'Fragetypen',
    numberOfQuestions: 'Anzahl der Fragen:',
    createQuiz: 'Quiz erstellen',
    generatingQuiz: 'Quiz wird generiert...',
    textInput: 'Texteingabe',
    uploadInstructions: 'Lade deine Notizen hoch oder füge deinen Text ein. Ich helfe dir, das perfekte Quiz zu erstellen!',
    processingFile: 'Verarbeite "{file}"... Diese Datei wird direkt zur Analyse an die API gesendet.',
    fileReadyForQuiz: 'Datei "{file}" bereit für die Quizgenerierung',
    fileAnalysisReady: 'Super! "{file}" wird direkt zur Analyse an die KI gesendet. Du kannst jetzt deine Quiz-Einstellungen konfigurieren.',
    errorProcessingFileMsg: 'Fehler beim Verarbeiten der Datei. Bitte versuche es erneut oder füge den Text direkt ein.',
    fileProcessingError: 'Entschuldigung, ich hatte Probleme beim Verarbeiten dieser Datei. Könntest du ein anderes Format ausprobieren oder deinen Text direkt einfügen?',
    enoughText: 'Das ist eine gute Menge Text! Ich kann daraus auf jeden Fall einige anspruchsvolle Fragen erstellen.',
    textProcessed: 'Super! Ich habe deinen Text verarbeitet. Du kannst jetzt deine Quiz-Einstellungen konfigurieren.',
    textProcessedSuccess: 'Text erfolgreich verarbeitet!',
    enterMoreText: 'Bitte gib mehr Text ein (mindestens 100 Zeichen).',
    needMoreText: 'Ich brauche mehr Text zum Arbeiten. Bitte gib mindestens ein oder zwei Absätze ein.',
    provideContent: 'Bitte gib Inhalte an, um ein Quiz zu generieren',
    needMaterialsForQuiz: 'Ich brauche etwas Material zum Arbeiten! Lade eine Datei hoch oder füge mehr Text hinzu.',
    selectSubject: 'Bitte wähle zuerst ein Fach aus',
    apiKeyRequiredMsg: 'Bitte lege zuerst deinen {provider} API-Schlüssel fest',
    processingMaterials: 'Verarbeite deine Materialien... Das ist aufregend! Ich erstelle anspruchsvolle Fragen auf Universitätsniveau, die genau auf deinen Inhalten basieren.',
    quizCreatedSuccess: 'Quiz erfolgreich erstellt!',
    couldNotCreateQuiz: 'Ich konnte aus diesem Inhalt kein gutes Quiz erstellen. Bitte stelle detaillierteres Lernmaterial zur Verfügung.',
    unableToGenerateQuiz: 'Quiz kann nicht generiert werden. Bitte stelle detailliertere Inhalte bereit oder versuche es mit einer anderen Datei.',
    errorCreatingQuizMsg: 'Fehler beim Erstellen des Quiz. Bitte versuche es erneut.',
    quizCreationError: 'Hoppla! Irgendwas ist schief gelaufen. Lass es uns noch einmal versuchen, ja?',
    creatingQuizFor: 'Erstelle ein Quiz für {subject}',
    fileWillBeSent: 'Die Datei wird direkt zur Analyse an die KI gesendet. Dies ermöglicht die genaueste Quizgenerierung.',
    textContentReady: 'Dein Textinhalt ist bereit für die Quizgenerierung. Konfiguriere die Einstellungen unten, um dein Quiz anzupassen.',
    documentLoaded: 'Ich habe "{document}" für dich geladen. Du kannst jetzt deine Quiz-Einstellungen konfigurieren.',
    switchedToModel: 'Gewechselt zu {model}',
    aiModel: 'KI-Modell',
    selectAIModel: 'KI-Modell auswählen',
    selectModelDesc: 'Wähle ein Modell aus, um dein Quiz zu generieren',
    usingModel: 'Verwende <span class="font-medium">{model}</span>, um Quizfragen auf Universitätsniveau zu generieren.',

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
    openEnded: 'Offen',

    // Dashboard
    recentQuizzes: 'Letzte Quizze',
    skillsProgress: 'Fertigkeiten Fortschritt',
    quickActions: 'Schnellaktionen',
    areasToImprove: 'Bereiche zu verbessern',
    createNewQuiz: 'Neues Quiz erstellen',
    continueLearning: 'Weiter lernen',
    viewAllQuizzes: 'Alle Quizze ansehen',
    viewAllSubjects: 'Alle Fächer ansehen',
    yourTopSubjects: 'Deine Top-Fächer',
    welcomeBack: 'Willkommen zurück zu Quizzy Cat!',
    dashboardSubtitle: 'Verfolge deinen Fortschritt, überprüfe vergangene Quizze und erstelle neue',
    noRecentQuizzes: 'Keine letzten Quizze gefunden',
    takeYourFirstQuiz: 'Mache dein erstes Quiz, um deine Ergebnisse hier zu sehen',
    averageScore: 'Durchschnittliche Punktzahl',
    quizzesCompleted: 'Quizze abgeschlossen',
    subjectsStudied: 'Fächer studiert',
    questionsAnswered: 'Fragen beantwortet',

    // Subjects
    subjectManager: 'Fachmanager',
    subjectManagerSubtitle: 'Erstelle, bearbeite und verwalte deine Fächer und zugehörigen Dokumente und Quizze',
    newSubject: 'Neues Fach',
    subjectName: 'Fachname',
    subjectDescription: 'Beschreibung',
    icon: 'Symbol',
    color: 'Farbe',
    documents: 'Dokumente',
    noSubjectsFound: 'Keine Fächer gefunden',
    createYourFirstSubject: 'Erstelle dein erstes Fach',
    addDocument: 'Dokument hinzufügen',
    noDocumentsFound: 'Keine Dokumente in diesem Fach gefunden',
    addYourFirstDocument: 'Füge dein erstes Dokument hinzu',
    
    // New missing translations
    enterTextToCreateQuiz: 'Text eingeben, um ein Quiz zu erstellen',
    enterContent: 'Inhalt eingeben',
    usingAI: 'KI verwenden'
  }
};
