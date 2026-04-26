import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/dashboard - Get dashboard statistics
export async function GET() {
  try {
    const totalItems = await (await db()).item.count();

    const totalIncomingRecords = await (await db()).incomingItem.count();
    const totalConsumedRecords = await (await db()).consumedItem.count();
    const totalTransferredRecords = await (await db()).transferredItem.count();

    const totalIncomingQty = await (await db()).incomingItem.aggregate({
      _sum: { quantity: true },
    });

    const totalConsumedQty = await (await db()).consumedItem.aggregate({
      _sum: { quantity: true },
    });

    const totalTransferredQty = await (await db()).transferredItem.aggregate({
      _sum: { quantity: true },
    });

    // Recent activities (last 20)
    const recentIncoming = await (await db()).incomingItem.findMany({
      orderBy: { date: 'desc' },
      take: 10,
      include: { item: true },
    });

    const recentConsumed = await (await db()).consumedItem.findMany({
      orderBy: { date: 'desc' },
      take: 10,
      include: { item: true },
    });

    const recentTransferred = await (await db()).transferredItem.findMany({
      orderBy: { date: 'desc' },
      take: 10,
      include: { item: true },
    });

    // Low stock items (stock <= item's lowStockThreshold, only if threshold is set)
    const allItems = await (await db()).item.findMany();
    const lowStockItems = [];

    for (const item of allItems) {
      if (item.lowStockThreshold === null || item.lowStockThreshold === undefined) continue;
      const inc = await (await db()).incomingItem.aggregate({ _sum: { quantity: true }, where: { itemId: item.id } });
      const con = await (await db()).consumedItem.aggregate({ _sum: { quantity: true }, where: { itemId: item.id } });
      const tra = await (await db()).transferredItem.aggregate({ _sum: { quantity: true }, where: { itemId: item.id } });

      const stock = (inc._sum.quantity || 0) - (con._sum.quantity || 0) - (tra._sum.quantity || 0);
      if (stock <= item.lowStockThreshold) {
        lowStockItems.push({ ...item, stock });
      }
    }

    return NextResponse.json({
      totalItems,
      totalIncomingRecords,
      totalConsumedRecords,
      totalTransferredRecords,
      totalIncomingQty: totalIncomingQty._sum.quantity || 0,
      totalConsumedQty: totalConsumedQty._sum.quantity || 0,
      totalTransferredQty: totalTransferredQty._sum.quantity || 0,
      recentIncoming,
      recentConsumed,
      recentTransferred,
      lowStockItems,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
