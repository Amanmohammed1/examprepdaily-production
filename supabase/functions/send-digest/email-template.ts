
// Configuration for the email template
// Modify these values to customize the email appearance and text
export const EmailConfig = {
    theme: {
        colors: {
            background: '#f1f5f9',
            containerBackground: '#ffffff',
            headerGradientStart: '#3b82f6',
            headerGradientEnd: '#8b5cf6',
            primaryText: '#1e293b',
            secondaryText: '#475569',
            mutedText: '#94a3b8',
            link: '#3b82f6',
            categoryTitle: '#3b82f6',
            tag: '#8b5cf6',
            articleBackground: '#f8fafc',
        },
        fonts: {
            main: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }
    },
    text: {
        headerTitle: '📬 ExamPrep Daily',
        headerSubtitle: 'Your AI-Curated Current Affairs Digest',
        footerText: "You're receiving this because you subscribed to ExamPrep Daily.",
        footerSubtext: 'Made with ❤️ for exam aspirants',
        noArticles: 'No new articles today. Check back tomorrow!',
    }
};

const categoryLabels: Record<string, string> = {
    rbi_circulars: '🏦 RBI Updates',
    government_schemes: '🏛️ Government Schemes',
    economy: '📊 Economy',
    banking: '🏧 Banking',
    finance: '💰 Finance',
    current_affairs: '📰 Current Affairs',
    international: '🌍 International',
    science_tech: '🔬 Science & Tech',
    environment: '🌱 Environment',
    sports: '⚽ Sports',
    awards: '🏆 Awards',
    other: '📌 Other',
};

const examLabels: Record<string, string> = {
    rbi_grade_b: 'RBI Grade B',
    sebi_grade_a: 'SEBI Grade A',
    nabard_grade_a: 'NABARD Grade A',
    nabard_grade_b: 'NABARD Grade B',
    upsc_cse: 'UPSC CSE',
    upsc_ies: 'UPSC IES',
    ssc_cgl: 'SSC CGL',
    ibps_po: 'IBPS PO',
    ibps_clerk: 'IBPS Clerk',
    lic_aao: 'LIC AAO',
};

export function generateEmailHtml(articles: any[], subscriberExams: string[], subscriberEmail: string): string {
    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const examNames = subscriberExams.map(e => examLabels[e] || e).join(', ');

    // Group articles by category
    const groupedArticles: Record<string, any[]> = {};
    for (const article of articles) {
        // SAFETY FILTER: Never show articles with AI Errors
        if (article.summary && (article.summary.includes('AI Error') || article.summary.includes('Auto-Generated'))) {
            continue;
        }

        const category = article.category || 'other';
        if (!groupedArticles[category]) {
            groupedArticles[category] = [];
        }
        groupedArticles[category].push(article);
    }

    let articlesHtml = '';
    for (const [category, categoryArticles] of Object.entries(groupedArticles)) {
        articlesHtml += `
      <tr>
        <td style="padding: 20px 0 10px 0;">
          <h2 style="margin: 0; font-size: 18px; color: ${EmailConfig.theme.colors.categoryTitle}; font-weight: 600;">
            ${categoryLabels[category] || category}
          </h2>
        </td>
      </tr>
    `;

        for (const article of categoryArticles) {
            const keyPoints = article.key_points || [];
            const relevantExams = (article.exam_tags || [])
                // Show ALL tags so user sees "SEBI Grade A" even if they didn't subscribe to it
                .map((tag: string) => examLabels[tag] || tag)
                .join(', ');

            articlesHtml += `
        <tr>
          <td style="padding: 15px; background: ${EmailConfig.theme.colors.articleBackground}; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; color: ${EmailConfig.theme.colors.primaryText}; font-weight: 600;">
              ${article.title}
            </h3>
            <p style="margin: 0 0 12px 0; font-size: 14px; color: ${EmailConfig.theme.colors.secondaryText}; line-height: 1.6;">
              ${article.summary || 'Summary not available'}
            </p>
            ${keyPoints.length > 0 ? `
              <ul style="margin: 0 0 12px 0; padding-left: 20px; font-size: 13px; color: ${EmailConfig.theme.colors.secondaryText};">
                ${keyPoints.map((point: string) => `<li style="margin-bottom: 4px;">${point}</li>`).join('')}
              </ul>
            ` : ''}
            ${relevantExams ? `
              <p style="margin: 0; font-size: 12px; color: ${EmailConfig.theme.colors.tag};">
                📚 Relevant for: ${relevantExams}
              </p>
            ` : ''}
            ${article.original_url ? `
              <a href="${article.original_url}" style="display: inline-block; margin-top: 10px; font-size: 12px; color: ${EmailConfig.theme.colors.link}; text-decoration: none;">
                Read original →
              </a>
            ` : ''}
          </td>
        </tr>
        <tr><td style="height: 15px;"></td></tr>
      `;
        }
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: ${EmailConfig.theme.fonts.main}; background-color: ${EmailConfig.theme.colors.background};">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: ${EmailConfig.theme.colors.containerBackground};">
        <!-- Header -->
        <tr>
          <td style="padding: 30px; background: linear-gradient(135deg, ${EmailConfig.theme.colors.headerGradientStart} 0%, ${EmailConfig.theme.colors.headerGradientEnd} 100%); text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 700;">
              ${EmailConfig.text.headerTitle}
            </h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">
              ${EmailConfig.text.headerSubtitle}
            </p>
          </td>
        </tr>
        
        <!-- Date & Exam Info -->
        <tr>
          <td style="padding: 20px 30px; border-bottom: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 14px; color: ${EmailConfig.theme.colors.secondaryText};">
              📅 ${today}
            </p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: ${EmailConfig.theme.colors.mutedText};">
              Tailored for: ${examNames}
            </p>
          </td>
        </tr>
        
        <!-- Articles -->
        <tr>
          <td style="padding: 20px 30px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${articlesHtml || `
                <tr>
                  <td style="text-align: center; padding: 40px;">
                    <p style="color: ${EmailConfig.theme.colors.secondaryText};">${EmailConfig.text.noArticles}</p>
                  </td>
                </tr>
              `}
            </table>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="padding: 30px; background-color: ${EmailConfig.theme.colors.articleBackground}; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; font-size: 13px; color: ${EmailConfig.theme.colors.secondaryText};">
              ${EmailConfig.text.footerText}
            </p>
            <p style="margin: 0 0 10px 0; font-size: 12px; color: ${EmailConfig.theme.colors.mutedText};">
              ${EmailConfig.text.footerSubtext}
            </p>
            <p style="margin: 0; font-size: 11px;">
              <a href="https://examprepdaily-main.vercel.app/unsubscribe?email=${subscriberEmail}" style="color: ${EmailConfig.theme.colors.mutedText}; text-decoration: underline;">
                Unsubscribe
              </a>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
