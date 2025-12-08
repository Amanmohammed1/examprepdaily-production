export type ExamType =
  | 'rbi_grade_b'
  | 'sebi_grade_a'
  | 'nabard_grade_a'
  | 'nabard_grade_b'
  | 'upsc_cse'
  | 'upsc_ies'
  | 'ssc_cgl'
  | 'ibps_po'
  | 'ibps_clerk'
  | 'lic_aao'
  | 'current_affairs'
  | 'other';

export type ContentCategory =
  | 'rbi_circulars'
  | 'government_schemes'
  | 'economy'
  | 'banking'
  | 'finance'
  | 'current_affairs'
  | 'international'
  | 'science_tech'
  | 'environment'
  | 'sports'
  | 'awards'
  | 'other';

export interface Exam {
  id: string;
  code: ExamType;
  name: string;
  description: string | null;
  related_categories: ContentCategory[];
  is_active: boolean;
  created_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  selected_exams: ExamType[];
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
  verification_token: string | null;
  is_verified: boolean;
}

export interface Article {
  id: string;
  source_id: string | null;
  source_name: string;
  title: string;
  original_url: string | null;
  content: string | null;
  summary: string | null;
  key_points: string[] | null;
  exam_tags: ExamType[];
  category: ContentCategory | null;
  published_at: string | null;
  fetched_at: string;
  processed_at: string | null;
  is_processed: boolean;
}

export interface ContentSource {
  id: string;
  name: string;
  url: string;
  source_type: 'rss' | 'scrape' | 'api';
  category: ContentCategory;
  is_active: boolean;
  last_fetched_at: string | null;
  created_at: string;
}