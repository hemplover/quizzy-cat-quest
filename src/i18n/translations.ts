
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
    
    // Upload page
    uploadTitle: 'Créer Quiz',
    uploadSubtitle: 'Téléchargez des documents ou collez du texte pour générer des questions de quiz',
    chooseSource: 'Choisir Source',
    configureQuiz: 'Configurer Quiz',
    apiKeyInstruction: 'Veuillez d\'abord définir votre clé API',
    uploadDocument: 'Télécharger Document',
    pasteText: 'Ou Collez votre Texte',
    pasteTextPlaceholder: 'Collez ici vos notes d\'étude, texte ou contenu...',
    processText: 'Traiter Texte',
    contentReady: 'Contenu Prêt',
    quizSettings: 'Paramètres du Quiz',
    difficultyLevel: 'Niveau de Difficulté',
    questionTypes: 'Types de Questions',
    numberOfQuestions: 'Nombre de Questions:',
    createQuiz: 'Créer Quiz',
    generatingQuiz: 'Génération du Quiz...',
    textInput: 'Texte Input',
    uploadInstructions: 'Téléchargez vos notes ou collez votre texte. Je vous aiderai à créer le quiz parfait !',
    processingFile: 'Traitement de "{file}"... Ce fichier sera envoyé directement à l\'API pour analyse.',
    fileReadyForQuiz: 'Fichier "{file}" prêt pour la génération du quiz',
    fileAnalysisReady: 'Super ! "{file}" sera envoyé directement à l\'IA pour analyse. Vous pouvez maintenant configurer les paramètres de votre quiz.',
    errorProcessingFileMsg: 'Erreur lors du traitement du fichier. Veuillez réessayer ou coller directement le texte.',
    fileProcessingError: 'Désolé, j\'ai eu du mal à traiter ce fichier. Pourriez-vous essayer un format différent ou coller directement votre texte ?',
    enoughText: 'C\'est une bonne quantité de texte ! Je peux certainement créer des questions stimulantes à partir de cela.',
    textProcessed: 'Super ! J\'ai traité votre texte. Vous pouvez maintenant configurer les paramètres de votre quiz.',
    textProcessedSuccess: 'Texte traité avec succès !',
    enterMoreText: 'Veuillez entrer plus de texte (au moins 100 caractères).',
    needMoreText: 'J\'ai besoin de plus de texte pour travailler. Veuillez entrer au moins un ou deux paragraphes.',
    provideContent: 'Veuillez fournir du contenu pour générer un quiz',
    needMaterialsForQuiz: 'J\'ai besoin de matériel pour travailler ! Veuillez télécharger un fichier ou ajouter plus de texte.',
    selectSubject: 'Veuillez d\'abord sélectionner une matière',
    apiKeyRequiredMsg: 'Veuillez d\'abord définir votre clé API {provider}',
    processingMaterials: 'Traitement de vos documents... C\'est passionnant ! Je crée des questions de niveau universitaire stimulantes basées exactement sur votre contenu.',
    quizCreatedSuccess: 'Quiz créé avec succès !',
    couldNotCreateQuiz: 'Je n\'ai pas pu créer un bon quiz à partir de ce contenu. Veuillez fournir du matériel d\'étude plus détaillé.',
    unableToGenerateQuiz: 'Impossible de générer le quiz. Veuillez fournir un contenu plus détaillé ou essayer un fichier différent.',
    errorCreatingQuizMsg: 'Erreur lors de la création du quiz. Veuillez réessayer.',
    quizCreationError: 'Oups! Quelque chose s\'est mal passé. Réessayons, d\'accord ?',
    creatingQuizFor: 'Création d\'un quiz pour {subject}',
    fileWillBeSent: 'Le fichier sera envoyé directement à l\'IA pour analyse. Cela fournit la génération de quiz la plus précise.',
    textContentReady: 'Votre contenu textuel est prêt pour la génération du quiz. Configurez les paramètres ci-dessous pour personnaliser votre quiz.',
    documentLoaded: 'J\'ai chargé "{document}" pour vous. Vous pouvez maintenant configurer les paramètres de votre quiz.',
    switchedToModel: 'Basculé vers {model}',
    aiModel: 'Modèle IA',
    selectAIModel: 'Sélectionner un Modèle IA',
    selectModelDesc: 'Sélectionnez un modèle pour générer votre quiz',
    usingModel: 'Utilisation de <span class="font-medium">{model}</span> pour générer des questions de quiz de niveau universitaire.',
    
    // Difficulty levels
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
    basicRecall: 'Questions de rappel de base',
    applicationConcepts: 'Application de concepts',
    analysisSynthesis: 'Analyse et synthèse',
    
    // Question types
    multipleChoice: 'Choix Multiple',
    trueFalse: 'Vrai/Faux',
    openEnded: 'Réponse Ouverte',
    
    // Dashboard
    recentQuizzes: 'Quiz Récents',
    skillsProgress: 'Progression des Compétences',
    quickActions: 'Actions Rapides',
    areasToImprove: 'Domaines à Améliorer',
    createNewQuiz: 'Créer Nouveau Quiz',
    continueLearning: 'Continuer l\'Apprentissage',
    viewAllQuizzes: 'Voir Tous les Quiz',
    viewAllSubjects: 'Voir Toutes les Matières',
    yourTopSubjects: 'Vos Matières Principales',
    welcomeBack: 'Bienvenue sur Quizzy Cat !',
    dashboardSubtitle: 'Suivez votre progression, révisez les quiz passés et créez-en de nouveaux',
    noRecentQuizzes: 'Aucun quiz récent trouvé',
    takeYourFirstQuiz: 'Faites votre premier quiz pour voir vos résultats ici',
    averageScore: 'Score Moyen',
    quizzesCompleted: 'Quiz Terminés',
    subjectsStudied: 'Matières Étudiées',
    questionsAnswered: 'Questions Répondues',
    
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
    createYourFirstSubject: 'Créez Votre Première Matière',
    addDocument: 'Ajouter Document',
    noDocumentsFound: 'Aucun document trouvé dans cette matière',
    addYourFirstDocument: 'Ajoutez Votre Premier Document',
    
    // Toast messages
    subjectCreated: 'Matière créée avec succès',
    subjectUpdated: 'Matière mise à jour avec succès',
    subjectDeleted: 'Matière supprimée avec succès',
    documentDeleted: 'Document supprimé avec succès',
    quizDeleted: 'Quiz supprimé avec succès',
    
    // File upload
    dragDropFile: 'Glissez et déposez votre fichier ici',
    dropFileHere: 'Déposez votre fichier ici',
    selectFromComputer: 'Sélectionner depuis l\'ordinateur',
    maxSize: 'Taille maximale:',
    supportFor: 'Support pour',
    files: 'fichiers',
    fileUploadNotSupported: 'Téléchargement de Fichier Non Pris en Charge',
    fileUploadNotSupportedMsg: 'Le fournisseur d\'IA sélectionné ne prend pas en charge les téléchargements directs de fichiers. Veuillez passer à OpenAI ou coller directement votre texte.',
    selectedFileSuccess: 'sélectionné avec succès !',
    
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
    defaultModel: 'Modèle Par Défaut',
    
    // Quiz page
    questionOf: 'Question {current} sur {total}',
    submitAnswer: 'Soumettre Réponse',
    reviewQuiz: 'Réviser Quiz',
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
    errorLoadingQuiz: 'Erreur lors du chargement du quiz',
    errorSavingQuiz: 'Erreur lors de l\'enregistrement du quiz'
  },
  
  de: {
    // Common
    appName: 'Quizzy Cat',
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
    change: 'Ändern',
    characters: 'Zeichen',
    language: 'Sprache',
    languageChanged: 'Sprache erfolgreich geändert',
    
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
    pasteTextPlaceholder: 'Fügen Sie hier Ihre Studiennotizen, Text oder Inhalt ein...',
    processText: 'Text verarbeiten',
    contentReady: 'Inhalt bereit',
    quizSettings: 'Quiz-Einstellungen',
    difficultyLevel: 'Schwierigkeitsgrad',
    questionTypes: 'Fragetypen',
    numberOfQuestions: 'Anzahl der Fragen:',
    createQuiz: 'Quiz erstellen',
    generatingQuiz: 'Quiz wird generiert...',
    textInput: 'Text Input',
    uploadInstructions: 'Laden Sie Ihre Notizen hoch oder fügen Sie Ihren Text ein. Ich helfe Ihnen, das perfekte Quiz zu erstellen!',
    processingFile: 'Verarbeitung von "{file}"... Diese Datei wird zur Analyse direkt an die API gesendet.',
    fileReadyForQuiz: 'Datei "{file}" bereit für die Quiz-Generierung',
    fileAnalysisReady: 'Großartig! "{file}" wird zur Analyse direkt an die KI gesendet. Sie können jetzt die Einstellungen für Ihr Quiz konfigurieren.',
    errorProcessingFileMsg: 'Fehler bei der Verarbeitung der Datei. Bitte versuchen Sie es erneut oder fügen Sie den Text direkt ein.',
    fileProcessingError: 'Entschuldigung, ich hatte Schwierigkeiten, diese Datei zu verarbeiten. Könnten Sie ein anderes Format ausprobieren oder Ihren Text direkt einfügen?',
    enoughText: 'Das ist eine gute Menge an Text! Ich kann definitiv einige anspruchsvolle Fragen daraus erstellen.',
    textProcessed: 'Großartig! Ich habe Ihren Text verarbeitet. Sie können jetzt die Einstellungen für Ihr Quiz konfigurieren.',
    textProcessedSuccess: 'Text erfolgreich verarbeitet!',
    enterMoreText: 'Bitte geben Sie mehr Text ein (mindestens 100 Zeichen).',
    needMoreText: 'Ich brauche mehr Text zum Arbeiten. Bitte geben Sie mindestens ein oder zwei Absätze ein.',
    provideContent: 'Bitte stellen Sie Inhalte bereit, um ein Quiz zu generieren',
    needMaterialsForQuiz: 'Ich brauche Material zum Arbeiten! Bitte laden Sie eine Datei hoch oder fügen Sie mehr Text hinzu.',
    selectSubject: 'Bitte wählen Sie zuerst ein Fach aus',
    apiKeyRequiredMsg: 'Bitte legen Sie zuerst Ihren {provider} API-Schlüssel fest',
    processingMaterials: 'Verarbeitung Ihrer Materialien... Das ist aufregend! Ich erstelle anspruchsvolle Fragen auf Universitätsniveau, die genau auf Ihren Inhalt zugeschnitten sind.',
    quizCreatedSuccess: 'Quiz erfolgreich erstellt!',
    couldNotCreateQuiz: 'Ich konnte aus diesem Inhalt kein gutes Quiz erstellen. Bitte stellen Sie detaillierteres Studienmaterial bereit.',
    unableToGenerateQuiz: 'Quiz konnte nicht generiert werden. Bitte stellen Sie detailliertere Inhalte bereit oder probieren Sie eine andere Datei aus.',
    errorCreatingQuizMsg: 'Fehler beim Erstellen des Quiz. Bitte versuchen Sie es erneut.',
    quizCreationError: 'Hoppla! Etwas ist schiefgelaufen. Versuchen wir es noch einmal, okay?',
    creatingQuizFor: 'Erstellung eines Quiz für {subject}',
    fileWillBeSent: 'Die Datei wird zur Analyse direkt an die KI gesendet. Dies bietet die genaueste Quiz-Generierung.',
    textContentReady: 'Ihr Textinhalt ist bereit für die Quiz-Generierung. Konfigurieren Sie die Einstellungen unten, um Ihr Quiz anzupassen.',
    documentLoaded: 'Ich habe "{document}" für Sie geladen. Sie können jetzt die Einstellungen für Ihr Quiz konfigurieren.',
    switchedToModel: 'Zu {model} gewechselt',
    aiModel: 'KI-Modell',
    selectAIModel: 'KI-Modell auswählen',
    selectModelDesc: 'Wählen Sie ein Modell zur Generierung Ihres Quiz',
    usingModel: 'Verwendung von <span class="font-medium">{model}</span> zur Generierung von Quiz-Fragen auf Universitätsniveau.',
    
    // Difficulty levels
    beginner: 'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced: 'Experte',
    basicRecall: 'Grundlegende Erinnerungsfragen',
    applicationConcepts: 'Anwendung von Konzepten',
    analysisSynthesis: 'Analyse und Synthese',
    
    // Question types
    multipleChoice: 'Multiple Choice',
    trueFalse: 'Wahr/Falsch',
    openEnded: 'Offene Fragen',
    
    // Dashboard
    recentQuizzes: 'Aktuelle Quizze',
    skillsProgress: 'Lernfortschritt',
    quickActions: 'Schnellaktionen',
    areasToImprove: 'Verbesserungsbereiche',
    createNewQuiz: 'Neues Quiz erstellen',
    continueLearning: 'Lernen fortsetzen',
    viewAllQuizzes: 'Alle Quizze anzeigen',
    viewAllSubjects: 'Alle Fächer anzeigen',
    yourTopSubjects: 'Ihre Top-Fächer',
    welcomeBack: 'Willkommen zurück bei Quizzy Cat!',
    dashboardSubtitle: 'Verfolgen Sie Ihren Fortschritt, überprüfen Sie vergangene Quizze und erstellen Sie neue',
    noRecentQuizzes: 'Keine aktuellen Quizze gefunden',
    takeYourFirstQuiz: 'Machen Sie Ihr erstes Quiz, um Ihre Ergebnisse hier zu sehen',
    averageScore: 'Durchschnittliche Punktzahl',
    quizzesCompleted: 'Abgeschlossene Quizze',
    subjectsStudied: 'Studierte Fächer',
    questionsAnswered: 'Beantwortete Fragen',
    
    // Subjects
    subjectManager: 'Fach-Manager',
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
    dragDropFile: 'Ziehen Sie Ihre Datei hierher',
    dropFileHere: 'Legen Sie Ihre Datei hier ab',
    selectFromComputer: 'Vom Computer auswählen',
    maxSize: 'Maximale Größe:',
    supportFor: 'Unterstützung für',
    files: 'Dateien',
    fileUploadNotSupported: 'Datei-Upload nicht unterstützt',
    fileUploadNotSupportedMsg: 'Der ausgewählte KI-Anbieter unterstützt keine direkten Datei-Uploads. Bitte wechseln Sie zu OpenAI oder fügen Sie Ihren Text direkt ein.',
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
    submitAnswer: 'Antwort abschicken',
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
    errorLoadingQuiz: 'Fehler beim Laden des Quiz',
    errorSavingQuiz: 'Fehler beim Speichern des Quiz'
  }
};
