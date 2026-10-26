import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Plus,
  Trash2,
  Edit3,
  Save,
  RotateCw,
  Calendar,
  Send,
  Eye,
  Check,
} from 'lucide-react';
import { Product, StructuredKnowledge, KnowledgeField, FieldConfidence } from '../types.ts';
import { updateProductKnowledge, approveProductKnowledge, analyzeProduct } from '../api.ts';
import confetti from 'canvas-confetti';

interface KnowledgeStudioProps {
  product: Product;
  knowledge: StructuredKnowledge | null;
  onKnowledgeUpdated: (updated: StructuredKnowledge) => void;
  onScheduleAd: (product: Product) => void;
}

export const KnowledgeStudio: React.FC<KnowledgeStudioProps> = ({
  product,
  knowledge,
  onKnowledgeUpdated,
  onScheduleAd,
}) => {
  const [fields, setFields] = useState<Record<string, KnowledgeField>>(knowledge?.fields || {});
  const [summary, setSummary] = useState<string>(knowledge?.summary || '');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    knowledge?.suggested_questions || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [newFieldConfidence, setNewFieldConfidence] = useState<FieldConfidence>('available');
  const [newFieldCategory, setNewFieldCategory] = useState('General');

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: value === '' ? null : value,
        confidence: value === '' ? 'not_specified' : 'available',
      },
    }));
  };

  const handleConfidenceChange = (key: string, confidence: FieldConfidence) => {
    setFields((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        confidence,
      },
    }));
  };

  const handleDeleteField = (key: string) => {
    const updated = { ...fields };
    delete updated[key];
    setFields(updated);
  };

  const handleAddNewField = () => {
    if (!newFieldLabel.trim()) return;
    const key = newFieldKey.trim() || newFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setFields((prev) => ({
      ...prev,
      [key]: {
        key,
        label: newFieldLabel.trim(),
        value: newFieldValue.trim() || null,
        confidence: newFieldConfidence,
        category: newFieldCategory,
      },
    }));
    setNewFieldKey('');
    setNewFieldLabel('');
    setNewFieldValue('');
    setShowAddField(false);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    setSuggestedQuestions((prev) => [...prev, newQuestion.trim()]);
    setNewQuestion('');
  };

  const handleDeleteQuestion = (idx: number) => {
    setSuggestedQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updated = await updateProductKnowledge(product.id, {
        summary,
        fields,
        suggested_questions: suggestedQuestions,
      });
      onKnowledgeUpdated(updated);
    } catch (err) {
      console.error('Failed to update knowledge:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsSaving(true);
    try {
      await updateProductKnowledge(product.id, {
        summary,
        fields,
        suggested_questions: suggestedQuestions,
      });
      const approved = await approveProductKnowledge(product.id);
      onKnowledgeUpdated(approved);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Failed to approve knowledge:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReanalyzeWithAI = async () => {
    setIsReanalyzing(true);
    try {
      const reanalyzed = await analyzeProduct(product.id);
      setFields(reanalyzed.fields);
      setSummary(reanalyzed.summary);
      setSuggestedQuestions(reanalyzed.suggested_questions);
      onKnowledgeUpdated(reanalyzed);
    } catch (err) {
      console.error('Failed to re-analyze:', err);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const availableCount = (Object.values(fields) as KnowledgeField[]).filter((f) => f.confidence === 'available').length;
  const notSpecifiedCount = (Object.values(fields) as KnowledgeField[]).filter((f) => f.confidence === 'not_specified').length;
  const uncertainCount = (Object.values(fields) as KnowledgeField[]).filter((f) => f.confidence === 'uncertain').length;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{product.name}</h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
              {product.type}
            </span>
            {knowledge?.is_approved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approved & Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800">
                <AlertTriangle className="w-3.5 h-3.5" />
                Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review and approve AI-extracted structured product knowledge before it is served to customer queries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleReanalyzeWithAI}
            disabled={isReanalyzing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
            <span>{isReanalyzing ? 'Re-analyzing...' : 'Re-analyze with AI'}</span>
          </button>

          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Approve Knowledge</span>
          </button>

          <button
            onClick={() => onScheduleAd(product)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Ad</span>
          </button>
        </div>
      </div>

      {/* Field Extraction Confidence Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-900/40 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Available & Verified</span>
            <span className="text-xl font-bold text-emerald-400">{availableCount} Fields</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400/60" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Not Specified (Protected)</span>
            <span className="text-xl font-bold text-slate-300">{notSpecifiedCount} Fields</span>
          </div>
          <HelpCircle className="w-6 h-6 text-slate-500" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-900/40 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Uncertain / Needs Review</span>
            <span className="text-xl font-bold text-amber-400">{uncertainCount} Fields</span>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-400/60" />
        </div>
      </div>

      {/* Side-by-Side: Raw Input Paragraph vs Structured Extracted Knowledge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Raw Description Reference (4 Cols) */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Raw Product Description
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Original Source</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 leading-relaxed max-h-[420px] overflow-y-auto whitespace-pre-wrap">
            {product.description}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              AI Executive Summary
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Right: Structured Fields Editor (8 Cols) */}
        <div className="lg:col-span-8 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Type-Specific Structured Schema
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                The robot uses ONLY these verified values. Missing values are safely protected against hallucinations.
              </p>
            </div>
            <button
              onClick={() => setShowAddField(!showAddField)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Field</span>
            </button>
          </div>

          {/* Add Custom Field Form */}
          {showAddField && (
            <div className="p-3.5 rounded-lg bg-slate-950 border border-cyan-900/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Field Label</label>
                <input
                  type="text"
                  placeholder="e.g. Battery Capacity"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Value</label>
                <input
                  type="text"
                  placeholder="e.g. 5000mAh with 100W fast charge"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddField(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNewField}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white font-semibold"
                >
                  Add Field
                </button>
              </div>
            </div>
          )}

          {/* Field List Grid */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {(Object.entries(fields) as [string, KnowledgeField][]).map(([key, field]) => {
              const valStr = field.value === null ? '' : Array.isArray(field.value) ? field.value.join(', ') : String(field.value);

              return (
                <div
                  key={key}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="sm:w-1/3">
                    <span className="font-semibold text-slate-200 block">{field.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{field.key}</span>
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={valStr}
                      placeholder="Not specified in product data"
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 sm:w-auto justify-between sm:justify-end">
                    <select
                      value={field.confidence}
                      onChange={(e) => handleConfidenceChange(key, e.target.value as FieldConfidence)}
                      className={`p-1.5 rounded-lg text-[11px] font-medium border bg-slate-900 ${
                        field.confidence === 'available'
                          ? 'text-emerald-400 border-emerald-800'
                          : field.confidence === 'not_specified'
                          ? 'text-slate-400 border-slate-700'
                          : 'text-amber-400 border-amber-800'
                      }`}
                    >
                      <option value="available">🟢 Available</option>
                      <option value="not_specified">⚪ Not specified</option>
                      <option value="uncertain">🟡 Uncertain</option>
                    </select>

                    <button
                      onClick={() => handleDeleteField(key)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suggested Customer Questions Manager */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Auto-Generated Suggested Customer Questions
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-slate-800 text-slate-200 border border-slate-700"
                >
                  <span>{q}</span>
                  <button
                    onClick={() => handleDeleteQuestion(idx)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add another suggested question..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              />
              <button
                onClick={handleAddQuestion}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
