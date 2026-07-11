const http = require('http');
const WebSocket = require('ws');

http.get('http://localhost:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const tabs = JSON.parse(data);
    
    // Nutanix
    const n = tabs.find(t => t.url.includes('10.23.50.27'));
    if (n) {
      const ws = new WebSocket(n.webSocketDebuggerUrl);
      ws.on('open', () => {
        ws.send(JSON.stringify({
          id: 1, method: 'Runtime.evaluate', 
          params: { 
            expression: `
              (() => {
                 let cpu = 0, mem = 0, storage = 0;
                 try { storage = parseFloat(document.querySelector('.storage-capacity-bar-wrapper .used-capacity.bar').style.width); } catch(e){}
                 document.querySelectorAll('*').forEach(el => {
                   if(el.textContent && el.textContent.includes('CPU Usage')) {
                      const m = el.textContent.match(/(\\d+(\\.\\d+)?)%/);
                      if (m) cpu = parseFloat(m[1]);
                   }
                   if(el.textContent && el.textContent.includes('Memory Usage')) {
                      const m = el.textContent.match(/(\\d+(\\.\\d+)?)%/);
                      if (m) mem = parseFloat(m[1]);
                   }
                 });
                 return {cpu, mem, storage};
              })()
            `, returnByValue: true 
          }
        }));
        ws.on('message', m => console.log('Nutanix Data:', JSON.parse(m).result.result.value));
      });
    }

    // SolarWinds
    const s = tabs.find(t => t.url.includes('10.36.91.45'));
    if (s) {
      const ws2 = new WebSocket(s.webSocketDebuggerUrl);
      ws2.on('open', () => {
        ws2.send(JSON.stringify({
          id: 2, method: 'Runtime.evaluate', 
          params: { 
            expression: `
              (() => {
                 return Array.from(document.querySelectorAll('tr')).map(tr => 
                    Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()).filter(Boolean)
                 ).filter(r => r.length > 2);
              })()
            `, returnByValue: true 
          }
        }));
        ws2.on('message', m => {
            const val = JSON.parse(m).result.result.value;
            console.log('SolarWinds 45 Table Rows:', val ? val.slice(0, 10) : 'None');
        });
      });
    }

    setTimeout(() => process.exit(0), 2000);
  });
});
