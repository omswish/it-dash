console.log('Utkal IT Dashboard Scraper: SolarWinds Content Script Injected');

// Auto-Login Handling
function handleAutoLogin(creds) {
  if (!creds) return;
  const userInput = document.querySelector('input[name*="user" i], input[id*="user" i], input[type="text"]');
  const passInput = document.querySelector('input[name*="password" i], input[id*="password" i], input[type="password"]');
  const submitBtn = document.querySelector('input[type="submit"], button[type="submit"], #cta, .btn-primary');
  
  if (userInput && passInput && submitBtn && !userInput.value) {
    userInput.value = creds.username;
    passInput.value = creds.secret;
    userInput.dispatchEvent(new Event('input', { bubbles: true }));
    passInput.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(() => submitBtn.click(), 1000);
  }
}

// Keep-alive activity emulation
function emulateActivity() {
  window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Shift' }));
}
setInterval(emulateActivity, 60000);

// Request credentials once loaded
chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS' }, (response) => {
  if (response && response.success && response.configs) {
    handleAutoLogin(response.configs.solarwinds);
  }
});

async function extractSolarWindsData() {
  const url = window.location.href;
  
  // Clean single-page Node Details scraping
  if (url.includes('NodeDetails.aspx')) {
    const objectMatch = url.match(/NetObject=N:(\d+)/);
    if (objectMatch) {
      const nodeId = objectMatch[1];
      let status = 'operational';
      let latency = 0;
      let utilization = 0;
      
      const statusImgs = document.querySelectorAll('img[src*="Status" i], img[src*="status" i], .sw-status-icon');
      for (const img of statusImgs) {
        const src = img.src.toLowerCase();
        if (src.includes('down') || src.includes('critical')) {
          status = 'down';
          break;
        } else if (src.includes('warning') || src.includes('degraded')) {
          status = 'degraded';
        }
      }
      
      const bodyText = document.body.innerText || '';
      const latencyMatch = bodyText.match(/([\d\.]+)\s*ms/i);
      if (latencyMatch) {
        latency = parseFloat(latencyMatch[1]);
      }
      
      const lines = bodyText.split('\n');
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('utilization') || lower.includes('load') || lower.includes('traffic')) {
          const m = line.match(/(\d+(\.\d+)?)\s*%/);
          if (m) {
            utilization = parseFloat(m[1]);
            break;
          }
        }
      }
      
      chrome.runtime.sendMessage({
        type: 'SOLARWINDS_SINGLE_NODE',
        nodeId: nodeId,
        data: { status, latency, utilization }
      });
      return;
    }
  }

  const isNetwork = window.location.host.includes('46');
  const source = isNetwork ? 'network' : 'server';

  try {
    if (source === 'server') {
      const allServerNames = [
        'HIL-HIDDOR-AV01.abgplanet.abg.com',
        'HIL-HIDDOR-BK01',
        'HIL-HIDDOR-CSCTS1',
        'HIL-HIDDOR-CSCTS2',
        'HILHIDDORDT0320',
        'HIL-HIDDOR-FS01.abgplanet.abg.com',
        'HILHIDDORILMSAP',
        'HILHIDDORILMSDB',
        'HIL-HIDDOR-PIMW.abgplanet.abg.com',
        'HIL-HIDDOR-PSDM.abgplanet.abg.com',
        'HIL-HIDDOR-US01.abgplanet.abg.com',
        'HIL-HIDDOR-US02.abgplanet.abg.com',
        'HIL-HIDDOR-US03.abgplanet.abg.com',
        'HIL-HIDDOR-US04.abgplanet.abg.com',
        'HIL-HIDDOR-US05.abgplanet.abg.com',
        'HIL-HIDDOR-US06.abgplanet.abg.com'
      ];
      
      const serverNodesMap = {};
      allServerNames.forEach((name, index) => {
         serverNodesMap[name] = {
           id: `sw-srv-${index + 1}`,
           name: name,
           location: 'Utkal DC',
           status: 'operational',
           cpu: null,
           memory: null,
           disk: null,
           backupStatus: null
         };
      });

      const rows = Array.from(document.querySelectorAll('table.NeedsZebraStripes tr'));
      let foundAnyData = false;
      
      rows.forEach(tr => {
         const cells = tr.querySelectorAll('td.Property');
         if (cells.length >= 3) {
            const statusImg = cells[0].querySelector('img');
            const nodeNameEl = cells[1].querySelector('a');
            const valEl = cells[2].querySelector('a'); // Memory or CPU %

            if (nodeNameEl && valEl) {
               const nodeName = nodeNameEl.innerText.trim().toLowerCase();
               const matchedKey = Object.keys(serverNodesMap).find(key => 
                  key.toLowerCase() === nodeName || 
                  key.toLowerCase().startsWith(nodeName + '.') ||
                  nodeName.startsWith(key.toLowerCase() + '.')
               );
               
               if (matchedKey) {
                  foundAnyData = true;
                  const valText = valEl.innerText.replace(/\s|%/g, '');
                  const val = parseInt(valText) || 0;
                  
                  if (valEl.href.includes('Memory')) {
                     serverNodesMap[matchedKey].memory = val;
                  } else if (valEl.href.includes('CPU')) {
                     serverNodesMap[matchedKey].cpu = val;
                  }
                  
                  const statusStr = statusImg?.getAttribute('src')?.toLowerCase() || '';
                  if (statusStr.includes('critical') || statusStr.includes('down')) {
                     serverNodesMap[matchedKey].status = 'down';
                  } else if (statusStr.includes('warning')) {
                     serverNodesMap[matchedKey].status = 'degraded';
                  } else if (statusStr.includes('up')) {
                     serverNodesMap[matchedKey].status = 'operational';
                  }
               }
            }
         }
      });
      
      if (!foundAnyData) {
        console.log('Server memory/cpu rows not found yet. Waiting for page load...');
        return;
      }
      
      const servers = Object.values(serverNodesMap);
      chrome.runtime.sendMessage({ type: 'SOLARWINDS_DATA', source, data: servers, status: 'active' });

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
