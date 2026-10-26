import { Product, StructuredKnowledge, Advertisement, QuestionLog, RobotTelemetry, AnalyticsSummary } from './types.ts';

export async function fetchHealth() {
  const res = await fetch('/api/health');
  return res.json();
}

export async function loginAdmin(username: string, password?: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
}

// Products
export async function getProducts(): Promise<Product[]> {
  const res = await fetch('/api/products');
  return res.json();
}

export async function getProduct(id: string): Promise<Product & { knowledge?: StructuredKnowledge }> {
  const res = await fetch(`/api/products/${id}`);
  return res.json();
}

export async function createProduct(payload: {
  name: string;
  type: string;
  description: string;
  product_poster?: string;
  advertisement_poster?: string;
  tagline?: string;
  auto_analyze?: boolean;
}): Promise<{ product: Product; knowledge?: StructuredKnowledge }> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create product');
  }
  return res.json();
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function deleteProduct(id: string): Promise<boolean> {
  const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
  return res.ok;
}

// AI Product Analyzer
export async function analyzeProductRaw(payload: { name: string; type: string; description: string }) {
  const res = await fetch('/api/products/analyze-raw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('AI analysis failed');
  return res.json();
}

export async function analyzeProduct(id: string): Promise<StructuredKnowledge> {
  const res = await fetch(`/api/products/${id}/analyze`, { method: 'POST' });
  if (!res.ok) throw new Error('AI product analysis failed');
  return res.json();
}

// Knowledge
export async function getProductKnowledge(productId: string): Promise<StructuredKnowledge> {
  const res = await fetch(`/api/products/${productId}/knowledge`);
  return res.json();
}

export async function updateProductKnowledge(productId: string, knowledge: Partial<StructuredKnowledge>): Promise<StructuredKnowledge> {
  const res = await fetch(`/api/products/${productId}/knowledge`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(knowledge),
  });
  return res.json();
}

export async function approveProductKnowledge(productId: string): Promise<StructuredKnowledge> {
  const res = await fetch(`/api/products/${productId}/knowledge/approve`, { method: 'POST' });
  return res.json();
}

// Advertisements
export async function getAdvertisements(): Promise<Advertisement[]> {
  const res = await fetch('/api/advertisements');
  return res.json();
}

export async function getActiveAdvertisement(): Promise<{
  advertisement: Advertisement | null;
  product: Product | null;
  knowledge: StructuredKnowledge | null;
}> {
  const res = await fetch('/api/advertisements/active');
  return res.json();
}

export async function createAdvertisement(payload: {
  product_id: string;
  title?: string;
  tagline?: string;
  advertisement_poster?: string;
  start_time?: string;
  duration_minutes?: number;
  priority?: number;
  status?: string;
  auto_loop?: boolean;
}): Promise<Advertisement> {
  const res = await fetch('/api/advertisements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateAdvertisement(id: string, updates: Partial<Advertisement>): Promise<Advertisement> {
  const res = await fetch(`/api/advertisements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function startAdvertisement(id: string): Promise<Advertisement> {
  const res = await fetch(`/api/advertisements/${id}/start`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to start advertisement');
  }
  return res.json();
}

export async function pauseAdvertisement(id: string): Promise<Advertisement> {
  const res = await fetch(`/api/advertisements/${id}/pause`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to pause advertisement');
  }
  return res.json();
}

export async function resumeAdvertisement(id: string): Promise<Advertisement> {
  const res = await fetch(`/api/advertisements/${id}/resume`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to resume advertisement');
  }
  return res.json();
}

export async function stopAdvertisement(id: string): Promise<Advertisement> {
  const res = await fetch(`/api/advertisements/${id}/stop`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to stop advertisement');
  }
  return res.json();
}

export async function activateAdvertisement(id: string): Promise<Advertisement> {
  const res = await fetch(`/api/advertisements/${id}/activate`, { method: 'POST' });
  return res.json();
}

export async function deleteAdvertisement(id: string): Promise<boolean> {
  const res = await fetch(`/api/advertisements/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function duplicateAdvertisement(id: string): Promise<Advertisement> {
  const res = await fetch(`/api/advertisements/${id}/duplicate`, { method: 'POST' });
  return res.json();
}

// Customer Chat
export async function askCustomerQuestion(payload: {
  product_id?: string;
  question: string;
  history?: { role: 'user' | 'model'; text: string }[];
}): Promise<{
  intent: string;
  required_fields: string[];
  answer: string;
  language_detected: string;
  confidence: number;
  product_id: string;
  product_name: string;
  log_id: string;
  latency_ms: number;
}> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Chat request failed');
  }
  return res.json();
}

// Question History & Analytics
export async function getQuestionHistory(): Promise<QuestionLog[]> {
  const res = await fetch('/api/question-history');
  return res.json();
}

export async function submitQuestionFeedback(id: string, feedback: 'helpful' | 'unhelpful') {
  const res = await fetch(`/api/question-history/${id}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback }),
  });
  return res.json();
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const res = await fetch('/api/analytics');
  return res.json();
}

// Robot Telemetry
export async function getRobotTelemetry(): Promise<RobotTelemetry> {
  const res = await fetch('/api/robot/telemetry');
  return res.json();
}

export async function updateRobotTelemetry(updates: Partial<RobotTelemetry>): Promise<RobotTelemetry> {
  const res = await fetch('/api/robot/telemetry', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

// Reset Demo Data
export async function resetDemoData() {
  const res = await fetch('/api/demo/reset', { method: 'POST' });
  return res.json();
}
