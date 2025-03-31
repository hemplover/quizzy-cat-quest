// Supabase Node.js Function for PDF Text Extraction (Correct Structure)

import { Buffer } from 'node:buffer'; // Explicit Node.js buffer import
import pdf from "pdf-parse";

// @ts-ignore // Supabase injects this type
import type { ServeWithOptions } from "@supabase/functions-js";

console.log("Node.js Extract PDF Text Function Initializing v4");

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase will call this default export function
export default async (req: Request, _info: ServeWithOptions) => {

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  
  // Handle non-POST requests
  if (req.method !== 'POST') {
     console.log(`Method ${req.method} not allowed`);
     return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  if (!req.body) {
    console.log("Request body is required");
    return new Response(JSON.stringify({ error: "Request body is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    console.log("Processing POST request for PDF extraction...");

    // Get the body as ArrayBuffer
    const pdfArrayBuffer = await req.arrayBuffer();
    console.log(`Received PDF buffer, size: ${pdfArrayBuffer.byteLength} bytes`);

    // Convert ArrayBuffer to Node.js Buffer
    const nodeBuffer = Buffer.from(pdfArrayBuffer);
    console.log("Parsing PDF buffer with pdf-parse...");
    const data = await pdf(nodeBuffer);

    // Extract text
    const extractedText = data.text || '';
    console.log(`PDF parsed successfully, extracted ${extractedText.length} characters`);

    // Return the extracted text
    return new Response(
        JSON.stringify({ text: extractedText }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error processing PDF:", error);
    return new Response(
        JSON.stringify({ error: `Failed to extract text: ${error.message || error}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

console.log("Node.js Extract PDF Text Function Ready v4"); 