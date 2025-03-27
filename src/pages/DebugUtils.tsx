import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const DebugUtils = () => {
  const [sessionId, setSessionId] = useState('');
  const [username, setUsername] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAddParticipant = async () => {
    if (!sessionId) {
      toast({
        title: 'Errore',
        description: 'Inserisci l\'ID della sessione',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionId,
          user_id: user?.id || null,
          username: username || 'Host',
          score: 0,
          completed: false,
          answers: []
        })
        .select('*')
        .single();

      if (error) {
        console.error('Errore:', error);
        setResult({ error });
        toast({
          title: 'Errore',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        console.log('Successo:', data);
        setResult({ data });
        toast({
          title: 'Successo',
          description: 'Partecipante aggiunto con ID: ' + data.id,
        });
      }
    } catch (err) {
      console.error('Eccezione:', err);
      setResult({ error: err });
      toast({
        title: 'Errore',
        description: 'Si è verificata un\'eccezione',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Errore:', error);
        setResult({ error });
      } else {
        console.log('Sessioni:', data);
        setResult({ sessions: data });
      }
    } catch (err) {
      console.error('Eccezione:', err);
      setResult({ error: err });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Utilità di Debug</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Aggiungi Partecipante</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ID Sessione</label>
            <Input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Inserisci l'ID della sessione"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Inserisci l'username (default: Host)"
            />
          </div>
          
          <Button onClick={handleAddParticipant} disabled={isLoading}>
            {isLoading ? 'Aggiungendo...' : 'Aggiungi Partecipante'}
          </Button>
          
          <Button variant="outline" onClick={getSessions} className="ml-2">
            Mostra Sessioni Recenti
          </Button>
        </div>
      </div>
      
      {result && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Risultato</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugUtils; 