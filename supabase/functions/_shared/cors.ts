    // supabase/functions/_shared/cors.ts
    export const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // Puoi restringere al tuo dominio frontend se vuoi più sicurezza
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      };