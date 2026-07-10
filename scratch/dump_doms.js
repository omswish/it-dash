const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 9222;

function getActiveTabs() {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${CDP_PORT}/json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', (err) => reject(err));
  });
}

function evaluateInTab(webSocketDebuggerUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(webSocketDebuggerUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1, method: "Runtime.evaluate",
        params: { expression, returnByValue: true, awaitPromise: true }
      }));
    });
    ws.on('message', (data) => {
      const response = JSON.parse(data);
      if (response.id === 1) {
        ws.close();
        if (response.result && response.result.result) resolve(response.result.result.value);
        else resolve(null);
      }
    });
    ws.on('error', reject);
  });
}

async function dumpDoms() {
  const tabs = await getActiveTabs();
  const dumps = {};

  for (const tab of tabs) {
    if (tab.url.includes('10.36.91') || tab.url.includes('10.23.50.27')) {
      console.log(`Extracting DOM from: ${tab.url}`);
      const html = await evaluateInTab(tab.webSocketDebuggerUrl, 'document.body.innerHTML');
      dumps[tab.url] = html;
    }
  }
  
  fs.writeFileSync(path.join(__dirname, 'dom_dumps.json'), JSON.stringify(dumps, null, 2));
  console.log('Saved DOM dumps to scratch/dom_dumps.json');
}

dumpDoms().catch(console.error);
