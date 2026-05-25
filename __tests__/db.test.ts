import { getDb, DbSchema } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Mock fs to avoid actually writing/reading db.json during tests
jest.mock('fs');

describe('Database Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate initial data if file does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    const db = getDb();
    
    expect(db.configs.nutanix.connected).toBe(false);
    expect(db.configs.symphony.connected).toBe(false);
    expect(db.configs.solarwinds?.connected).toBe(false);
    expect(db.configs.solarwinds?.endpoint).toBe('http://10.36.91.45/Orion/Login.aspx');
  });

  it('should parse and return existing data if file exists', () => {
    const mockDb: DbSchema = {
      servers: [],
      networks: [],
      configs: {
        nutanix: { connected: true, endpoint: 'test', username: 'u', authMethod: 'k' },
        symphony: { connected: true, endpoint: 'test', username: 'u', authMethod: 'k' },
        solarwinds: { connected: true, endpoint: 'test', username: 'u', authMethod: 'k' }
      },
      nutanix: { uptime: '1d', nodesCount: 2, storageUsage: 50, historyCpu: [], historyMem: [], nodeStatuses: [] },
      symphony: { openIncidents: 10, serviceRequests: 5, activeIncidents: [] },
      cartridges: [],
      onboardingRequests: [],
      lastUpdated: Date.now(),
      lastNutanixSync: 0,
      lastSymphonySync: 0,
      lastSolarWindsSync: 0
    };
    
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDb));
    
    const db = getDb();
    expect(db.configs.nutanix.connected).toBe(true);
    expect(db.symphony.openIncidents).toBe(10);
  });
});
