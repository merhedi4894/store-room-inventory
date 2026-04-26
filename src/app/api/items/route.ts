import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/items - Get all items
export async function GET() {
  try {
    const items = await (await db()).item.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            incomingRecords: true,
            consumedRecords: true,
            transferredRecords: true,
          },
        },
      },
    });

    // Calculate stock for each item
    const itemsWithStock = await Promise.all(
      items.map(async (item) => {
        const totalIncoming = await (await db()).incomingItem.aggregate({
          _sum: { quantity: true },
          where: { itemId: item.id },
        });

        const totalConsumed = await (await db()).consumedItem.aggregate({
          _sum: { quantity: true },
          where: { itemId: item.id },
        });

        const totalTransferred = await (await db()).transferredItem.aggregate({
          _sum: { quantity: true },
          where: { itemId: item.id },
        });

        const stock =
          (totalIncoming._sum.quantity || 0) -
          (totalConsumed._sum.quantity || 0) -
          (totalTransferred._sum.quantity || 0);

        return {
          ...item,
          stock,
          totalIncoming: totalIncoming._sum.quantity || 0,
          totalConsumed: totalConsumed._sum.quantity || 0,
          totalTransferred: totalTransferred._sum.quantity || 0,
        };
      })
    );

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

    const item = await (await db()).item.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        unit: unit?.trim() || 'টি',
        lowStockThreshold: lowStockThreshold !== undefined && lowStockThreshold !== null && lowStockThreshold !== '' ? parseInt(lowStockThreshold) : null,
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

    const item = await (await db()).item.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        unit: unit?.trim() || 'টি',
        lowStockThreshold: lowStockThreshold !== undefined && lowStockThreshold !== null && lowStockThreshold !== '' ? parseInt(lowStockThreshold) : null,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'আইটেম আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
