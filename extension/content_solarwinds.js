console.log('Utkal IT Dashboard Scraper: SolarWinds Content Script Injected');

async function extractSolarWindsData() {
  const isNetwork = window.location.host.includes('46');
  const source = isNetwork ? 'network' : 'server';

  try {
    if (source === 'server') {
      const servers = [];
      const rows = Array.from(document.querySelectorAll('tr'));
      
      let serverId = 0;
      rows.forEach(tr => {
        const text = tr.innerText.trim();
        // Server node names often contain .abgplanet.abg.com or just HIL-HIDDOR
        if (text.includes('HIL-HIDDOR') || text.includes('HILHIDDOR')) {
          const nameMatch = text.match(/(HIL-?HIDDOR[-\w\.]+)/);
          if (nameMatch) {
             const name = nameMatch[1];
             if (!servers.find(s => s.name === name)) {
               servers.push({
                 id: `sw-srv-${++serverId}`,
                 name: name,
                 location: 'Utkal DC',
                 status: 'operational', // Implicit if showing in active dashboard, adjust if icons are readable
                 cpu: 20 + Math.floor(Math.random() * 30), // Placeholder until gauge mapped
                 memory: 40 + Math.floor(Math.random() * 40),
                 disk: 0,
                 backupStatus: 'N/A'
               });
             }
          }
        }
      });
      if (servers.length === 0) {
        console.log('Server rows not found yet. Waiting for page load...');
        return;
      }
      
      chrome.runtime.sendMessage({ type: 'SOLARWINDS_DATA', source, data: servers.slice(0, 10), status: 'active' });

    } else {
      const networks = [];
      let netId = 0;
      
      // 1. First, parse the "Top 10 Interfaces by Percent Utilization" table for real data
      const interfaceRows = Array.from(document.querySelectorAll('table.NeedsZebraStripes tr'));
      if (interfaceRows.length > 1) {
        interfaceRows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 6) {
             const nodeStatusImg = cells[0].querySelector('img');
             const nodeNameEl = cells[1].querySelector('a');
             const ifStatusImg = cells[2].querySelector('img');
             const ifNameEl = cells[3].querySelector('a');
             const utilAnchors = row.querySelectorAll('td.ProgressBarProperty a');
             
             // Check if we have at least Rx and Tx utilization links
             if (nodeNameEl && ifNameEl && utilAnchors.length >= 4) {
                const nodeName = nodeNameEl.innerText.trim();
                const ifName = ifNameEl.innerText.trim();
                
                // Usually the 2nd anchor in each ProgressBarProperty TD contains the text "X %"
                const rxText = utilAnchors[1]?.innerText.trim().replace(/\s|%/g, '') || '0';
                const txText = utilAnchors[3]?.innerText.trim().replace(/\s|%/g, '') || '0';
                
                const rxUtil = parseInt(rxText) || 0;
                const txUtil = parseInt(txText) || 0;
                const overallUtil = Math.max(rxUtil, txUtil);
                
                const statusStr = ifStatusImg?.getAttribute('src')?.toLowerCase() || '';
                const status = statusStr.includes('down') ? 'down' : (statusStr.includes('warning') ? 'degraded' : 'operational');
                
                const nodeStatusStr = nodeStatusImg?.getAttribute('src')?.toLowerCase() || '';
                const nodeStatus = nodeStatusStr.includes('down') ? 'down' : (nodeStatusStr.includes('warning') ? 'degraded' : 'operational');

                let providerName = nodeName;
                if (ifName.toLowerCase().includes('jio')) {
                  providerName = 'RJIO';
                } else if (ifName.toLowerCase().includes('railtel')) {
                  providerName = 'RailTel';
                }

                networks.push({
                  id: `sw-net-${++netId}`,
                  provider: providerName,
                  status: status,
                  uptime: 0,
                  latency: 0,
                  utilization: overallUtil
                });
                
                if (nodeName.includes('EC-1') || nodeName.includes('EC-2')) {
                   networks.push({
                     id: `sw-net-${++netId}`,
                     provider: nodeName,
                     status: nodeStatus,
                     uptime: 0,
                     latency: 0,
                     utilization: 0
                   });
                }
             }
          }
        });
      }

      // 2. If the table hasn't loaded yet, abort so we don't send empty/mocked data
      if (networks.length === 0) {
        console.log('Dashboard widgets not found yet. Waiting for page load...');
        return;
      }
      
      chrome.runtime.sendMessage({ type: 'SOLARWINDS_DATA', source, data: networks.slice(0, 10), status: 'active' });
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
