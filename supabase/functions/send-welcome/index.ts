import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const welcomeTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 30px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 700;">
          Welcome to ExamPrep Daily! 🚀
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <p style="margin: 0 0 15px 0; font-size: 16px; color: #334155; line-height: 1.6;">
          Hi there,
        </p>
        <p style="margin: 0 0 15px 0; font-size: 16px; color: #334155; line-height: 1.6;">
          Thanks for subscribing! You're now all set to receive your daily dose of AI-curated current affairs, customized specifically for your exams.
        </p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1e293b;">What to expect:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #475569;">
            <li style="margin-bottom: 8px;">Update emails every morning at 8:00 AM</li>
            <li style="margin-bottom: 8px;">News filtered by your selected exams</li>
            <li style="margin-bottom: 8px;">Concise summaries & key points</li>
          </ul>
        </div>
        <p style="margin: 0; font-size: 16px; color: #334155;">
          Your first digest will arrive tomorrow morning. Best of luck with your preparation!
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          Made with ❤️ for exam aspirants
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

interface WelcomeRequest {
  email: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('Missing RESEND_API_KEY');
    }

    const resend = new Resend(resendApiKey);
    const { email }: WelcomeRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending welcome email to ${email}`);

    const { data, error } = await resend.emails.send({
      from: 'ExamPrep Daily <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to ExamPrep Daily! 🚀',
      html: welcomeTemplate,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-welcome:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Unknown error',
        details: JSON.stringify(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
