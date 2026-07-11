console.log('Utkal IT Dashboard Scraper: Nutanix Content Script Injected');

function extractNutanixData() {
  try {
    // Attempt to extract from Prism UI DOM directly


    // Exact Nutanix Prism Element scraping
    let cpu = null, mem = null, storage = null; 
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
    document.querySelectorAll('table.dataTable tbody tr, tr').forEach(row => {
       const nameEl = row.querySelector('.n-vm-name');
       if (!nameEl) return;
       const vmName = nameEl.textContent.trim().toLowerCase();
       const match = allServerNames.find(n => n.toLowerCase() === vmName || n.toLowerCase().startsWith(vmName + '.'));
       if (match) {
           let diskPercent = 'N/A';
           let backupStatus = 'N/A';
           const tds = row.querySelectorAll('td');
           
           if (tds.length >= 13) {
               const bText = tds[12].textContent.trim();
               if (bText === 'Yes') backupStatus = 'successful';
               else if (bText === 'No') backupStatus = 'failed';
           }

           for (const td of tds) {
               const tdText = td.textContent.trim();
               const storageMatch = tdText.match(/([\d\.]+)\s*(GiB|TiB|MiB|GB|TB|MB)\s*\/\s*([\d\.]+)\s*(GiB|TiB|MiB|GB|TB|MB)/i);
               if (storageMatch) {
                   const used = parseFloat(storageMatch[1]);
                   const usedUnit = storageMatch[2].toLowerCase();
                   const total = parseFloat(storageMatch[3]);
                   const totalUnit = storageMatch[4].toLowerCase();
                   
                   let usedVal = used;
                   if (usedUnit.includes('t')) usedVal *= 1024;
                   else if (usedUnit.includes('m')) usedVal /= 1024;
                   
                   let totalVal = total;
                   if (totalUnit.includes('t')) totalVal *= 1024;
                   else if (totalUnit.includes('m')) totalVal /= 1024;
                   
                   if (totalVal > 0) {
                       diskPercent = (usedVal / totalVal) * 100;
                   }
                   break;
               }
           }
           serverDisks.push({
              name: match,
              disk: diskPercent,
              backupStatus
           });
       }
    });

    let vmHealth = null;
    const vmBlock = document.getElementById('ets-vm');
    if (vmBlock) {
       let vmGood = 0, vmWarning = 0, vmCritical = 0;
       const critEl = vmBlock.querySelector('.count-box-critical .count-box-number');
       if (critEl) vmCritical = parseInt(critEl.textContent.trim(), 10) || 0;
       
       const warnEl = vmBlock.querySelector('.count-box-warning .count-box-number');
       if (warnEl) vmWarning = parseInt(warnEl.textContent.trim(), 10) || 0;
       
       const goodEl = vmBlock.querySelector('.count-box-good .count-box-number');
       if (goodEl) vmGood = parseInt(goodEl.textContent.trim(), 10) || 0;
       vmHealth = { good: vmGood, warning: vmWarning, critical: vmCritical };
    }

    let nodeStatuses = null;
    const hostBlock = document.getElementById('ets-host');
    if (hostBlock) {
       let hostGood = 3, hostWarning = 0, hostCritical = 0;
       const critEl = hostBlock.querySelector('.count-box-critical .count-box-number');
       if (critEl) hostCritical = parseInt(critEl.textContent.trim(), 10) || 0;
       
       const warnEl = hostBlock.querySelector('.count-box-warning .count-box-number');
       if (warnEl) hostWarning = parseInt(warnEl.textContent.trim(), 10) || 0;
       
       const goodEl = hostBlock.querySelector('.count-box-good .count-box-number');
       if (goodEl) hostGood = parseInt(goodEl.textContent.trim(), 10) || 0;
       
       nodeStatuses = [];
       for(let i=0; i<hostCritical; i++) nodeStatuses.push('down');
       for(let i=0; i<hostWarning; i++) nodeStatuses.push('warning');
       for(let i=0; i<hostGood; i++) nodeStatuses.push('normal');
       if (nodeStatuses.length === 0) nodeStatuses.push('normal', 'normal', 'normal');
    }

    const data = {
      nodesCount: nodeStatuses ? nodeStatuses.length : null,
      storageUsage: storage,
      cpu: cpu,
      mem: mem,
      uptime: 'N/A',
      nodeStatuses: nodeStatuses,
      serverDisks,
      vmHealth: vmHealth
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
