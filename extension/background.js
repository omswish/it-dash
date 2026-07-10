// Background Orchestrator
console.log('Utkal IT Dashboard Scraper: Background Worker Started');

let combinedData = {
  symphony: null,
  solarwinds: { servers: null, networks: null, status: 'idle', statusMessage: '' },
  nutanix: null
};

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
      combinedData.solarwinds.networks = message.data;
    }
    combinedData.solarwinds.status = message.status || 'active';
    combinedData.solarwinds.statusMessage = message.statusMessage || '';
    pushToDashboard();
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
    console.log('Auto-refreshing target tabs...');
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (
          tab.url.includes('hsd.adityabirla.com/MDLIncidentMgmt') ||
          tab.url.includes('10.36.91.45/Orion') ||
          tab.url.includes('10.36.91.46/Orion') ||
          tab.url.includes('10.23.50.27:9440')
        ) {
          chrome.tabs.reload(tab.id);
        }
      });
    });
  }
});
