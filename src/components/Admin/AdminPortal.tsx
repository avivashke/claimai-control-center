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
  Globe,
  ExternalLink,
  Users,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Smartphone,
  RefreshCw,
  QrCode,
  Download
} from 'lucide-react';
import { AppUser, UserRole, UserPermissions } from '../../types';
import { getGoogleClientId, setGoogleClientId } from '../../services/authService';
import {
  getLocalUsers,
  saveLocalUsers,
  updateLocalUserStatus,
  updateLocalUserRole,
  generateAdminResetCode,
  LocalUser
} from '../../services/authService';

interface AdminPortalProps {
  users: AppUser[];
  currentUser: AppUser;
  onSaveUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser: (user: AppUser) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onSwitchUser
}) => {
  const [googleClientId, setGoogleClientIdState] = useState(getGoogleClientId());
  const [isSavedClientId, setIsSavedClientId] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [resetCode, setResetCode] = useState<{ user: LocalUser; code: string } | null>(null);
  const [whatsappQr, setWhatsappQr] = useState<string | null>(null);
  const [whatsappReady, setWhatsappReady] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('editor');
  const [permissions, setPermissions] = useState<UserPermissions>({
    canEditCrm: true,
    canEditProduct: true,
    canEditTables: true,
    canManageUsers: false
  });
  const [isActive, setIsActive] = useState(true);

  const handleSaveClientId = () => {
    setGoogleClientId(googleClientId);
    setIsSavedClientId(true);
    setTimeout(() => setIsSavedClientId(false), 2500);
  };

  // Load WhatsApp QR code from server
  const loadWhatsappStatus = async () => {
    setWhatsappLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/whatsapp/qr');
      const data = await res.json();
      setWhatsappQr(data.qr || null);
      setWhatsappReady(Boolean(data.ready));
    } catch {
      setWhatsappQr(null);
      setWhatsappReady(false);
    } finally {
      setWhatsappLoading(false);
    }
  };

  React.useEffect(() => {
    loadWhatsappStatus();
    const interval = setInterval(loadWhatsappStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setEmail('');
    setName('');
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
      // viewer
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

    const userObj: AppUser = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      email: email.trim().toLowerCase(),
      name: name.trim() || email.split('@')[0],
      role,
      permissions,
      isActive,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString().slice(0, 10),
      lastLogin: editingUser?.lastLogin
    };

    onSaveUser(userObj);
    setIsModalOpen(false);
  };

  const handleGenerateResetCode = (user: LocalUser) => {
    const result = generateAdminResetCode(user.id);
    if (result.success) {
      setResetCode({ user, code: result.code });
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Portal Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>פורטל אדמין מאובטח · ניהול משתמשים והרשאות Google OAuth</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              ניהול פורטלים, משתמשי מערכת והרשאות עריכה/צפייה
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              מכאן אתה מעניק הרשאות למשתמשים שמתחברים עם חשבון ה-Google שלהם. ניתן להגדיר תפקידי מנהל (Admin), עורך (Editor) או צופה בלבד (Viewer) ללא אפשרות עריכה או מחיקה.
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

      {/* Simulator / Fast Switcher Card */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white">סימולטור לבדיקת פורטלים בזמן אמת:</span>
          <span className="text-xs text-slate-400">התחבר בלחיצה אחת ככל אחד מחברי הצוות כדי לראות את הפורטל שלו</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => onSwitchUser(u)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentUser.id === u.id
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                u.role === 'admin' ? 'bg-amber-400' : u.role === 'editor' ? 'bg-blue-400' : 'bg-slate-400'
              }`}></span>
              <span>{u.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({u.role})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Users & Permissions Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">רשימת משתמשים והרשאות ({users.length})</h2>
          </div>
          <span className="text-xs text-slate-400">
            התחברות מתבצעת עם חשבון Google (@gmail.com או דומיין ארגוני)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">שם ואימייל גוגל</th>
                <th className="py-3 px-4">תפקיד / פורטל</th>
                <th className="py-3 px-4 text-center">עריכת CRM</th>
                <th className="py-3 px-4 text-center">עריכת מוצר</th>
                <th className="py-3 px-4 text-center">טבלאות & AI</th>
                <th className="py-3 px-4 text-center">אדמין</th>
                <th className="py-3 px-4">סטטוס</th>
                <th className="py-3 px-4">התחברות אחרונה</th>
                <th className="py-3 px-4 text-center w-24">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const isAdmin = u.role === 'admin';
                const isEditor = u.role === 'editor';
                const isViewer = u.role === 'viewer';

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Name & Google Email */}
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

                    {/* Role Badge */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${
                        isAdmin
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : isEditor
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-slate-700/40 text-slate-400 border-slate-700'
                      }`}>
                        {isAdmin && <ShieldCheck className="w-3 h-3" />}
                        {isEditor && <Edit3 className="w-3 h-3" />}
                        {isViewer && <Eye className="w-3 h-3" />}
                        <span>
                          {isAdmin ? 'מנהל מערכת (Admin)' : isEditor ? 'עורך מלא (Editor)' : 'צופה בלבד (Viewer)'}
                        </span>
                      </span>
                    </td>

                    {/* CRM Edit Permission */}
                    <td className="py-3 px-4 text-center">
                      {u.permissions.canEditCrm ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-500">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>

                    {/* Product Edit Permission */}
                    <td className="py-3 px-4 text-center">
                      {u.permissions.canEditProduct ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-500">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>

                    {/* Tables Edit Permission */}
                    <td className="py-3 px-4 text-center">
                      {u.permissions.canEditTables ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-500">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </td>

                    {/* Manage Users Permission */}
                    <td className="py-3 px-4 text-center">
                      {u.permissions.canManageUsers ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-600">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
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

                    {/* Actions */}
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

      {/* Google Authentication Configuration Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center font-bold">
              G
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">פרוטוקול התחברות Google Identity Services (OAuth 2.0)</h3>
              <p className="text-xs text-slate-400">חיבור מאובטח ישירות עם חשבון גוגל של כל משתמש</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Google Sign-In Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">
                Google Client ID (מזהה הלקוח מ-Google Cloud Console)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="xxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientIdState(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveClientId}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all shrink-0"
                >
                  שמור Client ID
                </button>
              </div>
              {isSavedClientId && (
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  ה-Client ID נשמר בהצלחה!
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              * גם ללא הגדרת Client ID, המערכת כוללת מנגנון התחברות אוטומטי מבוסס אימייל גוגל עבור כל אנשי הצוות שהוגדרו בטבלה.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5 text-xs text-slate-300">
            <span className="font-bold text-white block">הנחיות הגדרה ב-Google Cloud:</span>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
              <li>גש ל-Google Cloud Console ← APIs & Services</li>
              <li>צור OAuth 2.0 Client ID (Web Application)</li>
              <li>הוסף ב-Authorized JavaScript origins את כתובת ה-Netlify שלך</li>
              <li>הדבק כאן את ה-Client ID</li>
            </ol>
          </div>
        </div>
      </div>

      {/* WhatsApp Authentication Configuration Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">אימות וואטסאפ שליחת קודי כניסה</h3>
              <p className="text-xs text-slate-400">
                קודי אימות נשלחים בוואטסאפ מהמספר <span className="font-mono text-emerald-400">+972586735953</span>
              </p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            whatsappReady
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
          }`}>
            {whatsappReady ? 'מחובר ומוכן לשליחה' : 'לא מחובר - סרוק QR'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              כדי לאפשר שליחת קודי אימות בוואטסאפ, סרק את קוד ה-QR למטה עם אפליקציית וואטסאפ בטלפון שלך:
            </p>
            {whatsappLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : whatsappQr ? (
              <div className="flex flex-col items-center justify-center p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-lg">
                <div className="relative">
                  <img
                    src={`data:image/png;base64,${whatsappQr}`}
                    alt="WhatsApp QR Code"
                    className="w-80 h-80 mb-3 bg-white p-2 rounded-lg shadow-xl block"
                  />
                  <a
                    href={`data:image/png;base64,${whatsappQr}`}
                    download="whatsapp-qr.png"
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    הורד תמונת QR
                  </a>
                </div>
                <p className="text-[10px] text-slate-400 text-center max-w-xs mt-2">
                  פתח וואטסאפ → הגדרות → מכשירים מקושרים → הקשר מכשיר → סרוק את הקוד
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-slate-500">
                טוען קוד QR…
              </div>
            )}
            {!whatsappReady && (
              <button
                onClick={loadWhatsappStatus}
                disabled={whatsappLoading}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3 h-3" />
                רענן קוד QR
              </button>
            )}
            {whatsappReady && (
              <p className="text-xs text-emerald-400 text-center font-medium">
                ✓ הוואטסאפ מחובר ומוכן לשליחת קודי אימות
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-3">
                מספר שולח
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold text-emerald-400 bg-emerald-900/50 px-3 py-1 rounded border border-emerald-500/30">
                  +972586735953
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                כל קודי האימות בכניסה ובאיפוס סיסמה יישלחו מהמספר הזה.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-3">
                איך זה עובד
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[10px] text-slate-400">
                <li>סרוק את קוד ה-QR עם וואטסאפ בטלפון</li>
                <li>המתין להודעת "מחובר ומוכן לשליחה"</li>
                <li>משתמשים יקבלו קוד אימות בהודעת וואטסאפ</li>
                <li>המנהל יכול להפיק קודי איפוס סיסמה לכל משתמש</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  {editingUser ? 'עריכת משתמש והרשאות' : 'יצירת משתמש חדש והענקת גישות'}
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
                  <label className="block text-xs text-slate-400 mb-1">אימייל Google של המשתמש *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">שם מלא של המשתמש *</label>
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

              {/* Fine-Grained Permissions Checkboxes */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
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
                      הרשאת עריכת CRM (הוספת לקוחות, עדכון סטטוסים, כתיבת הערות)
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
                      הרשאת עריכת מוצר (יצירת תקלות ובאגים, עדכון מפת דרכים)
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
                      הרשאת יצירה ועריכת טבלאות AI ונתונים מותאמים
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
                      הרשאת אדמין וניהול משתמשים (צפייה בפורטל זה והענקת הרשאות)
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
                  {editingUser ? 'עדכן הרשאות' : 'צור משתמש'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Local Users Management (WhatsApp Code Login) */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">ניהול משתמשי התחברות מקומית (וואטסאפ)</h3>
          </div>
          <p className="text-xs text-slate-400">
            משתמשים אלה מתחברים עם קוד אימות שנשלח לוואטסאפ. ניתן להשבית או לשנות תפקיד לכל משתמש.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-800/60 text-xs text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">שם משתמש</th>
                <th className="py-3 px-4">טלפון / וואטסאפ</th>
                <th className="py-3 px-4">תפקיד</th>
                <th className="py-3 px-4">סטטוס</th>
                <th className="py-3 px-4 text-center">פעולה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(() => {
                const localUsers = getLocalUsers();
                if (localUsers.length === 0) {
                  return (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                        אין משתמשים רשומים במערכת ההתחברות המקומית.
                      </td>
                    </tr>
                  );
                }
                return localUsers.map((u: LocalUser) => {
                  const isAdmin = u.role === 'admin';
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">{u.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-300">{u.phone}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isAdmin
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : u.role === 'editor'
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            : 'bg-slate-700/40 text-slate-400 border-slate-700'
                        }`}>
                          {isAdmin ? 'מנהל' : u.role === 'editor' ? 'עורך' : 'צופה'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.isActive ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          {u.isActive ? '● פעיל' : '○ מושבת'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            const nextActive = !u.isActive;
                            updateLocalUserStatus(u.id, nextActive);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            u.isActive
                              ? 'bg-rose-900/30 text-rose-400 border border-rose-800/40 hover:bg-rose-900/50'
                              : 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/50'
                          }`}
                        >
                          {u.isActive ? 'השבת' : 'הפעל'}
                        </button>
                        <button
                          onClick={() => handleGenerateResetCode(u)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-900/30 text-amber-400 border border-amber-800/40 hover:bg-amber-900/50 transition-all"
                          title="הפק קוד איפוס סיסמה למשתמש"
                        >
                          <Key className="w-3 h-3" />
                          קוד איפוס
                        </button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-slate-800">
          <label className="block text-xs text-slate-400 mb-2">
            שנה תפקיד למשתמש נבחר (מנהל / עורך / צופה)
          </label>
          <select
            onChange={(e) => {
              const localUsers = getLocalUsers();
              if (localUsers.length === 0) return;
              const target = localUsers[0];
              const role = e.target.value as UserRole;
              const perms: UserPermissions = role === 'admin'
                ? { canEditCrm: true, canEditProduct: true, canEditTables: true, canManageUsers: true }
                : role === 'editor'
                ? { canEditCrm: true, canEditProduct: true, canEditTables: true, canManageUsers: false }
                : { canEditCrm: false, canEditProduct: false, canEditTables: false, canManageUsers: false };
              updateLocalUserRole(target.id, role, perms);
            }}
            className="w-auto bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="admin">מנהל מערכת (Admin)</option>
            <option value="editor">עורך מלא (Editor)</option>
            <option value="viewer">צופה בלבד (Viewer)</option>
          </select>
          <p className="text-[10px] text-slate-500 mt-1">
            현재 משמש לדוגמה את המשתמש הראשון ברשימה. לניהול פרטני יש לערוך כל משתמש בנפרד דרך כרטיס המשתמש למעלה.
          </p>
        </div>

        {/* Generated reset code display */}
        {resetCode && (
          <div className="p-4 rounded-xl bg-amber-900/30 border border-amber-600/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                קוד איפוס סיסמה הופק
              </span>
              <button
                onClick={() => setResetCode(null)}
                className="text-[9px] text-amber-400 hover:text-amber-300 underline underline-offset-2"
              >
                סגור
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">משתמש:</span>
              <span className="text-xs font-medium text-white">{resetCode.user.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">טלפון:</span>
              <span className="text-xs font-mono text-slate-300">{resetCode.user.phone}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400">קוד איפוס:</span>
              <span className="font-mono text-xl font-bold text-amber-400 bg-amber-900/50 px-3 py-1 rounded border border-amber-500/40">
                {resetCode.code}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(resetCode.code);
                  alert('הקוד הועתק ללוח');
                }}
                className="text-[9px] text-amber-400 hover:text-amber-300 underline underline-offset-2"
              >
                העתק קוד
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              מסור את הקוד למשתמש. הקוד תקף ל־10 דקות וניתן לשימוש חד־פעמי לאיפוס סיסמה במסך הכניסה.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
