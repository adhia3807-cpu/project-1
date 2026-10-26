import React, { useState } from 'react';
import { Sparkles, Upload, Image as ImageIcon, Check, X, Tag, Plus } from 'lucide-react';
import { PRODUCT_TYPES, ProductType, Product } from '../types.ts';
import { createProduct } from '../api.ts';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (newProduct: Product) => void;
}

const POSTER_PRESETS = [
  {
    name: 'Beverage / Drink',
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Education / College',
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Laptop / Tech',
    url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Smartphone',
    url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Restaurant / Cafe',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Automobile',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Fitness / Gym',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  },
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType | string>('Food & Beverage');
  const [customType, setCustomType] = useState('');
  const [description, setDescription] = useState('');
  const [tagline, setTagline] = useState('');
  const [productPoster, setProductPoster] = useState(POSTER_PRESETS[0].url);
  const [adPoster, setAdPoster] = useState(POSTER_PRESETS[0].url);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError('Please provide product name and complete description.');
      return;
    }

    const finalType = type === 'Other / Custom' && customType.trim() ? customType.trim() : type;

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await createProduct({
        name: name.trim(),
        type: finalType,
        description: description.trim(),
        product_poster: productPoster,
        advertisement_poster: adPoster,
        tagline: tagline.trim() || `Discover ${name}`,
        auto_analyze: true,
      });

      onProductCreated(res.product);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create product with AI knowledge.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Create New Product & AI Knowledge</h2>
            <p className="text-xs text-slate-400">
              Input the raw paragraph description. The AI Product Analyzer converts it into verified structured knowledge.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Product Name *</label>
              <input
                type="text"
                placeholder="e.g. 7UP or Apex Engineering College"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Product Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Type Input if "Other / Custom" */}
          {type === 'Other / Custom' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Specify Custom Product Type *
              </label>
              <input
                type="text"
                placeholder="e.g. Solar Energy Solutions, Drone Services, Luxury Watch"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* Tagline */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Tagline / Broadcast Header (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Feel the Refreshing Lemon-Lime Zing!"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Product Description Paragraph (1 large textarea as requested) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold">
                Complete Product Description (Raw Text / Paragraph) *
              </label>
              <span className="text-[10px] text-cyan-400 font-mono">
                No manual field entry required
              </span>
            </div>
            <textarea
              rows={5}
              placeholder="Write or paste all available product information in normal paragraph form (sizes, pricing, ingredients, specs, offers, warranty, courses, contact, etc.). The AI automatically structures this into type-specific knowledge..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          {/* Posters & Presets */}
          <div className="space-y-3">
            <label className="block text-slate-300 font-semibold">
              Product & Advertisement Posters
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Product Poster URL</label>
                <input
                  type="text"
                  value={productPoster}
                  onChange={(e) => setProductPoster(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
                <div className="mt-2 h-28 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                  <img
                    src={productPoster}
                    alt="Product preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Advertisement Poster URL
                </label>
                <input
                  type="text"
                  value={adPoster}
                  onChange={(e) => setAdPoster(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
                <div className="mt-2 h-28 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                  <img
                    src={adPoster}
                    alt="Ad preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Poster Presets */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1.5 font-medium uppercase tracking-wider">
                Or Choose from High-Res Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {POSTER_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setProductPoster(preset.url);
                      setAdPoster(preset.url);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px]"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isAnalyzing}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing Product with AI...' : 'Submit & Analyze with AI'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
