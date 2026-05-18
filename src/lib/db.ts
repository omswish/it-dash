import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/lib/db.json');

export interface ServerData {
  id: string;
  name: string;
  location: string;
  status: 'operational' | 'degraded' | 'down';
  cpu: number;
  memory: number;
  disk: number;
  backupStatus: 'successful' | 'failed';
  history: number[];
}

export interface NetworkData {
  id: string;
  provider: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  latency: number;
  utilization: number;
  history: number[];
}

export interface SystemConfig {
  connected: boolean;
  endpoint: string;
  username: string;
  authMethod: string;
}

export interface NutanixMetrics {
  uptime: string;
  nodesCount: number;
  storageUsage: number;
  historyCpu: number[];
  historyMem: number[];
}

export interface SymphonyMetrics {
  openIncidents: number;
  serviceRequests: number;
  workOrders: number;
  changeRequests: number;
  serviceRequestsSla: number;
}

export interface IsmsObjective {
  id: string;
  name: string;
  progress: number;
  target: number;
}

export interface ComplianceMetrics {
  workstationsPatched: number;
  antivirusActive: number;
  dlpEnabled: number;
}

export interface DbSchema {
  lastUpdated: number;
  servers: ServerData[];
  networks: NetworkData[];
  configs: {
    nutanix: SystemConfig;
    symphony: SystemConfig;
    isms: SystemConfig;
    compliance: SystemConfig;
  };
  nutanix: NutanixMetrics;
  symphony: SymphonyMetrics;
  isms: IsmsObjective[];
  compliance: ComplianceMetrics;
}

function generateInitialData(): DbSchema {
  const generateHistory = (min: number, max: number) => {
    return Array.from({ length: 20 }, () => Math.floor(Math.random() * (max - min) + min));
  };

  return {
    lastUpdated: Date.now(),
    servers: [
      {
        id: 'srv-smartface',
        name: 'Smartface',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 42,
        memory: 58,
        disk: 48,
        backupStatus: 'successful',
        history: generateHistory(30, 60),
      },
      {
        id: 'srv-clms',
        name: 'CLMS',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 56,
        memory: 74,
        disk: 62,
        backupStatus: 'successful',
        history: generateHistory(45, 75),
      },
      {
        id: 'srv-dhcp',
        name: 'DHCP',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 18,
        memory: 38,
        disk: 25,
        backupStatus: 'successful',
        history: generateHistory(10, 30),
      },
      {
        id: 'srv-ilms-app',
        name: 'ILMS APP',
        location: 'Utkal Alumina',
        status: 'degraded',
        cpu: 78,
        memory: 88,
        disk: 69,
        backupStatus: 'successful',
        history: generateHistory(60, 90),
      },
      {
        id: 'srv-ilms-db',
        name: 'ILMS DB',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 32,
        memory: 64,
        disk: 91,
        backupStatus: 'failed',
        history: generateHistory(20, 50),
      }
    ],
    networks: [
      {
        id: 'net-rjio',
        provider: 'RJIO',
        status: 'operational',
        uptime: 99.99,
        latency: 8,
        utilization: 68,
        history: generateHistory(60, 80),
      },
      {
        id: 'net-railtel',
        provider: 'RailTel',
        status: 'operational',
        uptime: 99.92,
        latency: 18,
        utilization: 45,
        history: generateHistory(35, 60),
      }
    ],
    configs: {
      nutanix: { connected: false, endpoint: '', username: '', authMethod: 'SSH Key' },
      symphony: { connected: false, endpoint: '', username: '', authMethod: 'API Key' },
      isms: { connected: false, endpoint: '', username: '', authMethod: 'OAuth Client' },
      compliance: { connected: false, endpoint: '', username: '', authMethod: 'OAuth Client' }
    },
    nutanix: {
      uptime: '142d 8h 12m',
      nodesCount: 6,
      storageUsage: 68,
      historyCpu: generateHistory(40, 70),
      historyMem: generateHistory(55, 80)
    },
    symphony: {
      openIncidents: 4,
      serviceRequests: 18,
      workOrders: 12,
      changeRequests: 2,
      serviceRequestsSla: 94
    },
    isms: [
      { id: 'isms-risk', name: 'Annual Risk Assessments', progress: 100, target: 100 },
      { id: 'isms-train', name: 'Staff Security Awareness', progress: 85, target: 100 },
      { id: 'isms-audit', name: 'Internal Audit Resolved', progress: 90, target: 100 },
      { id: 'isms-inc', name: 'Incident Response Drills', progress: 50, target: 100 }
    ],
    compliance: {
      workstationsPatched: 94,
      antivirusActive: 98,
      dlpEnabled: 96
    }
  };
}

export function getDb(): DbSchema {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const initialData = generateInitialData();
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }

  try {
    const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
    let db = JSON.parse(fileContent) as DbSchema;
    
    // Auto seed if 10s have passed
    const now = Date.now();
    if (now - db.lastUpdated >= 10000) {
      db = autoSeed(db);
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    }
    
    return db;
  } catch (error) {
    console.error('Error reading/writing DB:', error);
    return generateInitialData();
  }
}

export function writeDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

function autoSeed(db: DbSchema): DbSchema {
  const now = Date.now();
  
  // Update servers
  const updatedServers = db.servers.map((server) => {
    let cpuDiff = Math.floor(Math.random() * 11) - 5;
    let newCpu = Math.max(5, Math.min(99, server.cpu + cpuDiff));
    let memDiff = Math.floor(Math.random() * 7) - 3;
    let newMem = Math.max(10, Math.min(99, server.memory + memDiff));
    let newDisk = server.disk;
    if (Math.random() > 0.9) newDisk = Math.min(100, server.disk + 1);
    
    let newStatus = server.status;
    if (Math.random() > 0.98) {
      newStatus = newStatus === 'operational' ? 'degraded' : 'operational';
    }

    let newBackup = server.backupStatus;
    if (Math.random() > 0.95) {
      newBackup = newBackup === 'successful' ? 'failed' : 'successful';
    }

    return {
      ...server,
      cpu: newCpu,
      memory: newMem,
      disk: newDisk,
      status: newStatus,
      backupStatus: newBackup,
      history: [...server.history.slice(1), newCpu],
    };
  });

  // Update networks
  const updatedNetworks = db.networks.map((net) => {
    let utilDiff = Math.floor(Math.random() * 15) - 7;
    let newUtil = Math.max(5, Math.min(100, net.utilization + utilDiff));
    let latDiff = Math.floor(Math.random() * 5) - 2;
    let newLat = Math.max(2, Math.min(100, net.latency + latDiff));
    
    let newStatus = net.status;
    if (Math.random() > 0.98) {
      newStatus = newStatus === 'operational' ? 'degraded' : 'operational';
    }

    return {
      ...net,
      utilization: newUtil,
      latency: newLat,
      status: newStatus,
      history: [...net.history.slice(1), newUtil],
    };
  });

  // Update Nutanix metrics if connected
  let updatedNutanix = { ...db.nutanix };
  if (db.configs.nutanix.connected) {
    let cpuDiff = Math.floor(Math.random() * 9) - 4;
    let currentCpu = db.nutanix.historyCpu[db.nutanix.historyCpu.length - 1];
    let newCpu = Math.max(10, Math.min(95, currentCpu + cpuDiff));

    let memDiff = Math.floor(Math.random() * 5) - 2;
    let currentMem = db.nutanix.historyMem[db.nutanix.historyMem.length - 1];
    let newMem = Math.max(20, Math.min(95, currentMem + memDiff));

    let storageDiff = Math.random() > 0.8 ? 1 : 0;

    updatedNutanix = {
      ...db.nutanix,
      storageUsage: Math.min(100, db.nutanix.storageUsage + storageDiff),
      historyCpu: [...db.nutanix.historyCpu.slice(1), newCpu],
      historyMem: [...db.nutanix.historyMem.slice(1), newMem]
    };
  }

  // Update Symphony Summit metrics if connected
  let updatedSymphony = { ...db.symphony };
  if (db.configs.symphony.connected) {
    const rand = Math.random();
    let incidents = db.symphony.openIncidents;
    let requests = db.symphony.serviceRequests;
    let orders = db.symphony.workOrders;
    let changes = db.symphony.changeRequests;

    if (rand > 0.85) {
      incidents = Math.max(0, incidents + (Math.random() > 0.6 ? 1 : -1));
      requests = Math.max(2, requests + (Math.random() > 0.5 ? 2 : -2));
      orders = Math.max(1, orders + (Math.random() > 0.5 ? 2 : -2));
      changes = Math.max(0, changes + (Math.random() > 0.8 ? 1 : -1));
    }

    updatedSymphony = {
      ...db.symphony,
      openIncidents: incidents,
      serviceRequests: requests,
      workOrders: orders,
      changeRequests: changes,
      serviceRequestsSla: Math.max(80, Math.min(100, db.symphony.serviceRequestsSla + (Math.random() > 0.5 ? 1 : -1)))
    };
  }

  // Update ISMS Objectives progress slowly if connected
  let updatedIsms = [...db.isms];
  if (db.configs.isms.connected) {
    updatedIsms = db.isms.map((obj) => {
      if (obj.progress < obj.target && Math.random() > 0.9) {
        return { ...obj, progress: Math.min(obj.target, obj.progress + 1) };
      }
      return obj;
    });
  }

  // Update Compliance metrics if connected
  let updatedCompliance = { ...db.compliance };
  if (db.configs.compliance.connected) {
    const rand = Math.random();
    if (rand > 0.9) {
      updatedCompliance = {
        workstationsPatched: Math.max(85, Math.min(100, db.compliance.workstationsPatched + (Math.random() > 0.5 ? 1 : -1))),
        antivirusActive: Math.max(90, Math.min(100, db.compliance.antivirusActive + (Math.random() > 0.5 ? 1 : -1))),
        dlpEnabled: Math.max(90, Math.min(100, db.compliance.dlpEnabled + (Math.random() > 0.5 ? 1 : -1)))
      };
    }
  }

  return {
    lastUpdated: now,
    servers: updatedServers,
    networks: updatedNetworks,
    configs: db.configs,
    nutanix: updatedNutanix,
    symphony: updatedSymphony,
    isms: updatedIsms,
    compliance: updatedCompliance
  };
}
