import fs from 'fs';
import path from 'path';
import { Product, StructuredKnowledge, Advertisement, QuestionLog, RobotTelemetry, AnalyticsSummary } from '../src/types.ts';
import { INITIAL_PRODUCTS, INITIAL_KNOWLEDGE, INITIAL_ADVERTISEMENTS, INITIAL_QUESTION_LOGS, INITIAL_ROBOT_TELEMETRY } from './seedData.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  products: Product[];
  knowledge: Record<string, StructuredKnowledge>;
  advertisements: Advertisement[];
  questionLogs: QuestionLog[];
  robot: RobotTelemetry;
  settings: Record<string, any>;
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      products: [...INITIAL_PRODUCTS],
      knowledge: { ...INITIAL_KNOWLEDGE },
      advertisements: [...INITIAL_ADVERTISEMENTS],
      questionLogs: [...INITIAL_QUESTION_LOGS],
      robot: { ...INITIAL_ROBOT_TELEMETRY },
      settings: {
        ai_engine: 'intent-knowledge-v2',
        auto_switch_ads: true,
        enable_speech: true,
        strict_no_hallucination: true,
        robot_screen_timeout_sec: 120,
        currency: 'INR',
        country: 'IN',
        timezone: 'Asia/Kolkata',
      }
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.products)) {
          this.data = parsed;
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('DB initialization notice: using in-memory state.', err);
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database to disk:', err);
    }
  }

  public resetDemoData() {
    this.data = {
      products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
      knowledge: JSON.parse(JSON.stringify(INITIAL_KNOWLEDGE)),
      advertisements: JSON.parse(JSON.stringify(INITIAL_ADVERTISEMENTS)),
      questionLogs: JSON.parse(JSON.stringify(INITIAL_QUESTION_LOGS)),
      robot: JSON.parse(JSON.stringify(INITIAL_ROBOT_TELEMETRY)),
      settings: {
        ai_engine: 'intent-knowledge-v2',
        auto_switch_ads: true,
        enable_speech: true,
        strict_no_hallucination: true,
        robot_screen_timeout_sec: 120,
        currency: 'INR',
        country: 'IN',
        timezone: 'Asia/Kolkata',
      }
    };
    this.save();
    return this.data;
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.products.unshift(newProduct);
    this.save();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    delete this.data.knowledge[id];
    
    // Cascade delete all advertisements referencing this product
    const removedAds = this.data.advertisements.filter(a => a.product_id === id);
    this.data.advertisements = this.data.advertisements.filter(a => a.product_id !== id);
    
    // If active ad belonged to this product, reset robot broadcast
    if (this.data.robot.current_ad_id && removedAds.some(a => a.id === this.data.robot.current_ad_id)) {
      this.data.robot.current_ad_id = null;
      this.data.robot.status = 'idle';
    }

    this.save();
    return this.data.products.length < initialLen;
  }

  // --- KNOWLEDGE ---
  public getKnowledgeByProductId(productId: string): StructuredKnowledge | null {
    return this.data.knowledge[productId] || null;
  }

  public setKnowledge(productId: string, knowledge: StructuredKnowledge) {
    this.data.knowledge[productId] = {
      ...knowledge,
      product_id: productId,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.knowledge[productId];
  }

  public approveKnowledge(productId: string): StructuredKnowledge | null {
    const k = this.data.knowledge[productId];
    if (!k) return null;
    k.is_approved = true;
    k.approved_at = new Date().toISOString();
    k.updated_at = new Date().toISOString();
    this.save();
    return k;
  }

  // --- ADVERTISEMENTS & SCHEDULING ENGINE ---
  public getAdvertisements(): Advertisement[] {
    this.refreshAdStatuses();
    return this.data.advertisements;
  }

  public getAdvertisementById(id: string): Advertisement | undefined {
    return this.data.advertisements.find(a => a.id === id);
  }

  public getActiveAdvertisement(): { advertisement: Advertisement | null; product: Product | null; knowledge: StructuredKnowledge | null } {
    this.refreshAdStatuses();
    
    // Find currently running ad strictly
    let activeAd = this.data.advertisements.find(a => a.status === 'running');
    
    // Check if there is an eligible scheduled ad that should start automatically
    if (!activeAd) {
      const now = Date.now();
      const nextScheduled = this.data.advertisements.find(a => {
        if (a.status !== 'scheduled') return false;
        const start = new Date(a.start_time).getTime();
        const end = new Date(a.end_time).getTime();
        return now >= start && now < end;
      });

      if (nextScheduled) {
        nextScheduled.status = 'running';
        activeAd = nextScheduled;
        this.save();
      }
    }

    if (!activeAd) {
      if (this.data.robot.status === 'broadcasting') {
        this.data.robot.status = 'idle';
        this.data.robot.current_ad_id = null;
      }
      return { advertisement: null, product: null, knowledge: null };
    }

    // Verify product still exists
    const product = this.getProductById(activeAd.product_id);
    if (!product) {
      // Clean up orphaned ad
      activeAd.status = 'stopped';
      this.data.robot.current_ad_id = null;
      this.data.robot.status = 'idle';
      this.save();
      return { advertisement: null, product: null, knowledge: null };
    }

    const knowledge = this.getKnowledgeByProductId(activeAd.product_id) || null;

    // Update robot telemetry
    this.data.robot.current_ad_id = activeAd.id;
    this.data.robot.status = 'broadcasting';
    this.data.robot.last_ping = new Date().toISOString();

    return { advertisement: activeAd, product, knowledge };
  }

  public createAdvertisement(ad: Omit<Advertisement, 'id' | 'created_at' | 'updated_at'>): Advertisement {
    const newAd: Advertisement = {
      ...ad,
      id: `ad-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // If set to running, make other running ads scheduled
    if (newAd.status === 'running') {
      this.data.advertisements.forEach(a => {
        if (a.status === 'running') a.status = 'scheduled';
      });
      this.data.robot.current_ad_id = newAd.id;
      this.data.robot.status = 'broadcasting';
    }

    this.data.advertisements.unshift(newAd);
    this.save();
    return newAd;
  }

  public updateAdvertisement(id: string, updates: Partial<Advertisement>): Advertisement | null {
    const idx = this.data.advertisements.findIndex(a => a.id === id);
    if (idx === -1) return null;

    if (updates.status === 'running') {
      this.data.advertisements.forEach(a => {
        if (a.id !== id && a.status === 'running') a.status = 'scheduled';
      });
      this.data.robot.current_ad_id = id;
      this.data.robot.status = 'broadcasting';
    }

    this.data.advertisements[idx] = {
      ...this.data.advertisements[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.advertisements[idx];
  }

  public deleteAdvertisement(id: string): boolean {
    const initialLen = this.data.advertisements.length;
    const target = this.data.advertisements.find(a => a.id === id);
    if (!target) return false;

    if (target.status === 'running' || this.data.robot.current_ad_id === id) {
      this.data.robot.current_ad_id = null;
      this.data.robot.status = 'idle';
    }

    this.data.advertisements = this.data.advertisements.filter(a => a.id !== id);
    this.save();
    return this.data.advertisements.length < initialLen;
  }

  public startAdvertisement(id: string): Advertisement | null {
    const target = this.data.advertisements.find(a => a.id === id);
    if (!target) return null;

    const prod = this.getProductById(target.product_id);
    if (!prod) return null;

    const now = new Date();
    const durationSec = target.remaining_seconds && target.remaining_seconds > 0
      ? target.remaining_seconds
      : (target.duration_minutes || 60) * 60;
    const end = new Date(now.getTime() + durationSec * 1000);

    this.data.advertisements.forEach(a => {
      if (a.id === id) {
        a.status = 'running';
        a.start_time = now.toISOString();
        a.end_time = end.toISOString();
        delete a.remaining_seconds;
        a.updated_at = now.toISOString();
      } else if (a.status === 'running') {
        a.status = 'scheduled';
        a.updated_at = now.toISOString();
      }
    });

    this.data.robot.current_ad_id = id;
    this.data.robot.status = 'broadcasting';
    this.save();
    return target;
  }

  public pauseAdvertisement(id: string): Advertisement | null {
    const target = this.data.advertisements.find(a => a.id === id);
    if (!target) return null;

    const now = Date.now();
    const endMs = new Date(target.end_time).getTime();
    const remainingSeconds = Math.max(1, Math.round((endMs - now) / 1000));

    target.status = 'paused';
    target.remaining_seconds = remainingSeconds;
    target.updated_at = new Date().toISOString();

    if (this.data.robot.current_ad_id === id) {
      this.data.robot.current_ad_id = null;
      this.data.robot.status = 'idle';
    }

    this.save();
    return target;
  }

  public resumeAdvertisement(id: string): Advertisement | null {
    return this.startAdvertisement(id);
  }

  public stopAdvertisement(id: string): Advertisement | null {
    const target = this.data.advertisements.find(a => a.id === id);
    if (!target) return null;

    target.status = 'stopped';
    delete target.remaining_seconds;
    target.updated_at = new Date().toISOString();

    if (this.data.robot.current_ad_id === id) {
      this.data.robot.current_ad_id = null;
      this.data.robot.status = 'idle';
    }

    this.save();
    return target;
  }

  public activateAdvertisementNow(id: string): Advertisement | null {
    return this.startAdvertisement(id);
  }

  private refreshAdStatuses() {
    const now = Date.now();
    let hasChanges = false;

    this.data.advertisements.forEach(ad => {
      if (ad.status === 'running') {
        const end = new Date(ad.end_time).getTime();
        if (now > end) {
          if (ad.auto_loop) {
            // Restart loop cleanly
            const durMs = (ad.duration_minutes || 60) * 60 * 1000;
            ad.start_time = new Date().toISOString();
            ad.end_time = new Date(now + durMs).toISOString();
            hasChanges = true;
          } else {
            ad.status = 'completed';
            if (this.data.robot.current_ad_id === ad.id) {
              this.data.robot.current_ad_id = null;
              this.data.robot.status = 'idle';
            }
            hasChanges = true;
          }
        }
      }
    });

    if (hasChanges) {
      this.save();
    }
  }

  // --- QUESTION LOGS & ANALYTICS ---
  public logQuestion(log: Omit<QuestionLog, 'id' | 'timestamp'>): QuestionLog {
    const newLog: QuestionLog = {
      ...log,
      id: `qlog-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.questionLogs.unshift(newLog);
    if (this.data.questionLogs.length > 500) {
      this.data.questionLogs = this.data.questionLogs.slice(0, 500);
    }
    this.save();
    return newLog;
  }

  public getQuestionLogs(): QuestionLog[] {
    return this.data.questionLogs;
  }

  public updateQuestionFeedback(id: string, feedback: 'helpful' | 'unhelpful'): boolean {
    const q = this.data.questionLogs.find(item => item.id === id);
    if (q) {
      q.feedback = feedback;
      this.save();
      return true;
    }
    return false;
  }

  public getAnalyticsSummary(): AnalyticsSummary {
    this.refreshAdStatuses();
    const total_products = this.data.products.length;
    const active_advertisements = this.data.advertisements.filter(a => a.status === 'running').length;
    const scheduled_advertisements = this.data.advertisements.filter(a => a.status === 'scheduled').length;
    const completed_advertisements = this.data.advertisements.filter(a => a.status === 'completed').length;
    const total_customer_questions = this.data.questionLogs.length;

    const latencies = this.data.questionLogs.map(q => q.latency_ms || 300);
    const avg_response_time_ms = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 280;

    // Intent counts
    const intentMap: Record<string, number> = {};
    this.data.questionLogs.forEach(q => {
      const intent = q.detected_intent || 'GENERAL_INQUIRY';
      intentMap[intent] = (intentMap[intent] || 0) + 1;
    });
    const top_intents = Object.entries(intentMap)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Type distribution
    const typeMap: Record<string, number> = {};
    this.data.products.forEach(p => {
      const t = p.type || 'Other';
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    const type_distribution = Object.entries(typeMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total_products,
      active_advertisements,
      scheduled_advertisements,
      completed_advertisements,
      total_customer_questions,
      avg_response_time_ms,
      top_intents,
      type_distribution,
      recent_questions: this.data.questionLogs.slice(0, 15),
    };
  }

  // --- ROBOT TELEMETRY & SETTINGS ---
  public getRobotTelemetry(): RobotTelemetry {
    return {
      ...this.data.robot,
      last_ping: new Date().toISOString(),
    };
  }

  public updateRobotTelemetry(updates: Partial<RobotTelemetry>): RobotTelemetry {
    this.data.robot = {
      ...this.data.robot,
      ...updates,
      last_ping: new Date().toISOString(),
    };
    this.save();
    return this.data.robot;
  }

  public getSettings() {
    return this.data.settings;
  }

  public updateSettings(newSettings: Record<string, any>) {
    this.data.settings = {
      ...this.data.settings,
      ...newSettings,
    };
    this.save();
    return this.data.settings;
  }
}

export const db = new Database();
