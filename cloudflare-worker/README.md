# ClaimAI Cloudflare AI Worker 🚀

וורקר ייעודי ל-Cloudflare המשרת את אפליקציית **ClaimAI Control Center** עבור שירותי AI, צ'אט אוטומטי, פיענוח טבלאות וניתוח נתוני לקוחות (CRM).

---

## 🛠️ שלב 1: פריסה ל-Cloudflare (Deploy)

1. היכנס לתיקייה:
   ```bash
   cd cloudflare-worker
   ```
2. התקן תלויות (אם נדרש):
   ```bash
   npm install
   ```
3. בצע פריסה לחשבון ה-Cloudflare שלך:
   ```bash
   npx wrangler deploy
   ```
4. בסיום הפריסה תקבל כתובת URL ייחודית, למשל:
   `https://claimai-ai-worker.<your-subdomain>.workers.dev`

---

## ⚙️ שלב 2: הגדרת משתנים ו-Secrets ב-Cloudflare

ניתן להגדיר דרך ה-Dashboard של Cloudflare או דרך שורת הפקודה (`wrangler`):

### אפשרות א': דרך Cloudflare Dashboard
1. היכנס ל-[Cloudflare Dashboard](https://dash.cloudflare.com/) ← **Compute (Workers & Pages)**.
2. לחץ על ה-Worker: `claimai-ai-worker`.
3. גש ללשונית **Settings** ← **Variables and Secrets**.
4. הוסף את המשתנים הבאים:

| סוג (Type) | שם המשתנה (Key) | תיאור | האם חובה? |
|---|---|---|---|
| **AI Binding** | `AI` | חיבור ל-Cloudflare Workers AI (מוגדר כבר ב-`wrangler.toml`) | מומלץ (חינמי ומהיר) |
| **Secret** | `WORKER_SECRET_TOKEN` | מפתח אבטחה פרטי לאימות הקריאות מהאפליקציה | אופציונלי |
| **Secret** | `GEMINI_API_KEY` | מפתח ל-Google Gemini 1.5/2.0 (אם רוצים מודל גוגל) | אופציונלי |
| **Secret** | `OPENAI_API_KEY` | מפתח ל-OpenAI (אם מעדיפים GPT-4o) | אופציונלי |
| **Text Variable** | `CORS_ORIGIN` | דומיין האפליקציה ב-Netlify או `*` | ברירת מחדל: `*` |
| **Text Variable** | `DEFAULT_MODEL` | מודל Workers AI (למשל `@cf/meta/llama-3.3-70b-instruct`) | מוגדר ב-`wrangler.toml` |

### אפשרות ב': דרך הטרמינל (Wrangler CLI)
```bash
# הגדרת Secret לטוקן אבטחה
npx wrangler secret put WORKER_SECRET_TOKEN

# הגדרת Secret ל-Gemini (אופציונלי)
npx wrangler secret put GEMINI_API_KEY
```

---

## 🌐 שלב 3: הגדרת המשתנים ב-Netlify

באפליקציית **ClaimAI Control Center** ב-Netlify:
1. היכנס ל-[Netlify App](https://app.netlify.com) ← בחר באתר שלך.
2. גש ל-**Site configuration** ← **Environment variables**.
3. הוסף:
   - `VITE_CLOUDFLARE_WORKER_URL` = ה-URL של הוורקר (למשל: `https://claimai-ai-worker.xyz.workers.dev`)
   - `VITE_WORKER_AUTH_TOKEN` = הטוקן שהגדרת ב-`WORKER_SECRET_TOKEN` (אם הגדרת כזה).
4. בצע **Trigger deploy** חדש (או פשוט דחוף קוד ל-Git).
