import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Square,
  Edit,
  Trash2,
  Clock,
  Tag,
  FileText,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  LogOut,
  Package,
  Radio,
  MessageSquare,
  History,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import {
  Product,
  Advertisement,
  StructuredKnowledge,
  QuestionLog,
  PRODUCT_TYPES,
  AnalyticsSummary,
} from '../types.ts';
import {
  createProduct,
  createAdvertisement,
  deleteProduct,
  startAdvertisement,
  pauseAdvertisement,
  resumeAdvertisement,
  stopAdvertisement,
  deleteAdvertisement,
} from '../api.ts';
import { KnowledgeStudio } from './KnowledgeStudio.tsx';
import { AiDescriptionPromptBox } from './AiDescriptionPromptBox.tsx';
import { EditAdvertisementModal } from './EditAdvertisementModal.tsx';
import { EditProductModal } from './EditProductModal.tsx';
import { DeleteConfirmModal } from './DeleteConfirmModal.tsx';

interface AdminDashboardProps {
  products: Product[];
  advertisements: Advertisement[];
  activeAd: Advertisement | null;
  activeProduct: Product | null;
  knowledgeMap: Record<string, StructuredKnowledge>;
  questionLogs: QuestionLog[];
  robotTelemetry: any;
  analytics: AnalyticsSummary | null;
  adminUser: { id: string; name: string; role: string } | null;
  onRefreshData: () => void;
  onSelectProductToBroadcast: (productId: string) => void;
  onLogout: () => void;
}

const RUNTIME_PRESETS = [
  { label: '15 Mins', value: 15 },
  { label: '30 Mins', value: 30 },
  { label: '1 Hour', value: 60 },
  { label: '2 Hours', value: 120 },
  { label: '4 Hours', value: 240 },
  { label: '24 Hours', value: 1440 },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  advertisements,
  activeAd,
  activeProduct,
  knowledgeMap,
  questionLogs,
  analytics,
  adminUser,
  onRefreshData,
  onSelectProductToBroadcast,
  onLogout,
}) => {
  // Form State - only the 4 core fields
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState<string>('Food & Beverage');
  const [customType, setCustomType] = useState('');
  const [description, setDescription] = useState('');
  const [runTimeMinutes, setRunTimeMinutes] = useState<number>(60);
  const [isCustomRuntime, setIsCustomRuntime] = useState(false);
  const [customRuntimeInput, setCustomRuntimeInput] = useState<number>(45);

  // UI & Action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [inspectingProduct, setInspectingProduct] = useState<Product | null>(null);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'product' | 'advertisement';
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Real Database Counts
  const countProducts = products.length;
  const countActiveAds = advertisements.filter((a) => a.status === 'running').length;
  const countPausedAds = advertisements.filter((a) => a.status === 'paused').length;
  const countScheduledAds = advertisements.filter((a) => a.status === 'scheduled').length;
  const countQuestions = questionLogs.length;

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setSuccessMessage(null);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(msg);
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  // Handle Publish & Run
  const handlePublishProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !description.trim()) {
      showNotification('Please enter both Product Name and Description.', true);
      return;
    }

    const finalType = productType === 'Other / Custom' && customType.trim() ? customType.trim() : productType;
    const finalRunTime = isCustomRuntime ? Number(customRuntimeInput) || 60 : runTimeMinutes;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Create product & trigger AI Knowledge extraction
      const result = await createProduct({
        name: productName.trim(),
        type: finalType,
        description: description.trim(),
        auto_analyze: true,
      });

      // 2. Schedule advertisement with the specified run time and start broadcasting immediately
      await createAdvertisement({
        product_id: result.product.id,
        title: result.product.name,
        tagline: result.product.tagline,
        duration_minutes: finalRunTime,
        status: 'running',
        priority: 5,
        auto_loop: true,
      });

      // 3. Reset form and refresh
      setProductName('');
      setDescription('');
      showNotification(`"${result.product.name}" created and broadcasting on the robot screen!`);
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to publish product and advertisement.', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Advertisement Controls
  const handleStart = async (adId: string, title?: string) => {
    setActionLoadingId(adId);
    try {
      await startAdvertisement(adId);
      showNotification(`Started broadcast: "${title || 'Advertisement'}"`);
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to start advertisement', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePause = async (adId: string, title?: string) => {
    setActionLoadingId(adId);
    try {
      await pauseAdvertisement(adId);
      showNotification(`Paused broadcast: "${title || 'Advertisement'}". Remaining runtime preserved.`);
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to pause advertisement', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResume = async (adId: string, title?: string) => {
    setActionLoadingId(adId);
    try {
      await resumeAdvertisement(adId);
      showNotification(`Resumed broadcast: "${title || 'Advertisement'}"`);
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to resume advertisement', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStop = async (adId: string, title?: string) => {
    setActionLoadingId(adId);
    try {
      await stopAdvertisement(adId);
      showNotification(`Stopped broadcast: "${title || 'Advertisement'}". Screen reset to standby.`);
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to stop advertisement', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmDeleteTarget = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'product') {
        await deleteProduct(deleteTarget.id);
        showNotification(`Deleted product "${deleteTarget.name}" and all associated advertisements.`);
      } else {
        await deleteAdvertisement(deleteTarget.id);
        showNotification(`Deleted advertisement "${deleteTarget.name}".`);
      }
      setDeleteTarget(null);
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete item', true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* Top Welcome Header with Admin Identity and Logout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome, {adminUser?.name || 'Bot'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              Admin: {adminUser?.name || 'Bot'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time advertisement control, AI knowledge management, and robot broadcast orchestrator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            title="Refresh database counts"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Refresh</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-xs font-semibold text-rose-300 transition-colors"
            title="Log out of Admin Dashboard"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD STAT COUNTS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Products Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Products</span>
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white font-mono">{countProducts}</span>
          </div>
        </div>

        {/* Active Ads Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Broadcast</span>
            <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-400 font-mono">{countActiveAds}</span>
          </div>
        </div>

        {/* Paused / Scheduled Ads */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paused / Queued</span>
            <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800">
              <Pause className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-amber-300 font-mono">{countPausedAds + countScheduledAds}</span>
          </div>
        </div>

        {/* Customer Questions Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Questions</span>
            <div className="p-2 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-blue-300 font-mono">{countQuestions}</span>
          </div>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* LIVE BROADCAST CONTROLLER BANNER (TOP PRIORITY CONTROLS) */}
      {activeAd && activeProduct && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-2 border-emerald-500/70 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/90 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
                <Radio className="w-6 h-6 animate-pulse text-emerald-400" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE ON ROBOT SCREEN
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Loop: {activeAd.duration_minutes} Mins
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">{activeAd.title || activeProduct.name}</h2>
                <p className="text-xs text-slate-300 line-clamp-1">{activeAd.tagline || activeProduct.tagline}</p>
              </div>
            </div>

            {/* DIRECT ACTION BUTTONS FOR ACTIVE AD */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handlePause(activeAd.id, activeAd.title)}
                disabled={actionLoadingId === activeAd.id}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all"
                title="Pause advertisement and preserve remaining runtime"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>

              <button
                onClick={() => handleStop(activeAd.id, activeAd.title)}
                disabled={actionLoadingId === activeAd.id}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all"
                title="Stop advertisement and clear robot screen immediately"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop</span>
              </button>

              <button
                onClick={() => setEditingAd(activeAd)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                title="Edit campaign duration, headline, or poster"
              >
                <Edit className="w-3.5 h-3.5 text-cyan-400" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => setDeleteTarget({ type: 'advertisement', id: activeAd.id, name: activeAd.title })}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
                title="Delete advertisement"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSED AD BANNER IF ANY */}
      {!activeAd && advertisements.some((a) => a.status === 'paused') && (
        <div className="bg-amber-950/40 border border-amber-700/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-900/60 text-amber-300 border border-amber-700">
              <Pause className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">Broadcast Paused</span>
              <p className="text-xs text-slate-300">
                {advertisements.find((a) => a.status === 'paused')?.title} is currently paused. Resume anytime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {advertisements
              .filter((a) => a.status === 'paused')
              .map((pausedAd) => (
                <button
                  key={pausedAd.id}
                  onClick={() => handleResume(pausedAd.id, pausedAd.title)}
                  disabled={actionLoadingId === pausedAd.id}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resume Broadcast</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* EMPTY STATE BANNER WHEN NO PRODUCTS */}
      {countProducts === 0 && (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-lg font-bold text-white">No products in database yet.</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Your database is completely fresh. Fill in the 4 fields below to create your product and launch an advertisement.
          </p>
        </div>
      )}

      {/* SECTION 1: SIMPLIFIED PRODUCT & AD CREATOR (4 FIELDS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">+ Add Product & Launch Advertisement</h2>
              <p className="text-xs text-slate-400">
                Enter product details and runtime. The AI converts descriptions into structured knowledge and broadcasts live.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePublishProduct} className="space-y-5 text-xs">
          {/* Field 1: Product Name & Field 2: Product Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. Product Name *</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 7UP, Apex College, CyberBlade Laptop, Chai Point..."
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>2. Product Type *</span>
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-all"
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Type field if user selects "Other / Custom" */}
          {productType === 'Other / Custom' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Specify Custom Product Type *
              </label>
              <input
                type="text"
                placeholder="e.g. Drone Services, Solar Solutions, Luxury Watches..."
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* AI DESCRIPTION PROMPT GENERATOR - Directly below Product Type */}
          <AiDescriptionPromptBox
            productName={productName}
            productType={productType}
            customType={customType}
          />

          {/* Field 3: Product Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Product Description (Paste AI Result Here) *</span>
              </label>
              <div className="flex items-center gap-2">
                {description && (
                  <button
                    type="button"
                    onClick={() => setDescription('')}
                    className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Clear text
                  </button>
                )}
                <span className="text-[10px] text-cyan-400 font-mono">
                  {description.length} chars
                </span>
              </div>
            </div>
            <textarea
              rows={5}
              placeholder="Paste the AI-generated description here (e.g. from ChatGPT, Gemini, or Claude). You can edit or add custom details before saving..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed transition-all"
            />
          </div>

          {/* Field 4: Run Time (Duration) */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>4. Advertisement Run Time *</span>
            </label>

            {/* Quick runtime buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
              {RUNTIME_PRESETS.map((preset) => {
                const isSelected = !isCustomRuntime && runTimeMinutes === preset.value;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setIsCustomRuntime(false);
                      setRunTimeMinutes(preset.value);
                    }}
                    className={`py-2 px-2 rounded-xl text-center font-semibold transition-all ${
                      isSelected
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20 border border-cyan-400'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}

              {/* Custom runtime option */}
              <button
                type="button"
                onClick={() => setIsCustomRuntime(true)}
                className={`py-2 px-2 rounded-xl text-center font-semibold transition-all ${
                  isCustomRuntime
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20 border border-cyan-400'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                Custom
              </button>
            </div>

            {isCustomRuntime && (
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10080"
                  placeholder="Enter minutes (e.g. 45)"
                  value={customRuntimeInput}
                  onChange={(e) => setCustomRuntimeInput(Number(e.target.value))}
                  className="w-48 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-slate-400">minutes of broadcast run time</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 disabled:opacity-50 transition-all"
            >
              <Sparkles className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>
                {isSubmitting
                  ? 'Analyzing Knowledge & Launching Advertisement...'
                  : '⚡ Publish & Run Advertisement on Robot'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: ADVERTISEMENT CAMPAIGNS & CONTROLS */}
      {advertisements.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Advertisement Campaigns & Controls ({advertisements.length})</span>
              </h2>
              <p className="text-slate-400 text-[11px]">
                Control real-time broadcasts: Start, Pause, Resume, Stop, Edit, or Delete campaigns.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Advertisement</th>
                  <th className="py-2.5 px-3">Product & Type</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {advertisements.map((ad) => {
                  const isRunning = ad.status === 'running';
                  const isPaused = ad.status === 'paused';
                  const isStopped = ad.status === 'stopped';
                  const isScheduled = ad.status === 'scheduled';
                  const isCompleted = ad.status === 'completed';

                  return (
                    <tr key={ad.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Ad Title & Info */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm">
                            <Tag className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <span className="font-bold text-white block truncate max-w-[200px]">
                              {ad.title || ad.product_name}
                            </span>
                            {ad.tagline && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                                {ad.tagline}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Product Name & Category */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-200 block">{ad.product_name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">{ad.product_type}</span>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3 text-slate-300 font-mono">
                        {ad.duration_minutes} Mins
                        {isPaused && ad.remaining_seconds && (
                          <span className="block text-[10px] text-amber-400">
                            ({Math.round(ad.remaining_seconds / 60)}m left)
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        {isRunning && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            RUNNING
                          </span>
                        )}
                        {isPaused && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1.5 w-fit">
                            <Pause className="w-3 h-3" />
                            PAUSED
                          </span>
                        )}
                        {isStopped && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 w-fit">
                            STOPPED
                          </span>
                        )}
                        {isScheduled && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 w-fit">
                            SCHEDULED
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 w-fit">
                            COMPLETED
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If Running: Pause, Stop */}
                          {isRunning && (
                            <>
                              <button
                                onClick={() => handlePause(ad.id, ad.title)}
                                disabled={actionLoadingId === ad.id}
                                className="p-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700 transition-colors"
                                title="Pause advertisement"
                              >
                                <Pause className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleStop(ad.id, ad.title)}
                                disabled={actionLoadingId === ad.id}
                                className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
                                title="Stop advertisement"
                              >
                                <Square className="w-3.5 h-3.5 fill-rose-300" />
                              </button>
                            </>
                          )}

                          {/* If Paused: Resume, Stop */}
                          {isPaused && (
                            <>
                              <button
                                onClick={() => handleResume(ad.id, ad.title)}
                                disabled={actionLoadingId === ad.id}
                                className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 transition-colors"
                                title="Resume advertisement"
                              >
                                <Play className="w-3.5 h-3.5 fill-emerald-300" />
                              </button>
                              <button
                                onClick={() => handleStop(ad.id, ad.title)}
                                disabled={actionLoadingId === ad.id}
                                className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
                                title="Stop advertisement"
                              >
                                <Square className="w-3.5 h-3.5 fill-rose-300" />
                              </button>
                            </>
                          )}

                          {/* If Stopped, Scheduled, or Completed: Start */}
                          {(isStopped || isScheduled || isCompleted) && (
                            <button
                              onClick={() => handleStart(ad.id, ad.title)}
                              disabled={actionLoadingId === ad.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition-colors"
                              title="Start and broadcast on robot"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>Start</span>
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => setEditingAd(ad)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                            title="Edit advertisement"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteTarget({ type: 'advertisement', id: ad.id, name: ad.title })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Delete advertisement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: CONFIGURED PRODUCTS LIST */}
      {products.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Configured Products ({products.length})</h2>
              <p className="text-xs text-slate-400">
                Manage product identity, AI knowledge records, and launch broadcasts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => {
              const isLive = activeProduct?.id === p.id && activeAd?.status === 'running';
              const k = knowledgeMap[p.id];
              const productAd = advertisements.find((a) => a.product_id === p.id);
              const runtime = productAd?.duration_minutes || 60;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl p-5 border transition-all ${
                    isLive
                      ? 'bg-slate-900/90 border-cyan-500 shadow-xl shadow-cyan-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  } flex flex-col justify-between space-y-4 text-xs`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm">
                          <Package className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                            {p.type}
                          </span>
                          <h3 className="text-base font-bold text-white mt-0.5">{p.name}</h3>
                        </div>
                      </div>

                      {isLive ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          LIVE BROADCAST
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400 shrink-0">
                          Ready
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Ad Loop: {runtime} mins</span>
                      {k?.fields && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400">
                            {Object.keys(k.fields).length} AI Facts Verified
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-slate-300 line-clamp-3 leading-relaxed">{p.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {!isLive ? (
                        <button
                          onClick={() => onSelectProductToBroadcast(p.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Broadcast Now</span>
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Currently on Screen
                        </span>
                      )}

                      <button
                        onClick={() => setInspectingProduct(p)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>AI Knowledge</span>
                      </button>

                      <button
                        onClick={() => setEditingProduct(p)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        title="Edit product"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => setDeleteTarget({ type: 'product', id: p.id, name: p.name })}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INSPECT KNOWLEDGE MODAL */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                Verified AI Knowledge: {inspectingProduct.name}
              </h2>
              <button
                onClick={() => setInspectingProduct(null)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Close
              </button>
            </div>

            <KnowledgeStudio
              product={inspectingProduct}
              knowledge={knowledgeMap[inspectingProduct.id] || null}
              onKnowledgeUpdated={() => {
                onRefreshData();
              }}
              onScheduleAd={() => {
                setInspectingProduct(null);
                onSelectProductToBroadcast(inspectingProduct.id);
              }}
            />
          </div>
        </div>
      )}

      {/* EDIT ADVERTISEMENT MODAL */}
      <EditAdvertisementModal
        isOpen={!!editingAd}
        advertisement={editingAd}
        onClose={() => setEditingAd(null)}
        onSaved={() => {
          showNotification('Advertisement updated successfully!');
          onRefreshData();
        }}
      />

      {/* EDIT PRODUCT MODAL */}
      <EditProductModal
        isOpen={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSaved={() => {
          showNotification('Product updated successfully!');
          onRefreshData();
        }}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.type === 'product' ? 'Delete Product & Associated Ads' : 'Delete Advertisement Campaign'}
        itemName={deleteTarget?.name || ''}
        itemType={deleteTarget?.type || 'product'}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
