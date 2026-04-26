import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/items - Get all items (optimized with batch queries)
export async function GET() {
  try {
    const database = await db();

    const items = await database.item.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (items.length === 0) {
      return NextResponse.json([]);
    }

    const itemIds = items.map((i) => i.id);

    // Batch aggregates for all items at once
    const [allIncoming, allConsumed, allTransferred] = await Promise.all([
      database.incomingItem.groupBy({
        by: ['itemId'],
        where: { itemId: { in: itemIds } },
        _sum: { quantity: true },
      }),
      database.consumedItem.groupBy({
        by: ['itemId'],
        where: { itemId: { in: itemIds } },
        _sum: { quantity: true },
      }),
      database.transferredItem.groupBy({
        by: ['itemId'],
        where: { itemId: { in: itemIds } },
        _sum: { quantity: true },
      }),
    ]);

    // Build lookup maps
    const incMap = new Map(allIncoming.map((r) => [r.itemId, r._sum.quantity || 0]));
    const conMap = new Map(allConsumed.map((r) => [r.itemId, r._sum.quantity || 0]));
    const traMap = new Map(allTransferred.map((r) => [r.itemId, r._sum.quantity || 0]));

    const itemsWithStock = items.map((item) => {
      const totalIncoming = incMap.get(item.id) || 0;
      const totalConsumed = conMap.get(item.id) || 0;
      const totalTransferred = traMap.get(item.id) || 0;
      const stock = totalIncoming - totalConsumed - totalTransferred;

      return {
        ...item,
        stock,
        totalIncoming,
        totalConsumed,
        totalTransferred,
      };
    });

    return NextResponse.json(itemsWithStock);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'আইটেম লোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// POST /api/items - Create new item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, unit, lowStockThreshold } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'আইটেমের নাম আবশ্যক' }, { status: 400 });
    }

    let threshold: number | null = null;
    if (lowStockThreshold !== undefined && lowStockThreshold !== null && lowStockThreshold !== '') {
      const parsed = parseInt(lowStockThreshold);
      if (!isNaN(parsed) && parsed >= 0) {
        threshold = parsed;
      }
    }

    const item = await (await db()).item.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        unit: unit?.trim() || 'টি',
        lowStockThreshold: threshold,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'আইটেম তৈরি করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// DELETE /api/items?id=xxx - Delete item
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'আইটেম আইডি আবশ্যক' }, { status: 400 });
    }

    await (await db()).incomingItem.deleteMany({ where: { itemId: id } });
    await (await db()).consumedItem.deleteMany({ where: { itemId: id } });
    await (await db()).transferredItem.deleteMany({ where: { itemId: id } });
    await (await db()).item.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'আইটেম মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// PUT /api/items - Update item
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, unit, lowStockThreshold } = body;

    if (!id || !name || name.trim() === '') {
      return NextResponse.json({ error: 'আইডি এবং নাম আবশ্যক' }, { status: 400 });
    }

    let threshold: number | null = null;
    if (lowStockThreshold !== undefined && lowStockThreshold !== null && lowStockThreshold !== '') {
      const parsed = parseInt(lowStockThreshold);
      if (!isNaN(parsed) && parsed >= 0) {
        threshold = parsed;
      }
    }

    const item = await (await db()).item.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        unit: unit?.trim() || 'টি',
        lowStockThreshold: threshold,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'আইটেম আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
