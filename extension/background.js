// Background Orchestrator
console.log('Utkal IT Dashboard Scraper: Background Worker Started');

let combinedData = {
  symphony: null,
  solarwinds: {
    servers: null,
    networks: [
      { id: 'sw-net-1', provider: 'RJIO', status: 'operational', uptime: 0, latency: 0, utilization: 0 },
      { id: 'sw-net-2', provider: 'HIL-UTK-EC-1', status: 'operational', uptime: 0, latency: 0, utilization: 0 },
      { id: 'sw-net-3', provider: 'RailTel', status: 'operational', uptime: 0, latency: 0, utilization: 0 },
      { id: 'sw-net-4', provider: 'HIL-UTK-EC-2', status: 'operational', uptime: 0, latency: 0, utilization: 0 }
    ],
    status: 'idle',
    statusMessage: ''
  },
  nutanix: null
};

const netIdMap = {
   '1419': 'sw-net-1',
   '401': 'sw-net-2',
   '1417': 'sw-net-3',
   '402': 'sw-net-4'
};

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CREDENTIALS') {
     fetch('http://localhost:3000/api/status')
       .then(res => res.json())
       .then(data => sendResponse({ success: true, configs: data.configs }))
       .catch(err => sendResponse({ success: false, error: err.message }));
     return true; // Keep channel open for async response
  }

  if (message.type === 'SYMPHONY_DATA') {
    console.log('Received Symphony Data', message.data);
    combinedData.symphony = {
      ...message.data,
      status: message.status || 'active',
      statusMessage: message.statusMessage || ''
    };
    pushToDashboard();
  }
  
  if (message.type === 'SOLARWINDS_DATA') {
    console.log('Received SolarWinds Data', message.data);
    if (message.source === 'server') {
      combinedData.solarwinds.servers = message.data;
    } else {
      // Overwrite only if bulk scraper delivers networks list
      combinedData.solarwinds.networks = message.data;
    }
    combinedData.solarwinds.status = message.status || 'active';
    combinedData.solarwinds.statusMessage = message.statusMessage || '';
    pushToDashboard();
  }

  if (message.type === 'SOLARWINDS_SINGLE_NODE') {
     console.log('Received SolarWinds Single Node Data', message.data);
     const targetId = netIdMap[message.nodeId];
     if (targetId) {
        const net = combinedData.solarwinds.networks.find(n => n.id === targetId);
        if (net) {
           if (message.data.status) net.status = message.data.status;
           if (message.data.latency !== undefined && message.data.latency !== null) net.latency = message.data.latency;
           if (message.data.utilization !== undefined && message.data.utilization !== null) net.utilization = message.data.utilization;
           
           combinedData.solarwinds.status = 'active';
           combinedData.solarwinds.statusMessage = '';
           pushToDashboard();
        }
     }
  }

  if (message.type === 'NUTANIX_DATA') {
    console.log('Received Nutanix Data', message.data);
    combinedData.nutanix = {
      ...message.data,
      status: message.status || 'active',
      statusMessage: message.statusMessage || ''
    };
    pushToDashboard();
  }
  
  if (message.type === 'TRIGGER_SYNC') {
    console.log('Manual sync triggered. Reloading portal pages...');
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (
          tab.url.includes('hsd.adityabirla.com/MDLIncidentMgmt') ||
          tab.url.includes('10.36.91.45/Orion') ||
          tab.url.includes('10.36.91.46/Orion') ||
          tab.url.includes('10.23.50.27')
        ) {
          chrome.tabs.reload(tab.id);
        }
      });
    });
    sendResponse({ status: 'sync_triggered' });
    return true;
  }

  sendResponse({ status: 'received' });
  return true;
});

// Push the combined data to the local Next.js server
async function pushToDashboard() {
  const timestamp = new Date().toLocaleTimeString();
  try {
    const res = await fetch('http://localhost:3000/api/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(combinedData)
    });
    
    let statusText = res.ok ? 'Successfully synced' : `Error ${res.status}`;
    const logItem = `[${timestamp}] ${statusText} with local dashboard.`;
    
    // Save state & log to local storage
    chrome.storage.local.get({ logs: [] }, (result) => {
      const logs = [logItem, ...result.logs].slice(0, 15);
      chrome.storage.local.set({ combinedData, logs, lastSync: timestamp });
    });

    console.log('Successfully pushed data to localhost:3000');
  } catch (error) {
    const logItem = `[${timestamp}] Connection failed: ${error.message}. Is Dashboard running?`;
    chrome.storage.local.get({ logs: [] }, (result) => {
      const logs = [logItem, ...result.logs].slice(0, 15);
      chrome.storage.local.set({ logs, lastSync: timestamp + " (Error)" });
    });
    console.warn('Failed to push data to Next.js dashboard:', error);
  }
}

// Set up an alarm to trigger auto-refreshes every 5 minutes
chrome.alarms.create('autoRefresh', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoRefresh') {
    console.log('Auto-refresh alarm fired, but page reloading is disabled to prevent random reload disruptions.');
    // Automatic page reloads disabled by user request.
  }
});
