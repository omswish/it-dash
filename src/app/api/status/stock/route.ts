import { NextResponse } from 'next/server';
import { getDb, writeDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cartridges } = body;
    if (!cartridges || !Array.isArray(cartridges)) {
      return NextResponse.json({ error: 'Invalid cartridges list' }, { status: 400 });
    }

    const db = getDb();
    db.cartridges = cartridges;
    db.lastUpdated = Date.now();
    writeDb(db);

    return NextResponse.json({ success: true, cartridges: db.cartridges });
  } catch (error) {
    console.error('API stock POST Error:', error);
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
  }
}
