import { NextResponse } from 'next/server';
import { getDb, writeDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbData = getDb();
    return NextResponse.json(dbData);
  } catch (error) {
    console.error('API GET Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve IT parameters' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { system, endpoint, username, authMethod, connected, secret } = body;
    
    if (!system || !['nutanix', 'symphony', 'isms', 'compliance'].includes(system)) {
      return NextResponse.json({ error: 'Invalid system specified' }, { status: 400 });
    }

    const db = getDb();
    
    // Simulate testing connection delay or just save directly
    db.configs[system as 'nutanix' | 'symphony' | 'isms' | 'compliance'] = {
      connected: connected !== undefined ? connected : true,
      endpoint: endpoint || '',
      username: username || '',
      authMethod: authMethod || 'API Key',
      secret: secret || ''
    };
    
    // update timestamp
    db.lastUpdated = Date.now();
    
    writeDb(db);
    
    return NextResponse.json({ success: true, config: db.configs[system as 'nutanix' | 'symphony' | 'isms' | 'compliance'] });
  } catch (error) {
    console.error('API POST Error:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
