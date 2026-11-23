# מדריך הרמה ואירוח ב-Netlify עם מסד נתונים

מדריך זה מפרט שלב-אחר-שלב כיצד להרים את אפליקציית **ClaimAI Control Center** ב-Netlify ולחבר אותה למסד נתונים.

---

## 1. חיבור הריפו והרמה ראשונית ב-Netlify

1. היכנס ל-[Netlify App](https://app.netlify.com).
2. לחץ על **"Add new site"** ואז **"Import an existing project"**.
3. בחר בספק הגיט: **GitHub**.
4. בחר בריפו: `avivashke/claimai-control-center`.
5. נטיפי תזהה אוטומטית את קובץ `netlify.toml` שנמצא בריפו:
   - **Branch to deploy:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. לחץ על **"Deploy claimai-control-center"**.
7. האפליקציה תבנה ותעלה לאוויר תוך פחות מדקה!

---

## 2. איך עובד מסד הנתונים? (Dual Database Architecture)

האפליקציה כוללת שני מסלולי דאטה-בייס חכמים:

### מסלול א': מסד נתונים מקומי אוטונומי (IndexedDB - פעיל מיידית ללא צורך בהגדרה!)
- בעת הפתיחה הראשונה של האתר ב-Netlify, האפליקציה טוענת אוטומטית ל-IndexedDB של הדפדפן את כל **1,282 הלקוחות** ו-**43 משימות המוצר והבאגים**.
- כל עריכה, הוספת הערה, שינוי סטטוס או יצירת ליד חדש נשמרים בדפדפן וממשיכים להתקיים גם ברענון העמוד.
- ניתן לייצא גיבוי מלא של הנתונים בכל עת כקובץ JSON או לייצא ל-CSV בלשונית "דאטה-בייס ונטיפי".

### מסלול ב': חיבור מסד נתונים ענן (Supabase / PostgreSQL - לסנכרון בין כל חברי הצוות)
אם תרצה שכל חברי הצוות (אביב, אייל וכו') יראו את אותם הנתונים ויעדכנו בזמן אמת מאתר אחד:

1. פתח פרויקט חינמי ב-[Supabase](https://supabase.com).
2. ב-Supabase, גש ל-**SQL Editor** והדבק את תוכן הקובץ [`supabase/schema.sql`](supabase/schema.sql) והפעל (Run).
3. (אופציונלי) הפעל גם את [`supabase/seed.sql`](supabase/seed.sql) להזנת הנתונים הראשוניים ישירות לטבלאות הענן.
4. ב-Netlify, גש ל: **Site configuration** ← **Environment variables** והוסף:
   - `VITE_SUPABASE_URL` = כתובת ה-URL של הפרויקט ב-Supabase (למשל: `https://xxxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` = המפתח הציבורי של Supabase (`anon` key)
5. בצע Trigger deploy חדש ב-Netlify.
   - לחילופין: ניתן גם להזין את ה-URL וה-Key ישירות בממשק האפליקציה תחת לשונית **"דאטה-בייס ונטיפי"**!

---

## 3. חיבור Cloudflare Worker AI למערכת ⚡

הפרויקט כולל תיקייה מוכנה לפריסה: `cloudflare-worker/` המספקת שירותי AI מהירים וחינמיים (באמצעות Cloudflare Workers AI או מודלים חיצוניים).

### משתנים להגדרה ב-Netlify:
ב-Netlify תחת **Site configuration** ← **Environment variables**:
1. **`VITE_CLOUDFLARE_WORKER_URL`** = הכתובת של הוורקר (לדוגמה: `https://claimai-ai-worker.xyz.workers.dev`).
2. **`VITE_WORKER_AUTH_TOKEN`** *(אופציונלי)* = טוקן סודי לאבטחה אם הגדרת כזה בוורקר.

לאחר ההגדרה, רכיב ה-**Floating AI Copilot** וסטודיו הטבלאות **AI Table Studio** ינותבו ישירות לענן של Cloudflare, ובמסך **דאטה-בייס ונטיפי** תוכל לבדוק את תקינות החיבור בלחיצת כפתור!

---

## 4. קבצים עיקריים בפרויקט

| קובץ | ייעוד |
|---|---|
| `netlify.toml` | הגדרות בנייה, ניתוב SPA (Redirects) וכותרות אבטחה ל-Netlify |
| `supabase/schema.sql` | סכמת טבלאות SQL מלאה עם אינדקסים וחוקי RLS |
| `supabase/seed.sql` | סקריפט הזנת כל הנתונים מגיליונות ה-Google Sheets |
| `src/services/db.ts` | מנוע ניהול הנתונים ההיברידי (Dexie + Supabase) |
| `src/data/` | קובצי ה-Seed המקוריים (1,282 לקוחות, 43 משימות מוצר, אנשי קשר) |
