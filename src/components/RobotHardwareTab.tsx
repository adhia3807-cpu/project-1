import React, { useState } from 'react';
import { Bot, Cpu, Battery, Wifi, Radio, Volume2, ShieldCheck, Terminal, Copy, Check, Power } from 'lucide-react';
import { RobotTelemetry } from '../types.ts';
import { updateRobotTelemetry } from '../api.ts';

interface RobotHardwareTabProps {
  telemetry: RobotTelemetry | null;
  onTelemetryUpdated: (updated: RobotTelemetry) => void;
}

export const RobotHardwareTab: React.FC<RobotHardwareTabProps> = ({
  telemetry,
  onTelemetryUpdated,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleRobotStatus = async (status: 'idle' | 'broadcasting' | 'answering' | 'offline') => {
    if (!telemetry) return;
    setIsUpdating(true);
    try {
      const updated = await updateRobotTelemetry({ status });
      onTelemetryUpdated(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateVolume = async (vol: number) => {
    if (!telemetry) return;
    try {
      const updated = await updateRobotTelemetry({ volume: vol });
      onTelemetryUpdated(updated);
    } catch (err) {
      console.error('Failed to update volume:', err);
    }
  };

  const apiBase = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              <span>Physical Robot Hardware Integration & Remote Telemetry</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
              API READY
            </span>
          </div>
          <p className="text-slate-400 mt-1">
            Connect any physical advertising robot (ROS, Android Tablet, Raspberry Pi, or Kiosk Display) via our ultra-fast REST & JSON APIs.
          </p>
        </div>
      </div>

      {/* Telemetry Control Dashboard */}
      {telemetry && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold">Robot Hardware State</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  telemetry.status === 'offline'
                    ? 'bg-rose-500'
                    : telemetry.status === 'answering'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-base font-bold capitalize text-white">{telemetry.status}</span>
            </div>
            <div className="flex gap-1 pt-1">
              <button
                onClick={() => handleToggleRobotStatus('broadcasting')}
                disabled={isUpdating}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200"
              >
                Broadcast
              </button>
              <button
                onClick={() => handleToggleRobotStatus('idle')}
                disabled={isUpdating}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200"
              >
                Standby
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold">Battery & Power</span>
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl font-bold text-emerald-400">{telemetry.battery_level}%</span>
            <span className="text-[10px] text-slate-500 block">AC Charging Connected</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold">Physical Speaker Volume</span>
              <Volume2 className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xl font-bold text-white">{telemetry.volume}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={telemetry.volume}
              onChange={(e) => handleUpdateVolume(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold">Screen Brightness</span>
              <Radio className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xl font-bold text-white">{telemetry.screen_brightness}%</span>
            <span className="text-[10px] text-slate-500 block">Auto-dimming enabled</span>
          </div>
        </div>
      )}

      {/* Integration API Endpoints */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Robot Hardware REST API Specifications</span>
        </h3>
        <p className="text-slate-400">
          The physical robot hardware makes these standard HTTP calls to display the current poster and stream customer voice Q&A.
        </p>

        <div className="space-y-3">
          {/* Endpoint 1 */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  GET
                </span>
                <span className="text-slate-200">/api/robot/active-display</span>
              </div>
              <button
                onClick={() =>
                  handleCopy(`${apiBase}/api/robot/active-display`, 'ep1')
                }
                className="flex items-center gap-1 text-slate-400 hover:text-cyan-300"
              >
                {copiedKey === 'ep1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'ep1' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-slate-400 text-[11px]">
              Returns the currently active advertisement posters, tagline, verified knowledge summary, and suggested questions for the robot head screen.
            </p>
          </div>

          {/* Endpoint 2 */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono">
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                  POST
                </span>
                <span className="text-slate-200">/api/chat</span>
              </div>
              <button
                onClick={() =>
                  handleCopy(
                    `curl -X POST ${apiBase}/api/chat -H "Content-Type: application/json" -d '{"question":"What are the pack sizes and price?"}'`,
                    'ep2'
                  )
                }
                className="flex items-center gap-1 text-slate-400 hover:text-cyan-300"
              >
                {copiedKey === 'ep2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'ep2' ? 'Copied Curl' : 'Copy Curl'}</span>
              </button>
            </div>
            <p className="text-slate-400 text-[11px]">
              Accepts customer questions in any language (English, Malayalam, Hindi, etc.) and returns structured intent, anti-hallucinated answer, and TTS speech ready text.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
