import React, { useState } from 'react';
import { Lock, Mail, User as UserIcon, Phone, Sparkles, ArrowRight, ArrowLeft, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onNavigate: (page: string, param?: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onNavigate }) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Field validation touched states
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Real-time validation rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneClean = phone.replace(/[\s\-\+\(\)]/g, '');
  const isIndianPhoneValid = phoneClean.length === 10 ? /^[6-9]\d{9}$/.test(phoneClean) : (phoneClean.length === 12 && phoneClean.startsWith('91')) ? /^[6-9]\d{9}$/.test(phoneClean.substring(2)) : false;

  const emailError = !email ? 'Email address is required' : !emailRegex.test(email) ? 'Please enter a valid email address (e.g. name@domain.com)' : '';
  const passwordError = !password ? 'Password is required' : password.length < 6 ? 'Password must be at least 6 characters' : '';
  const nameError = !isLogin ? (!fullName.trim() ? 'Full name is required' : fullName.trim().length < 2 ? 'Name must be at least 2 characters' : '') : '';
  const phoneError = !isLogin && phone ? (!isIndianPhoneValid ? 'Please enter a valid 10-digit mobile number' : '') : '';

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pwd)) score += 25;
    return score;
  };
  const passwordStrength = getPasswordStrength(password);

  const isFormValid = isLogin
    ? !emailError && !passwordError
    : !emailError && !passwordError && !nameError && !phoneError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, fullName: true, phone: true });

    if (!isFormValid) {
      setError('Please resolve the highlighted validation errors.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(fullName.trim(), email.trim(), password, phone.trim());
      }
      onNavigate('home');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      // Simulate real Google Identity popup flow with demo user account
      const googleDemoUser = {
        email: 'user.google@gmail.com',
        fullName: 'Aura Luxe Google Member',
        googleSub: 'google_sub_' + Date.now(),
        profilePictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
      await loginWithGoogle(googleDemoUser);
      onNavigate('home');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
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
              ? 'Sign in to access your luxury cosmetics orders, tracking, and instant returns.'
              : 'Join for clean botanical cosmetics, 1-click orders, and member rewards.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xl space-y-6">
          {/* Mode Switcher */}
          <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-neutral-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); setTouched({}); }}
              className={`flex-1 py-2.5 rounded-xl transition ${isLogin ? 'bg-[#1E1611] text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); setTouched({}); }}
              className={`flex-1 py-2.5 rounded-xl transition ${!isLogin ? 'bg-[#1E1611] text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              Register
            </button>
          </div>

          {/* Google Sign-In Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-xs flex items-center justify-center gap-3 transition shadow-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{googleLoading ? 'Connecting with Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-neutral-200 w-full" />
            <span className="bg-white px-3 text-[10px] text-neutral-400 uppercase tracking-widest font-semibold absolute">
              or continue with email
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>
            {!isLogin && (
              <>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onBlur={() => setTouched((p) => ({ ...p, fullName: true }))}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#FAF9F6] focus:outline-none transition ${
                        touched.fullName && nameError
                          ? 'border-red-400 focus:ring-1 focus:ring-red-400 bg-red-50/20'
                          : 'border-neutral-200 focus:ring-1 focus:ring-rose-500'
                      }`}
                    />
                    <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  </div>
                  {touched.fullName && nameError && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{nameError}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Mobile Number <span className="text-neutral-400 font-normal">(10-digit for courier SMS)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={14}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#FAF9F6] focus:outline-none transition ${
                        touched.phone && phoneError
                          ? 'border-red-400 focus:ring-1 focus:ring-red-400 bg-red-50/20'
                          : 'border-neutral-200 focus:ring-1 focus:ring-rose-500'
                      }`}
                    />
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  </div>
                  {touched.phone && phoneError && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{phoneError}</span>
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@demo.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-[#FAF9F6] focus:outline-none transition ${
                    touched.email && emailError
                      ? 'border-red-400 focus:ring-1 focus:ring-red-400 bg-red-50/20'
                      : 'border-neutral-200 focus:ring-1 focus:ring-rose-500'
                  }`}
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              </div>
              {touched.email && emailError && (
                <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-neutral-700">
                  Password <span className="text-red-500">*</span>
                </label>
                {!isLogin && password && (
                  <span className={`text-[10px] font-bold ${
                    passwordStrength < 50 ? 'text-amber-600' : passwordStrength < 75 ? 'text-blue-600' : 'text-emerald-600'
                  }`}>
                    {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Medium' : 'Strong'}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-[#FAF9F6] focus:outline-none transition ${
                    touched.password && passwordError
                      ? 'border-red-400 focus:ring-1 focus:ring-red-400 bg-red-50/20'
                      : 'border-neutral-200 focus:ring-1 focus:ring-rose-500'
                  }`}
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar for register */}
              {!isLogin && password && (
                <div className="w-full bg-neutral-100 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength < 50 ? 'bg-amber-500 w-1/3' : passwordStrength < 75 ? 'bg-blue-500 w-2/3' : 'bg-emerald-500 w-full'
                    }`}
                  />
                </div>
              )}

              {touched.password && passwordError && (
                <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-[#1E1611] text-white font-semibold text-xs hover:bg-rose-700 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
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
                className="p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] hover:bg-rose-50 hover:border-rose-300 text-neutral-700 text-left transition cursor-pointer"
              >
                <strong className="block text-neutral-900 text-xs">Customer Account</strong>
                priya@demo.com
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@daivatech.com', 'admin123')}
                className="p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] hover:bg-amber-50 hover:border-amber-300 text-neutral-700 text-left transition cursor-pointer"
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
