import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  X
} from 'lucide-react';
import { AppUser } from '../../types';
import { 
  loginWithPassword, 
  resetPasswordWithAdminCode,
  DEFAULT_FALLBACK_PASSWORD
} from '../../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLogin: (email: string, name?: string) => void;
  availableUsers: AppUser[];
}

export const GoogleLoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  availableUsers
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Reset code fields
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('נא להזין אימייל וסיסמה');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithPassword(email.trim(), password);
      if (result.success && result.user) {
        onLogin(result.user.email, result.user.name);
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'שגיאה בהתחברות למערכת');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !resetCode.trim() || !newPassword) {
      setErrorMessage('נא למלא את כל השדות');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('הסיסמה חייבת לכלול לפחות 6 תווים');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('הסיסמאות אינן תואמות');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPasswordWithAdminCode(email.trim(), resetCode.trim(), newPassword);
      if (result.success) {
        setSuccessMessage(result.message);
        if (result.user) {
          setTimeout(() => {
            onLogin(result.user!.email, result.user!.name);
          }, 1200);
        } else {
          setMode('login');
          setPassword(newPassword);
        }
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'שגיאה באיפוס הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in-50 duration-150" dir="rtl">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Top Header Banner */}
        <div className="relative p-6 bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border-b border-slate-800 text-center space-y-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="סגור חלון"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 border border-blue-400/30">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Claim<span className="text-blue-400">AI</span> Control Center
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login' 
              ? 'הזן אימייל וסיסמה כדי להיכנס למערכת' 
              : 'הגדרת סיסמה עם קוד איפוס שקיבלת ממנהל המערכת'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            כניסה עם סיסמה
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('reset');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'reset'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            קוד איפוס מהאדמין
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="m-4 mb-0 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="m-4 mb-0 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MODE 1: Login with Email & Password */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                כתובת אימייל
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@claimai.co.il"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  סיסמה
                </label>
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  הגדרת סיסמה עם קוד?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="הזן את סיסמתך..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>בודק נתונים...</span>
                </>
              ) : (
                <span>התחבר למערכת</span>
              )}
            </button>

          </form>
        )}

        {/* MODE 2: Set Password with Admin Code */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
            
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200">
              <p className="leading-relaxed">
                מנהל המערכת יכול להפיק עבורך קוד איפוס סיסמה חד-פעמי (6 ספרות) מתוך פורטל אדמין. הזן את פרטיך כאן כדי לקבוע את סיסמתך החדשה.
              </p>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                כתובת אימייל שלך
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@claimai.co.il"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Admin Reset Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                קוד איפוס מהאדמין (6 ספרות)
              </label>
              <div className="relative">
                <Key className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="למשל: 492810"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono tracking-widest text-center text-sm font-bold"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                סיסמה חדשה (לפחות 6 תווים)
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="הזן סיסמה חדשה..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                אימות סיסמה חדשה
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="הזן שוב את הסיסמה..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
            </div>

            {/* Submit Reset Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>מאמת ומעדכן סיסמה...</span>
                </>
              ) : (
                <span>קבע סיסמה והתחבר למערכת</span>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                ← חזרה להתחברות רגילה עם סיסמה
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
