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
    
    document.querySelectorAll('.n-vantage-point-metric-small, .n-vantage-point').forEach(el => {
       const titleEl = el.querySelector('.lblTitle');
       if (!titleEl) return;
       const title = (titleEl.getAttribute('title') || titleEl.textContent || '').toLowerCase();
       
       const valueEl = el.querySelector('.lblValue');
       if (!valueEl) return;
       
       const valStr = valueEl.textContent.replace(/[^\d.]/g, '');
       const valFloat = parseFloat(valStr);
       if (isNaN(valFloat)) return;
       
       if (title.includes('cpu')) {
           cpu = valFloat;
       } else if (title.includes('memory')) {
           mem = valFloat;
       } else if (title.includes('storage')) {
           storage = valFloat;
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
    const vmSummaryBlock = document.querySelector('.n-vantage-point-summary-vm');
    if (vmSummaryBlock) {
       let vmOn = 0, vmOff = 0;
       vmSummaryBlock.querySelectorAll('li').forEach(li => {
           const labelEl = li.querySelector('.n-col-1');
           const valEl = li.querySelector('.n-col-2');
           if (!labelEl || !valEl) return;
           const label = labelEl.textContent.trim().toLowerCase();
           const val = parseInt(valEl.textContent.trim(), 10) || 0;
           if (label === 'on') vmOn = val;
           else if (label === 'off') vmOff = val;
       });
       // Map 'on' to good and 'off' to critical so we don't break the payload schema
       vmHealth = { good: vmOn, warning: 0, critical: vmOff };
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
