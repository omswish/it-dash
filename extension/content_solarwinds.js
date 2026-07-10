console.log('Utkal IT Dashboard Scraper: SolarWinds Content Script Injected');

async function extractSolarWindsData() {
  const isNetwork = window.location.host.includes('46');
  const source = isNetwork ? 'network' : 'server';

  try {
    if (source === 'server') {
      const query = `
        SELECT TOP 10 
          n.NodeID, n.Caption, n.Status, 
          n.CPULoad, n.PercentMemoryUsed
        FROM Orion.Nodes n
        WHERE n.Vendor = 'Windows'
      `;
      
      const res = await fetch('/SolarWinds/InformationService/v3/Json/Query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error('Failed to query SolarWinds SWIS API: ' + res.status);
      const json = await res.json();
      
      const servers = (json.results || []).map((node, i) => ({
        id: `sw-srv-${node.NodeID || i}`,
        name: node.Caption || 'Unknown Server',
        location: 'Utkal DC',
        status: node.Status === 1 ? 'operational' : 'down',
        cpu: Math.round(node.CPULoad || 0),
        memory: Math.round(node.PercentMemoryUsed || 0),
        disk: 0,
        backupStatus: 'N/A'
      }));
      
      chrome.runtime.sendMessage({ type: 'SOLARWINDS_DATA', source, data: servers, status: 'active' });

    } else {
      const query = `
        SELECT TOP 10 
          i.InterfaceID, i.Caption, i.Status, i.InPercentUtil, i.OutPercentUtil
        FROM Orion.NPM.Interfaces i
        WHERE i.Caption LIKE '%SDWAN%' OR i.Caption LIKE '%ILL%' OR i.Caption LIKE '%ISP%' OR i.Caption LIKE '%Link%'
      `;
      
      const res = await fetch('/SolarWinds/InformationService/v3/Json/Query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error('Failed to query SolarWinds SWIS API: ' + res.status);
      const json = await res.json();
      
      const networks = (json.results || []).map((node, i) => ({
        id: `sw-net-${node.InterfaceID || i}`,
        provider: node.Caption || 'Unknown Gateway',
        status: node.Status === 1 ? 'operational' : (node.Status === 2 ? 'down' : 'degraded'),
        uptime: 0,
        latency: 0,
        utilization: Math.round(((node.InPercentUtil || 0) + (node.OutPercentUtil || 0)) / 2) || 0
      }));
      
      chrome.runtime.sendMessage({ type: 'SOLARWINDS_DATA', source, data: networks, status: 'active' });
    }
  } catch (error) {
    console.error('SolarWinds Extension Scrape Error:', error);
    const isAuth = error.message.includes('401') || error.message.includes('403');
    chrome.runtime.sendMessage({
      type: 'SOLARWINDS_DATA',
      source,
      data: null,
      status: isAuth ? 'auth_required' : 'network_error',
      statusMessage: error.message
    });
  }
}

// Run immediately and every 15 seconds
setTimeout(extractSolarWindsData, 5000);
setInterval(extractSolarWindsData, 15000);
