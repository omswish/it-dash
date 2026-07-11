import fs from 'fs';
import path from 'path';


const DB_PATH = path.join(process.cwd(), 'src/lib/db.json');

export interface ServerData {
  id: string;
  name: string;
  location: string;
  status: 'operational' | 'degraded' | 'down';
  cpu: number | null;
  memory: number | null;
  disk: number | string | null;
  backupStatus: 'successful' | 'failed' | 'N/A';
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
  endpointNetwork?: string;
  username: string;
  authMethod: string;
  secret?: string;
  status?: 'active' | 'auth_required' | 'layout_error' | 'network_error' | 'idle';
  statusMessage?: string;
}

export interface NutanixMetrics {
  uptime: string;
  nodesCount: number;
  storageUsage: number;
  historyCpu: number[];
  historyMem: number[];
  nodeStatuses?: string[];
  vmHealth?: { good: number; warning: number; critical: number };
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
  changeRecords: number;
  changeRecordsBreakdown: TicketBreakdown;
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
  return {
    lastUpdated: Date.now(),
    servers: [
      { id: 'srv-smartface', name: 'Smartface', location: 'Utkal Alumina', status: 'operational', cpu: 0, memory: 0, disk: 0, backupStatus: 'successful', history: Array.from({ length: 20 }, () => 0) },
      { id: 'srv-clms', name: 'CLMS', location: 'Utkal Alumina', status: 'operational', cpu: 0, memory: 0, disk: 0, backupStatus: 'successful', history: Array.from({ length: 20 }, () => 0) },
      { id: 'srv-dhcp', name: 'DHCP', location: 'Utkal Alumina', status: 'operational', cpu: 0, memory: 0, disk: 0, backupStatus: 'successful', history: Array.from({ length: 20 }, () => 0) },
      { id: 'srv-ilms-app', name: 'ILMS APP', location: 'Utkal Alumina', status: 'operational', cpu: 0, memory: 0, disk: 0, backupStatus: 'successful', history: Array.from({ length: 20 }, () => 0) },
      { id: 'srv-ilms-db', name: 'ILMS DB', location: 'Utkal Alumina', status: 'operational', cpu: 0, memory: 0, disk: 0, backupStatus: 'successful', history: Array.from({ length: 20 }, () => 0) }
    ],
    networks: [
      { id: 'net-rjio', provider: 'RJIO', status: 'operational', uptime: 99.99, latency: 12, utilization: 0, history: Array.from({ length: 20 }, () => 0) },
      { id: 'net-railtel', provider: 'RailTel', status: 'operational', uptime: 99.92, latency: 12, utilization: 0, history: Array.from({ length: 20 }, () => 0) }
    ],
    configs: {
      nutanix: { connected: false, endpoint: 'https://10.23.50.27:9440/console/#login', username: '', authMethod: 'SSH Key' },
      symphony: { connected: false, endpoint: 'https://hsd.adityabirla.com/MDLIncidentMgmt/SDE_Dashboard.aspx', username: '', authMethod: 'API Key' },
      solarwinds: { connected: false, endpoint: 'http://10.36.91.45/Orion/Login.aspx', endpointNetwork: 'http://10.36.91.46/Orion/Login.aspx', username: 'hil-dor.itdashboard@adityabirla.com', authMethod: 'Basic Authentication' }
    },
    nutanix: {
      uptime: '0d 0h 0m',
      nodesCount: 0,
      storageUsage: 0,
      historyCpu: Array.from({ length: 20 }, () => 0),
      historyMem: Array.from({ length: 20 }, () => 0)
    },
    symphony: {
      openIncidents: 0,
      openIncidentsBreakdown: { new: 0, assigned: 0, inProgress: 0, pending: 0 },
      serviceRequests: 0,
      serviceRequestsBreakdown: { new: 0, assigned: 0, inProgress: 0, pending: 0 },
      workOrders: 0,
      workOrdersBreakdown: { new: 0, assigned: 0, inProgress: 0, pending: 0 },
      changeRecords: 0,
      changeRecordsBreakdown: { new: 0, assigned: 0, inProgress: 0, pending: 0 },
      serviceRequestsSla: 0,
      incidentsResponseSla: 0,
      incidentsResolutionSla: 0,
      requestsResponseSla: 0,
      requestsResolutionSla: 0,
      activeIncidents: []
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
    const db = JSON.parse(fileContent) as DbSchema;
    

    
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

// ============================================================================
// AUTOMATED SCRAPERS DISABLED
// ============================================================================
// Note: As of the Edge Extension Architecture Pivot, the Next.js backend no 
// longer actively spawns browsers or probes the network directly. 
// Instead, the native Edge Extension running in the user's authenticated 
// browser session pushes data to the POST /api/update endpoint, which safely 
// updates db.json.
// ============================================================================


