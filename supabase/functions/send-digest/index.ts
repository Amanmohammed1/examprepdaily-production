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
    // SMART WINDOW: Default to 24h, but fallback if empty
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // First pass: standard 24h window
    let query24h = supabase
      .from('articles')
      .select('*')
      .eq('is_processed', true)
      .gte('fetched_at', yesterday.toISOString())
      .order('published_at', { ascending: false });

    if (testEmail) query24h = query24h.limit(20);

    let { data: allArticles, error: articlesError } = await query24h;

    // Retry Logic: If 24h is empty (or very low), look back 3 days (72h) or just get latest absolute
    if (!articlesError && (!allArticles || allArticles.length < 2)) {
      console.log("Smart Window: < 2 articles in 24h. Expanding search window...");

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      let queryFallback = supabase
        .from('articles')
        .select('*')
        .eq('is_processed', true)
        .gte('fetched_at', threeDaysAgo.toISOString()) // Last 3 days
        .order('published_at', { ascending: false })
        .limit(15);

      const { data: fallbackData } = await queryFallback;

      if (fallbackData && fallbackData.length > 0) {
        console.log(`Smart Window: Found ${fallbackData.length} articles in 3-day window.`);
        allArticles = fallbackData;
      } else {
        // Ultimate fallback: Just get whatever is in the DB
        console.log("Smart Window: 3-day is empty. Fetching absolute latest...");
        const { data: ultimateData } = await supabase
          .from('articles')
          .select('*')
          .eq('is_processed', true)
          .order('fetched_at', { ascending: false })
          .limit(15);
        allArticles = ultimateData || [];
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
          // Fallback for "No Articles" - ONLY for test emails to prove it works
          if (testEmail) {
            console.log("No articles found, forcing a dummy email for test.");
            html = `<html><body><h1>System Working! ✅</h1><p>We found 0 new articles today, but your email delivery system is working perfectly via Gmail.</p></body></html>`;
            subject = `✅ Test System Check - ${today}`;
            relevantArticles = [{ title: 'System Check' }]; // Dummy to pass counts
          } else {
            console.log(`No articles for ${subscriber.email}`);
            continue;
          }
        } else {
          // Filter articles relevant to subscriber's exams
          relevantArticles = (allArticles || []).filter(article => {
            const articleExams = article.exam_tags || [];
            const subscriberExams = subscriber.selected_exams || [];
            return articleExams.some((tag: string) => subscriberExams.includes(tag));
          }).slice(0, 15); // Max 15 articles per email

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