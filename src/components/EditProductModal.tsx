import React, { useState } from 'react';
import { X, Save, Tag, Sparkles } from 'lucide-react';
import { Product, PRODUCT_TYPES } from '../types.ts';
import { updateProduct, analyzeProduct } from '../api.ts';

interface EditProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  product,
  onClose,
  onSaved,
}) => {
  if (!isOpen || !product) return null;

  const [name, setName] = useState(product.name || '');
  const [type, setType] = useState(product.type || 'Food & Beverage');
  const [tagline, setTagline] = useState(product.tagline || '');
  const [description, setDescription] = useState(product.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError('Product name and description are required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await updateProduct(product.id, {
        name: name.trim(),
        type,
        tagline: tagline.trim(),
        description: description.trim(),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReanalyzeWithAI = async () => {
    setReanalyzing(true);
    setError(null);
    try {
      // First save product updates
      await updateProduct(product.id, {
        name: name.trim(),
        type,
        tagline: tagline.trim(),
        description: description.trim(),
      });
      // Then re-run AI Analyzer
      await analyzeProduct(product.id);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'AI Knowledge re-analysis failed');
    } finally {
      setReanalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8 text-xs text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Edit Product Details</h2>
            <p className="text-[11px] text-slate-400">
              Update name, category, tagline, and AI description.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Product Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Product Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Refresh your mind"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
              <span>Product Knowledge Description *</span>
              <span className="text-[10px] text-slate-400 font-mono">{description.length} chars</span>
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReanalyzeWithAI}
              disabled={reanalyzing || isSaving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-300 font-medium text-xs transition-colors"
              title="Save changes and re-run AI Knowledge Extractor"
            >
              <Sparkles className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
              <span>{reanalyzing ? 'Re-analyzing...' : 'Save & Re-run AI Analyzer'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || reanalyzing}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Product'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
