import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DbSchema, ServerData, NetworkData } from '@/lib/db';

const DB_PATH = path.join(process.cwd(), 'src/lib/db.json');

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }

    const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(fileContent) as DbSchema;

    // Apply Symphony Extension Data
    if (data.symphony) {
      console.log('--- INCOMING SYMPHONY PAYLOAD ---', JSON.stringify(data.symphony));
      db.configs.symphony.connected = true;
      db.symphony = {
        ...db.symphony,
        openIncidents: data.symphony.incidents ?? db.symphony.openIncidents,
        openIncidentsBreakdown: data.symphony.incidentsBreakdown ?? db.symphony.openIncidentsBreakdown,
        serviceRequests: data.symphony.requests ?? db.symphony.serviceRequests,
        serviceRequestsBreakdown: data.symphony.requestsBreakdown ?? db.symphony.serviceRequestsBreakdown,
        workOrders: data.symphony.orders ?? db.symphony.workOrders,
        workOrdersBreakdown: data.symphony.ordersBreakdown ?? db.symphony.workOrdersBreakdown,
        changeRecords: data.symphony.changes ?? db.symphony.changeRecords,
        changeRecordsBreakdown: data.symphony.changesBreakdown ?? db.symphony.changeRecordsBreakdown,
        incidentsResponseSla: data.symphony.incidentsResponseSla ?? db.symphony.incidentsResponseSla,
        incidentsResolutionSla: data.symphony.incidentsResolutionSla ?? db.symphony.incidentsResolutionSla,
        requestsResponseSla: data.symphony.requestsResponseSla ?? db.symphony.requestsResponseSla,
        requestsResolutionSla: data.symphony.requestsResolutionSla ?? db.symphony.requestsResolutionSla,
        activeIncidents: data.symphony.activeIncidents ?? db.symphony.activeIncidents,
      };
    }

    // Apply SolarWinds Extension Data
    if (data.solarwinds) {
      if (db.configs.solarwinds) db.configs.solarwinds.connected = true;
      if (data.solarwinds.servers && data.solarwinds.servers.length > 0) {
        db.servers = data.solarwinds.servers.map((newSrv: Omit<ServerData, 'history'>) => {
          const oldSrv = db.servers?.find(s => 
            s.id === newSrv.id || 
            s.name.toLowerCase() === newSrv.name.toLowerCase()
          );
          const history = oldSrv?.history && Array.isArray(oldSrv.history) ? oldSrv.history : Array.from({ length: 20 }, () => 0);
          const updatedHistory = [...history.slice(1), newSrv.cpu];
          return {
            ...newSrv,
            history: updatedHistory
          } as ServerData;
        });
      }
      if (data.solarwinds.networks && data.solarwinds.networks.length > 0) {
        db.networks = data.solarwinds.networks.map((newNet: Omit<NetworkData, 'history'>) => {
          const oldNet = db.networks?.find(n => 
            n.id === newNet.id || 
            n.provider.toLowerCase() === newNet.provider.toLowerCase() ||
            (n.provider.length > 2 && newNet.provider.toLowerCase().includes(n.provider.toLowerCase())) ||
            (newNet.provider.length > 2 && n.provider.toLowerCase().includes(newNet.provider.toLowerCase()))
          );
          const history = oldNet?.history && Array.isArray(oldNet.history) ? oldNet.history : Array.from({ length: 20 }, () => 0);
          const updatedHistory = [...history.slice(1), newNet.utilization];
          
          let mappedProvider = newNet.provider;
          if (newNet.provider.toLowerCase().includes('rjio') || newNet.provider.toLowerCase().includes('jio')) {
            mappedProvider = 'RJIO';
          } else if (newNet.provider.toLowerCase().includes('railtel')) {
            mappedProvider = 'RailTel';
          }
          
          return {
            ...newNet,
            provider: mappedProvider,
            history: updatedHistory
          } as NetworkData;
        });
      }
    }

    // Apply Nutanix Extension Data
    if (data.nutanix) {
      db.configs.nutanix.connected = true;
      const historyCpu = db.nutanix?.historyCpu || Array.from({length:20}, ()=>0);
      const historyMem = db.nutanix?.historyMem || Array.from({length:20}, ()=>0);
      
      db.nutanix = {
        ...db.nutanix,
        uptime: data.nutanix.uptime ?? db.nutanix.uptime,
        nodesCount: data.nutanix.nodesCount ?? db.nutanix.nodesCount,
        storageUsage: data.nutanix.storageUsage ?? db.nutanix.storageUsage,
        nodeStatuses: data.nutanix.nodeStatuses ?? db.nutanix.nodeStatuses,
        historyCpu: [...historyCpu.slice(1), data.nutanix.cpu ?? 0],
        historyMem: [...historyMem.slice(1), data.nutanix.mem ?? 0],
      };
    }

    db.lastUpdated = Date.now();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Update API Error:', error);
    return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
  }
}
