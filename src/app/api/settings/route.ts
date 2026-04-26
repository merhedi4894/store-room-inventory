import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Ensure the AppSetting table exists (auto-migration for serverless)
async function ensureTable() {
  try {
    const database = await db();
    await database.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AppSetting" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "updatedAt" DATETIME NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "AppSetting_key_key" ON "AppSetting"("key");
    `);
  } catch (error) {
    console.error('Error ensuring AppSetting table:', error);
  }
}

// GET /api/settings - Get all settings (for checking security setup status)
export async function GET() {
  try {
    await ensureTable();
    const database = await db();
    const settings = await database.appSetting.findMany();
    // Return as key-value map
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    return NextResponse.json(map);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'সেটিংস লোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// POST /api/settings - Upsert a setting (key-value)
export async function POST(request: Request) {
  try {
    await ensureTable();
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'কী এবং মান আবশ্যক' }, { status: 400 });
    }

    const database = await db();

    // Upsert: update if exists, create if not
    const existing = await database.appSetting.findUnique({ where: { key } });
    if (existing) {
      await database.appSetting.update({
        where: { key },
        data: { value: String(value) },
      });
    } else {
      await database.appSetting.create({
        data: { key, value: String(value) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json({ error: 'সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
