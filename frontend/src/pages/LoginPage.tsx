import React, { useState } from 'react';
import { Lock, Mail, User as UserIcon, Phone, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onNavigate: (page: string, param?: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onNavigate }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(fullName, email, password, phone);
      }
      // Redirect directly to the storefront homepage upon successful sign in / registration
      onNavigate('home');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center py-12 px-4 selection:bg-rose-100 selection:text-rose-900">
      {/* Top minimal brand & return navigation */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <button
          onClick={() => onNavigate('home')}
          className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 transition px-2 py-1 rounded-lg hover:bg-neutral-200/50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Back to Store</span>
        </button>
        <span className="font-serif tracking-[0.25em] font-semibold text-neutral-900 text-sm">
          AURA LUXE
        </span>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Botanical Beauty Membership</span>
          </div>
          <h1 className="font-serif text-3xl text-neutral-900 font-medium">
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </h1>
          <p className="text-xs text-neutral-500">
            {isLogin
              ? 'Sign in to access your luxury cosmetics orders and express checkout.'
              : 'Join for exclusive access to clean botanical cosmetics and member rewards.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xl space-y-6">
          {/* Mode Switcher */}
          <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-neutral-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition ${isLogin ? 'bg-[#1E1611] text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition ${!isLogin ? 'bg-[#1E1611] text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {!isLogin && (
              <>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Mobile Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@demo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-[#1E1611] text-white font-semibold text-xs hover:bg-rose-700 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : isLogin ? 'Sign In & Enter Store' : 'Complete Registration & Enter Store'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Accounts for testing */}
          <div className="pt-4 border-t border-neutral-100 space-y-2">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest text-center">
              One-Click Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin('priya@demo.com', 'demo123')}
                className="p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] hover:bg-rose-50 hover:border-rose-300 text-neutral-700 text-left transition"
              >
                <strong className="block text-neutral-900 text-xs">Customer Account</strong>
                priya@demo.com
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@daivatech.com', 'admin123')}
                className="p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] hover:bg-amber-50 hover:border-amber-300 text-neutral-700 text-left transition"
              >
                <strong className="block text-neutral-900 text-xs">Store Admin</strong>
                admin@daivatech.com
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
