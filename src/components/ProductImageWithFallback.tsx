import React, { useState } from 'react';
import { Package, ImageOff } from 'lucide-react';

interface ProductImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  category?: string;
  badgeLabel?: string;
}

export const ProductImageWithFallback: React.FC<ProductImageWithFallbackProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center',
  category,
  badgeLabel,
}) => {
  const [hasError, setHasError] = useState(false);

  // If no source or failed to load, render verified placeholder
  if (!src || src.trim() === '' || hasError) {
    return (
      <div className={`${containerClassName} border border-slate-800/80 bg-slate-900/90 text-slate-400 p-4 flex flex-col items-center justify-center text-center select-none`}>
        <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 mb-2">
          <ImageOff className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
          Product Image Unavailable
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 max-w-[200px]">
          {alt}
        </p>
        {category && (
          <span className="mt-2 inline-block px-2 py-0.5 rounded-full text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
            {category}
          </span>
        )}
        {badgeLabel && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400">
            {badgeLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={className}
      />
      {badgeLabel && (
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-950/80 text-white backdrop-blur-sm border border-slate-800">
          {badgeLabel}
        </span>
      )}
    </div>
  );
};
