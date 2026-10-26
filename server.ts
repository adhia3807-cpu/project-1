import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db.ts';
import { analyzeProductDescription, answerCustomerQuestion } from './server/groq.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Trust Cloudflare / reverse proxy headers
  app.set('trust proxy', 1);

  // JSON payload parser
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Request logger
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // --- HEALTH & STATUS ---
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'AI Advertisement Robot Engine',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      ai_status: 'available',
    });
  });

  // --- AUTHENTICATION ---
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    // Strict admin credentials as specified: bot / 1234
    if (username === 'bot' && password === '1234') {
      res.json({
        success: true,
        token: `robot-admin-token-${Date.now()}`,
        user: {
          id: 'admin-bot',
          name: 'Bot',
          role: 'admin',
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    res.json({
      user: {
        id: 'admin-bot',
        name: 'Bot',
        role: 'admin',
      },
    });
  });

  // --- PRODUCTS CRUD ---
  app.get('/api/products', (req: Request, res: Response) => {
    const products = db.getProducts();
    res.json(products);
  });

  app.get('/api/products/:id', (req: Request, res: Response) => {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const knowledge = db.getKnowledgeByProductId(req.params.id);
    res.json({ ...product, knowledge });
  });

  app.post('/api/products', async (req: Request, res: Response) => {
    try {
      const { name, type, description, product_poster, advertisement_poster, tagline, auto_analyze } = req.body;
      if (!name || !description) {
        return res.status(400).json({ error: 'Product name and description are required' });
      }

      const defaultPoster = product_poster || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
      const newProduct = db.createProduct({
        name,
        type: type || 'Other / Custom',
        description,
        product_poster: defaultPoster,
        advertisement_poster: advertisement_poster || defaultPoster,
        tagline: tagline || `Discover ${name}`,
      });

      let knowledge = null;
      if (auto_analyze !== false) {
        // Run AI Product Analyzer
        const analysis = await analyzeProductDescription(name, type || 'Other / Custom', description);
        knowledge = db.setKnowledge(newProduct.id, {
          product_id: newProduct.id,
          product_name: name,
          product_type: type || 'Other / Custom',
          summary: analysis.summary,
          fields: analysis.fields,
          suggested_questions: analysis.suggested_questions,
          analyzer_version: 'v2.1-intent-engine',
          is_approved: false, // Requires Admin approval as specified in pipeline
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      res.status(201).json({ product: newProduct, knowledge });
    } catch (err: any) {
      console.error('Error creating product:', err);
      res.status(500).json({ error: err.message || 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    const updated = db.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const deleted = db.deleteProduct(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  });

  // --- AI PRODUCT ANALYZER ENDPOINTS ---
  app.post('/api/products/analyze-raw', async (req: Request, res: Response) => {
    try {
      const { name, type, description } = req.body;
      if (!name || !description) {
        return res.status(400).json({ error: 'Product name and description are required for AI analysis' });
      }
      const analysis = await analyzeProductDescription(name, type || 'Other / Custom', description);
      res.json(analysis);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'AI Product Analysis failed' });
    }
  });

  app.post('/api/products/:id/analyze', async (req: Request, res: Response) => {
    try {
      const product = db.getProductById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const analysis = await analyzeProductDescription(product.name, product.type, product.description);
      const knowledge = db.setKnowledge(product.id, {
        product_id: product.id,
        product_name: product.name,
        product_type: product.type,
        summary: analysis.summary,
        fields: analysis.fields,
        suggested_questions: analysis.suggested_questions,
        analyzer_version: 'v2.1-intent-engine',
        is_approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      res.json(knowledge);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'AI Analysis failed' });
    }
  });

  // --- PRODUCT KNOWLEDGE ENDPOINTS ---
  app.get('/api/products/:id/knowledge', (req: Request, res: Response) => {
    const knowledge = db.getKnowledgeByProductId(req.params.id);
    if (!knowledge) return res.status(404).json({ error: 'Knowledge not found for this product' });
    res.json(knowledge);
  });

  app.put('/api/products/:id/knowledge', (req: Request, res: Response) => {
    const product = db.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const updated = db.setKnowledge(req.params.id, req.body);
    res.json(updated);
  });

  app.post('/api/products/:id/knowledge/approve', (req: Request, res: Response) => {
    const approved = db.approveKnowledge(req.params.id);
    if (!approved) return res.status(404).json({ error: 'Knowledge not found to approve' });
    res.json(approved);
  });

  // --- ADVERTISEMENTS ENDPOINTS ---
  app.get('/api/advertisements', (req: Request, res: Response) => {
    res.json(db.getAdvertisements());
  });

  app.get('/api/advertisements/active', (req: Request, res: Response) => {
    const activeData = db.getActiveAdvertisement();
    res.json(activeData);
  });

  app.post('/api/advertisements', (req: Request, res: Response) => {
    try {
      const { product_id, title, tagline, advertisement_poster, start_time, duration_minutes, priority, auto_loop } = req.body;
      const product = db.getProductById(product_id);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const start = start_time ? new Date(start_time) : new Date();
      const dur = duration_minutes || 60;
      const end = new Date(start.getTime() + dur * 60 * 1000);

      const ad = db.createAdvertisement({
        product_id,
        product_name: product.name,
        product_type: product.type,
        title: title || product.name,
        tagline: tagline || product.tagline || '',
        product_poster: product.product_poster,
        advertisement_poster: advertisement_poster || product.advertisement_poster || product.product_poster,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: dur,
        priority: priority || 3,
        status: req.body.status || 'scheduled',
        auto_loop: auto_loop !== false,
      });

      res.status(201).json(ad);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create advertisement' });
    }
  });

  app.put('/api/advertisements/:id', (req: Request, res: Response) => {
    const updated = db.updateAdvertisement(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Advertisement not found' });
    res.json(updated);
  });

  app.post('/api/advertisements/:id/start', (req: Request, res: Response) => {
    const started = db.startAdvertisement(req.params.id);
    if (!started) return res.status(404).json({ error: 'Advertisement or associated product not found' });
    res.json(started);
  });

  app.post('/api/advertisements/:id/pause', (req: Request, res: Response) => {
    const paused = db.pauseAdvertisement(req.params.id);
    if (!paused) return res.status(404).json({ error: 'Advertisement not found' });
    res.json(paused);
  });

  app.post('/api/advertisements/:id/resume', (req: Request, res: Response) => {
    const resumed = db.resumeAdvertisement(req.params.id);
    if (!resumed) return res.status(404).json({ error: 'Advertisement or associated product not found' });
    res.json(resumed);
  });

  app.post('/api/advertisements/:id/stop', (req: Request, res: Response) => {
    const stopped = db.stopAdvertisement(req.params.id);
    if (!stopped) return res.status(404).json({ error: 'Advertisement not found' });
    res.json(stopped);
  });

  app.post('/api/advertisements/:id/activate', (req: Request, res: Response) => {
    const activated = db.activateAdvertisementNow(req.params.id);
    if (!activated) return res.status(404).json({ error: 'Advertisement not found' });
    res.json(activated);
  });

  app.delete('/api/advertisements/:id', (req: Request, res: Response) => {
    const deleted = db.deleteAdvertisement(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Advertisement not found' });
    res.json({ success: true });
  });

  app.post('/api/advertisements/:id/duplicate', (req: Request, res: Response) => {
    const original = db.getAdvertisementById(req.params.id);
    if (!original) return res.status(404).json({ error: 'Advertisement not found' });

    const duplicated = db.createAdvertisement({
      product_id: original.product_id,
      product_name: original.product_name,
      product_type: original.product_type,
      title: `${original.title} (Copy)`,
      tagline: original.tagline,
      product_poster: original.product_poster,
      advertisement_poster: original.advertisement_poster,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + original.duration_minutes * 60 * 1000).toISOString(),
      duration_minutes: original.duration_minutes,
      priority: original.priority,
      status: 'draft',
      auto_loop: original.auto_loop,
    });

    res.status(201).json(duplicated);
  });

  // --- CUSTOMER CHAT & QUESTION INTELLIGENCE ENGINE ---
  app.post('/api/chat', async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const { product_id, question, history } = req.body;
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Customer question is required' });
      }

      // If product_id not provided, look up the currently active advertisement
      let product: any = null;
      let knowledge: any = null;

      if (product_id) {
        product = db.getProductById(product_id);
        knowledge = db.getKnowledgeByProductId(product_id);
      } else {
        const active = db.getActiveAdvertisement();
        product = active.product;
        knowledge = active.knowledge;
      }

      if (!product) {
        return res.status(404).json({
          error: 'No active product advertisement found on the robot at this moment.',
          answer: 'Hello! There is no active advertisement running on my screen right now. Please check back shortly or speak with our administrator.',
        });
      }

      // Run Question Intelligence Engine
      const aiResult = await answerCustomerQuestion(product, knowledge, question, history || []);
      const latency = Date.now() - startTime;

      // Log question to database
      const log = db.logQuestion({
        product_id: product.id,
        product_name: product.name,
        product_type: product.type,
        customer_question: question,
        detected_intent: aiResult.intent,
        required_fields: aiResult.required_fields,
        answer: aiResult.answer,
        language_detected: aiResult.language_detected,
        latency_ms: latency,
      });

      // Update robot telemetry state
      db.updateRobotTelemetry({
        status: 'answering',
      });

      setTimeout(() => {
        db.updateRobotTelemetry({ status: 'broadcasting' });
      }, 4000);

      res.json({
        ...aiResult,
        product_id: product.id,
        product_name: product.name,
        log_id: log.id,
        latency_ms: latency,
      });
    } catch (err: any) {
      console.error('Chat endpoint error:', err);
      res.status(500).json({
        error: err.message || 'Failed to process question',
        answer: 'I encountered a temporary communication glitch with my core processor. Please ask again in a moment!',
      });
    }
  });

  // --- QUESTION HISTORY & ANALYTICS ---
  app.get('/api/question-history', (req: Request, res: Response) => {
    res.json(db.getQuestionLogs());
  });

  app.post('/api/question-history/:id/feedback', (req: Request, res: Response) => {
    const { feedback } = req.body;
    const ok = db.updateQuestionFeedback(req.params.id, feedback);
    res.json({ success: ok });
  });

  app.get('/api/analytics', (req: Request, res: Response) => {
    res.json(db.getAnalyticsSummary());
  });

  // --- ROBOT TELEMETRY & PHYSICAL INTEGRATION API ---
  app.get('/api/robot/active-display', (req: Request, res: Response) => {
    const active = db.getActiveAdvertisement();
    const telemetry = db.getRobotTelemetry();
    res.json({
      robot: telemetry,
      active_campaign: active.advertisement,
      active_product: active.product,
      knowledge_summary: active.knowledge?.summary || null,
      suggested_questions: active.knowledge?.suggested_questions || [],
      server_time: new Date().toISOString(),
    });
  });

  app.get('/api/robot/telemetry', (req: Request, res: Response) => {
    res.json(db.getRobotTelemetry());
  });

  app.put('/api/robot/telemetry', (req: Request, res: Response) => {
    const updated = db.updateRobotTelemetry(req.body);
    res.json(updated);
  });

  // --- SETTINGS & DEMO CONTROLS ---
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json(db.getSettings());
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  });

  app.post('/api/demo/reset', (req: Request, res: Response) => {
    const data = db.resetDemoData();
    res.json({ success: true, message: 'Demo data reset successfully', data });
  });

  // --- VITE DEV / STATIC PRODUCTION SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Advertisement Robot Server running on http://localhost:${PORT}`);
  });
}

startServer();
