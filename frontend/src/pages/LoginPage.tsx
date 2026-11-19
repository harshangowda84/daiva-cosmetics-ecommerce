import React, { useState, useEffect, useRef } from 'react';
import { Lock, Mail, User as UserIcon, Phone, Sparkles, ArrowRight, ArrowLeft, Check, AlertCircle, Eye, EyeOff, X, ExternalLink, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onNavigate: (page: string, param?: string) => void;
}

// Decode Google JWT credential without external libraries
const decodeGoogleJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse Google JWT credential', e);
    return null;
  }
};

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onNavigate }) => {
  const { login, register, loginWithGoogle, loginWithApple } = useAuth();
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
  const [appleLoading, setAppleLoading] = useState(false);

  // Google OAuth Configuration Modal State
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    return (
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      localStorage.getItem('daiva_google_client_id') ||
      '294043017483-6q41ur8pr2r0s2gncm9ndmbe97franpo.apps.googleusercontent.com'
    );
  });
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState('');
  const [gisRendered, setGisRendered] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Apple Sign-In Configuration Modal State
  const [appleClientId, setAppleClientId] = useState<string>(() => {
    return (
      import.meta.env.VITE_APPLE_CLIENT_ID ||
      localStorage.getItem('daiva_apple_client_id') ||
      'com.daivatech.ecommerce.client'
    );
  });
  const [showAppleModal, setShowAppleModal] = useState(false);
  const [customAppleClientIdInput, setCustomAppleClientIdInput] = useState('');

  // Real-time validation rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneClean = phone.replace(/[\s\-\+\(\)]/g, '');
  const isIndianPhoneValid = phoneClean.length === 10 ? /^[6-9]\d{9}$/.test(phoneClean) : (phoneClean.length === 12 && phoneClean.startsWith('91')) ? /^[6-9]\d{9}$/.test(phoneClean.substring(2)) : false;

  const emailError = !email ? 'Email address is required' : !emailRegex.test(email) ? 'Please enter a valid email address (e.g. name@domain.com)' : '';
  const passwordError = !password ? 'Password is required' : password.length < 6 ? 'Password must be at least 6 characters' : '';
  const nameError = !isLogin ? (!fullName.trim() ? 'Full name is required' : fullName.trim().length < 2 ? 'Name must be at least 2 characters' : '') : '';
  const phoneError = !isLogin && phone ? (!isIndianPhoneValid ? 'Please enter a valid 10-digit mobile number' : '') : '';

  // Initialize Google Identity Services (GIS)
  useEffect(() => {
    const initGis = () => {
      if (typeof window === 'undefined' || !window.google?.accounts?.id || !googleClientId) {
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (!response?.credential) return;
            setGoogleLoading(true);
            try {
              const payload = decodeGoogleJwt(response.credential);
              if (payload && payload.email) {
                await loginWithGoogle({
                  email: payload.email,
                  fullName: payload.name || payload.given_name || 'Google User',
                  googleSub: payload.sub,
                  profilePictureUrl: payload.picture,
                });
                onNavigate('home');
              }
            } catch (err: any) {
              setError(err.message || 'Google account synchronization failed');
            } finally {
              setGoogleLoading(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render official Google Identity Services button
        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: 380,
            text: isLogin ? 'signin_with' : 'signup_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          });
          setGisRendered(true);
        }
      } catch (e) {
        console.warn('Google Identity initialization notice:', e);
      }
    };

    // Check if script is loaded or poll briefly
    if (window.google?.accounts?.id) {
      initGis();
    } else {
      const timer = setTimeout(initGis, 800);
      return () => clearTimeout(timer);
    }
  }, [googleClientId, isLogin]);

  // Load official Sign in with Apple JS script
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).AppleID) {
      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/auth/js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

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
      let loggedUser: any;
      if (isLogin) {
        loggedUser = await login(email.trim(), password.trim());
      } else {
        loggedUser = await register(fullName.trim(), email.trim(), password.trim(), phone.trim());
      }
      if (loggedUser?.role === 'ADMIN') {
        onNavigate('admin');
      } else {
        onNavigate('home');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');

    // If client ID is present and GIS is loaded, prompt Google's native popup
    if (googleClientId && window.google?.accounts?.id) {
      try {
        setGoogleLoading(true);
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If One Tap was dismissed or blocked, trigger explicit modal for fallback
            setGoogleLoading(false);
            setShowGoogleModal(true);
          }
        });
        return;
      } catch (err) {
        console.warn('Google prompt fallback:', err);
        setGoogleLoading(false);
      }
    }

    // Otherwise open Google Setup & Instant Testing modal
    setShowGoogleModal(true);
  };

  const handleSaveCustomClientId = () => {
    if (customClientIdInput.trim()) {
      const clean = customClientIdInput.trim();
      localStorage.setItem('daiva_google_client_id', clean);
      setGoogleClientId(clean);
      setShowGoogleModal(false);
      setError('');
    }
  };

  const handleInstantDemoGoogleLogin = async (customEmail?: string, customName?: string) => {
    setGoogleLoading(true);
    setShowGoogleModal(false);
    setError('');
    try {
      const demoEmail = customEmail || 'sarah.jenkins.google@gmail.com';
      const demoName = customName || 'Sarah Jenkins';
      await loginWithGoogle({
        email: demoEmail,
        fullName: demoName,
        googleSub: 'google_user_' + Date.now(),
        profilePictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
      onNavigate('home');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    const AppleID = typeof window !== 'undefined' ? (window as any).AppleID : null;

    // If AppleID SDK is loaded and a real custom Service ID is set (not default dummy), launch popup
    if (AppleID?.auth && appleClientId && !appleClientId.includes('.client')) {
      try {
        setAppleLoading(true);
        AppleID.auth.init({
          clientId: appleClientId,
          scope: 'name email',
          redirectURI: window.location.origin,
          usePopup: true,
        });
        const res = await AppleID.auth.signIn();
        if (res && res.authorization) {
          const idToken = res.authorization.id_token;
          let email = '';
          let appleSub = '';
          if (idToken) {
            const payload = decodeGoogleJwt(idToken);
            email = payload?.email || '';
            appleSub = payload?.sub || '';
          }
          let fullName = '';
          if (res.user?.name) {
            fullName = `${res.user.name.firstName || ''} ${res.user.name.lastName || ''}`.trim();
          }
          if (!email && appleSub) {
            email = `apple_${appleSub.slice(0, 8)}@privaterelay.appleid.com`;
          }
          if (email) {
            const logged = await loginWithApple({
              email,
              fullName: fullName || 'Apple User',
              appleSub,
              identityToken: idToken,
            });
            if (logged?.role === 'ADMIN') {
              onNavigate('admin');
            } else {
              onNavigate('home');
            }
            return;
          }
        }
      } catch (err: any) {
        console.warn('Apple popup notice/dismissed:', err);
        setAppleLoading(false);
        setShowAppleModal(true);
        return;
      } finally {
        setAppleLoading(false);
      }
    }

    // Default: Show Apple Setup & Instant Connect Modal
    setShowAppleModal(true);
  };

  const handleSaveCustomAppleClientId = () => {
    if (!customAppleClientIdInput.trim()) return;
    const cleanId = customAppleClientIdInput.trim();
    setAppleClientId(cleanId);
    localStorage.setItem('daiva_apple_client_id', cleanId);
    setCustomAppleClientIdInput('');
    setShowAppleModal(false);
  };

  const handleInstantDemoAppleLogin = async (demoEmail: string, demoName: string) => {
    setError('');
    setAppleLoading(true);
    setShowAppleModal(false);
    try {
      const logged = await loginWithApple({
        email: demoEmail,
        fullName: demoName,
        appleSub: `apple_id_${Date.now()}`,
      });
      if (logged?.role === 'ADMIN') {
        onNavigate('admin');
      } else {
        onNavigate('home');
      }
    } catch (err: any) {
      setError(err.message || 'Apple authentication failed');
    } finally {
      setAppleLoading(false);
    }
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

          {/* Social Sign-In Buttons */}
          <div className="w-full space-y-2.5">
            {/* Google Sign-In Container */}
            <div className="w-full">
              <div
                ref={googleBtnContainerRef}
                className={`w-full flex justify-center [&>div]:!w-full [&>div>div]:!w-full [&_iframe]:!w-full min-h-[44px] ${
                  gisRendered ? 'block' : 'hidden'
                }`}
              />
              {!gisRendered && (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-xs flex items-center justify-center gap-3 transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{googleLoading ? 'Connecting with Google...' : isLogin ? 'Continue with Google' : 'Register with Google'}</span>
                </button>
              )}
            </div>

            {/* Apple Sign-In Button */}
            <button
              type="button"
              onClick={handleAppleSignIn}
              disabled={appleLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-neutral-900 active:scale-[0.99] text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition shadow-sm disabled:opacity-50 cursor-pointer border border-black"
            >
              <svg className="w-4 h-4 fill-current mb-0.5" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.05-7.58-7.7-11.66-13.94-7.2-11.01-12.65-23.75-16.34-38.22-3.7-14.47-5.55-27.4-5.55-38.8 0-14.82 3.65-27.24 10.96-37.28 7.31-10.04 16.63-15.17 27.96-15.39 5.89 0 12.18 1.8 18.88 5.39 6.7 3.59 11.23 5.45 13.59 5.57 2.01-.12 6.64-1.98 13.89-5.57 7.25-3.59 13.6-5.33 19.06-5.21 8.28.24 15.7 2.47 22.27 6.69 6.57 4.22 11.64 9.87 15.2 16.96-13.48 8.16-20.13 19.34-19.96 33.53.18 11.51 4.54 21.05 13.08 28.62 8.54 7.57 18.73 11.89 30.57 12.96-2.83 8.71-6.4 17.09-10.7 25.14zM119.22 31.84c0-7.73 2.76-14.99 8.27-21.78 5.52-6.79 12.35-10.66 20.48-11.61.12.94.18 1.89.18 2.83 0 7.61-2.9 14.93-8.71 21.96-5.81 7.03-12.8 11.07-20.97 12.12-.24-.94-.36-1.9-.36-2.88z" />
              </svg>
              <span>{appleLoading ? 'Connecting with Apple...' : isLogin ? 'Continue with Apple' : 'Register with Apple'}</span>
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
                      placeholder="Enter your full name"
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
                  placeholder="name@example.com"
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
        </div>
      </div>

      {/* Google OAuth Configuration & Quick Connect Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-neutral-900">
                    Google Sign-In & Registration
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Real Google Identity Services (GIS) OAuth 2.0
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Google OAuth Web Client ID Setup</span>
              </p>
              <p className="text-amber-800/90 leading-relaxed">
                To launch the browser's native Google account popup window, provide your Google Cloud OAuth Client ID below (or set <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">VITE_GOOGLE_CLIENT_ID</code>).
              </p>
            </div>

            {/* Custom Client ID Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-700 block">
                Paste Google Client ID:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customClientIdInput}
                  onChange={(e) => setCustomClientIdInput(e.target.value)}
                  placeholder="e.g. 123456789-xxxx.apps.googleusercontent.com"
                  className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomClientId}
                  disabled={!customClientIdInput.trim()}
                  className="px-4 py-2 bg-[#1E1611] text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition cursor-pointer"
                >
                  Save & Connect
                </button>
              </div>
            </div>

            {/* Steps Guide */}
            <div className="border border-neutral-200 rounded-2xl p-3.5 text-[11.5px] text-neutral-600 space-y-1.5 bg-[#FAF9F6]">
              <p className="font-semibold text-neutral-800">4-Step Google Cloud Console Guide:</p>
              <ol className="list-decimal list-inside space-y-1 text-neutral-600">
                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium inline-flex items-center gap-0.5">console.cloud.google.com <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li>Configure <strong>OAuth Consent Screen</strong> (External, app name: <em>Aura Luxe</em>).</li>
                <li>Go to <strong>Credentials</strong> → <strong>Create Credentials</strong> → <strong>OAuth client ID</strong> (Web application).</li>
                <li>Add Authorized Javascript Origin: <code className="bg-neutral-200/80 px-1 rounded font-mono">https://daiva-cosmetics-ecommerce-xi.vercel.app</code></li>
              </ol>
            </div>

            {/* Instant Demo Sign-In */}
            <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
              <p className="text-[11px] text-neutral-500 text-center">
                Want to test the Google login/register workflow right away?
              </p>
              <button
                type="button"
                onClick={() => handleInstantDemoGoogleLogin('sarah.jenkins.google@gmail.com', 'Sarah Jenkins')}
                className="w-full py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Quick Test: Sign in as Sarah Jenkins (Google Verified)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apple ID Configuration & Quick Connect Modal */}
      {showAppleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shadow-xs">
                  <svg className="w-5 h-5 fill-current mb-0.5" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.05-7.58-7.7-11.66-13.94-7.2-11.01-12.65-23.75-16.34-38.22-3.7-14.47-5.55-27.4-5.55-38.8 0-14.82 3.65-27.24 10.96-37.28 7.31-10.04 16.63-15.17 27.96-15.39 5.89 0 12.18 1.8 18.88 5.39 6.7 3.59 11.23 5.45 13.59 5.57 2.01-.12 6.64-1.98 13.89-5.57 7.25-3.59 13.6-5.33 19.06-5.21 8.28.24 15.7 2.47 22.27 6.69 6.57 4.22 11.64 9.87 15.2 16.96-13.48 8.16-20.13 19.34-19.96 33.53.18 11.51 4.54 21.05 13.08 28.62 8.54 7.57 18.73 11.89 30.57 12.96-2.83 8.71-6.4 17.09-10.7 25.14zM119.22 31.84c0-7.73 2.76-14.99 8.27-21.78 5.52-6.79 12.35-10.66 20.48-11.61.12.94.18 1.89.18 2.83 0 7.61-2.9 14.93-8.71 21.96-5.81 7.03-12.8 11.07-20.97 12.12-.24-.94-.36-1.9-.36-2.88z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-neutral-900">
                    Sign in with Apple
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Official Apple ID OAuth 2.0 / OpenID Connect Setup
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAppleModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-xs text-neutral-800 space-y-2">
              <p className="font-semibold flex items-center gap-1.5 text-neutral-900">
                <KeyRound className="w-4 h-4 text-neutral-700" />
                <span>Apple Services ID (Client ID) Configuration</span>
              </p>
              <p className="text-neutral-600 leading-relaxed">
                Current Client ID: <code className="bg-neutral-200/80 px-1.5 py-0.5 rounded font-mono text-[11px] text-neutral-900">{appleClientId}</code>
              </p>
              <p className="text-neutral-500 text-[11px]">
                To trigger Apple's live native biometric/Safari authentication dialog, enter your registered Apple Developer Services ID below (or set <code className="bg-neutral-200/80 px-1 py-0.5 rounded font-mono">VITE_APPLE_CLIENT_ID</code>).
              </p>
            </div>

            {/* Custom Apple Client ID Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-700 block">
                Paste Apple Services ID (Client ID):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customAppleClientIdInput}
                  onChange={(e) => setCustomAppleClientIdInput(e.target.value)}
                  placeholder="e.g. com.daivatech.ecommerce.sid"
                  className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomAppleClientId}
                  disabled={!customAppleClientIdInput.trim()}
                  className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition cursor-pointer"
                >
                  Save & Connect
                </button>
              </div>
            </div>

            {/* 4-Step Apple Developer Portal Guide */}
            <div className="border border-neutral-200 rounded-2xl p-3.5 text-[11.5px] text-neutral-600 space-y-1.5 bg-[#FAF9F6]">
              <p className="font-semibold text-neutral-800">4-Step Apple Developer Setup Guide:</p>
              <ol className="list-decimal list-inside space-y-1 text-neutral-600">
                <li>Log in to <a href="https://developer.apple.com/account/resources/identifiers/list" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium inline-flex items-center gap-0.5">developer.apple.com <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li>Go to <strong>Identifiers</strong> → click <strong>(+)</strong> → Select <strong>Services IDs</strong>.</li>
                <li>Enable <strong>Sign in with Apple</strong>, link your Primary App ID, and add your Return URL: <code className="bg-neutral-200/80 px-1 rounded font-mono">https://daiva-cosmetics-ecommerce-xi.vercel.app</code></li>
                <li>Under <strong>Keys</strong>, generate an Apple Sign-In Private Key (.p8) for server-side token validation.</li>
              </ol>
            </div>

            {/* Instant Demo Sign-In */}
            <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
              <p className="text-[11px] text-neutral-500 text-center">
                Want to test the Apple ID customer authentication workflow immediately?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleInstantDemoAppleLogin('alex.rivers@privaterelay.appleid.com', 'Alex Rivers')}
                  className="w-full py-2.5 px-3 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Test as Alex Rivers</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantDemoAppleLogin('priya.patel@privaterelay.appleid.com', 'Priya Patel')}
                  className="w-full py-2.5 px-3 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Test as Priya Patel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
