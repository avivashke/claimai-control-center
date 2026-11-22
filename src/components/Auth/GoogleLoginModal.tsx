import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Phone, 
  Lock, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Smartphone, 
  Headset, 
  Key, 
  Send,
  ArrowLeft,
  Check,
  User
} from 'lucide-react';
import { AppUser } from '../../types';
import {
  localLogin,
  sendAuthCodeToWhatsApp,
  requestPasswordReset,
  resetPasswordWithCode,
  ensureDefaultAdmin,
  generateAuthCode,
  sendVerificationCode,
  verifyVerificationCode
} from '../../services/authService';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLogin: (email: string, name?: string) => void;
  availableUsers: AppUser[];
}

type AuthMethod = 'google' | 'whatsapp' | 'email' | 'admin-reset';

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  availableUsers
}) => {
  if (!isOpen) return null;

  ensureDefaultAdmin();

  const [method, setMethod] = useState<AuthMethod>('google');
  const [step, setStep] = useState<'identifier' | 'code' | 'reset'>('identifier');

  // Form state
  const [identifier, setIdentifier] = useState(''); // phone or email
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const showMessage = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'info' }), 6000);
  };

  const cleanPhone = (p: string) => p.replace(/\s/g, '');
  const cleanEmail = (e: string) => e.trim().toLowerCase();

  // ===== Method selection handlers =====
  const selectMethod = (m: AuthMethod) => {
    setMethod(m);
    setStep('identifier');
    setIdentifier('');
    setCode('');
    setSentCode(null);
    setCodeSent(false);
    setNewPassword('');
    setConfirmPassword('');
    setMessage({ text: '', type: 'info' });
  };

  // ===== Google OAuth =====
  const handleGoogleLogin = (email: string, name?: string) => {
    onLogin(email, name);
  };

  // ===== WhatsApp flow =====
  const handleRequestWhatsAppCode = async () => {
    const p = cleanPhone(identifier);
    if (!p || p.length < 8) {
      showMessage('נא להזין מספר טלפון מלא (לפחות 8 ספרות)', 'error');
      return;
    }
    setLoading(true);
    const generatedCode = generateAuthCode();
    const result = await sendVerificationCode(p, generatedCode, 'login', 'whatsapp');
    setSentCode(result.code || generatedCode);
    setCodeSent(true);
    setLoading(false);
    if (result.success) {
      showMessage(result.message, 'success');
      setStep('code');
    } else {
      showMessage(result.message, 'error');
    }
  };

  const handleWhatsAppCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = cleanPhone(identifier);
    const c = code.trim();
    if (!p || !c) {
      showMessage('נא להזין טלפון וקוד אימות', 'error');
      return;
    }
    setLoading(true);
    const result = await verifyVerificationCode(p, c, 'login');
    setLoading(false);
    if (result.success) {
      // Find or create local user
      ensureDefaultAdmin();
      const localUsers = (await import('../../services/authService')).getLocalUsers();
      const user = localUsers.find((u: any) => u.phone === p);
      if (user) {
        (await import('../../services/authService')).setCurrentUser({
          id: user.id,
          email: user.phone,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLogin: new Date().toISOString()
        });
        onLogin(user.phone, user.name);
      } else {
        showMessage('משתמש לא נמצא במערכת. פנה למנהל מערכת להוספה.', 'error');
      }
    } else {
      showMessage(result.message, 'error');
    }
  };

  // ===== Email flow =====
  const handleRequestEmailCode = async () => {
    const e = cleanEmail(identifier);
    if (!e || !e.includes('@')) {
      showMessage('נא להזין כתובת אימייל תקינה', 'error');
      return;
    }
    setLoading(true);
    const generatedCode = generateAuthCode();
    const result = await sendVerificationCode(e, generatedCode, 'login', 'email');
    setSentCode(result.code || generatedCode);
    setCodeSent(true);
    setLoading(false);
    if (result.success) {
      showMessage(result.message, 'success');
      setStep('code');
    } else {
      showMessage(result.message, 'error');
    }
  };

  const handleEmailCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const eMail = cleanEmail(identifier);
    const c = code.trim();
    if (!eMail || !c) {
      showMessage('נא להזין אימייל וקוד אימות', 'error');
      return;
    }
    setLoading(true);
    const result = await verifyVerificationCode(eMail, c, 'login');
    setLoading(false);
    if (result.success) {
      // Try to find AppUser by email
      const { findUserByEmail } = await import('../../services/db');
      const { loginWithGoogleEmail } = await import('../../services/authService');
      let user = await findUserByEmail(eMail);
      if (!user) {
        user = await loginWithGoogleEmail(eMail, eMail.split('@')[0]);
      }
      onLogin(user.email, user.name);
    } else {
      showMessage(result.message, 'error');
    }
  };

  // ===== Admin Reset Code flow =====
  const handleRequestAdminReset = async () => {
    const id = cleanPhone(identifier) || cleanEmail(identifier);
    if (!id) {
      showMessage('נא להזין טלפון או אימייל', 'error');
      return;
    }
    setStep('code');
    showMessage('הזן את קוד האיפוס שקיבלת מהמנהל ואת הסיסמה החדשה', 'info');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = cleanPhone(identifier) || cleanEmail(identifier);
    const c = code.trim();
    if (newPassword !== confirmPassword || newPassword.length < 6) {
      showMessage('נא להזין סיסמה באורך 6 תווים לפחות ולזהה בשני השדות', 'error');
      return;
    }
    if (!id || !c) {
      showMessage('נא להזין מזהה וקוד איפוס', 'error');
      return;
    }
    setLoading(true);
    // Verify the admin reset code via server
    const result = await verifyVerificationCode(id, c, 'reset');
    setLoading(false);
    if (result.success) {
      // Reset password in local users (phone-based)
      ensureDefaultAdmin();
      const { getLocalUsers, saveLocalUsers, findLocalUserByPhone } = await import('../../services/authService');
      const user = findLocalUserByPhone(id);
      if (user) {
        const users = getLocalUsers().map((u: any) =>
          u.id === user.id ? { ...u, passwordHash: newPassword, updatedAt: new Date().toISOString() } : u
        );
        saveLocalUsers(users);
        showMessage('הסיסמה אופסה בהצלחה. ניתן להיכנס עם הסיסמה החדשה.', 'success');
        setStep('identifier');
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showMessage('משתמש לא נמצא במערכת המקומית.', 'error');
      }
    } else {
      showMessage(result.message, 'error');
    }
  };

  // ===== Render method selector =====
  const renderMethodSelector = () => (
    <div className="p-6 border-b border-slate-800 bg-slate-900/80">
      <h2 className="text-xl font-extrabold text-white mb-4">התחברות למערכת ClaimAI</h2>
      <p className="text-xs text-slate-400 mb-6">בחר שיטת הזדהות:</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => selectMethod('google')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all ${
            method === 'google'
              ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-blue-600/20'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-750'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-sm font-semibold">כניסה עם Google</span>
        </button>
        <button
          onClick={() => selectMethod('whatsapp')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all ${
            method === 'whatsapp'
              ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 shadow-emerald-600/20'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-750'
          }`}
        >
          <Smartphone className="w-5 h-5" />
          <span className="text-sm font-semibold">וואטסאפ (+972586735953)</span>
        </button>
        <button
          onClick={() => selectMethod('email')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all ${
            method === 'email'
              ? 'bg-amber-600/20 border-amber-500/50 text-amber-400 shadow-amber-600/20'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-750'
          }`}
        >
          <Mail className="w-5 h-5" />
          <span className="text-sm font-semibold">אימייל עם קוד אימות</span>
        </button>
        <button
          onClick={() => selectMethod('admin-reset')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all ${
            method === 'admin-reset'
              ? 'bg-purple-600/20 border-purple-500/50 text-purple-400 shadow-purple-600/20'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-750'
          }`}
        >
          <Headset className="w-5 h-5" />
          <span className="text-sm font-semibold">קוד איפוס מהמנהל</span>
        </button>
      </div>
    </div>
  );

  // ===== Google sign-in content =====
  const renderGoogleContent = () => (
    <div className="p-6 space-y-5">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white mt-3">התחברות עם חשבון Google</h3>
        <p className="text-sm text-slate-400 mt-1">התחברות ישירות דרך חשבון גוגל שלך</p>
      </div>

      {availableUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500 font-medium mb-3">או בחר משתמש מהרשימה:</p>
          <div className="space-y-1">
            {availableUsers.slice(0, 6).map((u) => (
              <button
                key={u.id}
                onClick={() => handleGoogleLogin(u.email, u.name)}
                className="w-full text-left p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-xs text-slate-300 transition-all flex items-center justify-between"
              >
                <span>{u.name}</span>
                <span className="text-[10px] font-mono text-slate-500">{u.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative flex items-center my-4">
        <div className="flex-grow border-t border-slate-800"></div>
        <span className="flex-shrink mx-4 text-slate-500 text-[10px]">או התחבר עם חשבון גוגל אחר</span>
        <div className="flex-grow border-t border-slate-800"></div>
      </div>

      <button
        onClick={() => {
          // Trigger Google OAuth - handled by parent via onLogin with Google email
          showMessage('הפעל את כפתור כניסה עם Google מה-header', 'info');
        }}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
      >
        <User className="w-4 h-4" />
        <span>התחבר עם Google</span>
      </button>
    </div>
  );

  // ===== WhatsApp content =====
  const renderWhatsAppContent = () => {
    if (step === 'identifier') {
      return (
        <div className="p-6 space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mt-3">התחברות עם וואטסאפ</h3>
            <p className="text-sm text-slate-400 mt-1">
              קוד אימות יישלח מהמספר <span className="font-mono text-emerald-400">+972586735953</span>
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-300">
              מספר טלפון / וואטסאפ
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="05XXXXXXXX"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                maxLength={15}
              />
              <button
                onClick={handleRequestWhatsAppCode}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white text-xs font-bold font-mono shadow-md shadow-emerald-600/30 transition-all"
              >
                {loading ? 'שולח…' : 'שלח קוד אימות'}
              </button>
            </div>
            {sentCode && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">קוד אימות (בדמו):</span>
                <span className="font-mono text-xl font-bold text-emerald-400 bg-emerald-900/30 px-3 py-1 rounded border border-emerald-500/30">
                  {sentCode}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => selectMethod('google')}
            className="w-full py-2 rounded-lg bg-transparent border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all font-medium"
          >
            ← בחר שיטה אחרת
          </button>
        </div>
      );
    }

    // Step: code entry
    return (
      <div className="p-6 space-y-5">
        <div className="text-center">
          <h3 className="text-lg font-bold text-white mt-3">הזן קוד אימות</h3>
          <p className="text-sm text-slate-400 mt-1">
            הקוד נשלח ל־<span className="font-mono text-slate-200">{identifier}</span>. תקף ל־10 דקות.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-300">
            קוד אימות בן 6 ספרות
          </label>
          <input
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white font-mono text-xl font-bold tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
            maxLength={6}
          />
          {sentCode && (
            <button
              onClick={() => setCode(sentCode!)}
              className="text-[9px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              השתמש בקוד שהוצג ({sentCode})
            </button>
          )}
        </div>

        <button
          onClick={handleWhatsAppCodeLogin}
          disabled={loading || code.length !== 6}
          className={`w-full py-2.5 rounded-lg text-white font-bold text-sm shadow-md transition-all ${
            loading || code.length !== 6
              ? 'bg-slate-800/50 border border-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/40 shadow-emerald-600/30'
          }`}
        >
          {loading ? 'מאמת…' : 'אמת קוד והיכנס'}
        </button>

        <button
          onClick={() => setStep('identifier')}
          className="w-full py-2 rounded-lg bg-transparent border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all font-medium"
        >
          ← חזור להזנת טלפון
        </button>
      </div>
    );
  };

  // ===== Email content =====
  const renderEmailContent = () => {
    if (step === 'identifier') {
      return (
        <div className="p-6 space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mt-3">התחברות עם אימייל</h3>
            <p className="text-sm text-slate-400 mt-1">קוד אימות יישלח לכתובת האימייל שלך</p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-300">
              כתובת אימייל
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {sentCode && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">קוד אימות (בדמו):</span>
                <span className="font-mono text-xl font-bold text-amber-400 bg-amber-900/30 px-3 py-1 rounded border border-amber-500/30">
                  {sentCode}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => selectMethod('google')}
            className="w-full py-2 rounded-lg bg-transparent border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all font-medium"
          >
            ← בחר שיטה אחרת
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-5">
        <div className="text-center">
          <h3 className="text-lg font-bold text-white mt-3">הזן קוד אימות</h3>
          <p className="text-sm text-slate-400 mt-1">
            הקוד נשלח ל־<span className="font-mono text-slate-200">{identifier}</span>. תקף ל־10 דקות.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-300">
            קוד אימות בן 6 ספרות
          </label>
          <input
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white font-mono text-xl font-bold tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
            maxLength={6}
          />
          {sentCode && (
            <button
              onClick={() => setCode(sentCode!)}
              className="text-[9px] text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              השתמש בקוד שהוצג ({sentCode})
            </button>
          )}
        </div>

        <button
          onClick={handleEmailCodeLogin}
          disabled={loading || code.length !== 6}
          className={`w-full py-2.5 rounded-lg text-white font-bold text-sm shadow-md transition-all ${
            loading || code.length !== 6
              ? 'bg-slate-800/50 border border-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-500 border border-amber-500/40 shadow-amber-600/30'
          }`}
        >
          {loading ? 'מאמת…' : 'אמת קוד והיכנס'}
        </button>

        <button
          onClick={() => setStep('identifier')}
          className="w-full py-2 rounded-lg bg-transparent border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all font-medium"
        >
          ← חזור להזנת אימייל
        </button>
      </div>
    );
  };

  // ===== Admin Reset Code content =====
  const renderAdminResetContent = () => {
    if (step === 'identifier') {
      return (
        <div className="p-6 space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
              <Headset className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mt-3">איפוס סיסמה דרך מנהל מערכת</h3>
            <p className="text-sm text-slate-400 mt-1">
              קבל קוד איפוס מהמנהל במערכת והזן כאן יחד עם סיסמה חדשה
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-300">
              טלפון או אימייל הרשום במערכת
            </label>
            <input
              type="text"
              placeholder="05XXXXXXXX או email@domain.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={handleRequestAdminReset}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all"
          >
            {loading ? 'מעבד…' : 'הזן קוד איפוס מהמנהל'}
          </button>

          <button
            onClick={() => selectMethod('google')}
            className="w-full py-2 rounded-lg bg-transparent border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all font-medium"
          >
            ← בחר שיטה אחרת
          </button>
        </div>
      );
    }

    if (step === 'code') {
      return (
        <div className="p-6 space-y-5">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mt-3">איפוס סיסמה</h3>
          <p className="text-sm text-slate-400 mt-1">
            הזן את קוד האיפוס שקיבלת מהמנהל ואת הסיסמה החדשה
          </p>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-300">
              קוד איפוס שקיבלת מהמנהל
            </label>
            <input
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white font-mono text-xl font-bold tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
              maxLength={6}
            />
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-300">
              סיסמה חדשה
            </label>
            <input
              type="password"
              placeholder="סיסמה חדשה (מינימום 6 תווים)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <label className="block text-xs font-medium text-slate-300 mt-2">
              אימות סיסמה חדשה
            </label>
            <input
              type="password"
              placeholder="חזור על הסיסמה החדשה"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={handleResetPassword}
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-white font-bold text-sm shadow-md transition-all ${
              loading
                ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 border border-purple-500/40 shadow-purple-600/30'
            }`}
          >
            {loading ? 'מאפס סיסמה…' : 'אפס סיסמה'}
          </button>

          <button
            onClick={() => setStep('identifier')}
            className="w-full py-2 rounded-lg bg-transparent border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all font-medium"
          >
            ← חזור
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        )}

        {method === 'google' ? renderMethodSelector() : null}

        <div className="p-6 flex-1 overflow-y-auto">
          {method === 'google' ? renderGoogleContent() : null}
          {method === 'whatsapp' ? renderWhatsAppContent() : null}
          {method === 'email' ? renderEmailContent() : null}
          {method === 'admin-reset' ? renderAdminResetContent() : null}
        </div>

        {message.text && (
          <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : message.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Phone className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
