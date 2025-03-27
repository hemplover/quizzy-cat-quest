# QuizAI - Documentazione Tecnica

## Scopo dell'Applicazione

QuizAI è una piattaforma educativa che permette agli utenti di:
- Creare quiz da documenti
- Partecipare a quiz
- Partecipare a sessioni multiplayer di quiz

L'applicazione utilizza l'IA (come Gemini) per generare quiz dal contenuto caricato e fornisce esperienze di quiz sia in modalità singolo giocatore che multiplayer.

## Funzionalità Principali

### 1. Caricamento e Elaborazione Documenti
- Caricamento di documenti (PDF, DOCX, TXT)
- Estrazione del contenuto testuale
- Memorizzazione dei documenti associati a utenti e materie

### 2. Generazione Quiz con IA
- Integrazione con Gemini AI per analizzare il contenuto
- Generazione di diversi tipi di domande (scelta multipla, vero/falso, aperte)
- Parametri personalizzabili (difficoltà, numero di domande, tipi di domande)

### 3. Gestione Materie
- Organizzazione del contenuto in materie
- Personalizzazione di nomi, descrizioni, icone e colori
- Associazione di quiz e documenti a materie specifiche

### 4. Esperienza Quiz Singolo Giocatore
- Quiz basati sul contenuto caricato
- Visualizzazione di punteggi, risposte corrette e spiegazioni
- Monitoraggio dei progressi tra più tentativi

### 5. Funzionalità Multiplayer
- Quiz multiplayer basati su sessioni con codici univoci
- Ruoli di host e giocatore con interfacce diverse
- Notifiche in tempo reale per i giocatori che si uniscono
- Classifiche in tempo reale
- Progressione sincronizzata per tutti i partecipanti

### 6. Autenticazione Utente
- Integrazione con autenticazione Supabase
- Profili utente e persistenza dei dati
- Controllo degli accessi basato sui ruoli tramite Row Level Security

## Architettura Tecnica

### Frontend
- React con TypeScript
- React Router per la navigazione
- TanStack React Query per il recupero dati
- Tailwind CSS e shadcn/ui per i componenti UI

### Backend
- Supabase per database, autenticazione e funzioni
- Edge functions per integrazione IA e operazioni complesse
- Sincronizzazione dati in tempo reale per funzionalità multiplayer

## Struttura dei File e Componenti

### Struttura Applicazione Core
- `src/App.tsx`: Componente principale dell'applicazione
- `src/pages/`: Contiene i componenti delle pagine
  - `Index.tsx`: Pagina iniziale
  - `Upload.tsx`: Interfaccia caricamento documenti
  - `Quiz.tsx`: Selezione e creazione quiz
  - `QuizSession.tsx`: Interfaccia quiz singolo giocatore
  - `Dashboard.tsx`: Dashboard utente
  - `SubjectManager.tsx` & `SubjectDetail.tsx`: Gestione materie
  - `MultiplayerHost.tsx`: Interfaccia host multiplayer
  - `MultiplayerPlayer.tsx`: Interfaccia giocatore multiplayer
  - `MultiplayerSession.tsx`: Interfaccia quiz multiplayer attivo
  - `MultiplayerJoin.tsx`: Interfaccia unione sessioni multiplayer

### Autenticazione
- `src/contexts/AuthContext.tsx`: Gestione stato autenticazione
- `src/components/AuthRequired.tsx`: Protezione route autenticate
- `src/pages/Auth.tsx` & `AuthCallback.tsx`: Interfacce autenticazione

### Generazione e Gestione Quiz
- `src/services/geminiService.ts`: Integrazione Gemini AI
- `src/services/quizService.ts`: Operazioni core quiz
- `src/services/aiProviderService.ts`: Configurazione provider IA
- `src/components/quiz/CreateQuizSession.tsx` & `JoinQuizSession.tsx`: Componenti UI quiz

### Funzionalità Multiplayer
- `src/services/multiplayerService.ts`: Servizio core multiplayer
  - `generateSessionCode()`: Genera codici sessione univoci
  - `normalizeSessionCode()`: Standardizza formato codici
  - `getQuizSessionByCode()`: Recupera sessioni per codice
  - `createQuizSession()`: Crea nuove sessioni multiplayer
  - `joinQuizSession()`: Aggiunge partecipanti
  - `startQuizSession()`: Attiva sessioni in attesa
  - `subscribeToSessionUpdates()`: Aggiornamenti in tempo reale

### Gestione Documenti
- `src/utils/documentParser.ts`: Utility parsing documenti
- `src/components/FileUpload.tsx`: Componente caricamento file

### Componenti UI
- `src/components/Layout.tsx`: Layout wrapper principale
- `src/components/Navigation.tsx`: Barra di navigazione
- `src/components/ui/*`: Componenti UI riutilizzabili
- `src/components/CatTutor.tsx`: Mascotte con guida contestuale

## Modelli Dati e Tipi
- `src/types/quiz.ts`: Definizioni tipi quiz
- `src/types/multiplayer.ts`: Definizioni tipi multiplayer

## Funzioni Edge Supabase
- `supabase/functions/generate-quiz/index.ts`: Generazione quiz
- `supabase/functions/grade-quiz/index.ts`: Valutazione quiz

## Schema Database

### Tabelle
- `documents`: Documenti caricati
- `quizzes`: Quiz generati
- `subjects`: Organizzazione materie
- `quiz_sessions`: Sessioni multiplayer
- `session_participants`: Partecipanti sessioni

## Flusso Applicazione

### Flusso Quiz Singolo Giocatore
1. Caricamento documento o selezione esistente
2. Configurazione parametri quiz
3. Generazione quiz con IA
4. Svolgimento quiz
5. Valutazione risposte
6. Memorizzazione risultati

### Flusso Quiz Multiplayer
1. Creazione sessione da quiz esistente
2. Generazione codice sessione
3. Condivisione codice
4. Unione partecipanti
5. Monitoraggio sala d'attesa
6. Svolgimento quiz sincronizzato
7. Aggiornamenti classifica in tempo reale
8. Visualizzazione risultati finali

## Sfide e Dettagli Implementazione

### Gestione Codici Sessione
- Utilizzo di nanoid per codici 6 caratteri
- Normalizzazione in maiuscolo
- Strategie multiple per recupero sessioni

### Aggiornamenti in Tempo Reale
- Canali Supabase per sincronizzazione
- Listener per aggiornamenti partecipanti e sessioni

### Integrazione IA
- Supporto provider multipli
- Gestione sicura API key
- Elaborazione server-side tramite edge functions

### Gestione Errori
- Logging estensivo
- Strategie fallback per recupero sessioni
- Messaggi errore user-friendly

### Considerazioni Sicurezza
- Memorizzazione sicura API key
- Row Level Security per accesso dati
- Validazione partecipanti
- Validazione input 