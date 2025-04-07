import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Function 'cleanup-old-sessions' starting...");

Deno.serve(async (req) => {
  // Questo gestisce le richieste OPTIONS preflight per CORS (buona pratica)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Ottieni le variabili d'ambiente necessarie (URL e Service Role Key)
    // DEVI impostare SUPABASE_SERVICE_ROLE_KEY come secret!
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }

    // Crea un client Supabase CON la Service Role Key per avere permessi di scrittura/delete
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    console.log("Supabase admin client initialized.");

    // Calcola il timestamp di 2 ore fa
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    console.log(`Calculated cutoff time (2 hours ago): ${twoHoursAgo}`);

    // Esegui la query DELETE
    // Cancella tutte le righe (waiting, active, completed) create più di 2 ore fa
    console.log("Attempting to delete old sessions...");
    const { count, error } = await supabaseAdmin
      .from('quiz_sessions')
      .delete()
      .lt('created_at', twoHoursAgo); // 'lt' significa "less than"

    if (error) {
      console.error("Error deleting old sessions:", error);
      throw error; // Rilancia l'errore per segnalare il fallimento
    }

    console.log(`Successfully deleted ${count ?? 0} old sessions.`);

    // Rispondi con successo
    return new Response(
      JSON.stringify({ message: `Successfully deleted ${count ?? 0} old sessions.` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (err) {
    console.error("An error occurred in the function:", err);
    // Rispondi con un errore generico
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500, // Internal Server Error
      }
    );
  }
});
