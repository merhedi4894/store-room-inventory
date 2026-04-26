import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/dashboard - Get dashboard statistics (optimized with parallel queries)
export async function GET() {
  try {
    const database = await db();

    // Run all independent queries in parallel
    const [
      totalItems,
      totalIncomingRecords,
      totalConsumedRecords,
      totalTransferredRecords,
      totalIncomingQty,
      totalConsumedQty,
      totalTransferredQty,
      recentIncoming,
      recentConsumed,
      recentTransferred,
      allItems,
    ] = await Promise.all([
      database.item.count(),
      database.incomingItem.count(),
      database.consumedItem.count(),
      database.transferredItem.count(),
      database.incomingItem.aggregate({ _sum: { quantity: true } }),
      database.consumedItem.aggregate({ _sum: { quantity: true } }),
      database.transferredItem.aggregate({ _sum: { quantity: true } }),
      database.incomingItem.findMany({
        orderBy: { date: 'desc' },
        take: 10,
        include: { item: true },
      }),
      database.consumedItem.findMany({
        orderBy: { date: 'desc' },
        take: 10,
        include: { item: true },
      }),
      database.transferredItem.findMany({
        orderBy: { date: 'desc' },
        take: 10,
        include: { item: true },
      }),
      database.item.findMany(),
    ]);

    // Low stock items - batch aggregate instead of N+1 queries
    const itemsWithThreshold = allItems.filter(
      (item) => item.lowStockThreshold !== null && item.lowStockThreshold !== undefined
    );

    const lowStockItems = [];
    if (itemsWithThreshold.length > 0) {
      const itemIds = itemsWithThreshold.map((i) => i.id);

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

      for (const item of itemsWithThreshold) {
        const stock = (incMap.get(item.id) || 0) - (conMap.get(item.id) || 0) - (traMap.get(item.id) || 0);
        if (stock <= item.lowStockThreshold) {
          lowStockItems.push({ ...item, stock });
        }
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
