const http = require('http');
const WebSocket = require('ws');

http.get('http://localhost:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const tabs = JSON.parse(data);
    const target = tabs.find(t => t.url.includes('10.23.50.27'));
    if (target) {
      console.log('Logging in to:', target.url);
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      ws.on('open', () => {
        const expression = `
          document.querySelector("input[type='text']").value = "hildoritdashboard";
          document.querySelector("input[type='password']").value = "ItDa$(1857";
          document.querySelector("button[type='submit']").click();
        `;
        ws.send(JSON.stringify({
          id: 1, 
          method: 'Runtime.evaluate', 
          params: { expression, returnByValue: true }
        }));
        setTimeout(() => { ws.close(); process.exit(0); }, 3000);
      });
    } else {
      console.log('Target tab not found.');
      process.exit(1);
    }
  });
});
