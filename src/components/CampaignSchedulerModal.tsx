import React, { useState } from 'react';
import { Calendar, Clock, X, Radio, Layers, Check, Play } from 'lucide-react';
import { Product, Advertisement } from '../types.ts';
import { createAdvertisement } from '../api.ts';

interface CampaignSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  allProducts: Product[];
  onAdCreated: (ad: Advertisement) => void;
}

const DURATION_OPTIONS = [
  { label: '15 Minutes', value: 15 },
  { label: '30 Minutes', value: 30 },
  { label: '1 Hour', value: 60 },
  { label: '2 Hours', value: 120 },
  { label: '4 Hours', value: 240 },
  { label: '8 Hours', value: 480 },
  { label: '12 Hours', value: 720 },
  { label: '24 Hours', value: 1440 },
  { label: 'Custom', value: 0 },
];

export const CampaignSchedulerModal: React.FC<CampaignSchedulerModalProps> = ({
  isOpen,
  onClose,
  product: initialProduct,
  allProducts,
  onAdCreated,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || (allProducts[0]?.id || '')
  );
  const [title, setTitle] = useState(initialProduct?.name || '');
  const [tagline, setTagline] = useState(initialProduct?.tagline || '');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [customDuration, setCustomDuration] = useState<number>(90);
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [priority, setPriority] = useState<number>(4);
  const [autoLoop, setAutoLoop] = useState<boolean>(true);
  const [activateImmediately, setActivateImmediately] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentProduct = allProducts.find((p) => p.id === selectedProductId) || initialProduct;

  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const p = allProducts.find((item) => item.id === id);
    if (p) {
      setTitle(p.name);
      setTagline(p.tagline || '');
    }
  };

  const handleDurationSelect = (val: number) => {
    if (val === 0) {
      setIsCustomDuration(true);
    } else {
      setIsCustomDuration(false);
      setDurationMinutes(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    setIsSubmitting(true);
    try {
      const effectiveDuration = isCustomDuration ? Number(customDuration) || 60 : durationMinutes;
      const now = new Date();
      const ad = await createAdvertisement({
        product_id: selectedProductId,
        title: title || currentProduct?.name,
        tagline: tagline || currentProduct?.tagline,
        duration_minutes: effectiveDuration,
        priority,
        status: activateImmediately ? 'running' : 'scheduled',
        auto_loop: autoLoop,
        start_time: now.toISOString(),
      });

      onAdCreated(ad);
      onClose();
    } catch (err) {
      console.error('Failed to create campaign:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8 text-xs">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Schedule Advertisement Campaign</h2>
            <p className="text-slate-400">
              Set broadcast runtime and activation rules on the robot screen.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Product */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type})
                </option>
              ))}
            </select>
          </div>

          {/* Title & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Ad Campaign Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Catchy Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Duration Options */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Advertisement Duration
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = isCustomDuration
                  ? opt.value === 0
                  : durationMinutes === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleDurationSelect(opt.value)}
                    className={`py-2 px-2.5 rounded-lg border text-center font-medium transition-all ${
                      isSelected
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {isCustomDuration && (
              <div className="mt-2">
                <label className="text-[11px] text-slate-400 block mb-1">
                  Custom Minutes (e.g. 45 or 180)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10080"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
            )}
          </div>

          {/* Priority Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">Priority Weight</label>
              <span className="font-mono text-cyan-400 font-bold">Level {priority} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={activateImmediately}
                onChange={(e) => setActivateImmediately(e.target.checked)}
                className="rounded accent-cyan-500"
              />
              <span className="text-slate-200 font-medium">
                Activate immediately on the robot screen now
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoLoop}
                onChange={(e) => setAutoLoop(e.target.checked)}
                className="rounded accent-cyan-500"
              />
              <span className="text-slate-200 font-medium">
                Auto-loop campaign when duration completes
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{activateImmediately ? 'Launch & Broadcast' : 'Schedule Campaign'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
