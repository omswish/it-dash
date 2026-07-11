const { exec } = require('child_process');

console.log('Starting IT Dashboard web server...');

// Boot the Next.js development server
const devServer = exec('npm run dev', (err) => {
  if (err) {
    console.error('Failed to run local dashboard dev server:', err);
    process.exit(1);
  }
});

// Stream standard output/error to terminal
devServer.stdout.pipe(process.stdout);
devServer.stderr.pipe(process.stderr);

// Wait 4 seconds for Next.js to compile and start listening on port 3000, then spawn Chrome tabs
setTimeout(() => {
  console.log('Opening target dashboard & scraper pages...');
  
  const urls = [
    'http://localhost:3000',
    'https://10.23.50.27:9440/console/#page/dashboard',
    'https://10.23.50.27:9440/console/#page/vms',
    'http://10.36.91.46/Orion/NetPerfMon/NodeDetails.aspx?NetObject=N:401',
    'http://10.36.91.46/Orion/NetPerfMon/NodeDetails.aspx?NetObject=N:402',
    'http://10.36.91.46/Orion/NetPerfMon/NodeDetails.aspx?NetObject=N:1419',
    'http://10.36.91.46/Orion/NetPerfMon/NodeDetails.aspx?NetObject=N:1417',
    'https://hsd.adityabirla.com/MDLIncidentMgmt/SDE_Dashboard.aspx'
  ];

  const startCmd = process.platform === 'win32' ? 'start' : 'open';
  urls.forEach(url => {
    exec(`${startCmd} "" "${url}"`);
  });
}, 4000);
