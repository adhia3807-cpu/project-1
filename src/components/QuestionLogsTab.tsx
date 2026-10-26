import React, { useState } from 'react';
import { Search, Filter, MessageSquare, ThumbsUp, ThumbsDown, Clock, Globe, Zap, Bot } from 'lucide-react';
import { QuestionLog } from '../types.ts';
import { formatIndianDate, formatIndianTimeIST } from '../utils/indiaFormatters.ts';

interface QuestionLogsTabProps {
  logs: QuestionLog[];
}

export const QuestionLogsTab: React.FC<QuestionLogsTabProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [intentFilter, setIntentFilter] = useState('all');
  const [langFilter, setLangFilter] = useState('all');

  const uniqueIntents = Array.from(new Set(logs.map((l) => l.detected_intent || 'GENERAL_INQUIRY')));
  const uniqueLangs = Array.from(new Set(logs.map((l) => l.language_detected || 'English')));

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.customer_question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detected_intent.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIntent = intentFilter === 'all' || log.detected_intent === intentFilter;
    const matchesLang = langFilter === 'all' || log.language_detected === langFilter;

    return matchesSearch && matchesIntent && matchesLang;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <span>Customer Question Intelligence & Interaction Logs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Every customer question asked to the robot is logged with intent classification and source tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search questions or intents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
            />
          </div>

          {/* Intent Filter */}
          <select
            value={intentFilter}
            onChange={(e) => setIntentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Intents ({uniqueIntents.length})</option>
            {uniqueIntents.map((intent) => (
              <option key={intent} value={intent}>
                {intent}
              </option>
            ))}
          </select>

          {/* Language Filter */}
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Languages</option>
            {uniqueLangs.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No question logs matched the criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-800/40 transition-colors space-y-2 text-xs">
                {/* Top metadata row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{log.product_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      {log.product_type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {log.detected_intent}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-500" />
                      {log.language_detected}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {log.latency_ms}ms
                    </span>
                    <span className="text-slate-500">
                      {formatIndianDate(log.timestamp)} • {formatIndianTimeIST(log.timestamp, false)} IST
                    </span>
                  </div>
                </div>

                {/* Customer Question Bubble */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200">
                  <span className="font-semibold text-slate-400 mr-2 text-[10px] uppercase font-mono tracking-wider">
                    Customer:
                  </span>
                  <span className="font-medium text-white">"{log.customer_question}"</span>
                </div>

                {/* Robot Answer Bubble */}
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 flex items-start gap-2">
                  <Bot className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold text-cyan-300 mr-2 text-[10px] uppercase font-mono tracking-wider">
                      Robot Answer:
                    </span>
                    <span>{log.answer}</span>
                  </div>
                  {log.feedback && (
                    <span
                      className={`p-1 rounded text-[10px] font-bold uppercase ${
                        log.feedback === 'helpful' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {log.feedback === 'helpful' ? '👍 Helpful' : '👎 Disliked'}
                    </span>
                  )}
                </div>

                {/* Required Fields footprint */}
                {log.required_fields && log.required_fields.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span>Grounded in fields:</span>
                    {log.required_fields.map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
