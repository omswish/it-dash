console.log('Utkal IT Dashboard Scraper: Symphony Content Script Injected');

function extractSymphonyData() {
  try {
    const items = [];
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
      if (el.childNodes.length > 0) {
        let hasText = false;
        let text = '';
        el.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            hasText = true;
            text += child.textContent.trim() + ' ';
          }
        });
        if (hasText) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            items.push({ text: text.trim(), x: rect.left + rect.width/2, y: rect.top + rect.height/2, rect });
          }
        }
      }
    });

    document.querySelectorAll('svg text, svg tspan').forEach(el => {
      const text = el.textContent.trim();
      if (text) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          items.push({ text, x: rect.left + rect.width/2, y: rect.top + rect.height/2, rect });
        }
      }
    });

    const headers = ["Incident", "Service Request", "Work Order", "Change Record"];
    const colBounds = [];
    headers.forEach(h => {
      const headerItem = items.find(i => i.text === h);
      if (headerItem) colBounds.push({ name: h, x: headerItem.x, item: headerItem });
    });
    colBounds.sort((a, b) => a.x - b.x);

    const getColumnName = (x) => {
      if (colBounds.length === 0) return null;
      let closest = colBounds[0];
      let minDiff = Math.abs(x - closest.x);
      for(let i=1; i<colBounds.length; i++) {
        const diff = Math.abs(x - colBounds[i].x);
        if (diff < minDiff) {
          minDiff = diff;
          closest = colBounds[i];
        }
      }
      return closest.name;
    };

    const data = {
      incidents: 0, requests: 0, orders: 0, changes: 0,
      incidentsBreakdown: { new: 0, assigned: 0, inProgress: 0, pending: 0 },
      requestsBreakdown: { new: 0, assigned: 0, inProgress: 0, pending: 0 },
      ordersBreakdown: { new: 0, assigned: 0, inProgress: 0, pending: 0 },
      changesBreakdown: { new: 0, assigned: 0, inProgress: 0, pending: 0 },
      activeIncidents: []
    };

    const myWorkgroups = items.filter(i => i.text === "My Workgroup");
    myWorkgroups.forEach(mw => {
      const col = getColumnName(mw.x);
      const numbersAbove = items.filter(i => i.y < mw.y && i.y > mw.y - 150 && Math.abs(i.x - mw.x) < 100 && /^\d+$/.test(i.text));
      if (numbersAbove.length > 0) {
        numbersAbove.sort((a, b) => b.y - a.y);
        const val = parseInt(numbersAbove[0].text, 10);
        if (col === "Incident") data.incidents = Math.max(data.incidents, val);
        if (col === "Service Request") data.requests = Math.max(data.requests, val);
        if (col === "Work Order") data.orders = Math.max(data.orders, val);
        if (col === "Change Record") data.changes = Math.max(data.changes, val);
      }
    });

    const categories = ["New", "Assigned", "In-Progress", "Pending", "Initiated", "Implemented", "Approved Stage"];
    const categoryLabels = items.filter(i => categories.includes(i.text));
    
    categoryLabels.forEach(catLabel => {
      const col = getColumnName(catLabel.x);
      const numbersAbove = items.filter(i => i.y < catLabel.y && i.y > catLabel.y - 250 && Math.abs(i.x - catLabel.x) < 50 && /^\d+$/.test(i.text));
      let val = 0;
      if (numbersAbove.length > 0) {
        numbersAbove.sort((a, b) => Math.abs(a.x - catLabel.x) - Math.abs(b.x - catLabel.x));
        val = parseInt(numbersAbove[0].text, 10);
      }
      
      let key = catLabel.text.toLowerCase();
      if (key === 'in-progress') key = 'inProgress';
      if (key === 'initiated') key = 'new';
      if (key === 'implemented') key = 'inProgress';
      if (key === 'approved stage') key = 'pending';
      
      if (col === "Incident" && data.incidentsBreakdown[key] !== undefined) data.incidentsBreakdown[key] = val;
      if (col === "Service Request" && data.requestsBreakdown[key] !== undefined) data.requestsBreakdown[key] = val;
      if (col === "Work Order" && data.ordersBreakdown[key] !== undefined) data.ordersBreakdown[key] = val;
      if (col === "Change Record" && data.changesBreakdown[key] !== undefined) data.changesBreakdown[key] = val;
    });

    const findSLA = (headerText, matchStr) => {
       const headers = items.filter(i => i.text.includes(headerText));
       let bestHeader = null;
       let minDiff = Infinity;
       headers.forEach(h => {
         const subLabels = items.filter(i => i.text.includes(matchStr) && Math.abs(i.x - h.x) < 400 && i.y > h.y);
         if (subLabels.length > 0) bestHeader = subLabels[0];
       });
       
       if (bestHeader) {
         const fractions = items.filter(i => i.text.includes('/') && i.y > bestHeader.y && Math.abs(i.x - bestHeader.x) < 150);
         if (fractions.length > 0) {
           fractions.sort((a, b) => a.y - b.y);
           const parts = fractions[0].text.split('/');
           if (parts.length === 2) {
             const num = parseInt(parts[0], 10);
             const den = parseInt(parts[1], 10);
             if (den > 0) return Math.round((num/den)*100);
           }
         }
       }
       return 0;
    };

    data.incidentsResponseSla = findSLA('Incident SLA Summary', 'Response SLA Performance');
    data.incidentsResolutionSla = findSLA('Incident SLA Summary', 'Resolution SLA Performance');
    data.requestsResponseSla = findSLA('Service Request SLA Summary', 'Response SLA Performance');
    data.requestsResolutionSla = findSLA('Service Request SLA Summary', 'Resolution SLA Performance');

    console.log('Extracted Symphony Data:', data);
    chrome.runtime.sendMessage({ type: 'SYMPHONY_DATA', data });
  } catch(e) {
    console.error('Symphony DOM Parsing Error:', e);
  }
}

// Run immediately and then every 10 seconds to keep pushing live data
setTimeout(extractSymphonyData, 5000);
setInterval(extractSymphonyData, 10000);
