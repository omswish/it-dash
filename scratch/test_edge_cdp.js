const http = require('http');
const WebSocket = require('ws'); // ws is already in package.json dependencies

const CDP_PORT = 9222;

function getActiveTabs() {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${CDP_PORT}/json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Failed to parse tabs JSON. Is Edge running with debugging?"));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Edge Debugger unreachable on port ${CDP_PORT}. Make sure Edge is started with --remote-debugging-port=9222`));
    });
  });
}

function evaluateInTab(webSocketDebuggerUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(webSocketDebuggerUrl);
    
    ws.on('open', () => {
      const message = JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: {
          expression: expression,
          returnByValue: true,
          awaitPromise: true
        }
      });
      ws.send(message);
    });

    ws.on('message', (data) => {
      try {
        const response = JSON.parse(data);
        if (response.id === 1) {
          ws.close();
          if (response.result && response.result.result) {
            resolve(response.result.result.value);
          } else {
            reject(new Error("No result returned from expression execution"));
          }
        }
      } catch (err) {
        reject(err);
      }
    });

    ws.on('error', (err) => {
      reject(err);
    });
  });
}

async function runCDPDiagnostics() {
  console.log("=== Edge Session CDP Diagnostics ===");
  try {
    const tabs = await getActiveTabs();
    console.log(`[✔] Connected to Edge. Found ${tabs.length} open tab(s).`);
    
    // Find SolarWinds or Nutanix tabs
    const targetTabs = tabs.filter(t => 
      t.url.includes('10.36.91') || 
      t.url.includes('10.23.50.27')
    );

    if (targetTabs.length === 0) {
      console.warn("[!] No SolarWinds or Nutanix tabs found. Please open these portals in Edge.");
      return;
    }

    for (const tab of targetTabs) {
      console.log(`\nTesting Tab: "${tab.title}" (${tab.url})`);
      
      if (tab.url.includes('10.36.91')) {
        // Run test query in SolarWinds tab context (inheriting ASP.NET session cookies)
        const checkExpression = `
          fetch('/SolarWinds/InformationService/v3/Json/Query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: "SELECT TOP 1 NodeID FROM Orion.Nodes" })
          }).then(r => ({ status: r.status, ok: r.ok }))
            .catch(e => ({ error: e.message }))
        `;
        try {
          const result = await evaluateInTab(tab.webSocketDebuggerUrl, checkExpression);
          if (result.ok) {
            console.log(`[✔ Success] SolarWinds session verified active. Status Code: ${result.status}`);
          } else {
            console.warn(`[❌ Failed] SolarWinds rejected query. Response: ${JSON.stringify(result)}`);
          }
        } catch (e) {
          console.error(`[❌ Error] Failed to evaluate: ${e.message}`);
        }
      }

      if (tab.url.includes('10.23.50.27')) {
        // Run test query in Nutanix tab context (inheriting active session)
        const checkExpression = `
          fetch('/api/nutanix/v3/clusters/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind: "cluster" })
          }).then(r => ({ status: r.status, ok: r.ok }))
            .catch(e => ({ error: e.message }))
        `;
        try {
          const result = await evaluateInTab(tab.webSocketDebuggerUrl, checkExpression);
          if (result.ok) {
            console.log(`[✔ Success] Nutanix session verified active. Status Code: ${result.status}`);
          } else {
            console.warn(`[❌ Failed] Nutanix rejected query. Response: ${JSON.stringify(result)}`);
          }
        } catch (e) {
          console.error(`[❌ Error] Failed to evaluate: ${e.message}`);
        }
      }
    }
  } catch (err) {
    console.error(`[❌ Failed] CDP connection failed: ${err.message}`);
  }
  console.log("\n==================================================");
}

runCDPDiagnostics();
