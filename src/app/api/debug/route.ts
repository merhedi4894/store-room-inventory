import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20),
    hasTursoUrl: !!process.env.TURSO_URL,
    tursoUrlPrefix: process.env.TURSO_URL?.substring(0, 30),
    hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
    tursoTokenPrefix: process.env.TURSO_AUTH_TOKEN?.substring(0, 20),
    nodeEnv: process.env.NODE_ENV,
  });
}
