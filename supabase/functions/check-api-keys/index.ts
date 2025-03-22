
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check which API keys are available in the environment
    const apiKeys = {
      openai: !!Deno.env.get('OPENAI_API_KEY'),
      gemini: !!Deno.env.get('GEMINI_API_KEY'),
      claude: !!Deno.env.get('CLAUDE_API_KEY'),
      mistral: !!Deno.env.get('MISTRAL_API_KEY')
    };
    
    return new Response(
      JSON.stringify({ 
        keys: apiKeys,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-api-keys function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
