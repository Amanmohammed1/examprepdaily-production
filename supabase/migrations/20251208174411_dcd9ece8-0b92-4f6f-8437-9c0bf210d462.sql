-- Create enum for exam types
CREATE TYPE public.exam_type AS ENUM (
  'rbi_grade_b',
  'sebi_grade_a',
  'nabard_grade_a',
  'nabard_grade_b',
  'upsc_cse',
  'upsc_ies',
  'ssc_cgl',
  'ibps_po',
  'ibps_clerk',
  'lic_aao',
  'other'
);

-- Create enum for content categories
CREATE TYPE public.content_category AS ENUM (
  'rbi_circulars',
  'government_schemes',
  'economy',
  'banking',
  'finance',
  'current_affairs',
  'international',
  'science_tech',
  'environment',
  'sports',
  'awards',
  'other'
);

-- Create enum for content source types
CREATE TYPE public.source_type AS ENUM (
  'rss',
  'scrape',
  'api'
);

-- Create exams reference table
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code exam_type NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  related_categories content_category[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content sources table
CREATE TABLE public.content_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type source_type NOT NULL DEFAULT 'rss',
  category content_category NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscribers table (no auth required - simple email signup)
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  selected_exams exam_type[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  verification_token TEXT,
  is_verified BOOLEAN DEFAULT false
);

-- Create articles table for storing fetched content
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.content_sources(id) ON DELETE SET NULL,
  source_name TEXT NOT NULL,
  title TEXT NOT NULL,
  original_url TEXT,
  content TEXT,
  summary TEXT,
  key_points TEXT[],
  exam_tags exam_type[] DEFAULT '{}',
  category content_category,
  published_at TIMESTAMP WITH TIME ZONE,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  is_processed BOOLEAN DEFAULT false
);

-- Create email_logs table for tracking sent emails
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'sent',
  article_count INTEGER DEFAULT 0
);

-- Enable RLS on all tables
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for exams (reference data)
CREATE POLICY "Anyone can view exams" 
ON public.exams 
FOR SELECT 
USING (true);

-- Public read access for content sources (reference data)
CREATE POLICY "Anyone can view content sources" 
ON public.content_sources 
FOR SELECT 
USING (true);

-- Allow anonymous inserts to subscribers (for signup form)
CREATE POLICY "Anyone can subscribe" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (true);

-- Allow subscribers to verify themselves via token
CREATE POLICY "Subscribers can update via token" 
ON public.subscribers 
FOR UPDATE 
USING (true);

-- Public read access for articles (content is public)
CREATE POLICY "Anyone can view articles" 
ON public.articles 
FOR SELECT 
USING (true);

-- Insert initial exam data
INSERT INTO public.exams (code, name, description, related_categories) VALUES
('rbi_grade_b', 'RBI Grade B', 'Reserve Bank of India Grade B Officer Exam', ARRAY['rbi_circulars', 'economy', 'banking', 'finance', 'current_affairs']::content_category[]),
('sebi_grade_a', 'SEBI Grade A', 'Securities and Exchange Board of India Grade A Exam', ARRAY['finance', 'economy', 'current_affairs']::content_category[]),
('nabard_grade_a', 'NABARD Grade A', 'National Bank for Agriculture and Rural Development Grade A', ARRAY['economy', 'banking', 'government_schemes', 'current_affairs']::content_category[]),
('nabard_grade_b', 'NABARD Grade B', 'National Bank for Agriculture and Rural Development Grade B', ARRAY['economy', 'banking', 'government_schemes', 'current_affairs']::content_category[]),
('upsc_cse', 'UPSC CSE', 'Union Public Service Commission Civil Services Exam', ARRAY['government_schemes', 'economy', 'current_affairs', 'international', 'science_tech', 'environment']::content_category[]),
('upsc_ies', 'UPSC IES', 'Indian Economic Service Exam', ARRAY['economy', 'finance', 'current_affairs', 'international']::content_category[]),
('ssc_cgl', 'SSC CGL', 'Staff Selection Commission Combined Graduate Level', ARRAY['current_affairs', 'government_schemes', 'economy']::content_category[]),
('ibps_po', 'IBPS PO', 'Institute of Banking Personnel Selection Probationary Officer', ARRAY['banking', 'economy', 'current_affairs', 'finance']::content_category[]),
('ibps_clerk', 'IBPS Clerk', 'Institute of Banking Personnel Selection Clerk', ARRAY['banking', 'current_affairs']::content_category[]),
('lic_aao', 'LIC AAO', 'Life Insurance Corporation Assistant Administrative Officer', ARRAY['finance', 'economy', 'current_affairs']::content_category[]);

-- Insert initial content sources
INSERT INTO public.content_sources (name, url, source_type, category) VALUES
('RBI Press Releases', 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx', 'scrape', 'rbi_circulars'),
('RBI Notifications', 'https://www.rbi.org.in/Scripts/NotificationUser.aspx', 'scrape', 'rbi_circulars'),
('PIB Releases', 'https://pib.gov.in/allRel.aspx', 'scrape', 'government_schemes'),
('Economic Times Economy', 'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms', 'rss', 'economy'),
('Ministry of Finance', 'https://www.finmin.nic.in/', 'scrape', 'finance');