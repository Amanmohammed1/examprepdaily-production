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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Check for ANY available AI key
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    const hasAI = !!(geminiKey || openaiKey || lovableKey);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Starting article processing... (AI Enabled: ${hasAI})`);

    const { count: totalCount } = await supabase.from('articles').select('*', { count: 'exact', head: true });
    console.log(`DEBUG: Total articles in DB: ${totalCount}`);

    // Read body once
    const body = await req.json().catch(() => ({}));
    const { force, reprocess_errors, clean_mode } = body;

    if (clean_mode) {
      console.log("🧹 CLEAN MODE INIT: Scrubbing AI Errors from DB...");
      // Fetch ALL articles with errors
      const { data: errorArticles, error: scanError } = await supabase
        .from('articles')
        .select('*')
        .like('summary', '%AI Error%')
        .limit(50); // Fetch more

      if (scanError) throw scanError;

      if (errorArticles && errorArticles.length > 0) {
        console.log(`🧹 Scrubbing ${errorArticles.length} error rows...`);
        let cleanedCount = 0;
        for (const article of errorArticles) {
          try {
            // Revert to clean rule-based summary
            const cleanSummary = `(Auto-Generated) This article '${article.title}' was fetched from ${article.source_name}. Check official source.`;
            await supabase
              .from('articles')
              .update({
                summary: cleanSummary,
                is_processed: false // Queue for retry
              })
              .eq('id', article.id);
            cleanedCount++;
          } catch (e) {
            console.error("Scrub failed for", article.id);
          }
        }
        return new Response(
          JSON.stringify({
            success: true,
            message: `Scrubbed ${cleanedCount} articles in Clean Mode.`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: true,
            message: `Clean Mode: No errors found.`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let query = supabase
      .from('articles')
      .select('*')
      .order('fetched_at', { ascending: false })
      // STABILITY FIX: Batch size reduced to 5 to prevent JSON truncation/timeout errors.
      .limit(5);

    if (reprocess_errors) {
      console.log("⚠️ REPROCESS ERRORS MODE: Targeting articles with AI failures");
      query = query.like('summary', '%AI Error%');
      // Ignore is_processed flag for this specific rescue mission
    } else if (!force) {
      query = query.eq('is_processed', false); // PERFORMANCE: Only fetch what needs work
    } else {
      console.log("⚠️ FORCE MODE: Reprocessing ALL articles");
    }

    // Fetch articles
    const { data: articles, error: articlesError } = await query;

    if (articlesError) {
      throw articlesError;
    }

    if (clean_mode && articles) {
      console.log(`🧹 Scrubbing ${articles.length} error rows...`);
      let cleanedCount = 0;
      for (const article of articles) {
        try {
          // Revert to clean rule-based summary
          const cleanSummary = `(Auto-Generated) This article '${article.title}' was fetched from ${article.source_name}. Check official source.`;
          await supabase
            .from('articles')
            .update({
              summary: cleanSummary,
              is_processed: false // Queue for retry
            })
            .eq('id', article.id);
          cleanedCount++;
        } catch (e) {
          console.error("Scrub failed for", article.id);
        }
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: `Scrubbed ${cleanedCount} articles.`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${articles?.length || 0} unprocessed articles`);

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No articles to process',
          debug_db_count: totalCount,
          debug_unprocessed_count: articles?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    let debugLastAiRaw = "No AI call made";

    for (const article of articles) {
      try {
        // ... (existing code for loop)
        console.log(`Processing: ${article.title}`);

        // Initialize robust defaults (but don't overwrite if AI is going to run)
        let summary = "Summary pending processing.";
        let key_points = ["Details pending."];
        let exam_tags: string[] = [];
        let is_processed = true; // Default to true (done), unless 429 hits

        const lowerTitle = article.title.toLowerCase();
        const source = (article.source_name || '').toUpperCase();
        let finalTitle = article.title;

        // 1. RULE-BASED TAGGING (Baseline for everyone)
        // We calculate this first, but only apply text summaries if AI is disabled/fails.
        let ruleBasedSummary = `(Auto-Generated) This article '${article.title}' was fetched from ${article.source_name}. Check official source.`;
        let ruleBasedKeyPoints = [
          `Published: ${new Date(article.published_at).toLocaleDateString()}`,
          `Source: ${article.source_name}`,
          "Tap 'Read original' for details."
        ];

        // ... (Tags logic omitted for brevity as it is unchanged) ...
        if (source.includes('RBI')) { exam_tags.push('rbi_grade_b', 'ibps_po'); }
        if (source.includes('SEBI')) { exam_tags.push('sebi_grade_a', 'rbi_grade_b'); }
        if (source.includes('NABARD')) { exam_tags.push('nabard_grade_a', 'rbi_grade_b'); }
        if (source.includes('PIB')) { exam_tags.push('rbi_grade_b', 'nabard_grade_a', 'upsc_cse'); }
        if (source.includes('HINDU') || source.includes('MINT') || source.includes('BUSINESS')) {
          exam_tags.push('current_affairs', 'rbi_grade_b', 'ibps_po', 'ssc_cgl');
        }
        if (source.includes('SSC')) { exam_tags.push('ssc_cgl'); }
        if (source.includes('IBPS')) { exam_tags.push('ibps_po', 'ibps_clerk'); }
        if (source.includes('LIC')) { exam_tags.push('lic_aao'); }
        if (lowerTitle.includes('bank')) exam_tags.push('ibps_po');
        if (lowerTitle.includes('agri')) exam_tags.push('nabard_grade_a');

        exam_tags = [...new Set(exam_tags)];
        if (exam_tags.length === 0) exam_tags.push('rbi_grade_b'); // Default

        // 2. AI PROCESSING
        let lastAiRaw = "";

        if (hasAI) {
          try {
            console.log("🤖 Initializing AI Model...");
            const { GoogleGenerativeAI } = await import("npm:@google/generative-ai");

            if (!geminiKey && !openaiKey && !lovableKey) {
              throw new Error("No AI API Keys found in environment!");
            }

            // ... (setup code omitted) ...

            const genAI = new GoogleGenerativeAI(geminiKey || openaiKey || lovableKey || '');
            const model = genAI.getGenerativeModel({
              model: "gemini-flash-latest",
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
              ]
            });

            const prompt = `
             Analyze this:
             Title: ${article.title}
             Source: ${article.source_name}
             Original Link: ${article.original_url || 'N/A'}
             
             TASK: return a valid JSON object.
             1. If the Title/Content is in Hindi or any other language, TRANSLATE IT TO ENGLISH.
             2. Provide a "Short & Crisp" summary in English.
             
             {
               "translated_title": "Video Conference by PM... (Only if original was non-English, else null)",
               "summary": "Start with 'Exam Relevance: High/Medium'. Then 2 sentences max summary.",
               "key_points": ["Point 1 (max 8 words)", "Point 2 (max 8 words)", "Point 3"],
               "exam_tags": ["rbi_grade_b", "upsc_cse"]
             }
             STRICTLY JSON. NO MARKDOWN. NO \`\`\`.
             `;

            console.log("🤖 Sending prompt...");
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            debugLastAiRaw = text; // DEBUG STORE

            console.log("🤖 Received:", text.substring(0, 50));

            // Aggressive Cleanup
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiData = JSON.parse(jsonStr);

            if (aiData.summary) summary = aiData.summary;
            if (aiData.key_points && Array.isArray(aiData.key_points)) key_points = aiData.key_points;

            // Merge/Enhance tags
            if (aiData.exam_tags && Array.isArray(aiData.exam_tags)) {
              exam_tags = [...new Set([...exam_tags, ...aiData.exam_tags])];
            }

            // Handle Title Translation
            if (aiData.translated_title && aiData.translated_title !== article.title) {
              console.log(`✨ Translating Title: ${article.title} -> ${aiData.translated_title}`);
              finalTitle = aiData.translated_title;
            }

            console.log("✅ AI Success");

          } catch (aiError: any) {
            console.error("❌ AI Failed:", aiError);
            const errStr = JSON.stringify(aiError, Object.getOwnPropertyNames(aiError));
            debugLastAiRaw = `ERROR: ${errStr}`; // FORCE CAPTURE ERROR

            // SMART RETRY: If Rate Limit (429), don't save error text, just revert to clean summary and retry later.
            if (errStr.includes("429") || errStr.includes("Too Many Requests")) {
              console.log("⏳ Rate Limit Hit: Reverting to clean summary & scheduling retry.");
              summary = ruleBasedSummary; // Clean text for UI
              key_points = ruleBasedKeyPoints;
              is_processed = false; // RETRY LATER
            } else {
              // Genuine error: Log it visible so we debug
              summary = ruleBasedSummary + ` (AI Error: ${errStr.substring(0, 200)})`;
              key_points = ruleBasedKeyPoints;
              is_processed = true; // Mark done
            }
          }
        } else {
          // No AI Configured
          summary = ruleBasedSummary;
          key_points = ruleBasedKeyPoints;
          is_processed = true;
        }

        // Prepare update object
        const updateData: any = {
          summary: summary,
          key_points: key_points,
          exam_tags: exam_tags,
          is_processed: is_processed,
          processed_at: new Date().toISOString(),
        };

        // Only update title if it changed (optimization)
        if (typeof finalTitle !== 'undefined' && finalTitle !== article.title) {
          updateData.title = finalTitle;
        }

        await supabase
          .from('articles')
          .update(updateData)
          .eq('id', article.id);

        processedCount++;
        console.log(`Processed: ${article.title}`);

      } catch (error) {
        console.error(`Error processing article ${article.id}:`, error);
      }
    }

    // Final response with debug info
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} of ${articles.length} articles`,
        ai_enabled: hasAI,
        ai_status: hasAI ? (processedCount > 0 ? "Attempted" : "Skipped (No Config)") : "Disabled",
        debug_key_present: !!geminiKey,
        debug_last_ai_raw: debugLastAiRaw,
        debug_key_present: !!geminiKey,
        debug_last_ai_raw: debugLastAiRaw,
        last_ai_error: debugLastAiRaw === "No AI call made" ? "Possible Error (Check Logs)" : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in process-articles:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Unknown error',
        details: JSON.stringify(error),
        env_check: {
          has_gemini: !!Deno.env.get('GEMINI_API_KEY'),
          has_openai: !!Deno.env.get('OPENAI_API_KEY')
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});