import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Bot, Volume2, Mic } from 'lucide-react';

interface RobotAvatarProps {
  isSpeaking: boolean;
  isListening?: boolean;
  statusText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RobotAvatar: React.FC<RobotAvatarProps> = ({
  isSpeaking,
  isListening,
  statusText = 'AI Online',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {/* Outer Pulsing Aura */}
        <motion.div
          animate={{
            scale: isSpeaking || isListening ? [1, 1.18, 1] : [1, 1.05, 1],
            opacity: isSpeaking ? [0.6, 0.9, 0.6] : [0.2, 0.4, 0.2],
          }}
          transition={{ duration: isSpeaking ? 0.8 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -inset-1 rounded-2xl ${
            isListening ? 'bg-rose-500/40' : isSpeaking ? 'bg-cyan-500/50' : 'bg-emerald-500/30'
          } blur-sm`}
        />

        {/* Robot Head Body */}
        <div
          className={`${sizeClasses[size]} relative rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700/80 shadow-xl flex items-center justify-center overflow-hidden`}
        >
          {/* Glass glare effect */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

          {/* Robot Eyes & Face Screen */}
          <div className="w-4/5 h-3/5 rounded-lg bg-black/90 border border-slate-800 flex items-center justify-around px-2 relative">
            {/* Left Eye */}
            <motion.div
              animate={{
                scaleY: isSpeaking ? [1, 1.4, 0.8, 1] : [1, 1, 0.1, 1],
                scaleX: isSpeaking ? [1, 1.1, 0.9, 1] : 1,
              }}
              transition={{
                duration: isSpeaking ? 0.5 : 3.5,
                repeat: Infinity,
                repeatDelay: isSpeaking ? 0 : 2,
              }}
              className={`w-2.5 h-3 rounded-full ${
                isListening
                  ? 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
                  : isSpeaking
                  ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
                  : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
              }`}
            />

            {/* Center Speech waveform indicator when speaking */}
            {isSpeaking && (
              <div className="flex items-center gap-0.5 h-3">
                <motion.div
                  animate={{ height: ['2px', '10px', '4px'] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                  className="w-0.5 bg-cyan-300 rounded-full"
                />
                <motion.div
                  animate={{ height: ['4px', '14px', '2px'] }}
                  transition={{ duration: 0.25, repeat: Infinity, delay: 0.1 }}
                  className="w-0.5 bg-cyan-300 rounded-full"
                />
                <motion.div
                  animate={{ height: ['2px', '8px', '3px'] }}
                  transition={{ duration: 0.35, repeat: Infinity, delay: 0.15 }}
                  className="w-0.5 bg-cyan-300 rounded-full"
                />
              </div>
            )}

            {/* Right Eye */}
            <motion.div
              animate={{
                scaleY: isSpeaking ? [1, 1.4, 0.8, 1] : [1, 1, 0.1, 1],
                scaleX: isSpeaking ? [1, 1.1, 0.9, 1] : 1,
              }}
              transition={{
                duration: isSpeaking ? 0.5 : 3.5,
                repeat: Infinity,
                repeatDelay: isSpeaking ? 0 : 2,
              }}
              className={`w-2.5 h-3 rounded-full ${
                isListening
                  ? 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
                  : isSpeaking
                  ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
                  : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
              }`}
            />
          </div>

          {/* Micro antenna */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
        </div>
      </div>

      {/* Robot Label & Status */}
      {size !== 'sm' && (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-100 tracking-wide uppercase font-mono">
              RoboAd AI
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              v2.1
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-xs">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isListening
                  ? 'bg-rose-500 animate-ping'
                  : isSpeaking
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="text-slate-400 text-[11px]">
              {isListening ? 'Listening to voice...' : isSpeaking ? 'Speaking answer...' : statusText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
