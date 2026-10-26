import React, { useState } from 'react';
import { X, Save, Clock, Layers } from 'lucide-react';
import { Advertisement } from '../types.ts';
import { updateAdvertisement } from '../api.ts';

interface EditAdvertisementModalProps {
  isOpen: boolean;
  advertisement: Advertisement | null;
  onClose: () => void;
  onSaved: () => void;
}

export const EditAdvertisementModal: React.FC<EditAdvertisementModalProps> = ({
  isOpen,
  advertisement,
  onClose,
  onSaved,
}) => {
  if (!isOpen || !advertisement) return null;

  const [title, setTitle] = useState(advertisement.title || '');
  const [tagline, setTagline] = useState(advertisement.tagline || '');
  const [durationMinutes, setDurationMinutes] = useState(advertisement.duration_minutes || 60);
  const [priority, setPriority] = useState(advertisement.priority || 3);
  const [autoLoop, setAutoLoop] = useState(advertisement.auto_loop !== false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await updateAdvertisement(advertisement.id, {
        title: title.trim(),
        tagline: tagline.trim(),
        duration_minutes: Number(durationMinutes) || 60,
        priority: Number(priority),
        auto_loop: autoLoop,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update advertisement');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8 text-xs text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Edit Advertisement Campaign</h2>
            <p className="text-[11px] text-slate-400">
              Product: <span className="text-cyan-300 font-semibold">{advertisement.product_name}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Campaign Headline / Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Broadcast Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Pure Refreshment in Every Sip!"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-400" />
                <span>Run Time (Minutes)</span>
              </label>
              <input
                type="number"
                min="1"
                max="10080"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>1 - Low</option>
                <option value={3}>3 - Standard</option>
                <option value={5}>5 - High Priority</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoLoopCheck"
              checked={autoLoop}
              onChange={(e) => setAutoLoop(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="autoLoopCheck" className="text-slate-300 font-medium cursor-pointer">
              Auto-loop broadcast continuously until stopped
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
