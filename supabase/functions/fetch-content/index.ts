import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleItem {
  title: string;
  url: string;
  published_at: string | Date;
  source: string;
  category: string;
  original_summary?: string;
}

// Helper to parse dates loosely
function parseDate(dateStr: string): Date {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    return new Date();
  } catch {
    return new Date();
  }
}

async function saveArticles(supabase: any, articles: ArticleItem[]) {
  let savedCount = 0;
  for (const item of articles) {
    try {
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('original_url', item.url)
        .single();

      if (!existing) {
        const { error } = await supabase.from('articles').insert({
          title: item.title,
          original_url: item.url,
          source_name: item.source,
          category: item.category,
          published_at: new Date(item.published_at).toISOString(),
          fetched_at: new Date().toISOString(),
          is_processed: false,
          summary: item.original_summary || null // Pre-fill summary if available
        });
        if (!error) savedCount++;
      }
    } catch (e) {
      console.error(`Error saving ${item.title}:`, e);
    }
  }
  return savedCount;
}

// --- SCRAPERS ---

async function scrapeRBINotifications(): Promise<ArticleItem[]> {
  const url = 'https://rbi.org.in/Scripts/NotificationUser.aspx';
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const items: ArticleItem[] = [];

    $('.tablebg tr').each((i, el) => {
      if (i === 0) return;
      const tds = $(el).find('td');
      if (tds.length >= 2) {
        const anchor = $(tds[0]).find('a');
        if (anchor.length > 0) {
          const dateText = $(tds[0]).text().split(anchor.text())[0].trim(); // Rough extraction
          items.push({
            title: anchor.text().trim(),
            url: new URL(anchor.attr('href') || '', 'https://rbi.org.in/Scripts/').href,
            published_at: parseDate(dateText),
            source: 'RBI Notifications',
            category: 'rbi_circulars'
          });
        }
      }
    });
    return items.slice(0, 5);
  } catch (e) { console.error('RBI Notif Error:', e); return []; }
}

async function scrapeRBIPressReleases(): Promise<ArticleItem[]> {
  const url = 'https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx';
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const items: ArticleItem[] = [];

    $('.tablebg tr').each((i, el) => {
      if (i === 0) return;
      const tds = $(el).find('td');
      if (tds.length >= 2) {
        const anchor = $(tds[0]).find('a');
        if (anchor.length > 0) {
          items.push({
            title: anchor.text().trim(),
            url: new URL(anchor.attr('href') || '', 'https://rbi.org.in/Scripts/').href,
            published_at: new Date(),
            source: 'RBI Press Releases',
            category: 'rbi_circulars'
          });
        }
      }
    });
    return items.slice(0, 5);
  } catch (e) { console.error('RBI Press Error:', e); return []; }
}

async function scrapeSEBI(): Promise<ArticleItem[]> {
  const url = 'https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListingAll=yes';
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const items: ArticleItem[] = [];

    $('table tr').each((i, el) => {
      if (i === 0) return;
      const tds = $(el).find('td');
      if (tds.length >= 3) {
        const anchor = $(tds[2]).find('a');
        if (anchor.length > 0) {
          items.push({
            title: anchor.text().trim(),
            url: anchor.attr('href') || '',
            published_at: $(tds[0]).text().trim(),
            source: 'SEBI',
            category: 'finance'
          });
        }
      }
    });
    return items.slice(0, 5);
  } catch (e) { console.error('SEBI Error:', e); return []; }
}

async function scrapeNABARD(): Promise<ArticleItem[]> {
  const url = 'https://www.nabard.org/circulars.aspx?cid=504&id=24';
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const items: ArticleItem[] = [];

    $('.common_body_text a[href*="CircularPage.aspx"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        items.push({
          title: $(el).text().trim(),
          url: new URL(href, 'https://www.nabard.org/').href,
          published_at: new Date(),
          source: 'NABARD',
          category: 'economy'
        });
      }
    });
    return items.slice(0, 5);
  } catch (e) { console.error('NABARD Error:', e); return []; }
}

async function scrapePIB(): Promise<ArticleItem[]> {
  const url = 'https://pib.gov.in/allRel.aspx';
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const items: ArticleItem[] = [];

    $('a[href*="/PressReleasePage.aspx?PRID="]').each((i, el) => {
      const href = $(el).attr('href');
      const title = $(el).attr('title') || $(el).text().trim();
      if (href && title) {
        items.push({
          title: title,
          url: new URL(href, 'https://pib.gov.in/').href,
          published_at: new Date(),
          source: 'PIB',
          category: 'government_schemes'
        });
      }
    });
    // Unique by URL
    const unique = items.filter((v, i, a) => a.findIndex(t => (t.url === v.url)) === i);
    return unique.slice(0, 10);
  } catch (e) { console.error('PIB Error:', e); return []; }
}

async function scrapeSSC(): Promise<ArticleItem[]> {
  const url = 'https://ssc.gov.in/home/notice-board';
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const items: ArticleItem[] = [];

    $('.notice-board-table tr').each((i, el) => {
      const dateText = $(el).find('td:nth-child(1)').text().trim();
      const title = $(el).find('td:nth-child(2)').text().trim();
      const relativeLink = $(el).find('a').attr('href'); // Might be missing or JS

      if (title) {
        items.push({
          title: title,
          // If link missing, map to notice board
          url: relativeLink ? (relativeLink.startsWith('http') ? relativeLink : `https://ssc.gov.in${relativeLink}`) : 'https://ssc.gov.in/home/notice-board',
          published_at: parseDate(dateText),
          source: 'SSC',
          category: 'other' // Will tag as ssc_cgl
        });
      }
    });
    return items.slice(0, 5);
  } catch (e) { console.error('SSC Error:', e); return []; }
}

async function scrapeIBPS(): Promise<ArticleItem[]> {
  const url = 'https://www.ibps.in/index.php/management-trainees-xv/';
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const items: ArticleItem[] = [];

    $('a.link').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      if (text && href && (text.toLowerCase().includes('notification') || text.toLowerCase().includes('process'))) {
        items.push({
          title: text,
          url: href,
          published_at: new Date(),
          source: 'IBPS',
          category: 'banking'
        });
      }
    });
    return items.slice(0, 5);
  } catch (e) { console.error('IBPS Error:', e); return []; }
}

async function scrapeLIC(): Promise<ArticleItem[]> {
  // Use a simpler target for MVP, or just generic Careers search
  // Based on research, LIC is hard. We will do a mocked "Visit for Updates" if fetch fails, 
  // or try the sitemap link if we found one. For now, let's keep it minimal.
  return [];
}

async function scrapeAffairsCloud(): Promise<ArticleItem[]> {
  console.log("Scraping AffairsCloud Current Affairs...");
  try {
    const response = await fetch("https://www.affairscloud.com/current-affairs/feed/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ExamPrepBot/1.0)",
      },
    });

    if (!response.ok) {
      console.error(`AffairsCloud HTTP error: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const articles: ArticleItem[] = [];

    $("item").each((_, element) => {
      const title = $(element).find("title").text();
      const link = $(element).find("link").text();
      const pubDate = $(element).find("pubDate").text();
      const content = $(element).find("content\\:encoded").text() || $(element).find("description").text();

      // Basic dedupe logic
      if (title) {
        articles.push({
          title: title.trim(),
          url: link.trim(),
          source: "AffairsCloud",
          category: "current_affairs",
          published_at: new Date(pubDate), // Convert to Date object
          original_summary: content.substring(0, 500) + "...",
          // is_processed: false // This field is not part of ArticleItem
        });
      }
    });

    console.log(`AffairsCloud: Found ${articles.length} articles.`);
    return articles;

  } catch (error) {
    console.error("Error scraping AffairsCloud:", error);
    return [];
  }
}

// --- MAIN HANDLER ---
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching content from all 7 sources...');

    const results = await Promise.allSettled([
      scrapeRBINotifications(),
      scrapeRBIPressReleases(),
      scrapeSEBI(),
      scrapeNABARD(),
      scrapePIB(),
      scrapeSSC(),
      scrapeIBPS(),
      scrapeLIC(),
      scrapeAffairsCloud() // New Source
    ]);

    let totalSaved = 0;
    const details = [];

    // Names for logging
    const names = ['RBI Notif', 'RBI Press', 'SEBI', 'NABARD', 'PIB', 'SSC', 'IBPS', 'LIC', 'AffairsCloud'];

    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (res.status === 'fulfilled') {
        const count = await saveArticles(supabase, res.value);
        totalSaved += count;
        details.push({ source: names[i], status: 'success', found: res.value.length, saved: count });
      } else {
        details.push({ source: names[i], status: 'error', error: res.reason });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fetched and saved ${totalSaved} new articles`,
        details: details
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Fatal Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});