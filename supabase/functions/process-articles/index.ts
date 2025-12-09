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

    let force = false;
    try {
      const body = await req.json();
      force = body.force;
    } catch {
      // Body might be empty
    }

    let query = supabase
      .from('articles')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(50);

    if (!force) {
      query = query.eq('is_processed', false);
    } else {
      console.log("⚠️ FORCE MODE: Reprocessing ALL articles");
    }

    // Fetch articles
    const { data: articles, error: articlesError } = await query;

    if (articlesError) {
      throw articlesError;
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

    for (const article of articles) {
      try {
        console.log(`Processing: ${article.title}`);

        let summary = "Summary pending AI processing.";
        let key_points = ["Check official document for details.", "Key points not yet extracted.", "Pending AI analysis."];
        let exam_tags: string[] = [];
        const lowerTitle = article.title.toLowerCase();
        const source = (article.source_name || '').toUpperCase();
        const category = article.category || '';

        if (hasAI) {
          // Placeholder for real AI call
          console.log("AI Key present but implementation minimal. using placeholder.");
          // In real implementation, we would call LLM here.
          // For now, we fall through to the robust rule-based logic below as a baseline, 
          // or we could assume the LLM would return tags.
          // Let's use the rule-based logic as a reliable fallback/baseline even if AI is present for this MVP phase.
        }

        // ROBUST RULE-BASED TAGGING (Mock Mode / Fallback)
        if (!hasAI || true) { // Always run this for now to ensure quality tags
          console.log("Generating Smart Tags...");
          summary = `(Auto-Generated) This article '${article.title}' was fetched from ${article.source_name}. Please verify details in the official link.`;
          key_points = [
            `Published on: ${new Date(article.published_at).toLocaleDateString()}`,
            `Source: ${article.source_name}`,
            "Tap 'Read original' for full details."
          ];

          // Source-based Tagging
          if (source.includes('RBI')) {
            exam_tags.push('rbi_grade_b');
            exam_tags.push('ibps_po');
          }
          if (source.includes('SEBI')) {
            exam_tags.push('sebi_grade_a');
            exam_tags.push('rbi_grade_b'); // Finance syllabus
          }
          if (source.includes('NABARD')) {
            exam_tags.push('nabard_grade_a');
            exam_tags.push('rbi_grade_b'); // ESI syllabus
          }
          if (source.includes('PIB')) {
            exam_tags.push('rbi_grade_b'); // Gov Schemes
            exam_tags.push('nabard_grade_a'); // Rural Schemes
            exam_tags.push('upsc_cse'); // General Policy
          }
          if (source.includes('HINDU') || source.includes('AFFAIRSCLOUD')) {
            exam_tags.push('current_affairs');
            exam_tags.push('rbi_grade_b'); // GA is relevant for all
            exam_tags.push('ibps_po');
            exam_tags.push('ssc_cgl');
          }
          if (source.includes('SSC')) {
            exam_tags.push('ssc_cgl');
          }
          if (source.includes('IBPS')) {
            exam_tags.push('ibps_po');
            exam_tags.push('ibps_clerk');
          }
          if (source.includes('LIC')) {
            exam_tags.push('lic_aao');
          }

          // Keyword-based refinement
          if (lowerTitle.includes('bank')) exam_tags.push('ibps_po');
          if (lowerTitle.includes('agri') || lowerTitle.includes('farm')) exam_tags.push('nabard_grade_a');
          if (lowerTitle.includes('cgl') || lowerTitle.includes('chsl')) exam_tags.push('ssc_cgl');
          if (lowerTitle.includes('insurance') || lowerTitle.includes('life')) exam_tags.push('lic_aao');
          if (lowerTitle.includes('budget') || lowerTitle.includes('economic survey')) exam_tags.push('current_affairs');

          // Deduplicate
          exam_tags = [...new Set(exam_tags)];

          // Fallback if no tags found
          if (exam_tags.length === 0) exam_tags.push('rbi_grade_b');
        }

        if (hasAI) {
          try {
            const { GoogleGenerativeAI } = await import("npm:@google/generative-ai");
            const genAI = new GoogleGenerativeAI(geminiKey || openaiKey || lovableKey || '');
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `
             You are an expert exam analyst for Indian Competitive Exams (RBI, UPSC, NABARD).
             Analyze this article title and source.
             
             Title: ${article.title}
             Source: ${article.source_name}
             Link: ${article.original_url}
             
             TASK: Provide a "Short & Crisp" summary in JSON format.
             - Summary: 2 sentences max. Focus on impact/action.
             - Key Points: Strictly 3 bullet points. Each point max 10 words. Focus on Dates, Numbers, Names.
             
             Output Format (JSON):
             {
               "summary": "Exam Relevance: <High/Medium>. [Concise Summary]",
               "key_points": [
                 "Fact 1 (e.g., 'Penalty: ₹5.00 Lakh on Yavatmal Bank')",
                 "Fact 2 (e.g., 'Reason: KYV violation')",
                 "Fact 3 (e.g., 'Act: Banking Regulation Act, 1949')"
               ],
               "exam_tags": ["rbi_grade_b", ...] 
             }
             `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Simple clean of code blocks if any
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiData = JSON.parse(jsonStr);

            if (aiData.summary) summary = aiData.summary;
            if (aiData.key_points && Array.isArray(aiData.key_points)) key_points = aiData.key_points;
            // Merge AI tags with Rule-based tags (prioritize AI but keep rules as backup)
            if (aiData.exam_tags && Array.isArray(aiData.exam_tags)) {
              exam_tags = [...new Set([...exam_tags, ...aiData.exam_tags])];
            }

            console.log("✅ AI Generation Successful for:", article.title);

          } catch (aiError) {
            console.error("❌ AI Generation Failed, falling back to rules:", aiError);
            // Verify fallback summary is set
            if (summary === "Summary pending AI processing.") {
              summary = `(Fallback) ${article.title} - Check official source.`;
            }
          }
        }

        await supabase
          .from('articles')
          .update({
            summary: summary,
            key_points: key_points,
            exam_tags: exam_tags,
            is_processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq('id', article.id);

        processedCount++;
        console.log(`Processed: ${article.title}`);

      } catch (error) {
        console.error(`Error processing article ${article.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} of ${articles.length} articles`,
        ai_enabled: hasAI
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in process-articles:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});