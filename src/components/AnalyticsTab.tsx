import React from 'react';
import { BarChart3, PieChart, Users, Zap, Clock, MessageSquare, TrendingUp, Layers, CheckCircle } from 'lucide-react';
import { AnalyticsSummary } from '../types.ts';

interface AnalyticsTabProps {
  analytics: AnalyticsSummary | null;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Loading system analytics...
      </div>
    );
  }

  const maxIntentCount = Math.max(...(analytics.top_intents.map((i) => i.count) || [1]), 1);

  return (
    <div className="space-y-6">
      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Products</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-extrabold text-white">{analytics.total_products}</span>
          <span className="text-[10px] text-slate-500 mt-1">Multi-domain knowledge base</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Advertisements</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-400">
            {analytics.active_advertisements} Active
          </span>
          <span className="text-[10px] text-slate-500 mt-1">
            {analytics.scheduled_advertisements} scheduled in queue
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Customer Q&A Queries</span>
            <MessageSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-extrabold text-white">
            {analytics.total_customer_questions}
          </span>
          <span className="text-[10px] text-slate-500 mt-1">Intent-driven answers</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Avg Response Latency</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-extrabold text-amber-400">
            {analytics.avg_response_time_ms} ms
          </span>
          <span className="text-[10px] text-slate-500 mt-1">Powered by Gemini 3.7 Flash</span>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Top Question Intents Bar Breakdown (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Customer Intent Intelligence Breakdown</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Most Asked Topics</span>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {analytics.top_intents.map((item) => {
              const pct = Math.round((item.count / maxIntentCount) * 100);
              return (
                <div key={item.intent} className="space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-semibold font-mono text-[11px] text-cyan-300">
                      {item.intent}
                    </span>
                    <span className="font-mono text-slate-400">{item.count} inquiries</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Product Type Distribution (5 Cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Product Type Distribution</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Catalog Mix</span>
          </div>

          <div className="space-y-2.5 pt-2 text-xs">
            {analytics.type_distribution.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80"
              >
                <span className="font-medium text-slate-200">{item.type}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 font-mono">
                  {item.count} items
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
