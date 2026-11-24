import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Key,
  Check,
  X,
  Trash2,
  Edit3,
  Lock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Copy,
  Info
} from 'lucide-react';
import { AppUser, UserRole, UserPermissions } from '../../types';
import {
  generateAdminResetCode,
  setUserPassword,
  getStoredPasswords,
  DEFAULT_FALLBACK_PASSWORD
} from '../../services/authService';

interface AdminPortalProps {
  users: AppUser[];
  currentUser: AppUser;
  onSaveUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser?: (user: AppUser) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Password setting modal
  const [passwordModalUser, setPasswordModalUser] = useState<AppUser | null>(null);
  const [directPassword, setDirectPassword] = useState('');

  // Generated reset code popup
  const [generatedCode, setGeneratedCode] = useState<{ email: string; name: string; code: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form state for user creation / edit
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [initialPassword, setInitialPassword] = useState('');
  const [role, setRole] = useState<UserRole>('editor');
  const [permissions, setPermissions] = useState<UserPermissions>({
    canEditCrm: true,
    canEditProduct: true,
    canEditTables: true,
    canManageUsers: false
  });
  const [isActive, setIsActive] = useState(true);

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setEmail('');
    setName('');
    setInitialPassword('');
    setRole('editor');
    setPermissions({
      canEditCrm: true,
      canEditProduct: true,
      canEditTables: true,
      canManageUsers: false
    });
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditUser = (user: AppUser) => {
    setEditingUser(user);
    setEmail(user.email);
    setName(user.name);
    setInitialPassword('');
    setRole(user.role);
    setPermissions({ ...user.permissions });
    setIsActive(user.isActive);
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setPermissions({
        canEditCrm: true,
        canEditProduct: true,
        canEditTables: true,
        canManageUsers: true
      });
    } else if (newRole === 'editor') {
      setPermissions({
        canEditCrm: true,
        canEditProduct: true,
        canEditTables: true,
        canManageUsers: false
      });
    } else {
      setPermissions({
        canEditCrm: false,
        canEditProduct: false,
        canEditTables: false,
        canManageUsers: false
      });
    }
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const cleanEmail = email.trim().toLowerCase();
    const userObj: AppUser = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      email: cleanEmail,
      name: name.trim() || cleanEmail.split('@')[0],
      role,
      permissions,
      isActive,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString().slice(0, 10),
      lastLogin: editingUser?.lastLogin
    };

    onSaveUser(userObj);

    // If an initial password was provided, save it
    if (initialPassword.trim()) {
      setUserPassword(cleanEmail, initialPassword.trim());
    }

    setIsModalOpen(false);
  };

  // Generate 6-digit one-time reset code for user
  const handleGenerateResetCode = (user: AppUser) => {
    const res = generateAdminResetCode(user.email);
    if (res.success) {
      setGeneratedCode({
        email: user.email,
        name: user.name,
        code: res.code
      });
      setCopiedCode(false);
    }
  };

  // Save direct password for user
  const handleSaveDirectPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !directPassword.trim()) return;

    if (directPassword.trim().length < 6) {
      alert('הסיסמה חייבת לכלול לפחות 6 תווים');
      return;
    }

    setUserPassword(passwordModalUser.email, directPassword.trim());
    alert(`הסיסמה עודכנה בהצלחה עבור ${passwordModalUser.name} (${passwordModalUser.email})`);
    setPasswordModalUser(null);
    setDirectPassword('');
  };

  const storedPasswords = getStoredPasswords();

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Admin Portal Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>פורטל אדמין מאובטח · ניהול משתמשים, סיסמאות והרשאות</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              ניהול משתמשי מערכת, סיסמאות וקודי איפוס
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              מכאן מנהל המערכת שולט בכל משתמשי הפלטפורמה, מפיק קודי איפוס סיסמה חד-פעמיים, מקצה הרשאות עריכה או צפייה בלבד, ומגדיר סיסמאות ישירות או דרך משתני סביבה ב-Netlify.
            </p>
          </div>

          <button
            onClick={handleOpenNewUser}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ יצירת משתמש חדש</span>
          </button>
        </div>
      </div>

      {/* Netlify Environment Variables Guide Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">הגדרת סיסמאות דרך משתני סביבה ב-Netlify (Production Env)</h3>
            <p className="text-xs text-slate-300">
              ניתן להגדיר סיסמאות ראשיות גלובליות ישירות ב-Netlify Dashboard תחת Site configuration ← Environment variables:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-xs">
            <span className="text-emerald-400 font-bold block">VITE_ADMIN_PASSWORD</span>
            <span className="text-slate-400 text-[11px] font-sans block">סיסמה ראשית לחשבונות מנהל (Admin)</span>
            <span className="text-slate-500 text-[10px] font-mono">ברירת מחדל: {DEFAULT_FALLBACK_PASSWORD}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-xs">
            <span className="text-blue-400 font-bold block">VITE_EDITOR_PASSWORD</span>
            <span className="text-slate-400 text-[11px] font-sans block">סיסמה לחשבונות עורכי CRM ומוצר (Editor)</span>
            <span className="text-slate-500 text-[10px] font-mono">ברירת מחדל: {DEFAULT_FALLBACK_PASSWORD}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-xs">
            <span className="text-purple-400 font-bold block">VITE_VIEWER_PASSWORD</span>
            <span className="text-slate-400 text-[11px] font-sans block">סיסמה לחשבונות צפייה בלבד (Viewer Portal)</span>
            <span className="text-slate-500 text-[10px] font-mono">ברירת מחדל: {DEFAULT_FALLBACK_PASSWORD}</span>
          </div>
        </div>
      </div>

      {/* Users & Permissions Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">רשימת משתמשי המערכת ({users.length})</h2>
          </div>
          <span className="text-xs text-slate-400">
            כל כניסה מחייבת סיסמה או קוד איפוס חד-פעמי שהופק על ידי האדמין
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">שם ואימייל</th>
                <th className="py-3 px-4">תפקיד</th>
                <th className="py-3 px-4 text-center">עריכת CRM</th>
                <th className="py-3 px-4 text-center">עריכת מוצר</th>
                <th className="py-3 px-4 text-center">טבלאות & AI</th>
                <th className="py-3 px-4 text-center">אדמין</th>
                <th className="py-3 px-4">סטטוס</th>
                <th className="py-3 px-4">התחברות אחרונה</th>
                <th className="py-3 px-4 text-center min-w-[200px]">ניהול סיסמה ואיפוס</th>
                <th className="py-3 px-4 text-center w-20">עריכה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {users.map((u) => {
                const isAdmin = u.role === 'admin';
                const isEditor = u.role === 'editor';
                const hasCustomPass = Boolean(storedPasswords[u.email.toLowerCase()]);

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Name & Email */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{u.name}</span>
                        {currentUser.id === u.id && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                            אתה
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px] mt-0.5">{u.email}</div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${
                        isAdmin
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : isEditor
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      }`}>
                        {isAdmin ? 'מנהל (Admin)' : isEditor ? 'עורך (Editor)' : 'צופה (Viewer)'}
                      </span>
                    </td>

                    {/* Permissions */}
                    <td className="py-3 px-4 text-center">
                      {u.permissions.canEditCrm ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.permissions.canEditProduct ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.permissions.canEditTables ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.permissions.canManageUsers ? <Check className="w-4 h-4 text-amber-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                    </td>

                    {/* Active */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.isActive ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {u.isActive ? '● פעיל' : '○ מושבת'}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {u.lastLogin || 'טרם התחבר'}
                    </td>

                    {/* Password & Reset Code Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Generate Admin Reset Code Button */}
                        <button
                          type="button"
                          onClick={() => handleGenerateResetCode(u)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold transition-all"
                          title="הפק קוד איפוס סיסמה חד-פעמי למשתמש"
                        >
                          <Key className="w-3 h-3 text-amber-400" />
                          <span>הפק קוד איפוס</span>
                        </button>

                        {/* Set Password Directly */}
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordModalUser(u);
                            setDirectPassword('');
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold transition-all"
                          title="הגדר סיסמה ישירות לחשבון זה"
                        >
                          <Lock className="w-3 h-3 text-blue-400" />
                          <span>{hasCustomPass ? 'שנה סיסמה' : 'הגדר סיסמה'}</span>
                        </button>
                      </div>
                    </td>

                    {/* Edit / Delete User */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title="ערוך הרשאות"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {users.length > 1 && u.id !== currentUser.id && (
                          <button
                            onClick={() => {
                              if (confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${u.name}?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 transition-all"
                            title="מחק משתמש"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP 1: Display Generated Reset Code */}
      {generatedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">קוד איפוס סיסמה הופק בהצלחה!</h3>
                <p className="text-xs text-slate-400">עבור: {generatedCode.name} ({generatedCode.email})</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 text-center space-y-2">
              <span className="text-xs text-slate-400 block font-medium">קוד האיפוס החד-פעמי (תקף ל-24 שעות):</span>
              <span className="font-mono text-3xl font-extrabold text-amber-400 tracking-widest block">
                {generatedCode.code}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode.code);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all mt-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'הועתק ללוח!' : 'העתק קוד איפוס'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              מסור קוד זה למשתמש. המשתמש ייכנס למסך ההתחברות, ילחץ על הלשונית <strong>"קוד איפוס מהאדמין"</strong>, יזין את כתובת האימייל שלו, את הקוד הנ"ל ואת הסיסמה החדשה שבחר.
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setGeneratedCode(null)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md"
              >
                סגור אישור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: Direct Password Setting Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  הגדרת סיסמה ישירה עבור {passwordModalUser.name}
                </h3>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDirectPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  אימייל משתמש:
                </label>
                <input
                  type="text"
                  disabled
                  value={passwordModalUser.email}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  סיסמה חדשה (לפחות 6 תווים):
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  placeholder="הזן סיסמה חדשה..."
                  value={directPassword}
                  onChange={(e) => setDirectPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
                >
                  שמור סיסמה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP 3: Create / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  {editingUser ? 'עריכת משתמש והרשאות' : 'יצירת משתמש חדש'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">אימייל המשתמש *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@claimai.co.il"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">שם מלא *</label>
                  <input
                    type="text"
                    required
                    placeholder="ישראל ישראלי"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Password definition field */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {editingUser ? 'סיסמה חדשה (השאר ריק אם אין שינוי)' : 'סיסמה ראשונית (או השאר ריק לברירת מחדל)'}
                </label>
                <input
                  type="password"
                  placeholder="למשל: Password2026!"
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">תפקיד ורמת גישה בסיסית</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      role === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    מנהל (Admin)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('editor')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      role === 'editor'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    עורך (Editor)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('viewer')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      role === 'viewer'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    צופה בלבד (Viewer)
                  </button>
                </div>
              </div>

              {/* Permissions Checkboxes */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  פירוט הרשאות מדויק:
                </span>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canEditCrm}
                      onChange={(e) => setPermissions({ ...permissions, canEditCrm: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-500"
                    />
                    <span className="text-xs text-slate-200">
                      עריכת CRM (הוספת לקוחות, עדכון סטטוסים, כתיבת הערות)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canEditProduct}
                      onChange={(e) => setPermissions({ ...permissions, canEditProduct: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-500"
                    />
                    <span className="text-xs text-slate-200">
                      עריכת מוצר (יצירת תקלות ובאגים, עדכון מפת דרכים)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canEditTables}
                      onChange={(e) => setPermissions({ ...permissions, canEditTables: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-blue-500"
                    />
                    <span className="text-xs text-slate-200">
                      יצירה ועריכת טבלאות AI ונתונים מותאמים
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageUsers}
                      onChange={(e) => setPermissions({ ...permissions, canManageUsers: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500"
                    />
                    <span className="text-xs text-slate-200">
                      ניהול משתמשים והפקת קודי איפוס סיסמה
                    </span>
                  </label>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activeUser"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                />
                <label htmlFor="activeUser" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  משתמש פעיל (רשאי להתחבר למערכת)
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md"
                >
                  {editingUser ? 'עדכן משתמש' : 'צור משתמש'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
