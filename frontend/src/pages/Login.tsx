import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Wrench } from 'lucide-react';
import { UserRole } from '../types';

interface LoginProps {
  onNavigate: (view: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onNavigate('home');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(role);
      onNavigate('home');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
        
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 items-center justify-center text-blue-400 mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Welcome Back</h2>
          <p className="text-sm text-slate-400">Access FixMyRoad AI infrastructure platform</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@fixmyroad.org"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-400">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Logins */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-400 text-center uppercase tracking-wider">
            Quick 1-Click Demo Profiles
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemo('CITIZEN')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-center space-y-1 transition-all group"
            >
              <UserCheck className="w-4 h-4 text-blue-400 mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-[11px] font-bold text-white">Citizen</div>
              <div className="text-[9px] text-slate-500">Public User</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemo('OFFICER')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-center space-y-1 transition-all group"
            >
              <Wrench className="w-4 h-4 text-amber-400 mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-[11px] font-bold text-white">Officer</div>
              <div className="text-[9px] text-slate-500">Technician</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemo('ADMIN')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-center space-y-1 transition-all group"
            >
              <ShieldCheck className="w-4 h-4 text-rose-400 mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-[11px] font-bold text-white">Admin</div>
              <div className="text-[9px] text-slate-500">Dispatch</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pt-2">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-blue-400 hover:underline font-semibold"
          >
            Create account
          </button>
        </div>

      </div>
    </div>
  );
};

