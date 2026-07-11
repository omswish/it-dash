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
      const text = (el.textContent || '').trim();
      if (text) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          items.push({ text, x: rect.left + rect.width/2, y: rect.top + rect.height/2, rect });
        }
      }
    });

    const headers = ["Incident", "Service Request", "Work Order", "Change Record"];
    const colBounds = [];
    const possibleHeaders = items.filter(i => headers.includes(i.text));
    
    // Group headers by Y coordinate to find the actual column headers (not breadcrumbs)
    const yGroups = [];
    possibleHeaders.forEach(p => {
      let foundGroup = yGroups.find(g => Math.abs(g.y - p.y) < 20);
      if (foundGroup) {
        foundGroup.items.push(p);
      } else {
        yGroups.push({ y: p.y, items: [p] });
      }
    });
    
    // The correct row is the one with the most matching headers (usually all 4)
    yGroups.sort((a, b) => b.items.length - a.items.length);
    const bestRow = yGroups.length > 0 ? yGroups[0].items : [];

    headers.forEach(h => {
      const headerItem = bestRow.find(i => i.text === h);
      if (headerItem) colBounds.push({ name: h, x: headerItem.x, left: headerItem.rect.left, item: headerItem });
    });
    colBounds.sort((a, b) => a.left - b.left);

    const getColumnName = (item) => {
      if (colBounds.length === 0) return null;
      let matchedCol = colBounds[colBounds.length - 1].name;
      for(let i=0; i<colBounds.length - 1; i++) {
        if (item.x < colBounds[i+1].left) {
          matchedCol = colBounds[i].name;
          break;
        }
      }
      return matchedCol;
    };

    const data = {
      incidents: 0, requests: 0, orders: 0, changes: 0,
      incidentsBreakdown: { new: 0, assigned: 0, inProgress: 0, pending: 0 },
      requestsBreakdown: { new: 0, assigned: 0, inProgress: 0, pending: 0 },
      ordersBreakdown: { new: 0, assigned: 0, inProgress: 0, pending: 0 },
      changesBreakdown: { new: 0, assigned: 0, inProgress: 0, pending: 0 },
      activeIncidents: []
    };

    // We strictly use "My Workgroup" as the geometric anchor for the charts.
    // The user will pre-filter their Symphony dashboard to Utkal_IT Support, so the numbers above "My Workgroup" will be correct.
    const targetGroups = items.filter(i => i.text === "My Workgroup");
    
    targetGroups.sort((a, b) => b.y - a.y);
    
    targetGroups.forEach(mw => {
      const col = getColumnName(mw);
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
      const col = getColumnName(catLabel);
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

    // Extremely robust direct DOM extraction using Angular bindings (if present)
    const exactCrTotal = document.querySelector('[ng-bind="CR.MyWorkgroupCount"]');
    if (exactCrTotal && exactCrTotal.textContent) {
      data.changes = parseInt(exactCrTotal.textContent.trim(), 10) || 0;
    }
    
    // Also try to find breakdown values if they have specific bindings
    const exactCrNew = document.querySelector('[ng-bind="CR.InitiatedCount"]');
    if (exactCrNew && exactCrNew.textContent) data.changesBreakdown.new = parseInt(exactCrNew.textContent.trim(), 10) || 0;
    
    const exactCrInProgress = document.querySelector('[ng-bind="CR.ImplementedCount"]');
    if (exactCrInProgress && exactCrInProgress.textContent) data.changesBreakdown.inProgress = parseInt(exactCrInProgress.textContent.trim(), 10) || 0;
    
    const exactCrPending = document.querySelector('[ng-bind="CR.ApprovedCount"]');
    if (exactCrPending && exactCrPending.textContent) data.changesBreakdown.pending = parseInt(exactCrPending.textContent.trim(), 10) || 0;

    const findSLA = (headerText, matchStr) => {
       const headers = items.filter(i => i.text.includes(headerText));
       let bestHeader = null;
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

    // Detect if we are logged out
    const loginForm = document.querySelector('form[action*="Login"], input[type="password"]');
    if (loginForm) {
      chrome.runtime.sendMessage({ 
        type: 'SYMPHONY_DATA', 
        data, 
        status: 'auth_required', 
        statusMessage: 'Authentication required. Operator session expired.' 
      });
      return;
    }

    // Abort if dashboard hasn't loaded yet (No anchor texts found) to prevent scraping zeroes
    if (targetGroups.length === 0 && !exactCrTotal) {
      console.log('Symphony Dashboard not loaded yet. Waiting...');
      return;
    }

    console.log('Extracted Symphony Data:', data);
    chrome.runtime.sendMessage({ type: 'SYMPHONY_DATA', data, status: 'active' });
  } catch(e) {
    console.error('Symphony DOM Parsing Error:', e);
    alert('Symphony Dashboard Scraper Error: ' + e.message + '\\nLine: ' + e.stack);
    chrome.runtime.sendMessage({ 
      type: 'SYMPHONY_DATA', 
      data: null, 
      status: 'layout_error', 
      statusMessage: `Layout error: ${e.message}` 
    });
  }
}

// Run immediately and then every 10 seconds to keep pushing live data
setTimeout(extractSymphonyData, 5000);
setInterval(extractSymphonyData, 10000);
