import { ensureBrowserRunning } from './src/lib/browser';
import WebSocket from 'ws';

async function testEdgeScraper() {
  console.log('----------------------------------------------------');
  console.log('Testing Managed Edge Scraper on Windows 11...');
  console.log('----------------------------------------------------');

  try {
    // 1. Ensure Managed Edge is running with debugging port
    await ensureBrowserRunning();
    console.log('SUCCESS: Managed Edge is running and debugging port is active.');

    // 2. Fetch tabs
    const res = await fetch('http://localhost:9222/json');
    if (!res.ok) throw new Error('Chrome debugging port not reachable');
    const tabs = (await res.json()) as Array<{ id: string; url: string; title: string; webSocketDebuggerUrl?: string }>;
    
    console.log(`Found ${tabs.length} open tabs in Edge.`);

    // 3. Find or open Symphony tab
    let tab = tabs.find((t) => t.url.includes('hsd.adityabirla.com') || t.title.includes('Hindalco'));
    
    if (!tab) {
      console.log('Symphony tab not found. Opening a new tab to Hindalco Service Desk...');
      const targetUrl = 'https://hsd.adityabirla.com/MDLIncidentMgmt/SDE_Dashboard.aspx';
      const openRes = await fetch(`http://localhost:9222/json/new?url=${encodeURIComponent(targetUrl)}`, { method: 'PUT' });
      if (openRes.ok) {
        const newTab = await openRes.json();
        console.log('Waiting 10 seconds for the dashboard to render its SVG charts...');
        await new Promise((resolve) => setTimeout(resolve, 10000));
        
        const refetchRes = await fetch('http://localhost:9222/json');
        const refetchTabs = (await refetchRes.json()) as Array<{ id: string; url: string; title: string; webSocketDebuggerUrl?: string }>;
        tab = refetchTabs.find((t) => t.id === newTab.id);
      }
    }

    if (!tab || !tab.webSocketDebuggerUrl) {
      throw new Error('Could not attach to Edge tab.');
    }

    console.log('SUCCESS: Attached to Edge tab. Executing scrape...');

    // 4. Connect via WebSocket and execute scrape
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    
    ws.on('open', () => {
      const message = {
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(async () => {
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
              const numbersAbove = items.filter(i => i.y < mw.y && i.y > mw.y - 150 && Math.abs(i.x - mw.x) < 100 && /^\\d+$/.test(i.text));
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
              const numbersAbove = items.filter(i => i.y < catLabel.y && i.y > catLabel.y - 250 && Math.abs(i.x - catLabel.x) < 50 && /^\\d+$/.test(i.text));
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

            return {
              incidents: data.incidents,
              incidentsBreakdown: data.incidentsBreakdown,
              requests: data.requests,
              requestsBreakdown: data.requestsBreakdown,
              orders: data.orders,
              ordersBreakdown: data.ordersBreakdown,
              changes: data.changes,
              changesBreakdown: data.changesBreakdown,
              incidentsResponseSla: findSLA('Incident SLA Summary', 'Response SLA Performance'),
              incidentsResolutionSla: findSLA('Incident SLA Summary', 'Resolution SLA Performance'),
              requestsResponseSla: findSLA('Service Request SLA Summary', 'Response SLA Performance'),
              requestsResolutionSla: findSLA('Service Request SLA Summary', 'Resolution SLA Performance')
            };
          })()`,
          awaitPromise: true,
          returnByValue: true
        }
      };
      ws.send(JSON.stringify(message));
    });

    ws.on('message', (data) => {
      const response = JSON.parse(data.toString());
      if (response.result && response.result.result && response.result.result.value) {
        console.log('----------------------------------------------------');
        console.log('SCRAPE SUCCESSFUL! Extracted Data:');
        console.log(response.result.result.value);
        console.log('----------------------------------------------------');
      } else {
        console.log('Scrape failed or returned empty data:', response);
      }
      ws.close();
      process.exit(0);
    });

    ws.on('error', (err) => {
      console.error('WebSocket Error:', err);
      process.exit(1);
    });

  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  }
}

testEdgeScraper();
