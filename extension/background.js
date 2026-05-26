// Background Orchestrator
console.log('Utkal IT Dashboard Scraper: Background Worker Started');

let combinedData = {
  symphony: null,
  solarwinds: { servers: null, networks: null },
  nutanix: null
};

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYMPHONY_DATA') {
    console.log('Received Symphony Data', message.data);
    combinedData.symphony = message.data;
    pushToDashboard();
  }
  
  if (message.type === 'SOLARWINDS_DATA') {
    console.log('Received SolarWinds Data', message.data);
    if (message.source === 'server') {
      combinedData.solarwinds.servers = message.data;
    } else {
      combinedData.solarwinds.networks = message.data;
    }
    pushToDashboard();
  }

  if (message.type === 'NUTANIX_DATA') {
    console.log('Received Nutanix Data', message.data);
    combinedData.nutanix = message.data;
    pushToDashboard();
  }
  
  sendResponse({ status: 'received' });
  return true;
});

// Push the combined data to the local Next.js server
async function pushToDashboard() {
  try {
    await fetch('http://localhost:3000/api/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(combinedData)
    });
    console.log('Successfully pushed data to localhost:3000');
  } catch (error) {
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
