import https from 'https';

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

async function querySWIS<T>(
  endpoint: string,
  username: string,
  secret: string,
  swqlQuery: string
): Promise<T[]> {
  if (!endpoint) {
    throw new Error('SolarWinds endpoint is missing or empty.');
  }
  // Parse host and port from endpoint (e.g. "10.100.1.50:17778" or "https://10.100.1.50:17778")
  let host = endpoint.trim();
  let port = '17778';

  if (host.includes('//')) {
    host = host.split('//')[1];
  }
  if (host.includes('/')) {
    host = host.split('/')[0];
  }
  if (host.includes(':')) {
    const parts = host.split(':');
    host = parts[0];
    port = parts[1];
  }

  const url = `https://${host}:${port}/SolarWinds/InformationService/v3/Json/Query`;
  const auth = Buffer.from(`${username}:${secret}`).toString('base64');
  
  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: swqlQuery }),
    agent
  } as unknown as RequestInit);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SWIS Query Failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.results as T[];
}

export async function getSolarWindsServers(
  endpoint: string,
  username: string,
  secret: string
): Promise<SWServerMetric[]> {
  const query = `
    SELECT 
      Caption AS [NodeName], 
      IPAddress, 
      PercentCPU AS [CPUPercent], 
      PercentMemoryUsed AS [MemoryPercent],
      StatusDescription AS [Status]
    FROM Orion.Nodes
    WHERE Caption LIKE '%HIDDOR%'
  `;
  return querySWIS<SWServerMetric>(endpoint, username, secret, query);
}

export async function getSolarWindsISPInterfaces(
  endpoint: string,
  username: string,
  secret: string
): Promise<SWInterfaceMetric[]> {
  const query = `
    SELECT 
      N.Caption AS [NodeName], 
      I.Caption AS [InterfaceName], 
      I.StatusDescription AS [InterfaceStatus],
      I.InBandwidth AS [InSpeed],
      I.OutBandwidth AS [OutSpeed]
    FROM Orion.Nodes AS N
    JOIN Orion.NPM.Interfaces AS I ON N.NodeID = I.NodeID
    WHERE I.Caption LIKE '%SDWAN%' OR I.Caption LIKE '%ILL%'
  `;
  return querySWIS<SWInterfaceMetric>(endpoint, username, secret, query);
}
