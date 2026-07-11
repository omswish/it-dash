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
      
      chrome.runtime.sendMessage({ type: 'SOLARWINDS_DATA', source, data: servers.slice(0, 10), status: 'active' });

    } else {
      const networks = [];
      const textLines = document.body.innerText.split('\n');
      let netId = 0;
      
      textLines.forEach(line => {
        if (line.includes('SDWAN') || line.includes('ILL') || line.includes('ISP') || line.includes('Link')) {
           if (line.length < 100 && !networks.find(n => n.provider === line.trim())) {
             networks.push({
               id: `sw-net-${++netId}`,
               provider: line.trim(),
               status: 'operational', // Default assumed if listed normally
               uptime: 0,
               latency: 0,
               utilization: 40 + Math.floor(Math.random() * 20) // Placeholder
             });
           }
        }
      });
      
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
