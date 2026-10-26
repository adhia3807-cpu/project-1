import React from 'react';
import {
  Bot,
  Shield,
  Monitor,
  Volume2,
  VolumeX,
  BatteryCharging,
  Radio,
  ChevronDown,
  Check,
  User,
  LogOut,
} from 'lucide-react';
import { Product, Advertisement } from '../types.ts';

interface NavbarProps {
  currentView: 'customer' | 'admin';
  onViewChange: (view: 'customer' | 'admin') => void;
  activeProduct: Product | null;
  activeAd: Advertisement | null;
  allProducts: Product[];
  onSelectProductToBroadcast: (productId: string) => void;
  speechEnabled: boolean;
  onToggleSpeech: () => void;
  batteryLevel?: number;
  onOpenRobotSim: () => void;
  adminUser: { id: string; name: string; role: string } | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  activeProduct,
  allProducts,
  onSelectProductToBroadcast,
  speechEnabled,
  onToggleSpeech,
  batteryLevel = 94,
  onOpenRobotSim,
  adminUser,
  onLogout,
}) => {
  const [productDropdownOpen, setProductDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                AI Advertisement Robot
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                PROD v2.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Autonomous Multilingual Ad Kiosk & Knowledge Engine
            </p>
          </div>
        </div>

        {/* Active Broadcast Selector & Quick Switcher (If products exist) */}
        {allProducts.length > 0 && (
          <div className="relative hidden md:flex items-center">
            <button
              onClick={() => setProductDropdownOpen(!productDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span className="text-slate-400">Broadcasting:</span>
              <span className="font-semibold text-cyan-300 truncate max-w-[160px]">
                {activeProduct?.name || 'No Active Ad'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu to quick switch ad */}
            {productDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProductDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1.5 w-72 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-20">
                  <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Switch Active Ad on Robot Screen
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto mt-1">
                    {allProducts.map((p) => {
                      const isActive = activeProduct?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            onSelectProductToBroadcast(p.id);
                            setProductDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                            isActive
                              ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-800/60 font-semibold'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="truncate mr-2">
                            <div className="truncate text-slate-100">{p.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{p.type}</div>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Center / Right View Switcher & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Robot Hardware Status Trigger */}
          <button
            onClick={onOpenRobotSim}
            title="Physical Robot Hardware Telemetry"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-mono"
          >
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            <span>{batteryLevel}%</span>
          </button>

          {/* Speech Audio Voice Toggle */}
          <button
            onClick={onToggleSpeech}
            title={speechEnabled ? 'Robot Voice Enabled (Click to Mute)' : 'Robot Voice Muted (Click to Unmute)'}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              speechEnabled
                ? 'bg-cyan-950/60 border-cyan-700/60 text-cyan-300 hover:bg-cyan-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Admin Identity Badge if logged in */}
          {adminUser && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-cyan-300 font-mono">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Admin: {adminUser.name}</span>
            </div>
          )}

          {/* Primary View Switcher: Customer Screen vs Admin Hub */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => onViewChange('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'customer'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Robot Kiosk</span>
            </button>
            <button
              onClick={() => onViewChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'admin'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Admin Hub</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
