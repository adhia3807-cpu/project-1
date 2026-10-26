import Groq from 'groq-sdk';
import { Product, StructuredKnowledge, KnowledgeField, FieldConfidence } from '../src/types.ts';
import { getAvailableFreeGroqModel } from './groqModels.ts';

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  if (!groqClient) {
    groqClient = new Groq({
      apiKey,
      timeout: 15000, // 15-second request timeout to prevent hanging
      maxRetries: 1,  // Maximum 1 retry to protect free-tier rate limits
    });
  }
  return groqClient;
}

export interface AnalysisResult {
  summary: string;
  suggested_questions: string[];
  fields: Record<string, KnowledgeField>;
}

export interface QuestionAnswerResult {
  intent: string;
  required_fields: string[];
  answer: string;
  language_detected: string;
  confidence: number;
}

// In-memory cache for Q&A to minimize repetitive API calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const qaCache = new Map<string, CacheEntry<QuestionAnswerResult>>();
const analysisCache = new Map<string, CacheEntry<AnalysisResult>>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache TTL
const MAX_CACHE_SIZE = 250;

// Simple sliding window rate limiter for chat queries (Free-tier protection)
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 25;     // Safe rate for free-tier usage

function isRateLimited(): boolean {
  const now = Date.now();
  // Filter out timestamps outside window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return true;
  }
  requestTimestamps.push(now);
  return false;
}

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/**
 * Extracts and cleans JSON from AI model text output safely.
 */
function parseJsonSafely<T>(rawText: string, fallback: T): T {
  if (!rawText) return fallback;
  try {
    // Attempt standard parse first
    return JSON.parse(rawText) as T;
  } catch {
    // Attempt extracting JSON inside markdown code fence
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim()) as T;
      } catch {
        // Continue
      }
    }
    // Attempt finding outer { ... }
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(rawText.substring(firstBrace, lastBrace + 1)) as T;
      } catch {
        // Fallback
      }
    }
    return fallback;
  }
}

/**
 * Generates structured product knowledge from raw product description and type.
 * Uses Groq LLM inference with database and memory caching.
 */
export async function analyzeProductDescription(
  name: string,
  type: string,
  description: string
): Promise<AnalysisResult> {
  const cacheKey = `${normalizeKey(name)}:${normalizeKey(type)}:${normalizeKey(description.slice(0, 100))}`;
  const cached = analysisCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const groq = getGroqClient();

  if (groq) {
    const systemInstruction = `You are an AI Product Knowledge Analyst for an autonomous Digital Advertisement Robot deployed in the Indian market.
Your task is to analyze an unstructured product description and extract structured, verified knowledge strictly without hallucination.

LOCALIZATION & FACTUAL REQUIREMENTS:
1. CURRENCY: Default currency is Indian Rupee (₹ / INR). Format numbers in Indian notation (e.g. ₹499, ₹25,000, ₹1.5 Lakh).
2. BUSINESS CONTEXT: Capture MRP, GST, EMI, Cash on Delivery (COD), UPI (GPay/PhonePe/Paytm), WhatsApp contact numbers (+91), certifications (FSSAI, AICTE, ISO), and warranty if mentioned.
3. EDUCATION: For College/Education, capture courses/degrees, intake, fees, scholarships, and boys/girls hostel facilities.
4. NO HALLUCINATION: Extract ONLY facts present in the text. For any field not mentioned in the text, set value to null and confidence to "not_specified".
5. SUGGESTED QUESTIONS: Generate 4 to 6 natural customer questions in English, Malayalam, or Manglish (e.g. "Price ethra?", "Hostel facility undo?", "EMI options undo?").

OUTPUT FORMAT: Strict JSON object matching this schema:
{
  "summary": "1-2 sentence executive summary using ₹",
  "suggested_questions": ["Question 1", "Question 2", "Question 3", "Question 4"],
  "fields": [
    {
      "key": "unique_snake_case_key",
      "label": "Human Display Label",
      "value": "Extracted value or null",
      "confidence": "available | not_specified | uncertain",
      "category": "Commercial | Academics | Specs | Nutrition | Contact | Location | General"
    }
  ]
}`;

    const prompt = `Product Name: ${name}
Product Type: ${type}
Raw Product Description:
"""
${description}
"""

Extract the structured knowledge JSON schema now.`;

    try {
      const selectedModel = getAvailableFreeGroqModel();
      const response = await groq.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Low temperature for high factual precision
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = parseJsonSafely<any>(content, null);

      if (parsed && typeof parsed === 'object') {
        const fieldMap: Record<string, KnowledgeField> = {};
        if (Array.isArray(parsed.fields)) {
          parsed.fields.forEach((f: any) => {
            if (f && f.key) {
              const isNotSpec =
                f.confidence === 'not_specified' ||
                f.value === 'Not specified' ||
                f.value === null ||
                f.value === undefined;
              fieldMap[f.key] = {
                key: f.key,
                label: f.label || f.key,
                value: isNotSpec ? null : f.value,
                confidence: (['available', 'not_specified', 'uncertain'].includes(f.confidence)
                  ? f.confidence
                  : isNotSpec
                  ? 'not_specified'
                  : 'available') as FieldConfidence,
                category: f.category || 'General',
              };
            }
          });
        }

        const result: AnalysisResult = {
          summary: parsed.summary || `${name} (${type})`,
          suggested_questions:
            Array.isArray(parsed.suggested_questions) && parsed.suggested_questions.length > 0
              ? parsed.suggested_questions
              : [
                  `What is the price in ₹?`,
                  `500ml price ethra?`,
                  `Are there any active offers or EMI?`,
                  `How can I contact via WhatsApp or Phone?`,
                ],
          fields: fieldMap,
        };

        // Cache result
        if (analysisCache.size >= MAX_CACHE_SIZE) {
          const firstKey = analysisCache.keys().next().value;
          if (firstKey) analysisCache.delete(firstKey);
        }
        analysisCache.set(cacheKey, { data: result, timestamp: Date.now() });

        return result;
      }
    } catch (err: any) {
      console.warn('AI analysis notice (falling back to structured heuristic):', err?.message || err);
    }
  }

  // Resilient heuristic parser when AI key is missing or quota is restricted
  const heuristic = heuristicAnalyzeProduct(name, type, description);
  analysisCache.set(cacheKey, { data: heuristic, timestamp: Date.now() });
  return heuristic;
}

/**
 * Answers customer questions with zero hallucination and native multilingual support.
 * Communicates as a friendly, warm young female assistant (~18 yrs old personality).
 */
export async function answerCustomerQuestion(
  product: Product,
  knowledge: StructuredKnowledge | null,
  customerQuestion: string,
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<QuestionAnswerResult> {
  const normQ = normalizeKey(customerQuestion);
  const cacheKey = `${product.id}:${normQ}`;

  // Check Q&A Cache
  const cached = qaCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Rate-limit check to protect free-tier usage
  if (isRateLimited()) {
    return {
      intent: 'RATE_LIMIT_COOLDOWN',
      required_fields: [],
      answer: 'Please wait a moment and try again 😊',
      language_detected: 'English',
      confidence: 0.9,
    };
  }

  // Format verified context facts
  const fieldsContext = knowledge?.fields
    ? Object.values(knowledge.fields)
        .map(
          f =>
            `- ${f.label} (${f.key}): ${
              f.value !== null
                ? Array.isArray(f.value)
                  ? f.value.join(', ')
                  : f.value
                : 'Not specified in verified product facts'
            }`
        )
        .join('\n')
    : 'No structured facts recorded.';

  const groq = getGroqClient();

  if (groq) {
    const systemInstruction = `You are a friendly, helpful, and warm young female assistant (~18 years old in personality, energy, and tone).
You are assisting a customer looking at an advertisement on a digital screen.

CURRENT ACTIVE PRODUCT:
Name: ${product.name}
Category: ${product.type}
Tagline: ${product.tagline || ''}
Product Details: ${product.description}

VERIFIED PRODUCT FACTS:
${fieldsContext}

CORE PERSONALITY & COMMUNICATION GUIDELINES:
1. FRIENDLY & CASUAL TONE:
   - Talk like a cheerful, friendly, polite young female assistant having a normal, easy conversation with a customer.
   - Keep answers natural, warm, and helpful.
   - NEVER sound like a formal corporate robot, textbook, or database.
   - NEVER use phrases like: "Dear customer", "According to the database", "The system has identified", "I searched the database", "I am an AI", "I detected your language".
   - Use ₹ naturally in the background without lecturing (e.g. "ഇതിന്റെ price ₹499 ആണ് 😊" or "The price is ₹499.").

2. AUTOMATIC LANGUAGE DETECTION & MATCHING:
   - Automatically detect the customer's language, dialect, and script (English, Malayalam, Manglish, Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, etc.).
   - Respond in the EXACT SAME language and conversational style the customer used.
   - DO NOT announce what language was detected. Just reply directly in that language.
   - Examples:
     * Customer: "What is the price?" -> Reply in English: "It is ₹499 😊"
     * Customer: "ഇതിന്റെ price എത്രയാണ്?" -> Reply in Malayalam: "ഇതിന്റെ price ₹499 ആണ് 😊"
     * Customer: "bro ithinte price ethra?" -> Reply in Manglish: "500ml pack-ന്റെ price ₹40 aanu 😊"
     * Customer: "इसका price कितना है?" -> Reply in Hindi: "इसका price ₹499 है 😊"
     * Customer: "Hostel facility undo?" -> Reply in Manglish/Malayalam: "Und, hostel facility available aanu."

3. CODE-MIXED / CASUAL LANGUAGE:
   - Seamlessly understand code-mixed speech ("bro ithu entha?", "hostel facility undo?", "gaminginu nallathano?", "offers kya hai?").
   - Respond naturally without forcing formal literary or textbook grammar.

4. OCCASIONAL EMOJIS:
   - Use friendly emojis occasionally when it improves the conversation (e.g. 😊, 👍). Do not spam emojis.

5. CONVERSATION CONTEXT & PRODUCT AWARENESS:
   - The customer is talking about the active product (${product.name}). Follow-up questions like "RAM ethra?", "Storage?", "Price?" relate to this product.

6. STRICT ANTI-HALLUCINATION (ZERO GUESSING):
   - Only answer facts present in the verified facts and product details.
   - If something is genuinely missing/not mentioned, politely say:
     * English: "I don't have that information right now 😊"
     * Malayalam: "ഈ വിവരം ഇതിൽ വ്യക്തമാക്കിയിട്ടില്ല 😊"
     * Manglish: "Aa details ippol available alla 😊"
     * Hindi: "यह जानकारी अभी उपलब्ध नहीं है 😊"

OUTPUT STRICT JSON matching:
{
  "intent": "Detected intent e.g. PRODUCT_PRICE, HOSTEL_FACILITY, COURSES_OFFERED, EMI_AND_PAYMENT, VOLUME_AND_SIZE, CONTACT_WHATSAPP, LOCATION_ADDRESS, GENERAL_INQUIRY",
  "required_fields": ["field_keys_used"],
  "answer": "Helpful, accurate, friendly conversational answer in the customer's language",
  "language_detected": "Malayalam | Manglish | English | Hindi | Tamil | Telugu | Other",
  "confidence": 0.95
}`;

    const recentHistory = history.slice(-4).map(h => ({
      role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: h.text,
    }));

    const messages = [
      { role: 'system' as const, content: systemInstruction },
      ...recentHistory,
      { role: 'user' as const, content: customerQuestion },
    ];

    try {
      const selectedModel = getAvailableFreeGroqModel();
      const response = await groq.chat.completions.create({
        model: selectedModel,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.2, // Balanced for warmth and grounding
        max_tokens: 600,
      });

      const raw = response.choices[0]?.message?.content || '{}';
      const parsed = parseJsonSafely<any>(raw, null);

      if (parsed && parsed.answer) {
        const result: QuestionAnswerResult = {
          intent: parsed.intent || 'GENERAL_INQUIRY',
          required_fields: Array.isArray(parsed.required_fields) ? parsed.required_fields : [],
          answer: parsed.answer,
          language_detected: parsed.language_detected || 'English',
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
        };

        // Cache the answer
        if (qaCache.size >= MAX_CACHE_SIZE) {
          const firstKey = qaCache.keys().next().value;
          if (firstKey) qaCache.delete(firstKey);
        }
        qaCache.set(cacheKey, { data: result, timestamp: Date.now() });

        return result;
      }
    } catch (err: any) {
      console.warn('AI Q&A notice (falling back to structured heuristic):', err?.message || err);
    }
  }

  // Resilient heuristic answering when AI key is missing or quota is restricted
  const heuristic = heuristicAnswerQuestion(product, knowledge, customerQuestion);
  qaCache.set(cacheKey, { data: heuristic, timestamp: Date.now() });
  return heuristic;
}

/**
 * Heuristic fallback for product analysis when offline or without external key.
 */
function heuristicAnalyzeProduct(name: string, type: string, description: string): AnalysisResult {
  const fields: Record<string, KnowledgeField> = {};

  fields['product_name'] = {
    key: 'product_name',
    label: 'Product Name',
    value: name,
    confidence: 'available',
    category: 'Identity',
  };
  fields['product_type'] = {
    key: 'product_type',
    label: 'Category',
    value: type,
    confidence: 'available',
    category: 'Identity',
  };

  if (type.includes('Food') || type.includes('Beverage')) {
    fields['pack_sizes'] = extractField(
      description,
      ['pack', 'size', 'ml', 'litre', 'bottle', 'can', '250', '500', '1.25'],
      'Pack Sizes & Volume',
      'Specifications'
    );
    fields['price_mrp'] = extractField(
      description,
      ['price', 'mrp', '₹', 'rs', 'inr', 'gst'],
      'Price / MRP (₹)',
      'Commercial'
    );
    fields['offers'] = extractField(
      description,
      ['offer', 'discount', 'cashback', 'upi', 'free'],
      'Offers & Cashback',
      'Commercial'
    );
    fields['dietary_type'] = extractField(
      description,
      ['veg', 'vegetarian', 'green dot', 'caffeine', 'fssai'],
      'Dietary & Certification',
      'Nutrition'
    );
    fields['whatsapp_contact'] = extractField(
      description,
      ['whatsapp', 'contact', 'phone', '+91', 'customer care'],
      'Contact & WhatsApp',
      'Contact'
    );
  } else if (type.includes('College') || type.includes('Education')) {
    fields['courses_offered'] = extractField(
      description,
      ['courses', 'b.tech', 'm.tech', 'degree', 'programs', 'computer science', 'ai', 'mechanical'],
      'Courses Offered',
      'Academics'
    );
    fields['fees_structure'] = extractField(
      description,
      ['fee', 'merit', 'management', '₹', 'rs', 'lakh', 'tuition'],
      'Fee Structure (₹)',
      'Commercial'
    );
    fields['hostel_facility'] = extractField(
      description,
      ['hostel', 'boys', 'girls', 'campus', 'accommodation', 'food'],
      'Hostel Accommodation',
      'Campus'
    );
    fields['placements'] = extractField(
      description,
      ['placement', 'recruiters', 'package', 'tcs', 'infosys', 'wipro'],
      'Campus Placements',
      'Placements'
    );
    fields['location_address'] = extractField(
      description,
      ['address', 'kerala', 'kannur', 'pin', 'road', 'thalassery'],
      'Address & Location',
      'Location'
    );
    fields['whatsapp_contact'] = extractField(
      description,
      ['whatsapp', 'admission', 'contact', 'phone', '+91'],
      'Admission WhatsApp',
      'Contact'
    );
  } else if (type.includes('Computer') || type.includes('Laptop')) {
    fields['price_and_mrp'] = extractField(
      description,
      ['price', 'mrp', '₹', 'rs', 'gst'],
      'Price & MRP (₹)',
      'Commercial'
    );
    fields['emi_and_payment'] = extractField(
      description,
      ['emi', 'no-cost', 'upi', 'gpay', 'phonepe', 'card'],
      'EMI & Payment Options',
      'Commercial'
    );
    fields['processor_gpu'] = extractField(
      description,
      ['processor', 'cpu', 'ryzen', 'intel', 'rtx', 'gpu', 'graphics'],
      'CPU & GPU Specs',
      'Performance'
    );
    fields['ram_storage'] = extractField(
      description,
      ['ram', 'ddr5', 'ssd', 'nvme', 'tb', 'gb'],
      'RAM & Storage',
      'Hardware'
    );
    fields['warranty'] = extractField(
      description,
      ['warranty', 'onsite', 'adp', 'support'],
      'India Warranty',
      'Support'
    );
  } else {
    fields['pricing'] = extractField(
      description,
      ['price', 'fee', 'rate', '₹', 'rs', 'cost'],
      'Pricing & Rates (₹)',
      'Commercial'
    );
    fields['specifications'] = extractField(
      description,
      ['feature', 'service', 'timing', 'facility'],
      'Key Details',
      'Specs'
    );
    fields['contact_and_location'] = extractField(
      description,
      ['contact', 'phone', '+91', 'whatsapp', 'pin', 'kerala', 'india'],
      'Contact & Address',
      'Contact'
    );
  }

  const suggested: string[] = [
    `Price ethra aanu in ₹?`,
    `വിലയും പ്രധാന വിവരങ്ങളും എന്തൊക്കെയാണ്?`,
    `Offers or EMI options undo?`,
    `WhatsApp or Phone contact details?`,
  ];

  return {
    summary: `${name} is an active Indian market product in the ${type} category.`,
    suggested_questions: suggested,
    fields,
  };
}

function extractField(desc: string, keywords: string[], label: string, category: string): KnowledgeField {
  const sentences = desc.split(/(?<=[.?!])\s+/);
  const matched = sentences.filter(s => keywords.some(k => s.toLowerCase().includes(k.toLowerCase())));

  if (matched.length > 0) {
    return {
      key: label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      label,
      value: matched.join(' '),
      confidence: 'available',
      category,
    };
  }
  return {
    key: label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    label,
    value: null,
    confidence: 'not_specified',
    category,
  };
}

/**
 * Heuristic answer generator
 */
function heuristicAnswerQuestion(
  product: Product,
  knowledge: StructuredKnowledge | null,
  question: string
): QuestionAnswerResult {
  const qLower = question.toLowerCase();
  const fields = knowledge?.fields || {};
  let intent = 'GENERAL_INQUIRY';
  const matchedFields: string[] = [];
  let answer = '';
  let lang = 'English';

  const isMalayalamScript = /[\u0D00-\u0D7F]/.test(question);
  const isManglish =
    qLower.includes('ethra') ||
    qLower.includes('undo') ||
    qLower.includes('aanu') ||
    qLower.includes('entha') ||
    qLower.includes('bro') ||
    qLower.includes('nallathano');
  const isHindi = qLower.includes('kitna') || qLower.includes('kya') || qLower.includes('hai') || qLower.includes('bhai');

  if (isMalayalamScript) lang = 'Malayalam';
  else if (isManglish) lang = 'Manglish';
  else if (isHindi) lang = 'Hindi';

  // Pricing / MRP / Fee
  if (
    qLower.includes('price') ||
    qLower.includes('cost') ||
    qLower.includes('rate') ||
    qLower.includes('വില') ||
    qLower.includes('ethra') ||
    qLower.includes('fees') ||
    qLower.includes('fee') ||
    qLower.includes('mrp') ||
    qLower.includes('kitna')
  ) {
    intent = 'PRODUCT_PRICE';
    const priceField = Object.values(fields).find(
      f => f.key.includes('price') || f.key.includes('fee') || f.key.includes('mrp') || f.category === 'Commercial'
    );
    if (priceField && priceField.value) {
      matchedFields.push(priceField.key);
      if (lang === 'Malayalam') {
        answer = `ഇതിന്റെ price ${priceField.value} ആണ് 😊`;
      } else if (lang === 'Manglish') {
        answer = `Ithinte price ${priceField.value} aanu 😊`;
      } else if (lang === 'Hindi') {
        answer = `इसका price ${priceField.value} है 😊`;
      } else {
        answer = `The price is ${priceField.value} 😊`;
      }
    } else {
      answer =
        lang === 'Malayalam'
          ? `ഇതിന്റെ വില വിവരങ്ങൾ നിലവിൽ നൽകിയിട്ടുള്ള വിവരങ്ങളിൽ ഉൾപ്പെടുത്തിയിട്ടില്ല 😊`
          : lang === 'Manglish'
          ? `Ithinte price details ippol available alla 😊`
          : `I don't have that information right now 😊`;
    }
  }
  // Hostel
  else if (qLower.includes('hostel') || qLower.includes('ഹോസ്റ്റൽ') || qLower.includes('accommodation')) {
    intent = 'HOSTEL_FACILITY';
    const hostelField = Object.values(fields).find(f => f.key.includes('hostel'));
    if (hostelField && hostelField.value) {
      matchedFields.push(hostelField.key);
      answer =
        lang === 'Malayalam'
          ? `ഉണ്ട്, hostel facility available ആണ്: ${hostelField.value}`
          : lang === 'Manglish'
          ? `Und, hostel facility available aanu: ${hostelField.value}`
          : `Yes, hostel facility is available: ${hostelField.value}`;
    } else {
      answer =
        lang === 'Malayalam'
          ? `ഹോസ്റ്റൽ വിവരങ്ങൾ ഇതിൽ വ്യക്തമാക്കിയിട്ടില്ല 😊`
          : `I don't have that information right now 😊`;
    }
  }
  // WhatsApp / Contact
  else if (
    qLower.includes('whatsapp') ||
    qLower.includes('phone') ||
    qLower.includes('contact') ||
    qLower.includes('number') ||
    qLower.includes('നമ്പർ')
  ) {
    intent = 'CONTACT_WHATSAPP';
    const contactField = Object.values(fields).find(
      f => f.key.includes('whatsapp') || f.key.includes('contact') || f.key.includes('phone')
    );
    if (contactField && contactField.value) {
      matchedFields.push(contactField.key);
      answer =
        lang === 'Malayalam'
          ? `Contact details: ${contactField.value}`
          : lang === 'Manglish'
          ? `Contact details: ${contactField.value}`
          : `You can reach out at: ${contactField.value}`;
    } else {
      answer =
        lang === 'Malayalam'
          ? `Contact details ഇതിൽ ഉൾപ്പെടുത്തിയിട്ടില്ല 😊`
          : `I don't have that information right now 😊`;
    }
  }
  // Volume / Size
  else if (
    qLower.includes('ml') ||
    qLower.includes('size') ||
    qLower.includes('volume') ||
    qLower.includes('pack') ||
    qLower.includes('litre') ||
    qLower.includes('kg') ||
    qLower.includes('500ml')
  ) {
    intent = 'VOLUME_AND_SIZE';
    const sizeField = Object.values(fields).find(
      f => f.key.includes('pack') || f.key.includes('size') || f.key.includes('volume')
    );
    if (sizeField && sizeField.value) {
      matchedFields.push(sizeField.key);
      const valStr = Array.isArray(sizeField.value) ? sizeField.value.join(', ') : sizeField.value;
      answer =
        lang === 'Malayalam'
          ? `ലഭ്യമായ sizes: ${valStr} ആണ്.`
          : lang === 'Manglish'
          ? `Available pack sizes: ${valStr} aanu.`
          : `Available pack sizes: ${valStr}`;
    } else {
      answer =
        lang === 'Malayalam'
          ? `Size വിവരങ്ങൾ ഇതിൽ വ്യക്തമാക്കിയിട്ടില്ല 😊`
          : `I don't have that information right now 😊`;
    }
  } else {
    intent = 'GENERAL_INQUIRY';
    answer =
      lang === 'Malayalam'
        ? `ഇത് ${product.name} ആണ്. ${knowledge?.summary || product.description}`
        : lang === 'Manglish'
        ? `Ithu ${product.name} aanu. ${knowledge?.summary || product.description}`
        : `This is ${product.name}. ${knowledge?.summary || product.description}`;
  }

  return {
    intent,
    required_fields: matchedFields,
    answer,
    language_detected: lang,
    confidence: 0.9,
  };
}
