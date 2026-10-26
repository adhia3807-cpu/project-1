import React from 'react';
import { X, Battery, Wifi, Volume2, Bot, Sparkles, Power } from 'lucide-react';
import { RobotTelemetry, Product, Advertisement } from '../types.ts';

interface RobotSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: RobotTelemetry | null;
  activeProduct: Product | null;
  activeAd: Advertisement | null;
  onSwitchToKiosk: () => void;
}

export const RobotSimulatorModal: React.FC<RobotSimulatorModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  activeProduct,
  activeAd,
  onSwitchToKiosk,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative my-8 text-xs text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-800 shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Physical Robot Chassis & Hardware Simulation</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                TELEMETRY LIVE
              </span>
            </h2>
            <p className="text-slate-400">
              Autonomous Mobile Advertising Robot unit model "RoboAd-X1".
            </p>
          </div>
        </div>

        {/* Robot Physical Form Representation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Chassis Visual Frame (8 Cols) */}
          <div className="md:col-span-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
            {/* Robot Head Sensors & Camera */}
            <div className="w-48 h-12 bg-slate-900 rounded-t-2xl border-t-2 border-x-2 border-slate-700 flex items-center justify-center gap-3 px-4 shadow-md">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
              <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            </div>

            {/* Robot Chest Kiosk Screen */}
            <div className="w-full rounded-2xl bg-slate-950 border-4 border-slate-800 p-4 shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Wifi className="w-3 h-3" /> 5G Connected
                </span>
                <span>Active: {activeProduct?.name || 'Idle'}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Battery className="w-3 h-3" /> {telemetry?.battery_level || 94}%
                </span>
              </div>

              {/* Poster Screen */}
              <div className="h-44 rounded-xl overflow-hidden relative bg-slate-900 border border-slate-800">
                <img
                  src={
                    activeAd?.advertisement_poster ||
                    activeProduct?.advertisement_poster ||
                    'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80'
                  }
                  alt="Poster"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    {activeProduct?.name}
                  </span>
                  <p className="text-white font-bold text-xs truncate">
                    {activeAd?.tagline || activeProduct?.tagline}
                  </p>
                </div>
              </div>

              {/* Voice wave bar */}
              <div className="mt-3 flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] text-slate-300">Natural Voice Core Active</span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onSwitchToKiosk();
                  }}
                  className="px-2.5 py-1 rounded bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[10px] font-bold"
                >
                  Interact on Touchscreen →
                </button>
              </div>
            </div>

            {/* Robot Base Wheels & Ground clearance */}
            <div className="w-4/5 h-8 mt-2 bg-slate-800 rounded-b-2xl border-b-2 border-x-2 border-slate-700 flex items-center justify-around px-4">
              <div className="w-8 h-3 rounded-full bg-slate-950 border border-slate-600" />
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                ROBOAD-X1 DRIVE
              </span>
              <div className="w-8 h-3 rounded-full bg-slate-950 border border-slate-600" />
            </div>
          </div>

          {/* Telemetry Panel (4 Cols) */}
          <div className="md:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider block">
                Robot Status Metrics
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Operating Mode:</span>
                  <span className="font-bold text-emerald-400 uppercase">
                    {telemetry?.status || 'Broadcasting'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Battery Level:</span>
                  <span className="font-bold text-emerald-400">{telemetry?.battery_level || 94}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Speaker Volume:</span>
                  <span className="font-bold text-white">{telemetry?.volume || 85}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Screen Brightness:</span>
                  <span className="font-bold text-white">{telemetry?.screen_brightness || 90}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">AI Response Engine:</span>
                  <span className="font-bold text-cyan-300 font-mono">Gemini Flash</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onSwitchToKiosk();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
            >
              <span>Open Customer Touchscreen Kiosk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
