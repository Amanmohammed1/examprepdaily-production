import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.13';
import { generateEmailHtml } from './email-template.ts';

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
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SMTP Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    let testEmail: string | null = null;
    try {
      const body = await req.json();
      testEmail = body.testEmail;
    } catch {
      // Body might be empty if triggered by cron
    }

    console.log('Starting digest send...', testEmail ? `(Test mode for ${testEmail})` : '(Production mode)');

    // Get active subscribers
    let query = supabase
      .from('subscribers')
      .select('*')
      .eq('is_active', true);

    if (!testEmail) {
      // Only enforce verification for production runs, or test runs if you want
      // For Gmail, verification isn't strictly tracked by us, but we respect the flag
      query = query.eq('is_verified', true);
    } else {
      query = query.eq('email', testEmail);
    }

    const { data: subscribers, error: subscribersError } = await query;

    if (subscribersError) {
      throw subscribersError;
    }

    console.log(`Found ${subscribers?.length || 0} active subscribers`);

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No subscribers to send to' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get processed articles
    // SMART WINDOW: Increased to 48h to ensure volume.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2); // 48h window

    // First pass: standard query
    let query24h = supabase
      .from('articles')
      .select('*')
      // REMOVED strict is_processed=true requirement to allow raw articles as fallback
      // .eq('is_processed', true) 
      .gte('fetched_at', yesterday.toISOString())
      .order('published_at', { ascending: false });

    // Increased limit to 30 for Pro feel
    if (testEmail) query24h = query24h.limit(30);

    let { data: allArticles, error: articlesError } = await query24h;

    // Retry Logic: If empty, look back 5 days (120h)
    if (!articlesError && (!allArticles || allArticles.length < 5)) {
      console.log("Smart Window: Low volume in 48h. Expanding search window...");

      const fiveDaysAgo = new Date();
      // If it's a test email (Welcome digest), look back 7 days to ensure they get something
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - (testEmail ? 7 : 5));

      let queryFallback = supabase
        .from('articles')
        .select('*')
        .gte('fetched_at', fiveDaysAgo.toISOString()) // Last 5 days
        .order('published_at', { ascending: false })
        .limit(30);

      const { data: fallbackData } = await queryFallback;

      if (fallbackData && fallbackData.length > 0) {
        console.log(`Smart Window: Found ${fallbackData.length} articles in 5-day window.`);
        allArticles = fallbackData;
      }
    }

    if (articlesError) {
      throw articlesError;
    }

    console.log(`Found ${allArticles?.length || 0} articles (Test Mode: ${!!testEmail})`);

    let sentCount = 0;
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    for (const subscriber of subscribers) {
      try {
        let relevantArticles = [];
        let html = '';
        let subject = '';

        if (!allArticles || allArticles.length === 0) {
          // Fallback: If absolutely no articles found even after 5-day lookback
          if (testEmail) {
            console.log("Welcome Digest: No recent articles found. Sending 'No Updates' notification.");
            html = `
              <html>
                <body style="font-family: sans-serif; color: #333;">
                  <h1>Welcome to ExamPrep Daily! 🚀</h1>
                  <p>You are successfully subscribed.</p>
                  <p>We checked the last 5 days of news, but found no articles relevant to your specific exam selection just yet.</p>
                  <p>Don't worry! Our scrapers run every hour. You will receive your first full digest as soon as news availability picks up.</p>
                </body>
              </html>`;
            subject = `Welcome to ExamPrep Daily! (No new updates today)`;
            relevantArticles = [{ title: 'Welcome - No Updates' }]; // Dummy to pass counts
          } else {
            console.log(`No articles for ${subscriber.email}`);
            continue;
          }
        } else {
          // Filter articles relevant to subscriber's exams
          // Filter articles relevant to subscriber's exams
          relevantArticles = (allArticles || []).filter(article => {
            const articleExams = article.exam_tags || [];
            const subscriberExams = subscriber.selected_exams || [];

            // 1. AI Match
            if (articleExams.some((tag: string) => subscriberExams.includes(tag))) {
              return true;
            }

            // 2. Fallback: Source Mapping (If AI hasn't tagged it yet)
            // If article is unprocessed, we infer relevance from source/category
            const category = article.category || '';
            const source = article.source || '';
            const title = (article.title || '').toLowerCase();

            // Broad "News" categories logic
            if (subscriberExams.includes('rbi_grade_b') && (
              title.includes('rbi') || category.includes('rbi') || source.includes('RBI'))) return true;

            if (subscriberExams.includes('sebi_grade_a') && (
              title.includes('sebi') || category.includes('sebi') || source.includes('SEBI'))) return true;

            if (subscriberExams.includes('upsc_cse') && (
              source.includes('PIB') || source.includes('Hindu'))) return true;

            // "Current Affairs" bucket catches everything else broad
            if (subscriberExams.includes('financial_awareness') || subscriberExams.includes('current_affairs')) return true;

            return false;
          }).slice(0, 30); // Max 30 articles per email

          // If test mode and no relevant articles, force send anyway with whatever we have
          if (relevantArticles.length === 0 && testEmail) {
            relevantArticles = allArticles.slice(0, 5);
          }

          if (relevantArticles.length === 0) {
            console.log(`No relevant articles for ${subscriber.email}`);
            continue;
          }

          html = generateEmailHtml(relevantArticles, subscriber.selected_exams);
          subject = `📬 Your Daily Digest - ${today} (${relevantArticles.length} updates)`;
        }

        // Send via Nodemailer
        await transporter.sendMail({
          from: `"ExamPrep Daily" <${gmailUser}>`, // sender address
          to: subscriber.email, // list of receivers
          subject: subject, // Subject line
          html: html, // html body
        });

        const emailSubject = `Daily Digest - ${today}`;
        // Log the email
        await supabase.from('email_logs').insert({
          subscriber_id: subscriber.id,
          email: subscriber.email,
          subject: emailSubject,
          status: 'sent',
          article_count: relevantArticles.length,
        });

        sentCount++;
      } catch (error) {
        console.error(`Error processing subscriber ${subscriber.email}:`, error);
        if (testEmail) { // If it's a test email, re-throw to indicate failure
          throw error;
        }
      }
    }

    console.log('Digest sending complete');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${sentCount} digest emails`,
        count: subscribers.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-digest:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Unknown error',
        details: JSON.stringify(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});