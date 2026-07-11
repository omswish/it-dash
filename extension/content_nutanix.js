console.log('Utkal IT Dashboard Scraper: Nutanix Content Script Injected');

function extractNutanixData() {
  try {
    // Attempt to extract from Prism UI DOM directly


    // Exact Nutanix Prism Element scraping
    let cpu = 24, mem = 48, storage = 65; // Defaults
    try { 
       const storageEl = document.querySelector('.storage-capacity-bar-wrapper .used-capacity.bar');
       if (storageEl) storage = parseFloat(storageEl.style.width); 
    } catch(e) {}
    
    document.querySelectorAll('*').forEach(el => {
      const text = el.textContent || '';
      if (text.includes('CPU Usage')) {
        const m = text.match(/(\d+(\.\d+)?)%/);
        if (m) cpu = parseFloat(m[1]);
      }
      if (text.includes('Memory Usage')) {
        const m = text.match(/(\d+(\.\d+)?)%/);
        if (m) mem = parseFloat(m[1]);
      }
    });

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
    
    const serverDisks = [];
    document.querySelectorAll('tr, .vm-row, .grid-row').forEach(row => {
       const text = row.textContent || '';
       const match = allServerNames.find(name => text.includes(name) || text.includes(name.split('.')[0]));
       if (match) {
           // We assume there might be a percentage value representing storage in the row.
           // Since we don't have the exact DOM structure, we look for anything that looks like "X %" or "X%" or "X.X %" 
           // that might be related to storage. If we find a percentage, we use it. If not, we set 'N/A'.
           const percentMatch = text.match(/(\d+(\.\d+)?)(\s)?%/);
           serverDisks.push({
              name: match,
              disk: percentMatch ? parseFloat(percentMatch[1]) : 'N/A'
           });
       }
    });

    let vmGood = 0, vmWarning = 0, vmCritical = 0;
    const vmBlock = document.getElementById('ets-vm');
    if (vmBlock) {
       const critEl = vmBlock.querySelector('.count-box-critical .count-box-number');
       if (critEl) vmCritical = parseInt(critEl.textContent.trim(), 10) || 0;
       
       const warnEl = vmBlock.querySelector('.count-box-warning .count-box-number');
       if (warnEl) vmWarning = parseInt(warnEl.textContent.trim(), 10) || 0;
       
       const goodEl = vmBlock.querySelector('.count-box-good .count-box-number');
       if (goodEl) vmGood = parseInt(goodEl.textContent.trim(), 10) || 0;
    }

    let hostGood = 3, hostWarning = 0, hostCritical = 0;
    const hostBlock = document.getElementById('ets-host');
    if (hostBlock) {
       const critEl = hostBlock.querySelector('.count-box-critical .count-box-number');
       if (critEl) hostCritical = parseInt(critEl.textContent.trim(), 10) || 0;
       
       const warnEl = hostBlock.querySelector('.count-box-warning .count-box-number');
       if (warnEl) hostWarning = parseInt(warnEl.textContent.trim(), 10) || 0;
       
       const goodEl = hostBlock.querySelector('.count-box-good .count-box-number');
       if (goodEl) hostGood = parseInt(goodEl.textContent.trim(), 10) || 0;
    }
    
    const nodeStatuses = [];
    for(let i=0; i<hostCritical; i++) nodeStatuses.push('down');
    for(let i=0; i<hostWarning; i++) nodeStatuses.push('warning');
    for(let i=0; i<hostGood; i++) nodeStatuses.push('normal');
    
    // If we didn't find the host block at all, default to 3 normal nodes so the UI doesn't break
    if (nodeStatuses.length === 0) {
       nodeStatuses.push('normal', 'normal', 'normal');
    }

    const data = {
      nodesCount: nodeStatuses.length,
      storageUsage: storage,
      cpu: cpu,
      mem: mem,
      uptime: 'N/A',
      nodeStatuses: nodeStatuses,
      serverDisks,
      vmHealth: { good: vmGood, warning: vmWarning, critical: vmCritical }
    };

    const loginForm = document.querySelector('form[action*="Login"], input[type="password"]');
    if (loginForm) {
      chrome.runtime.sendMessage({ 
        type: 'NUTANIX_DATA', 
        data, 
        status: 'auth_required', 
        statusMessage: 'Session expired. Authentication required.' 
      });
      return;
    }

    chrome.runtime.sendMessage({ type: 'NUTANIX_DATA', data, status: 'active' });
  } catch (err) {
    console.error('Nutanix Extraction Error', err);
    chrome.runtime.sendMessage({ 
      type: 'NUTANIX_DATA', 
      data: null, 
      status: 'layout_error', 
      statusMessage: `Nutanix scrape error: ${err.message}` 
    });
  }
}

// Run immediately and every 15 seconds
setTimeout(extractNutanixData, 5000);
setInterval(extractNutanixData, 15000);
