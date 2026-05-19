import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

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

export interface IsmsObjective {
  id: string;
  name: string;
  progress: number;
  target: number;
}

export interface ComplianceMetrics {
  serverOs: number;
  serverPatch: number;
  endpointCsClient: number;
  endpointCsPatch: number;
  endpointIntuneClient: number;
  endpointIntunePatch: number;
  endpointClearpass: number;
  endpointSupportedOs: number;
  endpointSamAgent: number;
  endpointHsd: number;
  endpointDomain: number;
  endpointBitlocker: number;
  endpointAverage: number;
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
      nodesCount: 3,
      storageUsage: 68,
      historyCpu: generateHistory(40, 70),
      historyMem: generateHistory(55, 80)
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
    isms: [
      { id: 'isms-risk', name: 'Annual Risk Assessments', progress: 100, target: 100 },
      { id: 'isms-train', name: 'Staff Security Awareness', progress: 85, target: 100 },
      { id: 'isms-audit', name: 'Internal Audit Resolved', progress: 90, target: 100 },
      { id: 'isms-inc', name: 'Incident Response Drills', progress: 50, target: 100 }
    ],
    compliance: {
      serverOs: 96,
      serverPatch: 94,
      endpointCsClient: 98,
      endpointCsPatch: 96,
      endpointIntuneClient: 97,
      endpointIntunePatch: 95,
      endpointClearpass: 99,
      endpointSupportedOs: 98,
      endpointSamAgent: 94,
      endpointHsd: 100,
      endpointDomain: 99,
      endpointBitlocker: 97,
      endpointAverage: 97.4
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
      if (db.configs.symphony.connected) {
        triggerSymphonyScrapeBackground(db.configs.symphony.endpoint);
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
    
    let newStorage = Math.max(45, Math.min(85, currentStorage + storageDiff));

    updatedNutanix = {
      ...db.nutanix,
      storageUsage: newStorage,
      historyCpu: [...db.nutanix.historyCpu.slice(1), newCpu],
      historyMem: [...db.nutanix.historyMem.slice(1), newMem]
    };
  }

  // Update Symphony Summit metrics if connected
  let updatedSymphony = { ...db.symphony };
  // Handled via async background scraping to fetch actual portal values

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
    if (rand > 0.85) {
      let serverOs = Math.max(85, Math.min(100, db.compliance.serverOs + (Math.random() > 0.5 ? 1 : -1)));
      let serverPatch = Math.max(85, Math.min(100, db.compliance.serverPatch + (Math.random() > 0.5 ? 1 : -1)));
      let endpointCsClient = Math.max(90, Math.min(100, db.compliance.endpointCsClient + (Math.random() > 0.5 ? 1 : -1)));
      let endpointCsPatch = Math.max(90, Math.min(100, db.compliance.endpointCsPatch + (Math.random() > 0.5 ? 1 : -1)));
      let endpointIntuneClient = Math.max(90, Math.min(100, db.compliance.endpointIntuneClient + (Math.random() > 0.5 ? 1 : -1)));
      let endpointIntunePatch = Math.max(90, Math.min(100, db.compliance.endpointIntunePatch + (Math.random() > 0.5 ? 1 : -1)));
      let endpointClearpass = Math.max(90, Math.min(100, db.compliance.endpointClearpass + (Math.random() > 0.5 ? 1 : -1)));
      let endpointSupportedOs = Math.max(90, Math.min(100, db.compliance.endpointSupportedOs + (Math.random() > 0.5 ? 1 : -1)));
      let endpointSamAgent = Math.max(90, Math.min(100, db.compliance.endpointSamAgent + (Math.random() > 0.5 ? 1 : -1)));
      let endpointHsd = Math.max(90, Math.min(100, db.compliance.endpointHsd + (Math.random() > 0.5 ? 1 : -1)));
      let endpointDomain = Math.max(90, Math.min(100, db.compliance.endpointDomain + (Math.random() > 0.5 ? 1 : -1)));
      let endpointBitlocker = Math.max(90, Math.min(100, db.compliance.endpointBitlocker + (Math.random() > 0.5 ? 1 : -1)));
      
      let sum = serverOs + serverPatch + endpointCsClient + endpointCsPatch + endpointIntuneClient + 
                endpointIntunePatch + endpointClearpass + endpointSupportedOs + endpointSamAgent + 
                endpointHsd + endpointDomain + endpointBitlocker;
      let endpointAverage = Math.round((sum / 12) * 10) / 10;

      updatedCompliance = {
        serverOs,
        serverPatch,
        endpointCsClient,
        endpointCsPatch,
        endpointIntuneClient,
        endpointIntunePatch,
        endpointClearpass,
        endpointSupportedOs,
        endpointSamAgent,
        endpointHsd,
        endpointDomain,
        endpointBitlocker,
        endpointAverage
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

let isUpdatingSymphony = false;

async function runSymphonyScrape(endpoint: string) {
  try {
    const res = await fetch('http://localhost:9222/json');
    if (!res.ok) throw new Error('Chrome debugging port not reachable');
    const tabs = await res.json();
    
    let tab = tabs.find((t: any) => t.url.includes('hsd.adityabirla.com') || t.title.includes('Hindalco'));
    
    if (!tab) {
      console.log('Symphony Scraper: Hindalco tab not open, attempting to open a new tab...');
      const targetUrl = endpoint || 'https://hsd.adityabirla.com/MDLIncidentMgmt/SDE_Dashboard.aspx';
      const openRes = await fetch(`http://localhost:9222/json/new?url=${encodeURIComponent(targetUrl)}`);
      if (openRes.ok) {
        const newTab = await openRes.json();
        await new Promise((resolve) => setTimeout(resolve, 4000));
        const refetchRes = await fetch('http://localhost:9222/json');
        const refetchTabs = await refetchRes.json();
        tab = refetchTabs.find((t: any) => t.id === newTab.id);
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
      const ws = new WebSocket(tab.webSocketDebuggerUrl);
      
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
                
                const sorted = texts.sort((a, b) => a.x - b.x);
                const values = sorted.map(t => parseInt(t.txt, 10) || 0).filter(v => !isNaN(v));
                
                const result = { new: 0, assigned: 0, inProgress: 0, pending: 0 };
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
