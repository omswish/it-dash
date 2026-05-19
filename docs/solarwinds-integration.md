# SolarWinds Orion Integration Guide

This guide outlines the exact steps to securely integrate a local/on-premises SolarWinds Orion deployment with the NOC Dashboard to replace simulated data for the **ISP Status** and **Server Status** cards.

---

## Architecture Overview

SolarWinds Orion exposes the **SolarWinds Information Service (SWIS)** REST API. This API allows us to perform read-only queries using **SWQL** (SolarWinds Query Language) via standard HTTPS.

* **API Version**: SWIS v3 (JSON-based REST API)
* **Default Port**: `17774` (HTTPS)
* **Authentication**: HTTP Basic (Base64-encoded username:password)
* **Query Format**: `POST` request to `/SolarWinds/InformationService/v3/Json/Query`

---

## Step 1: SolarWinds Server Configuration

### 1.1 Create a Read-Only Service Account
For security, do not use an administrator account. Create a restricted service account:
1. Log into your SolarWinds Orion Web Console as an administrator.
2. Navigate to **Settings** > **All Settings** > **Manage Accounts**.
3. Click **Add New Account** and select **Orion Individual Account**.
4. Set the credentials (e.g., Username: `svc_noc_dashboard`, Password: `SecurePassword!`).
5. Under permissions, configure:
   * **Allow Node Management**: No
   * **Allow Alert Management**: No
   * **Allow Account Customization**: No
   * **Orion View Limitations**: Read-Only / Default views
6. Save the account.

### 1.2 Configure Firewall Rules
The SolarWinds server must allow incoming HTTPS traffic on port `17774` from the Dashboard server:
1. Open the Windows Firewall (or corporate perimeter firewall) on the SolarWinds host.
2. Create an **Inbound Rule**:
   * **Protocol**: TCP
   * **Local Port**: `17774`
   * **Remote IP**: Whitelist the static IP address of the Next.js Dashboard server.
   * **Action**: Allow the Connection.

---

## Step 2: Next.js Project Setup

### 2.1 Add Environment Variables
To keep credentials secure, define them in your environment configuration. Do not commit these to Git.

Create or edit your `.env.local` file in the root of the project:

```env
# SolarWinds Integration Config
SOLARWINDS_HOST=10.100.1.50
SOLARWINDS_PORT=17774
SOLARWINDS_USERNAME=svc_noc_dashboard
SOLARWINDS_PASSWORD=SecurePassword!
```

---

## Step 3: Implement the Integration Client

Create a new file `src/lib/solarwinds.ts` to handle the HTTPS requests and SWIS queries:

```typescript
import https from 'https';

const host = process.env.SOLARWINDS_HOST || '127.0.0.1';
const port = process.env.SOLARWINDS_PORT || '17774';
const username = process.env.SOLARWINDS_USERNAME || '';
const password = process.env.SOLARWINDS_PASSWORD || '';

// SolarWinds often uses self-signed SSL certificates.
// This agent allows us to make requests safely by bypassing strict CA checks 
// if required, but ideally you should import the corporate root CA certificate.
const agent = new https.Agent({
  rejectUnauthorized: false // Set to true if root CA is imported
});

/**
 * Executes a SWQL query against the SolarWinds REST API
 */
async function querySWIS<T>(swqlQuery: string): Promise<T[]> {
  const url = `https://${host}:${port}/SolarWinds/InformationService/v3/Json/Query`;
  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: swqlQuery }),
    agent // Pass the https agent to handle self-signed certificates
  } as any);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SWIS Query Failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.results as T[];
}

// Interfaces for Query Results
export interface SWServerMetric {
  NodeName: string;
  IPAddress: string;
  CPUPercent: number;
  MemoryPercent: number;
  Status: string;
}

export interface SWInterfaceMetric {
  NodeName: string;
  InterfaceName: string;
  InterfaceStatus: string;
  InSpeed: number;
  OutSpeed: number;
}

/**
 * Fetch CPU and Memory performance metrics for monitored servers
 */
export async function getSolarWindsServers(): Promise<SWServerMetric[]> {
  const query = `
    SELECT 
      Caption AS [NodeName], 
      IPAddress, 
      PercentCPU AS [CPUPercent], 
      PercentMemoryUsed AS [MemoryPercent],
      StatusDescription AS [Status]
    FROM Orion.Nodes
    WHERE Status = 1 -- Only active/up nodes
  `;
  return querySWIS<SWServerMetric>(query);
}

/**
 * Fetch ISP WAN link performance parameters (bandwidth, status)
 */
export async function getSolarWindsISPInterfaces(): Promise<SWInterfaceMetric[]> {
  const query = `
    SELECT 
      N.Caption AS [NodeName], 
      I.Caption AS [InterfaceName], 
      I.StatusDescription AS [InterfaceStatus],
      I.InBandwidth AS [InSpeed],
      I.OutBandwidth AS [OutSpeed]
    FROM Orion.Nodes AS N
    JOIN Orion.NPM.Interfaces AS I ON N.NodeID = I.NodeID
    WHERE I.Caption LIKE '%ISP%' OR I.Caption LIKE '%WAN%'
  `;
  return querySWIS<SWInterfaceMetric>(query);
}
```

---

## Step 4: Integrate into the Dashboard Background Worker

Integrate these fetch functions into the background sync process in `src/lib/db.ts`.

### 4.1 Update `db.ts` to trigger SolarWinds Fetch

Within your `src/lib/db.ts` file, add a background worker that fetches from SolarWinds and updates `db.json` every 30 seconds:

```typescript
import { getSolarWindsServers, getSolarWindsISPInterfaces } from './solarwinds';

let isUpdatingSolarWinds = false;

export async function syncSolarWindsMetrics() {
  if (isUpdatingSolarWinds) return;
  isUpdatingSolarWinds = true;

  try {
    console.log('SolarWinds Sync: Fetching server status...');
    const servers = await getSolarWindsServers();
    
    console.log('SolarWinds Sync: Fetching ISP interface status...');
    const interfaces = await getSolarWindsISPInterfaces();

    // Load active DB
    const db = getDb();

    // Map SolarWinds Servers to local Schema
    db.servers = servers.map(srv => ({
      name: srv.NodeName,
      status: srv.Status === 'Up' ? 'Online' : 'Offline',
      cpu: srv.CPUPercent,
      ram: srv.MemoryPercent,
      type: 'Virtual Machine', // or map dynamically based on Node description
      uptime: 'Dynamic'
    }));

    // Map SolarWinds Interfaces to local ISP status schema
    // assuming we have Tata, Airtel, Jio mapping
    db.network = interfaces.map(inf => ({
      provider: inf.InterfaceName.includes('Tata') ? 'Tata' 
              : inf.InterfaceName.includes('Airtel') ? 'Airtel' 
              : inf.InterfaceName.includes('Jio') ? 'Jio' 
              : 'Secondary WAN',
      status: inf.InterfaceStatus === 'Up' ? 'Active' : 'Degraded',
      latency: 12, // Default or pull from Orion.ResponseTime
      bandwidth: `${Math.round(inf.InSpeed / 1000000)} Mbps`, // converts bps to Mbps
      jitter: 2
    }));

    db.lastUpdated = Date.now();
    writeDb(db);
    console.log('SolarWinds Sync: Successfully updated local database.');
  } catch (err) {
    console.error('SolarWinds Sync Error:', err);
  } finally {
    isUpdatingSolarWinds = false;
  }
}
```

This ensures that the **NOC Dashboard** is updated automatically using the secure integration with SolarWinds, removing any manual data entries.
