function updateUI() {
  chrome.storage.local.get(['combinedData', 'logs', 'lastSync'], (data) => {
    // 1. Update Symphony
    const symStatus = data.combinedData?.symphony?.status || 'idle';
    updateBadge('status-symphony', symStatus);

    // 2. Update SolarWinds
    const swStatus = data.combinedData?.solarwinds?.status || 'idle';
    updateBadge('status-solarwinds', swStatus);

    // 3. Update Nutanix
    const nutStatus = data.combinedData?.nutanix?.status || 'idle';
    updateBadge('status-nutanix', nutStatus);

    // 4. Update Logs
    const logBox = document.getElementById('log-box');
    if (data.logs && data.logs.length > 0) {
      logBox.textContent = data.logs.join('\n');
    } else {
      logBox.textContent = 'No sync events logged yet.';
    }

    // 5. Update Timestamp
    document.getElementById('last-sync').textContent = `Last Sync: ${data.lastSync || 'Never'}`;
  });
}

function updateBadge(elementId, status) {
  const container = document.getElementById(elementId);
  if (!container) return;
  const badge = container.querySelector('.status-badge');
  if (!badge) return;

  // Clear previous status classes
  badge.className = 'status-badge';
  
  if (status === 'active') {
    badge.textContent = 'Active';
    badge.classList.add('status-active');
  } else if (status === 'auth_required') {
    badge.textContent = 'Auth Required';
    badge.classList.add('status-auth');
  } else if (status === 'layout_error' || status === 'network_error') {
    badge.textContent = 'Error';
    badge.classList.add('status-error');
  } else {
    badge.textContent = 'Disconnected';
    badge.classList.add('status-idle');
  }
}

document.getElementById('btn-sync').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }, () => {
    // Brief timeout to let the sync run and update UI
    setTimeout(updateUI, 1000);
  });
});

document.getElementById('btn-refresh-tabs').addEventListener('click', () => {
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
    const logBox = document.getElementById('log-box');
    logBox.textContent = `[System] Portal tabs reloading refreshed...` + '\n' + logBox.textContent;
  });
});

// Run immediately on popup click and poll for updates
updateUI();
setInterval(updateUI, 2000);
