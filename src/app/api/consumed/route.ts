import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/consumed - Get all consumed records
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    const where = itemId ? { itemId } : {};

    const records = await (await db()).consumedItem.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { item: true },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching consumed records:', error);
    return NextResponse.json({ error: 'রেকর্ড লোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// POST /api/consumed - Add consumed record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemId, quantity, date, note } = body;

    if (!itemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'আইটেম এবং পরিমাণ আবশ্যক' }, { status: 400 });
    }

    // Check stock
    const totalIncoming = await (await db()).incomingItem.aggregate({
      _sum: { quantity: true },
      where: { itemId },
    });
    const totalConsumed = await (await db()).consumedItem.aggregate({
      _sum: { quantity: true },
      where: { itemId },
    });
    const totalTransferred = await (await db()).transferredItem.aggregate({
      _sum: { quantity: true },
      where: { itemId },
    });

    const currentStock =
      (totalIncoming._sum.quantity || 0) -
      (totalConsumed._sum.quantity || 0) -
      (totalTransferred._sum.quantity || 0);

    if (parseInt(quantity) > currentStock) {
      return NextResponse.json(
        { error: `পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${currentStock}` },
        { status: 400 }
      );
    }

    const record = await (await db()).consumedItem.create({
      data: {
        itemId,
        quantity: parseInt(quantity),
        date: date ? new Date(date) : new Date(),
        note: note?.trim() || null,
      },
      include: { item: true },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating consumed record:', error);
    return NextResponse.json({ error: 'রেকর্ড তৈরি করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// PUT /api/consumed - Update consumed record
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, itemId, quantity, date, note } = body;

    if (!id) {
      return NextResponse.json({ error: 'রেকর্ড আইডি আবশ্যক' }, { status: 400 });
    }
    if (!itemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'আইটেম এবং পরিমাণ আবশ্যক' }, { status: 400 });
    }

    const record = await (await db()).consumedItem.update({
      where: { id },
      data: {
        itemId,
        quantity: parseInt(quantity),
        date: date ? new Date(date) : new Date(),
        note: note?.trim() || null,
      },
      include: { item: true },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating consumed record:', error);
    return NextResponse.json({ error: 'রেকর্ড আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// DELETE /api/consumed?id=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'রেকর্ড আইডি আবশ্যক' }, { status: 400 });
    }

    await (await db()).consumedItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting consumed record:', error);
    return NextResponse.json({ error: 'রেকর্ড মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
