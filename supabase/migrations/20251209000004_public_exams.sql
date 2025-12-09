-- Enable RLS on exams (if not already)
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Allow public read access to exams
CREATE POLICY "Allow public read access" ON public.exams
FOR SELECT USING (true);

-- Ensure public read access to subscribers (Wait, subscribers should be private?)
-- RLS on subscribers is good. We use RPC for insert/update now.
