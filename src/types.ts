export type ProductType =
  | 'Food & Beverage'
  | 'College / Education'
  | 'Computer / Laptop'
  | 'Mobile / Smartphone'
  | 'Electronics'
  | 'Automobile'
  | 'Hotel / Resort'
  | 'Restaurant / Cafe'
  | 'Clothing / Fashion'
  | 'Home Appliances'
  | 'Healthcare / Pharmacy'
  | 'Fitness / Gym'
  | 'Salon / Beauty'
  | 'Retail / Shopping'
  | 'Finance / Banking'
  | 'Travel / Tourism'
  | 'Real Estate'
  | 'Service / Repair'
  | 'Training / Coaching'
  | 'Gaming / Entertainment'
  | 'Other / Custom';

export const PRODUCT_TYPES: ProductType[] = [
  'Food & Beverage',
  'College / Education',
  'Computer / Laptop',
  'Mobile / Smartphone',
  'Electronics',
  'Automobile',
  'Hotel / Resort',
  'Restaurant / Cafe',
  'Clothing / Fashion',
  'Home Appliances',
  'Healthcare / Pharmacy',
  'Fitness / Gym',
  'Salon / Beauty',
  'Retail / Shopping',
  'Finance / Banking',
  'Travel / Tourism',
  'Real Estate',
  'Service / Repair',
  'Training / Coaching',
  'Gaming / Entertainment',
  'Other / Custom',
];

export type FieldConfidence = 'available' | 'not_specified' | 'uncertain';

export interface KnowledgeField {
  key: string;
  label: string;
  value: string | number | string[] | null;
  confidence: FieldConfidence;
  category?: string;
}

export interface StructuredKnowledge {
  product_id: string;
  product_name: string;
  product_type: string;
  summary: string;
  fields: Record<string, KnowledgeField>;
  suggested_questions: string[];
  analyzer_version: string;
  is_approved: boolean;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType | string;
  description: string;
  product_poster: string;
  advertisement_poster?: string;
  tagline?: string;
  created_at: string;
  updated_at: string;
}

export type AdStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'stopped' | 'completed' | 'expired' | 'deleted';

export interface Advertisement {
  id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  title: string;
  tagline: string;
  product_poster: string;
  advertisement_poster: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  duration_minutes: number;
  remaining_seconds?: number; // Preserved duration when paused
  priority: number; // 1 to 5
  status: AdStatus;
  auto_loop: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionLog {
  id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  customer_question: string;
  detected_intent: string;
  required_fields: string[];
  answer: string;
  language_detected: string;
  latency_ms: number;
  timestamp: string;
  feedback?: 'helpful' | 'unhelpful';
}

export interface RobotTelemetry {
  id: string;
  name: string;
  battery_level: number;
  status: 'broadcasting' | 'idle' | 'answering' | 'sleeping' | 'offline';
  current_ad_id: string | null;
  active_listeners: number;
  screen_brightness: number;
  volume: number;
  mic_enabled: boolean;
  speech_synthesis_enabled: boolean;
  last_ping: string;
}

export interface AnalyticsSummary {
  total_products: number;
  active_advertisements: number;
  scheduled_advertisements: number;
  completed_advertisements: number;
  total_customer_questions: number;
  avg_response_time_ms: number;
  top_intents: { intent: string; count: number }[];
  type_distribution: { type: string; count: number }[];
  recent_questions: QuestionLog[];
}
