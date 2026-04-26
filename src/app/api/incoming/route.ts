import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/incoming - Get all incoming records
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    const where = itemId ? { itemId } : {};

    const records = await (await db()).incomingItem.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { item: true },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching incoming records:', error);
    return NextResponse.json({ error: 'রেকর্ড লোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// POST /api/incoming - Add incoming record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemId, quantity, date, supplier, note } = body;

    if (!itemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'আইটেম এবং পরিমাণ আবশ্যক' }, { status: 400 });
    }

    const record = await (await db()).incomingItem.create({
      data: {
        itemId,
        quantity: parseInt(quantity),
        date: date ? new Date(date) : new Date(),
        supplier: supplier?.trim() || null,
        note: note?.trim() || null,
      },
      include: { item: true },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating incoming record:', error);
    return NextResponse.json({ error: 'রেকর্ড তৈরি করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// PUT /api/incoming - Update incoming record
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, itemId, quantity, date, supplier, note } = body;

    if (!id) {
      return NextResponse.json({ error: 'রেকর্ড আইডি আবশ্যক' }, { status: 400 });
    }
    if (!itemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'আইটেম এবং পরিমাণ আবশ্যক' }, { status: 400 });
    }

    const record = await (await db()).incomingItem.update({
      where: { id },
      data: {
        itemId,
        quantity: parseInt(quantity),
        date: date ? new Date(date) : new Date(),
        supplier: supplier?.trim() || null,
        note: note?.trim() || null,
      },
      include: { item: true },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating incoming record:', error);
    return NextResponse.json({ error: 'রেকর্ড আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// DELETE /api/incoming?id=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'রেকর্ড আইডি আবশ্যক' }, { status: 400 });
    }

    await (await db()).incomingItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting incoming record:', error);
    return NextResponse.json({ error: 'রেকর্ড মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
