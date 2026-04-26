# 🚀 Store Room Inventory — Vercel + Turso Deploy Guide

## ধাপ ১: Turso এ ডাটাবেজ তৈরি করুন

### ১.১ Turso সাইনআপ
1. এই লিংকে যান: https://turso.tech/signup
2. GitHub দিয়ে সাইনইন করুন (সবচেয়ে সহজ)
3. অ্যাকাউন্ট তৈরি হলে Turso Dashboard দেখা যাবে

### ১.২ ডাটাবেজ তৈরি
1. https://dashboard.turso.tech এ যান
2. **"Create Database"** বাটনে ক্লিক করুন
3. Database name: `store-room-inventory` (যেকোনো নাম দিতে পারেন)
4. Region: **Singapore** বা **ap-south-1** নির্বাচন করুন (আপনার কাছাকাছি)
5. **"Create"** বাটনে ক্লিক করুন

### ১.৩ Auth Token তৈরি
1. Dashboard এ আপনার ডাটাবেজে ক্লিক করুন
2. **"Settings"** ট্যাবে যান
3. **"Create Auth Token"** বাটনে ক্লিক করুন
4. Token কপি করুন (এটি আর দেখা যাবে না!)

### ১.৪ Connection URL কপি
1. Dashboard এ আপনার ডাটাবেজে যান
2. **"Settings"** ট্যাবে
3. **"Connection URL"** কপি করুন (এটি দেখতে এমন: `libsql://store-room-inventory-xyz.turso.io`)

---

## ধাপ ২: Turso তে Schema Push করুন (Local থেকে)

আপনার কম্পিউটারে Terminal খুলে নিচের কমান্ডগুলো চালান:

```bash
# ১. প্রজেক্ট ফোল্ডারে যান
cd store-room-inventory

# ২. Turso CLI লগইন
npx turso auth login

# ৩. পরিবেশগত ভেরিয়েবল সেট করুন (আপনার URL ও Token দিয়ে পরিবর্তন করুন)
export DATABASE_URL="libsql://store-room-inventory-xyz.turso.io"
export DATABASE_AUTH_TOKEN="your-auth-token-here"
export DIRECT_URL="libsql://store-room-inventory-xyz.turso.io"

# ৪. Schema টি Turso তে পুশ করুন
npx prisma db push

# ৫. Prisma Client জেনারেট করুন
npx prisma generate
```

✅ "Your database is now in sync with your Prisma schema" দেখলে সফল!

---

## ধাপ ৩: Vercel তে Deploy করুন

### ৩.১ Vercel সাইনআপ
1. https://vercel.com/signup এ যান
2. GitHub দিয়ে সাইনইন করুন

### ৩.২ প্রজেক্ট Import
1. Vercel Dashboard এ **"Add New"** > **"Project"** ক্লিক করুন
2. GitHub repository list থেকে **`store-room-inventory`** নির্বাচন করুন
3. **"Import"** ক্লিক করুন

### ৩.৩ Build Settings
- **Framework Preset**: Next.js (স্বয়ংক্রিয় ডিটেক্ট হবে)
- **Root Directory**: `.` (ডিফল্ট)
- **Build Command**: `npx prisma generate && next build`
- **Output Directory**: `.next` (ডিফল্ট)

### ৩.৪ Environment Variables সেট করুন (সবচেয়ে গুরুত্বপূর্ণ!)
Vercel এর "Environment Variables" সেকশনে ৩টি ভেরিয়েবল যোগ করুন:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `libsql://store-room-inventory-xyz.turso.io` |
| `DATABASE_AUTH_TOKEN` | `your-turso-auth-token-here` |
| `DIRECT_URL` | `libsql://store-room-inventory-xyz.turso.io` |

⚠️ **USERNAME ও TOKEN আপনার নিজেরটি বসাবেন, উপরেরটি শুধু উদাহরণ!**

### ৩.৫ Deploy!
1. **"Deploy"** বাটনে ক্লিক করুন
2. ২-৩ মিনিট অপেক্ষা করুন
3. ✅ Deploy সফল হলে আপনার সাইটের URL পাবেন: `https://store-room-inventory-xxx.vercel.app`

---

## 📋 সমস্যা সমাধান

### "prisma db push" এরর:
- Turso CLI লগইন হয়েছে কিনা চেক করুন: `npx turso auth whoami`
- DATABASE_URL সঠিক কিনা নিশ্চিত করুন

### Vercel Build Failed:
- Build Command ঠিক আছে কিনা দেখুন: `npx prisma generate && next build`
- Environment Variables ৩টাই সেট করা আছে কিনা নিশ্চিত করুন

### ডাটাবেজ কানেকশন এরর:
- Turso Auth Token মেয়াদ উত্তীর্ণ হলে নতুন তৈরি করুন
- Vercel Environment Variables এ সঠিক URL ও Token আছে কিনা চেক করুন

### Local Development:
- লোকালে কাজ করতে চাইলে `.env` ফাইলে `DATABASE_URL="file:./dev.db"` রাখুন
- Turso তে কাজ করতে চাইলে `.env` তে Turso URL ও Token দিন
