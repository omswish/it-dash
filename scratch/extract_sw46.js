const http = require('http');
const WebSocket = require('ws');

http.get('http://localhost:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const tabs = JSON.parse(data);

    // SolarWinds 46
    const s = tabs.find(t => t.url.includes('10.36.91.46'));
    if (s) {
      const ws2 = new WebSocket(s.webSocketDebuggerUrl);
      ws2.on('open', () => {
        ws2.send(JSON.stringify({
          id: 2, method: 'Runtime.evaluate', 
          params: { 
            expression: `
              (() => {
                 const text = document.body.innerText;
                 return text.split('\\n').filter(line => line.includes('SDWAN') || line.includes('ILL') || line.includes('ISP') || line.includes('Link')).join('\\n');
              })()
            `, returnByValue: true 
          }
        }));
        ws2.on('message', m => {
            console.log('SolarWinds 46 Network Links:');
            console.log(JSON.parse(m).result.result.value);
        });
      });
    }

    setTimeout(() => process.exit(0), 1500);
  });
});
