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
    const { system, endpoint, endpointNetwork, username, authMethod, connected, secret } = body;
    
    if (!system || !['nutanix', 'symphony', 'solarwinds'].includes(system)) {
      return NextResponse.json({ error: 'Invalid system specified' }, { status: 400 });
    }

    if (connected) {
      if (system === 'solarwinds') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        let host = endpoint.trim();
        let port = '17774';
        if (host.includes('//')) host = host.split('//')[1];
        if (host.includes('/')) host = host.split('/')[0];
        if (host.includes(':')) {
          const parts = host.split(':');
          host = parts[0];
          port = parts[1];
        }
        const url = `https://${host}:${port}/SolarWinds/InformationService/v3/Json/Query`;
        const auth = Buffer.from(`${username}:${secret}`).toString('base64');
        
        try {
          const testRes = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: "SELECT TOP 1 NodeID FROM Orion.Nodes" }),
            signal: AbortSignal.timeout(5000)
          });
          
          if (!testRes.ok) {
            console.warn('Authentication failed. Check credentials, but saving config anyway.');
          }
        } catch (err) {
          console.warn('Connection timed out or host unreachable. Saving config for background scraper fallback.');
        }
      } else {
        // For Nutanix / Symphony, test if the URL is minimally reachable
        try {
          let testUrl = endpoint;
          if (!testUrl.startsWith('http')) {
            testUrl = `https://${testUrl}`;
          }
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
          await fetch(testUrl, { method: 'GET', signal: AbortSignal.timeout(5000) });
        } catch (err) {
          console.warn('Endpoint is unreachable or timed out. Saving config for background scraper fallback.');
        }
      }
    }

    const db = getDb();
    
    db.configs[system as 'nutanix' | 'symphony' | 'solarwinds'] = {
      connected: connected !== undefined ? connected : true,
      endpoint: endpoint || '',
      endpointNetwork: endpointNetwork,
      username: username || '',
      authMethod: authMethod || 'API Key',
      secret: secret || ''
    };
    
    // update timestamp
    db.lastUpdated = Date.now();
    
    writeDb(db);
    
    return NextResponse.json({ success: true, config: db.configs[system as 'nutanix' | 'symphony' | 'solarwinds'] });
  } catch (error) {
    console.error('API POST Error:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}
