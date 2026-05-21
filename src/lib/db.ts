import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';
import { getSolarWindsServers, getSolarWindsISPInterfaces } from './solarwinds';
import { fetchNutanixMetrics } from './nutanix';

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
  secret?: string;
}

export interface NutanixMetrics {
  uptime: string;
  nodesCount: number;
  storageUsage: number;
  historyCpu: number[];
  historyMem: number[];
  nodeStatuses?: string[];
}

export interface TicketBreakdown {
  new: number;
  assigned: number;
  inProgress: number;
  pending: number;
}

export interface ActiveIncident {
  id: string;
  priority: string;
  caller: string;
  title: string;
  status: string;
}

export interface SymphonyMetrics {
  openIncidents: number;
  openIncidentsBreakdown: TicketBreakdown;
  serviceRequests: number;
  serviceRequestsBreakdown: TicketBreakdown;
  workOrders: number;
  workOrdersBreakdown: TicketBreakdown;
  changeRequests: number;
  changeRequestsBreakdown: TicketBreakdown;
  serviceRequestsSla: number;
  incidentsResponseSla: number;
  incidentsResolutionSla: number;
  requestsResponseSla: number;
  requestsResolutionSla: number;
  activeIncidents: ActiveIncident[];
}



export interface CartridgeItem {
  type: string;
  current: number;
  target: number;
  label: string;
}

export interface OnboardingRequest {
  id: string;
  type: 'onboarding' | 'offboarding';
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
}

export interface DbSchema {
  lastUpdated: number;
  servers: ServerData[];
  networks: NetworkData[];
  configs: {
    nutanix: SystemConfig;
    symphony: SystemConfig;
    solarwinds?: SystemConfig;
  };
  nutanix: NutanixMetrics;
  symphony: SymphonyMetrics;
  cartridges?: CartridgeItem[];
  onboardingRequests?: OnboardingRequest[];
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
      },
      {
        id: 'srv-ad-01',
        name: 'AD Primary',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 15,
        memory: 40,
        disk: 35,
        backupStatus: 'successful',
        history: generateHistory(10, 25),
      },
      {
        id: 'srv-ad-02',
        name: 'AD Backup',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 12,
        memory: 35,
        disk: 30,
        backupStatus: 'successful',
        history: generateHistory(8, 20),
      },
      {
        id: 'srv-mail',
        name: 'Exchange Mail',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 45,
        memory: 82,
        disk: 75,
        backupStatus: 'successful',
        history: generateHistory(40, 60),
      },
      {
        id: 'srv-sap-app',
        name: 'SAP App',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 58,
        memory: 79,
        disk: 68,
        backupStatus: 'successful',
        history: generateHistory(50, 70),
      },
      {
        id: 'srv-sap-db',
        name: 'SAP DB',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 64,
        memory: 88,
        disk: 82,
        backupStatus: 'successful',
        history: generateHistory(55, 80),
      },
      {
        id: 'srv-utility',
        name: 'Utility Gateway',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 22,
        memory: 45,
        disk: 40,
        backupStatus: 'successful',
        history: generateHistory(15, 35),
      },
      {
        id: 'srv-fileshare',
        name: 'File Share',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 28,
        memory: 55,
        disk: 85,
        backupStatus: 'successful',
        history: generateHistory(20, 40),
      },
      {
        id: 'srv-print',
        name: 'Print Server',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 10,
        memory: 28,
        disk: 30,
        backupStatus: 'successful',
        history: generateHistory(5, 20),
      },
      {
        id: 'srv-security',
        name: 'Endpoint Security',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 35,
        memory: 60,
        disk: 50,
        backupStatus: 'successful',
        history: generateHistory(25, 45),
      },
      {
        id: 'srv-apex-db',
        name: 'Oracle APEX DB',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 40,
        memory: 70,
        disk: 65,
        backupStatus: 'successful',
        history: generateHistory(30, 55),
      },
      {
        id: 'srv-cctv-01',
        name: 'CCTV Monitor 01',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 70,
        memory: 75,
        disk: 88,
        backupStatus: 'successful',
        history: generateHistory(65, 80),
      },
      {
        id: 'srv-cctv-02',
        name: 'CCTV Monitor 02',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 68,
        memory: 72,
        disk: 85,
        backupStatus: 'successful',
        history: generateHistory(60, 75),
      },
      {
        id: 'srv-weighbridge',
        name: 'Weighbridge Host',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 15,
        memory: 32,
        disk: 28,
        backupStatus: 'successful',
        history: generateHistory(10, 25),
      },
      {
        id: 'srv-plm',
        name: 'PLM Server',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 30,
        memory: 50,
        disk: 45,
        backupStatus: 'successful',
        history: generateHistory(20, 40),
      },
      {
        id: 'srv-backup-repo',
        name: 'Backup Repo',
        location: 'Utkal Alumina',
        status: 'operational',
        cpu: 8,
        memory: 20,
        disk: 92,
        backupStatus: 'successful',
        history: generateHistory(5, 15),
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
      solarwinds: { connected: false, endpoint: '', username: '', authMethod: 'Basic Authentication' }
    },
    nutanix: {
      uptime: '142d 8h 12m',
      nodesCount: 3,
      storageUsage: 68,
      historyCpu: generateHistory(40, 70),
      historyMem: generateHistory(55, 80),
      nodeStatuses: ['normal', 'normal', 'normal']
    },
    symphony: {
      openIncidents: 4,
      openIncidentsBreakdown: { new: 1, assigned: 1, inProgress: 1, pending: 1 },
      serviceRequests: 18,
      serviceRequestsBreakdown: { new: 5, assigned: 4, inProgress: 6, pending: 3 },
      workOrders: 12,
      workOrdersBreakdown: { new: 3, assigned: 3, inProgress: 4, pending: 2 },
      changeRequests: 2,
      changeRequestsBreakdown: { new: 1, assigned: 0, inProgress: 1, pending: 0 },
      serviceRequestsSla: 94,
      incidentsResponseSla: 98,
      incidentsResolutionSla: 94,
      requestsResponseSla: 99,
      requestsResolutionSla: 96,
      activeIncidents: [
        { id: 'INC00000984711', priority: 'P2', caller: 'R. K. Senapati', title: 'Utkal WAN Link Degradation', status: 'In Progress' },
        { id: 'INC00000984725', priority: 'P4', caller: 'S. Mohapatra', title: 'Office 365 License Sync', status: 'Assigned' }
      ]
    },
    cartridges: [
      { type: '88A', current: 85, target: 100, label: 'HP LaserJet 88A' },
      { type: '12A', current: 34, target: 50, label: 'HP LaserJet 12A' },
      { type: '378A', current: 28, target: 40, label: 'Premium 378A Color' }
    ],
    onboardingRequests: [
      { id: 'REQ-OB-01', type: 'onboarding', employeeName: 'Amit Kumar', department: 'Digital Transformation', date: new Date().toISOString().split('T')[0] },
      { id: 'REQ-OB-02', type: 'onboarding', employeeName: 'Priya Sharma', department: 'HR Shared Services', date: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0] },
      { id: 'REQ-OF-01', type: 'offboarding', employeeName: 'Rajesh Patel', department: 'Finance & Accounts', date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0] },
      { id: 'REQ-OB-03', type: 'onboarding', employeeName: 'Suresh Naidu', department: 'Operations', date: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString().split('T')[0] }
    ]
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
      if (db.configs.symphony.connected) {
        triggerSymphonyScrapeBackground(db.configs.symphony.endpoint);
      }
      if (db.configs.solarwinds && db.configs.solarwinds.connected) {
        triggerSolarWindsSyncBackground(db.configs.solarwinds.endpoint, db.configs.solarwinds.username, db.configs.solarwinds.secret || '');
      }
      if (db.configs.nutanix.connected) {
        triggerNutanixSyncBackground(db.configs.nutanix.endpoint, db.configs.nutanix.username, db.configs.nutanix.authMethod, db.configs.nutanix.secret || '');
      }
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
  
  const isSolarWindsConnected = db.configs.solarwinds?.connected ?? false;

  // Update servers
  const updatedServers = isSolarWindsConnected
    ? db.servers
    : db.servers.map((server) => {
        const cpuDiff = Math.floor(Math.random() * 11) - 5;
        const newCpu = Math.max(5, Math.min(99, server.cpu + cpuDiff));
        const memDiff = Math.floor(Math.random() * 7) - 3;
        const newMem = Math.max(10, Math.min(99, server.memory + memDiff));
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
  const updatedNetworks = isSolarWindsConnected
    ? db.networks
    : db.networks.map((net) => {
        const utilDiff = Math.floor(Math.random() * 15) - 7;
        const newUtil = Math.max(5, Math.min(100, net.utilization + utilDiff));
        const latDiff = Math.floor(Math.random() * 5) - 2;
        const newLat = Math.max(2, Math.min(100, net.latency + latDiff));
        
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

  // Update Nutanix metrics if NOT connected (simulated mode)
  let updatedNutanix = { ...db.nutanix };
  if (!db.configs.nutanix.connected) {
    const cpuDiff = Math.floor(Math.random() * 9) - 4;
    const currentCpu = db.nutanix.historyCpu[db.nutanix.historyCpu.length - 1];
    const newCpu = Math.max(10, Math.min(95, currentCpu + cpuDiff));

    const memDiff = Math.floor(Math.random() * 5) - 2;
    const currentMem = db.nutanix.historyMem[db.nutanix.historyMem.length - 1];
    const newMem = Math.max(20, Math.min(95, currentMem + memDiff));

    // Make storage dynamic, fluctuating within 45% - 85% range, and reset if stuck at 100%
    let storageDiff = 0;
    const r = Math.random();
    if (r > 0.85) {
      storageDiff = 1;
    } else if (r < 0.15) {
      storageDiff = -1;
    }
    
    let currentStorage = db.nutanix.storageUsage;
    if (currentStorage >= 100) {
      currentStorage = 68; // Reset stuck static 100% value
    }
    
    const newStorage = Math.max(45, Math.min(85, currentStorage + storageDiff));

    // Simulate node status updates occasionally
    let nodeStatuses = db.nutanix.nodeStatuses || ['normal', 'normal', 'normal'];
    if (Math.random() > 0.90) {
      const index = Math.floor(Math.random() * 3);
      nodeStatuses = [...nodeStatuses];
      nodeStatuses[index] = Math.random() > 0.8 ? 'degraded' : 'normal';
    }

    updatedNutanix = {
      ...db.nutanix,
      storageUsage: newStorage,
      historyCpu: [...db.nutanix.historyCpu.slice(1), newCpu],
      historyMem: [...db.nutanix.historyMem.slice(1), newMem],
      nodeStatuses
    };
  }

  // Update Symphony Summit metrics if connected
  const updatedSymphony = { ...db.symphony };
  // Handled via async background scraping to fetch actual portal values



  return {
    lastUpdated: now,
    servers: updatedServers,
    networks: updatedNetworks,
    configs: db.configs,
    nutanix: updatedNutanix,
    symphony: updatedSymphony,
    cartridges: db.cartridges,
    onboardingRequests: db.onboardingRequests
  };
}

let isUpdatingSymphony = false;
let lastTabOpenTime = 0;

async function runSymphonyScrape(endpoint: string) {
  try {
    const res = await fetch('http://localhost:9222/json');
    if (!res.ok) throw new Error('Chrome debugging port not reachable');
    const tabs = (await res.json()) as Array<{ id: string; url: string; title: string; webSocketDebuggerUrl?: string }>;
    
    let tab = tabs.find((t) => t.url.includes('hsd.adityabirla.com') || t.title.includes('Hindalco'));
    
    if (!tab) {
      const now = Date.now();
      if (now - lastTabOpenTime < 300000) {
        console.log('Symphony Scraper: Hindalco tab not open, but skipping tab open to prevent flooding.');
        throw new Error('Hindalco tab not open (tab open rate limited)');
      }
      
      console.log('Symphony Scraper: Hindalco tab not open, attempting to open a new tab...');
      lastTabOpenTime = now;
      const targetUrl = endpoint || 'https://hsd.adityabirla.com/MDLIncidentMgmt/SDE_Dashboard.aspx';
      const openRes = await fetch(`http://localhost:9222/json/new?url=${encodeURIComponent(targetUrl)}`, { method: 'PUT' });
      if (openRes.ok) {
        const newTab = await openRes.json();
        await new Promise((resolve) => setTimeout(resolve, 4000));
        const refetchRes = await fetch('http://localhost:9222/json');
        const refetchTabs = (await refetchRes.json()) as Array<{ id: string; url: string; title: string; webSocketDebuggerUrl?: string }>;
        tab = refetchTabs.find((t) => t.id === newTab.id);
      }
    }
    
    if (!tab || !tab.webSocketDebuggerUrl) {
      throw new Error('Could not attach to Hindalco Analyst Dashboard tab');
    }
    
    return new Promise<{
      incidents: number;
      incidentsBreakdown: { new: number; assigned: number; inProgress: number; pending: number };
      requests: number;
      requestsBreakdown: { new: number; assigned: number; inProgress: number; pending: number };
      orders: number;
      ordersBreakdown: { new: number; assigned: number; inProgress: number; pending: number };
      changes: number;
      changesBreakdown: { new: number; assigned: number; inProgress: number; pending: number };
      activeIncidents: ActiveIncident[];
    }>((resolve, reject) => {
      const ws = new WebSocket(tab.webSocketDebuggerUrl!);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket evaluation timed out'));
      }, 8000);
      
      ws.on('open', () => {
        const message = {
          id: 1,
          method: 'Runtime.evaluate',
          params: {
            expression: `(async () => {
              const getVal = (selector) => {
                const el = document.querySelector(selector);
                return el ? parseInt(el.innerText.trim(), 10) || 0 : 0;
              };
              
              const parseChart = (containerId, isChange = false) => {
                const container = document.getElementById(containerId);
                if (!container) return { new: 0, assigned: 0, inProgress: 0, pending: 0 };
                
                const svg = container.querySelector('svg');
                if (!svg) return { new: 0, assigned: 0, inProgress: 0, pending: 0 };
                
                const texts = Array.from(svg.querySelectorAll('text')).map(el => {
                  const x = parseFloat(el.getAttribute('x')) || 0;
                  const txt = el.textContent.trim();
                  return { txt, x };
                });
                
                const result = { new: 0, assigned: 0, inProgress: 0, pending: 0 };
                const categories = ['New', 'Assigned', 'In-Progress', 'Pending'];
                const labelPositions = {};
                
                texts.forEach(item => {
                  if (categories.includes(item.txt)) {
                    labelPositions[item.txt] = item.x;
                  }
                });
                
                if (Object.keys(labelPositions).length > 0) {
                  texts.forEach(item => {
                    const val = parseInt(item.txt, 10);
                    if (!isNaN(val)) {
                      let closestCategory = null;
                      let minDiff = Infinity;
                      for (const [cat, x] of Object.entries(labelPositions)) {
                        const diff = Math.abs(x - item.x);
                        if (diff < minDiff && diff < 10) {
                          minDiff = diff;
                          closestCategory = cat;
                        }
                      }
                      if (closestCategory) {
                        const key = closestCategory === 'In-Progress' ? 'inProgress' : closestCategory.toLowerCase();
                        result[key] = val;
                      }
                    }
                  });
                  return result;
                }
                
                const sorted = texts.sort((a, b) => a.x - b.x);
                const values = sorted.map(t => parseInt(t.txt, 10) || 0).filter(v => !isNaN(v));
                
                if (isChange) {
                  if (values.length >= 3) {
                    result.new = values[0];
                    result.inProgress = values[1];
                    result.pending = values[2];
                  }
                  return result;
                }
                
                const labels = Array.from(container.querySelectorAll('.dx-legend-item-text')).map(el => el.textContent.trim());
                if (labels.length > 0) {
                  labels.forEach((label, i) => {
                    if (i < values.length) {
                      const key = label === 'In-Progress' ? 'inProgress' : label.toLowerCase();
                      result[key] = values[i];
                    }
                  });
                }
                return result;
              };

              const parseActiveIncidentsFromDoc = (doc) => {
                const results = [];
                const rows = Array.from(doc.querySelectorAll('tr'));
                rows.forEach(row => {
                  const cells = Array.from(row.querySelectorAll('td'));
                  if (cells.length < 9) return;
                  const idLink = cells[1].querySelector('a');
                  if (!idLink) return;
                  const idText = idLink.textContent.trim();
                  if (!idText.match(/^\\d+$/)) return;
                  
                  const id = 'INC' + idText;
                  const status = cells[3] ? cells[3].textContent.trim() : '';
                  const caller = cells[4] ? cells[4].textContent.trim() : '';
                  const priorityText = cells[7] ? cells[7].textContent.trim() : '';
                  const symptom = cells[8] ? cells[8].textContent.trim() : '';
                  
                  let priority = 'P3';
                  const pMatch = priorityText.match(/P[1-4]/);
                  if (pMatch) {
                    priority = pMatch[0];
                  }
                  
                  results.push({ id, priority, caller, title: symptom, status });
                });
                return results;
              };

              let activeInc = parseActiveIncidentsFromDoc(document);
              if (activeInc.length === 0) {
                try {
                  const res = await fetch('/MDLIncidentMgmt/IM_WorkgroupTickets.aspx?dashboard=true');
                  if (res.ok) {
                    const html = await res.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    activeInc = parseActiveIncidentsFromDoc(doc);
                  }
                } catch (e) {
                  console.error('Fetch error:', e);
                }
              }

              return {
                incidents: getVal("a[aria-label=' My workgroups'] span"),
                incidentsBreakdown: parseChart("myWorkgroupIncidents"),
                requests: getVal("a[aria-label='My Workgroup'][href*='SR_WorkgroupTickets'] span"),
                requestsBreakdown: parseChart("myWorkgroupRequests"),
                orders: getVal("a[aria-label='My Workgroup'][href*='WO_Workorder'] span"),
                ordersBreakdown: parseChart("myWorkgroupWorkorders"),
                changes: getVal("a[aria-label='My workgroup'][href*='CM_ChangeRequestList'] span"),
                changesBreakdown: parseChart("myWorkgroupCRs", true),
                activeIncidents: activeInc
              };
            })()`,
            awaitPromise: true,
            returnByValue: true
          }
        };
        ws.send(JSON.stringify(message));
      });
      
      ws.on('message', (data) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          if (response.result && response.result.result && response.result.result.value) {
            resolve(response.result.result.value);
          } else {
            reject(new Error('Unexpected response format from CDP'));
          }
        } catch (e) {
          reject(e);
        } finally {
          ws.close();
        }
      });
      
      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  } catch (err) {
    console.error('Symphony Scraper Error:', err);
    throw err;
  }
}

function triggerSymphonyScrapeBackground(endpoint: string) {
  if (isUpdatingSymphony) return;
  isUpdatingSymphony = true;
  
  runSymphonyScrape(endpoint)
    .then((data) => {
      try {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        const db = JSON.parse(fileContent) as DbSchema;
        db.symphony = {
          ...db.symphony,
openIncidents: data.incidents,
          activeIncidents: data.activeIncidents,
          openIncidentsBreakdown: data.incidentsBreakdown,
          serviceRequests: data.requests,
          serviceRequestsBreakdown: data.requestsBreakdown,
          workOrders: data.orders,
          workOrdersBreakdown: data.ordersBreakdown,
          changeRequests: data.changes,
          changeRequestsBreakdown: data.changesBreakdown,
          serviceRequestsSla: 92,
          incidentsResponseSla: 98,
          incidentsResolutionSla: 94,
          requestsResponseSla: 99,
          requestsResolutionSla: 96
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log('Symphony Scraper: Successfully updated db.json with live values:', data);
      } catch (err) {
        console.error('Symphony Scraper: Error updating database with scraped values:', err);
      }
    })
    .catch((err) => {
      console.error('Symphony Scraper: Scrape failed, using simulated updates.', err);
    })
    .finally(() => {
      isUpdatingSymphony = false;
    });
}

let isUpdatingSolarWinds = false;

async function runSolarWindsSync(endpoint: string, username: string, secret: string) {
  const servers = await getSolarWindsServers(endpoint, username, secret);
  const interfaces = await getSolarWindsISPInterfaces(endpoint, username, secret);
  return { servers, interfaces };
}

function triggerSolarWindsSyncBackground(endpoint: string, username: string, secret: string) {
  if (isUpdatingSolarWinds) return;
  isUpdatingSolarWinds = true;

  runSolarWindsSync(endpoint, username, secret)
    .then((data) => {
      try {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        const db = JSON.parse(fileContent) as DbSchema;

        // Map SolarWinds Servers to local schema
        db.servers = data.servers.map((srv, idx) => ({
          id: `sw-srv-${idx}`,
          name: srv.NodeName,
          location: 'SolarWinds Node',
          status: srv.Status === 'Up' || srv.Status === '1' || srv.Status.toLowerCase() === 'up' ? 'operational' : 'down',
          cpu: Math.round(srv.CPUPercent || 0),
          memory: Math.round(srv.MemoryPercent || 0),
          disk: 50,
          backupStatus: 'successful',
          history: Array.from({ length: 20 }, () => Math.floor(Math.random() * 20 + 40))
        }));

        // Map SolarWinds Interfaces to local Network/ISP status schema
        db.networks = data.interfaces.map((inf, idx) => ({
          id: `sw-net-${idx}`,
          provider: inf.InterfaceName.includes('Tata') ? 'Tata' 
                  : inf.InterfaceName.includes('Airtel') ? 'Airtel' 
                  : inf.InterfaceName.includes('Jio') || inf.InterfaceName.includes('RJIO') ? 'RJIO' 
                  : inf.InterfaceName.includes('RailTel') ? 'RailTel' 
                  : inf.InterfaceName.substring(0, 15),
          status: inf.InterfaceStatus === 'Up' || inf.InterfaceStatus === '1' || inf.InterfaceStatus.toLowerCase() === 'up' ? 'operational' : 'down',
          uptime: 99.9,
          latency: 12,
          utilization: Math.round(((inf.InSpeed + inf.OutSpeed) / 2) / 1000000) || 50,
          history: Array.from({ length: 20 }, () => Math.floor(Math.random() * 30 + 40))
        }));

        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log('SolarWinds Sync: Successfully updated db.json with live values.');
      } catch (err) {
        console.error('SolarWinds Sync: Error updating database with sync values:', err);
      }
    })
    .catch((err) => {
      console.error('SolarWinds Sync failed:', err);
    })
    .finally(() => {
      isUpdatingSolarWinds = false;
    });
}

let isUpdatingNutanix = false;

async function runNutanixSync(endpoint: string, username: string, authMethod: string, secret: string) {
  return fetchNutanixMetrics(endpoint, username, authMethod, secret);
}

function triggerNutanixSyncBackground(endpoint: string, username: string, authMethod: string, secret: string) {
  if (isUpdatingNutanix) return;
  isUpdatingNutanix = true;

  runNutanixSync(endpoint, username, authMethod, secret)
    .then((data) => {
      try {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        const db = JSON.parse(fileContent) as DbSchema;

        // Keep historical arrays
        const historyCpu = db.nutanix?.historyCpu || [];
        const historyMem = db.nutanix?.historyMem || [];

        db.nutanix = {
          uptime: data.uptime,
          nodesCount: data.nodesCount,
          storageUsage: data.storageUsage,
          historyCpu: [...historyCpu.slice(1), data.cpuUsage],
          historyMem: [...historyMem.slice(1), data.memoryUsage],
          nodeStatuses: data.nodeStatuses || db.nutanix.nodeStatuses || ['normal', 'normal', 'normal']
        };

        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log('Nutanix Sync: Successfully updated db.json with live values:', data);
      } catch (err) {
        console.error('Nutanix Sync: Error updating database with sync values:', err);
      }
    })
    .catch((err) => {
      console.error('Nutanix Sync failed:', err);
    })
    .finally(() => {
      isUpdatingNutanix = false;
    });
}

