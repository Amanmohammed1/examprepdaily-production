-- Add 'current_affairs' to the enum
-- This must be separate to be safe for immediate use
ALTER TYPE public.exam_type ADD VALUE IF NOT EXISTS 'current_affairs';
