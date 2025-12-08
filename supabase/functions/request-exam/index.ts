import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { exam, sources, email } = await req.json();

        if (!exam) {
            throw new Error("Exam name is required");
        }

        console.log(`[Exam Request] ${exam} | Sources: ${sources} | By: ${email || 'Anonymous'}`);

        // For MVP, just logging is enough to let the admin (user) know.
        // Ideally we insert into a 'requests' table.
        // Let's assume we might not have the table, so we just log and return success.

        // Check if requests table exists? No, let's just create a log entry in 'email_logs' as a hack if needed, 
        // OR just return success. The user will see the log in Supabase Dashboard.

        return new Response(
            JSON.stringify({ success: true, message: "Request received" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
