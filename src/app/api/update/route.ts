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
      if (data.symphony.status) {
        db.configs.symphony.status = data.symphony.status;
        db.configs.symphony.statusMessage = data.symphony.statusMessage || '';
      }
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
      if (db.configs.solarwinds) {
        db.configs.solarwinds.connected = true;
        if (data.solarwinds.status) {
          db.configs.solarwinds.status = data.solarwinds.status;
          db.configs.solarwinds.statusMessage = data.solarwinds.statusMessage || '';
        }
      }
      if (data.solarwinds.servers && data.solarwinds.servers.length > 0) {
        db.servers = data.solarwinds.servers.map((newSrv: any) => {
          const oldSrv = db.servers?.find(s => 
            s.id === newSrv.id || 
            s.name.toLowerCase() === newSrv.name.toLowerCase()
          );
          const history = oldSrv?.history && Array.isArray(oldSrv.history) ? oldSrv.history : Array.from({ length: 20 }, () => 0);
          
          const cpu = newSrv.cpu !== null ? newSrv.cpu : (oldSrv?.cpu ?? null);
          const memory = newSrv.memory !== null ? newSrv.memory : (oldSrv?.memory ?? null);
          const disk = newSrv.disk !== null ? newSrv.disk : (oldSrv?.disk ?? null);
          const backupStatus = newSrv.backupStatus !== null ? newSrv.backupStatus : (oldSrv?.backupStatus ?? 'N/A');

          const updatedHistory = [...history.slice(1), cpu || 0];
          return {
            ...newSrv,
            cpu,
            memory,
            disk,
            backupStatus,
            history: updatedHistory
          } as ServerData;
        });
      }
      if (data.solarwinds.networks && data.solarwinds.networks.length > 0) {
        const uniqueNets = new Map<string, NetworkData>();
        
        data.solarwinds.networks.forEach((newNet: Omit<NetworkData, 'history'>) => {
          let mappedProvider = newNet.provider;
          if (newNet.provider.toLowerCase().includes('rjio') || newNet.provider.toLowerCase().includes('jio')) {
            mappedProvider = 'RJIO';
          } else if (newNet.provider.toLowerCase().includes('railtel')) {
            mappedProvider = 'RailTel';
          } else if (newNet.provider.includes('HIL-UTK-EC-1')) {
            mappedProvider = 'HIL-UTK-EC-1';
          } else if (newNet.provider.includes('HIL-UTK-EC-2')) {
            mappedProvider = 'HIL-UTK-EC-2';
          }
          
          if (!uniqueNets.has(mappedProvider)) {
            const oldNet = db.networks?.find(n => 
              n.id === newNet.id || 
              n.provider.toLowerCase() === mappedProvider.toLowerCase() ||
              (n.provider.length > 2 && mappedProvider.toLowerCase().includes(n.provider.toLowerCase()))
            );
            
            const history = oldNet?.history && Array.isArray(oldNet.history) ? oldNet.history : Array.from({ length: 20 }, () => 0);
            const updatedHistory = [...history.slice(1), newNet.utilization];
            
            uniqueNets.set(mappedProvider, {
              ...newNet,
              provider: mappedProvider,
              history: updatedHistory
            } as NetworkData);
          }
        });
        
        db.networks = Array.from(uniqueNets.values());
      }
    }

    // Apply Nutanix Extension Data
    if (data.nutanix) {
      db.configs.nutanix.connected = true;
      if (data.nutanix.status) {
        db.configs.nutanix.status = data.nutanix.status;
        db.configs.nutanix.statusMessage = data.nutanix.statusMessage || '';
      }
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
      
      if (data.nutanix.serverDisks && Array.isArray(data.nutanix.serverDisks)) {
         data.nutanix.serverDisks.forEach((s: any) => {
            const srv = db.servers?.find(x => x.name.toLowerCase() === s.name.toLowerCase());
            if (srv) {
               srv.disk = s.disk;
            }
         });
      }
    }

    db.lastUpdated = Date.now();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Update API Error:', error);
    return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
  }
}
