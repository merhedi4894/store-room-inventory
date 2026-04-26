import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// v2: fixed purpose nullable field
// GET /api/transferred - Get all transferred records
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    const where = itemId ? { itemId } : {};

    const records = await (await db()).transferredItem.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { item: true },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching transferred records:', error);
    return NextResponse.json({ error: 'রেকর্ড লোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// POST /api/transferred - Add transferred record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { itemId, quantity, date, transferredTo, purpose, receivedBy, note } = body;

    if (!itemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'আইটেম এবং পরিমাণ আবশ্যক' }, { status: 400 });
    }
    if (!transferredTo || !transferredTo.trim()) {
      return NextResponse.json({ error: 'কোথায় নেওয়া হচ্ছে তা উল্লেখ করুন' }, { status: 400 });
    }
    if (!receivedBy || !receivedBy.trim()) {
      return NextResponse.json({ error: 'যে নিচ্ছে তার নাম উল্লেখ করুন' }, { status: 400 });
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

    const record = await (await db()).transferredItem.create({
      data: {
        itemId,
        quantity: parseInt(quantity),
        date: date ? new Date(date) : new Date(),
        transferredTo: transferredTo.trim(),
        purpose: purpose?.trim() || null,
        receivedBy: receivedBy.trim(),
        note: note?.trim() || null,
      },
      include: { item: true },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating transferred record:', error);
    return NextResponse.json({ error: 'রেকর্ড তৈরি করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// PUT /api/transferred - Update transferred record
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, itemId, quantity, date, transferredTo, purpose, receivedBy, note } = body;

    if (!id) {
      return NextResponse.json({ error: 'রেকর্ড আইডি আবশ্যক' }, { status: 400 });
    }
    if (!itemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'আইটেম এবং পরিমাণ আবশ্যক' }, { status: 400 });
    }
    if (!transferredTo || !transferredTo.trim()) {
      return NextResponse.json({ error: 'কোথায় নেওয়া হচ্ছে তা উল্লেখ করুন' }, { status: 400 });
    }
    if (!receivedBy || !receivedBy.trim()) {
      return NextResponse.json({ error: 'যে নিচ্ছে তার নাম উল্লেখ করুন' }, { status: 400 });
    }

    const record = await (await db()).transferredItem.update({
      where: { id },
      data: {
        itemId,
        quantity: parseInt(quantity),
        date: date ? new Date(date) : new Date(),
        transferredTo: transferredTo.trim(),
        purpose: purpose?.trim() || null,
        receivedBy: receivedBy.trim(),
        note: note?.trim() || null,
      },
      include: { item: true },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating transferred record:', error);
    return NextResponse.json({ error: 'রেকর্ড আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// DELETE /api/transferred?id=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'রেকর্ড আইডি আবশ্যক' }, { status: 400 });
    }

    await (await db()).transferredItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transferred record:', error);
    return NextResponse.json({ error: 'রেকর্ড মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
