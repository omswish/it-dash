const https = require('https');
const http = require('http');

// Portal IPs
const SOLARWINDS_SERVER_IP = "10.36.91.45";
const SOLARWINDS_NETWORK_IP = "10.36.91.46";
const NUTANIX_IP = "10.23.50.27";

const credentials = {
  solarwinds: {
    username: "hil-dor.itdashboard@adityabirla.com",
    secret: "ItDa$(1857"
  },
  nutanix: {
    username: "hildoritdashboard",
    secret: "ItDa$(1857"
  }
};

function testSolarWindsLogin(ip, creds) {
  // Use relative web URL on port 80 (default http) instead of SDK port 17778
  const url = `http://${ip}/SolarWinds/InformationService/v3/Json/Query`;
  const authHeader = 'Basic ' + Buffer.from(`${creds.username}:${creds.secret}`).toString('base64');
  
  console.log(`[Diagnostic] Attempting Web API Login on SolarWinds (${ip})...`);
  
  const payload = JSON.stringify({ query: "SELECT TOP 1 NodeID FROM Orion.Nodes" });
  
  return new Promise((resolve) => {
    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 6000
    }, (res) => {
      if (res.statusCode === 200) {
        console.log(`[✔ Success] SolarWinds (${ip}) Login Successful. HTTP ${res.statusCode}`);
        resolve(true);
      } else {
        console.warn(`[❌ Failed] SolarWinds (${ip}) Login Rejected. HTTP ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.error(`[❌ Error] SolarWinds (${ip}) connection failed: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error(`[❌ Timeout] SolarWinds (${ip}) request timed out.`);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

function testNutanixLogin(ip, creds) {
  // Prism API v3 endpoint for cluster validation
  const url = `https://${ip}:9440/api/nutanix/v3/clusters/list`;
  const authHeader = 'Basic ' + Buffer.from(`${creds.username}:${creds.secret}`).toString('base64');
  
  console.log(`[Diagnostic] Attempting Prism API Login on Nutanix (${ip})...`);
  
  const payload = JSON.stringify({ kind: "cluster" });

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 6000,
      rejectUnauthorized: false
    }, (res) => {
      if (res.statusCode === 200) {
        console.log(`[✔ Success] Nutanix (${ip}) Login Successful. HTTP ${res.statusCode}`);
        resolve(true);
      } else {
        console.warn(`[❌ Failed] Nutanix (${ip}) Login Rejected. HTTP ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.error(`[❌ Error] Nutanix (${ip}) connection failed: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error(`[❌ Timeout] Nutanix (${ip}) request timed out.`);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

async function runDiagnostics() {
  console.log("==================================================");
  console.log("=== NOC Portal Authentication & Login Diagnostics ===");
  console.log("==================================================");
  
  // 1. SolarWinds Server Portal
  await testSolarWindsLogin(SOLARWINDS_SERVER_IP, credentials.solarwinds);

  // 2. SolarWinds Network Portal
  await testSolarWindsLogin(SOLARWINDS_NETWORK_IP, credentials.solarwinds);
  
  // 3. Nutanix Prism Console
  await testNutanixLogin(NUTANIX_IP, credentials.nutanix);
  
  console.log("==================================================");
}

runDiagnostics();
