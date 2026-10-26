import React, { useState } from 'react';
import { Copy, Check, Sparkles, AlertCircle, FileSearch, HelpCircle } from 'lucide-react';
import { generateAiDescriptionPrompt } from '../utils/promptGenerator.ts';

interface AiDescriptionPromptBoxProps {
  productName: string;
  productType: string;
  customType?: string;
}

export const AiDescriptionPromptBox: React.FC<AiDescriptionPromptBoxProps> = ({
  productName,
  productType,
  customType,
}) => {
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const { prompt, isValid, warning, effectiveType } = generateAiDescriptionPrompt(
    productName,
    productType,
    customType
  );

  const handleCopy = async () => {
    if (!prompt) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = prompt;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const lineCount = prompt ? prompt.split('\n').length : 0;
  const wordCount = prompt ? prompt.trim().split(/\s+/).length : 0;

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-slate-950/90 p-4 space-y-3 shadow-inner">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
            <FileSearch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white uppercase tracking-wider">
                AI Research Prompt
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {effectiveType}
              </span>
              {isValid && (
                <span className="hidden sm:inline-block text-[10px] text-slate-500 font-mono">
                  {wordCount} words • {lineCount} lines
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Deep product research prompt to extract factual product knowledge and specifications.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 text-xs transition-colors"
            title="How this workflow works"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {isValid && (
            <div className="flex items-center gap-2">
              {copied && (
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 animate-fade-in">
                  <Check className="w-3.5 h-3.5" />
                  Prompt copied!
                </span>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20 scale-105'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20 active:scale-95'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIED!' : 'COPY PROMPT'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Optional Workflow Helper Card */}
      {showGuide && (
        <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-slate-300 space-y-2">
          <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>How to use the AI Research Prompt:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
            <li>Click <strong>COPY PROMPT</strong> above.</li>
            <li>Use it to research comprehensive factual product information.</li>
            <li>Copy the structured factual response and paste it into the <strong>Product Description</strong> box below.</li>
            <li>Save the product. The kiosk robot will now know every specification, price, and feature!</li>
          </ol>
        </div>
      )}

      {/* Prompt Display Box or Missing Input Warning */}
      {!isValid ? (
        <div className="rounded-lg bg-slate-900/90 border border-dashed border-slate-800 p-4 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{warning || 'Enter the product name to generate the research prompt.'}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            The system will automatically generate a specialized research prompt covering all specifications, variants, prices, and customer questions for {effectiveType}.
          </p>
        </div>
      ) : (
        <div className="relative rounded-lg bg-slate-900/95 border border-slate-800 p-3.5 max-h-56 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-cyan-500/30 shadow-inner">
          {prompt}
        </div>
      )}
    </div>
  );
};
