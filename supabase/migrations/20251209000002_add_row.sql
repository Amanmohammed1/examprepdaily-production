-- Add Current Affairs to the exams table
-- This runs after enum is committed
INSERT INTO public.exams (code, name, description, is_active, related_categories)
VALUES 
  ('current_affairs', 'Current Affairs', 'General Awareness & News', true, ARRAY['current_affairs', 'economy', 'government_schemes', 'international', 'sports', 'awards']::content_category[])
ON CONFLICT (code) DO NOTHING;
