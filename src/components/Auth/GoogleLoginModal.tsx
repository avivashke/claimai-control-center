import React, { useState } from 'react';
import { ShieldCheck, Phone, Lock, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppUser } from '../../types';
import {
  localLogin,
  sendAuthCodeToWhatsApp,
  requestPasswordReset,
  resetPasswordWithCode,
  ensureDefaultAdmin
} from '../../services/authService';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLogin: (email: string, name?: string) => void;
  availableUsers: AppUser[];
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  availableUsers
}) => {
  if (!isOpen) return null;

  ensureDefaultAdmin();

  const [step, setStep] = useState<'phone' | 'code' | 'reset'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [resetSentCode, setResetSentCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: 'info' as 'info' | 'success' | 'error' });
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const showMessage = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: 'info' }), 5000);
  };

  const cleanPhone = (p: string) => p.replace(/\s/g, '');

  const handleRequestCode = () => {
    const p = cleanPhone(phone);
    if (!p || p.length < 8) {
      showMessage('נא להזין מספר טלפון מלא (לפחות 8 ספרות)', 'error');
      return;
    }
    setLoading(true);
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const result = sendAuthCodeToWhatsApp(p, generatedCode, 'login');
    setSentCode(generatedCode);
    setCodeSent(true);
    setLoading(false);
    if (result.success) {
      showMessage(result.message + ` קוד להצגה בדמו: ${generatedCode}`, 'success');
    } else {
      showMessage(result.message, 'error');
    }
  };

  const handleCodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const p = cleanPhone(phone);
    const c = code.trim();
    if (!p || !c) {
      showMessage('נא להזין טלפון וקוד אימות', 'error');
      return;
    }
    setLoading(true);
    const result = localLogin(p, c);
    setLoading(false);
    if (result.success) {
      onLogin(result.user!.phone, result.user!.name);
    } else {
      showMessage(result.message, 'error');
    }
  };

  const handleRequestReset = () => {
    const p = cleanPhone(phone);
    if (!p || p.length < 8) {
      showMessage('נא להזין מספר טלפון מלא', 'error');
      return;
    }
    setLoading(true);
    const result = requestPasswordReset(p);
    if (result.code) setResetSentCode(result.code);
    setLoading(false);
    showMessage(result.message + (result.code ? ` קוד להצגה בדמו: ${result.code}` : ''), result.success ? 'success' : 'error');
    if (result.success) setStep('reset');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const p = cleanPhone(phone);
    const c = code.trim();
    if (newPassword !== confirmPassword || newPassword.length < 6) {
      showMessage('נא להזין סיסמה באורך 6 תווים לפחות ולזהה בשני השדות', 'error');
      return;
    }
    setLoading(true);
    const result = resetPasswordWithCode(p, c, newPassword);
    setLoading(false);
    showMessage(result.message, result.success ? 'success' : 'error');
    if (result.success) {
      setStep('phone');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 text-center space-y-2 border-b border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-900 relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <Lock className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-xl font-extrabold text-white">
            התחברות מאובטחת למערכת ClaimAI
          </h2>
          <p className="text-xs text-slate-400">
            הזדהות באמצעות קוד אימות שנשלח לוואטסאפ
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {message.text && (
            <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : message.type === 'error'
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                : 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Phone className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* STEP 1: Phone + Request Code */}
          {step === 'phone' && (
            <>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  מספר טלפון / וואטסאפ
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="05XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    maxLength={15}
                  />
                  <button
                    onClick={handleRequestCode}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-xs font-bold font-mono shadow-md shadow-blue-600/30 transition-all"
                  >
                    {loading ? 'שולח…' : 'שלח קוד אימות'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                 {codeSent ? 'הקוד הופק ונשלח. הקוד להצגה בדמו:' : 'קוד בן 6 ספרות יישלח לוואטסאפ שלך לכניסה למערכת.'}
                </p>
                {sentCode && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">קוד אימות:</span>
                    <span className="font-mono text-xl font-bold text-blue-400 bg-blue-900/30 px-3 py-1 rounded border border-blue-500/30">
                      {sentCode}
                    </span>
                    <button
                      onClick={() => setCode(sentCode)}
                      className="text-[9px] text-blue-400 hover:text-blue-300 underline underline-offset-2"
                    >
                      העתק קוד
                    </button>
                  </div>
                )}
              </div>

              <div className="relative flex py-1 items-center mt-2">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-500 text-[10px]">שכחת סיסמה?</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                onClick={handleRequestReset}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-medium transition-all"
              >
                איפוס סיסמה באמצעות קוד אימות
              </button>

              {/* Quick team users (for development/testing) */}
              {availableUsers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-slate-500 mb-2">או בחר משתמש בדיקה:</p>
                  <div className="space-y-1">
                    {availableUsers.slice(0, 4).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setPhone(u.email);
                          setStep('code');
                          setCodeSent(true);
                          showMessage(`הזן קוד אימות עבור ${u.name}`, 'info');
                        }}
                        className="w-full text-left p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-xs text-slate-300 transition-all"
                      >
                        {u.name} — {u.email}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 2: Code entry */}
          {step === 'code' && (
            <>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  קוד אימות בן 6 ספרות
                </label>
                <p className="text-[10px] text-slate-500 mb-2">
                  הקוד נשלח ל־<span className="font-mono text-slate-200">{phone}</span>. הקוד תקף ל־10 דקות.
                </p>
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white font-mono text-xl font-bold tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-blue-500 letter-spacing-widest"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleCodeLogin}
                disabled={loading || code.length !== 6}
                className={`w-full py-2.5 rounded-lg text-white font-bold text-sm shadow-md transition-all ${
                  loading || code.length !== 6
                    ? 'bg-slate-800/50 border border-slate-700/50 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 border border-blue-500/40 shadow-blue-600/30'
                }`}
              >
                {loading ? 'מתחבר…' : 'היכנס למערכת'}
              </button>

              <button
                onClick={() => setStep('phone')}
                className="w-full py-2 rounded-lg bg-transparent border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all font-medium"
              >
                ← חזור להזנת טלפון
              </button>
            </>
          )}

          {/* STEP 3: Password reset */}
          {step === 'reset' && (
            <>
              <div className="space-y-3">
                <p className="text-[10px] text-slate-500 mb-2">
                  קוד איפוס נשלח ל־<span className="font-mono text-slate-200">{phone}</span>. הקוד תקף ל־10 דקות.
                </p>
                {resetSentCode && (
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">קוד איפוס:</span>
                    <span className="font-mono text-xl font-bold text-emerald-400 bg-emerald-900/30 px-3 py-1 rounded border border-emerald-500/30">
                      {resetSentCode}
                    </span>
                    <button
                      onClick={() => setCode(resetSentCode)}
                      className="text-[9px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                    >
                      השתמש בקוד זה
                    </button>
                  </div>
                )}
                <label className="block text-xs font-medium text-slate-300">
                  סיסמה חדשה
                </label>
                <input
                  type="password"
                  placeholder="סיסמה חדשה (מינימום 6 תווים)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <label className="block text-xs font-medium text-slate-300 mt-2">
                  אימות סיסמה חדשה
                </label>
                <input
                  type="password"
                  placeholder="חזור על הסיסמה החדשה"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleResetPassword}
                disabled={loading}
                className={`w-full py-2.5 rounded-lg text-white font-bold text-sm shadow-md transition-all ${
                  loading
                    ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/40 shadow-emerald-600/30'
                }`}
              >
                {loading ? 'מאפס סיסמה…' : 'אפס סיסמה והיכנס'}
              </button>

              <button
                onClick={() => setStep('phone')}
                className="w-full py-2 rounded-lg bg-transparent border border-slate-700 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all font-medium"
              >
                ← חזר למסך הכניסה
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
