import React, { useState } from 'react';
import { Bot, Lock, User, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { loginAdmin } from '../api.ts';

interface AdminLoginProps {
  onLoginSuccess: (user: { id: string; name: string; role: string }) => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await loginAdmin(username.trim(), password.trim());
      if (res && res.success) {
        // Save session in localStorage
        localStorage.setItem('robo_admin_token', res.token);
        localStorage.setItem('robo_admin_user', JSON.stringify(res.user));
        onLoginSuccess(res.user);
      } else {
        setErrorMessage('Invalid username or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20 mb-1 border border-cyan-400/30">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
            ADMIN LOGIN
          </h1>
          <p className="text-xs text-slate-400">
            Authenticate to manage products, schedules, and broadcasts.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Username</span>
            </label>
            <input
              type="text"
              id="admin-username-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              id="admin-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-mono"
            />
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={isSubmitting}
              id="admin-login-submit-button"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all uppercase tracking-wider"
            >
              {isSubmitting ? 'Verifying...' : 'LOGIN'}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Robot Kiosk</span>
            </button>
          </div>
        </form>

        {/* Demo Credentials hint */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400">
            Initial Admin Credentials: <span className="font-mono text-cyan-300 font-semibold">bot</span> / <span className="font-mono text-cyan-300 font-semibold">1234</span>
          </p>
        </div>
      </div>
    </div>
  );
};
