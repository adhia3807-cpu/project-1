import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Mic,
  Sparkles,
  Bot,
  Volume2,
  VolumeX,
  Clock,
  Tag,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
  ThumbsUp,
  ThumbsDown,
  Radio,
  MessageCircle,
  Phone,
  MapPin,
  IndianRupee,
} from 'lucide-react';
import { Product, Advertisement, StructuredKnowledge, QuestionLog, KnowledgeField } from '../types.ts';
import { RobotAvatar } from './RobotAvatar.tsx';
import { askCustomerQuestion, submitQuestionFeedback } from '../api.ts';
import { speakRobotText, stopRobotSpeech, createSpeechRecognizer, SpeechRecognitionWrapper } from '../utils/speech.ts';
import { formatIndianTimeIST, getWhatsAppLink, formatIndianPhone } from '../utils/indiaFormatters.ts';

interface CustomerKioskProps {
  product: Product | null;
  advertisement: Advertisement | null;
  knowledge: StructuredKnowledge | null;
  speechEnabled: boolean;
  onToggleSpeech: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'robot';
  text: string;
  intent?: string;
  required_fields?: string[];
  language?: string;
  confidence?: number;
  timestamp: string;
  logId?: string;
  feedback?: 'helpful' | 'unhelpful';
}

export const CustomerKiosk: React.FC<CustomerKioskProps> = ({
  product,
  advertisement,
  knowledge,
  speechEnabled,
  onToggleSpeech,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remainingSecs, setRemainingSecs] = useState<number>(3600);
  const [currentTimeIST, setCurrentTimeIST] = useState<string>(formatIndianTimeIST(new Date(), true));

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<SpeechRecognitionWrapper | null>(null);

  // Update IST clock every 10 seconds
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTimeIST(formatIndianTimeIST(new Date(), true));
    }, 10000);
    return () => clearInterval(clockInterval);
  }, []);

  // Initialize messages when product changes
  useEffect(() => {
    if (product) {
      stopRobotSpeech();
      setIsSpeaking(false);

      const welcomeText = `Hi! I'm here to help with ${product.name}. Feel free to ask me anything 😊`;

      setMessages([
        {
          id: `msg-welcome-${product.id}`,
          sender: 'robot',
          text: welcomeText,
          timestamp: formatIndianTimeIST(new Date(), false),
        },
      ]);

      if (speechEnabled) {
        setIsSpeaking(true);
        speakRobotText(welcomeText, () => setIsSpeaking(false));
      }
    }
  }, [product?.id]);

  // Active countdown timer
  useEffect(() => {
    if (!advertisement?.end_time) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(advertisement.end_time).getTime() - Date.now()) / 1000));
      setRemainingSecs(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [advertisement?.end_time]);

  // Setup speech recognition
  useEffect(() => {
    recognizerRef.current = createSpeechRecognizer(
      (transcript) => {
        setInputQuery(transcript);
        handleSendMessage(transcript);
      },
      (err) => {
        setSpeechError(err);
        setIsListening(false);
      },
      (listening) => {
        setIsListening(listening);
        if (listening) setSpeechError(null);
      }
    );

    return () => {
      stopRobotSpeech();
      recognizerRef.current?.stop();
    };
  }, [product?.id, speechEnabled]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    setInputQuery('');
    setSpeechError(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: formatIndianTimeIST(new Date(), false),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.intent !== 'WELCOME_GREETING')
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          text: m.text,
        }));

      const res = await askCustomerQuestion({
        product_id: product?.id,
        question: textToSend,
        history,
      });

      const robotMsg: ChatMessage = {
        id: `robot-${Date.now()}`,
        sender: 'robot',
        text: res.answer,
        intent: res.intent,
        required_fields: res.required_fields,
        language: res.language_detected,
        confidence: res.confidence,
        logId: res.log_id,
        timestamp: formatIndianTimeIST(new Date(), false),
      };

      setMessages((prev) => [...prev, robotMsg]);

      if (speechEnabled) {
        setIsSpeaking(true);
        speakRobotText(res.answer, () => setIsSpeaking(false));
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `robot-err-${Date.now()}`,
        sender: 'robot',
        text: "Sorry, I'm having a little trouble answering that right now. Please try again 😊",
        intent: 'SYSTEM_ERROR',
        timestamp: formatIndianTimeIST(new Date(), false),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      recognizerRef.current?.stop();
    } else {
      recognizerRef.current?.start();
    }
  };

  const handleFeedback = async (msgId: string, logId: string | undefined, feedback: 'helpful' | 'unhelpful') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback } : m))
    );
    if (logId) {
      try {
        await submitQuestionFeedback(logId, feedback);
      } catch (e) {
        // ignore
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!product) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 p-6 text-slate-200">
        <div className="text-center max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
          <Bot className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-white mb-2">Robot Screen Standby</h2>
          <p className="text-sm text-slate-400 mb-6">
            No active advertisement is currently broadcasting. Head to the Admin Hub to schedule or activate an Indian product campaign.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-xs font-mono">
            <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
            <span>Awaiting Next Broadcast Schedule (IST)</span>
          </div>
        </div>
      </div>
    );
  }

  // Extract WhatsApp / Phone / Address from knowledge fields if available
  const fields = (knowledge?.fields || {}) as Record<string, KnowledgeField>;
  const whatsappField = Object.values(fields).find((f) => f.key.includes('whatsapp') && f.value);
  const phoneField = Object.values(fields).find((f) => (f.key.includes('phone') || f.key.includes('contact')) && f.value);
  const locationField = Object.values(fields).find((f) => (f.key.includes('location') || f.key.includes('address')) && f.value);

  const whatsappNumber = whatsappField?.value ? String(whatsappField.value) : '';
  const phoneNumber = phoneField?.value ? String(phoneField.value) : '';

  // Clean natural suggested questions for the active product
  const defaultQuestions: string[] = [
    'What is the price?',
    'bro ithinte price ethra?',
    'ഇതിന്റെ പ്രധാന പ്രത്യേകതകൾ എന്തൊക്കെയാണ്?',
    'Is there any offer or discount available?',
    'How can I get more details or contact?',
  ];

  const displayedQuestions = knowledge?.suggested_questions && knowledge.suggested_questions.length > 0
    ? knowledge.suggested_questions
    : defaultQuestions;

  return (
    <div
      className={`min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''
      }`}
    >
      {/* Top Kiosk Status Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
            LIVE BROADCAST
          </span>
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <span className="text-xs text-slate-300 font-medium hidden sm:inline-block truncate max-w-xs">
            {advertisement?.title || product.name}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Clock */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>{currentTimeIST}</span>
          </div>

          {/* Ad Countdown Timer */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Ad Loop: {formatTimer(remainingSecs)}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen Kiosk' : 'Enter Fullscreen Kiosk'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Kiosk Split Screen */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Visual Advertisement Display Screen (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Main Digital Broadcast Card */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl flex-1 flex flex-col justify-between p-6 min-h-[380px] lg:min-h-[460px]">
            {/* Ambient subtle glow background */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar with Product Type & Actions */}
            <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 shadow-lg flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  {product.type}
                </span>
                {knowledge?.is_approved && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-600/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    AI Verified Knowledge
                  </span>
                )}
              </div>

              {/* Direct WhatsApp Action Button if configured */}
              {whatsappNumber && (
                <div>
                  <a
                    href={getWhatsAppLink(whatsappNumber, `Hi, I am inquiring about ${product.name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all hover:scale-105"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            {/* Central Headline & Description Showcase */}
            <div className="relative z-10 my-auto py-6 text-left space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {product.name}
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {advertisement?.tagline || product.tagline || product.name}
              </h1>
              {knowledge?.summary ? (
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  {knowledge.summary}
                </p>
              ) : (
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl line-clamp-3">
                  {product.description}
                </p>
              )}
            </div>

            {/* Verified Fact Badges Grid */}
            {knowledge?.fields && (
              <div className="relative z-10 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {(Object.values(knowledge.fields) as KnowledgeField[])
                  .filter((f: KnowledgeField) => f.confidence === 'available' && f.value)
                  .slice(0, 3)
                  .map((f: KnowledgeField) => (
                    <div key={f.key} className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/90 shadow-sm">
                      <span className="text-[10px] text-cyan-400 block font-semibold uppercase tracking-wider truncate">
                        {f.label}
                      </span>
                      <span className="font-bold text-slate-100 truncate block mt-0.5 text-xs sm:text-sm">
                        {Array.isArray(f.value) ? f.value.join(', ') : f.value}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Interactive AI Chat & Robot Voice Kiosk (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden min-h-[500px]">
          {/* Chat Header with Friendly Assistant Avatar */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <RobotAvatar
              isSpeaking={isSpeaking}
              isListening={isListening}
              statusText={
                isListening
                  ? 'Listening to you...'
                  : isSpeaking
                  ? 'Speaking...'
                  : isLoading
                  ? 'Thinking...'
                  : 'Happy to help! Ask me anything 😊'
              }
              size="md"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleSpeech}
                title={speechEnabled ? 'Mute Voice' : 'Unmute Voice'}
                className={`p-2 rounded-xl text-xs border transition-colors ${
                  speechEnabled
                    ? 'bg-cyan-950/60 border-cyan-700 text-cyan-300 hover:bg-cyan-900'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Chat Message Stream */}
          <div
            ref={chatScrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/40 text-sm"
          >
            {messages.map((msg) => {
              const isRobot = msg.sender === 'robot';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isRobot ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-md ${
                      isRobot
                        ? 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-sm'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {/* Feedback & Timestamp footer */}
                    <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 text-[10px] text-slate-400">
                      <span>{msg.timestamp}</span>

                      {isRobot && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleFeedback(msg.id, msg.logId, 'helpful')}
                            className={`p-1 rounded hover:text-cyan-300 transition-colors ${
                              msg.feedback === 'helpful' ? 'text-cyan-400 font-bold' : ''
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, msg.logId, 'unhelpful')}
                            className={`p-1 rounded hover:text-rose-300 transition-colors ${
                              msg.feedback === 'unhelpful' ? 'text-rose-400 font-bold' : ''
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                <RobotAvatar isSpeaking={true} size="sm" />
                <span className="animate-pulse">Finding the answer for you...</span>
              </div>
            )}
          </div>

          {/* Suggested Questions Bar (No dropdowns or form feel) */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Suggested Questions:</span>
            </div>

            {/* Suggested Question Chips */}
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
              {displayedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full text-xs bg-slate-800 hover:bg-slate-700/90 text-slate-200 border border-slate-700 hover:border-cyan-500/50 transition-all text-left truncate max-w-full"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input & Voice Control Bar */}
          <div className="p-3.5 bg-slate-950 border-t border-slate-800">
            {speechError && (
              <div className="mb-2 text-[11px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{speechError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Voice Mic Button */}
              <button
                type="button"
                onClick={handleMicClick}
                className={`p-2.5 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-[0_0_12px_#f43f5e]'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak with Microphone'}
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={`Ask anything about ${product.name}...`}
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={isLoading || !inputQuery.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 transition-opacity"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
