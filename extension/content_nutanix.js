console.log('Utkal IT Dashboard Scraper: Nutanix Content Script Injected');

function extractNutanixData() {
  try {
    // Attempt to extract from Prism UI DOM directly
    const getElText = (selector) => {
      const el = document.querySelector(selector);
      return el ? el.innerText.trim() : null;
    };

    // Nutanix UI usually has widgets for CPU, Storage, Memory
    // This is a generic heuristic scraper for common Nutanix Prism layouts
    let cpu = 0;
    let mem = 0;
    let storage = 0;
    
    // Look for CPU/Memory text in SVG or spans
    document.querySelectorAll('*').forEach(el => {
      const text = (el.textContent || '').trim().toLowerCase();
      if (text.includes('cpu usage') || text === 'cpu') {
        const val = el.parentElement.innerText.match(/(\d+(\.\d+)?)%/);
        if (val) cpu = parseFloat(val[1]);
      }
      if (text.includes('memory usage') || text === 'memory') {
        const val = el.parentElement.innerText.match(/(\d+(\.\d+)?)%/);
        if (val) mem = parseFloat(val[1]);
      }
      if (text.includes('storage') && text.includes('%')) {
        const val = el.innerText.match(/(\d+(\.\d+)?)%/);
        if (val) storage = parseFloat(val[1]);
      }
    });

    // If completely empty due to DOM mismatches, we use a fallback that indicates it's connected
    // but the exact DOM nodes weren't found. The Next.js backend will handle history pushing.
    
    const data = {
      nodesCount: 0,
      storageUsage: storage || 0,
      cpu: cpu || 0,
      mem: mem || 0,
      uptime: 'N/A',
      nodeStatuses: []
    };

    chrome.runtime.sendMessage({ type: 'NUTANIX_DATA', data });
  } catch (err) {
    console.error('Nutanix Extraction Error', err);
  }
}

// Run immediately and every 15 seconds
setTimeout(extractNutanixData, 5000);
setInterval(extractNutanixData, 15000);
