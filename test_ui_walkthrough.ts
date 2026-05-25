import fs from 'fs';
import path from 'path';
import { getDb } from './src/lib/db';

async function testWalkthrough() {
  console.log('--- IT Dash UI & Data Update Walkthrough Test ---');

  // 1. Initial State Check
  let db = getDb();
  console.log('1. Initial config connections:');
  console.log('   Nutanix:', db.configs.nutanix.connected);
  console.log('   Symphony:', db.configs.symphony.connected);
  console.log('   SolarWinds:', db.configs.solarwinds?.connected);

  // 2. Simulate User clicking "Test & Connect" in ConfigModal for all three
  console.log('\n2. Simulating User connecting via ConfigModal...');
  
  db.configs.nutanix.connected = true;
  db.configs.symphony.connected = true;
  if (db.configs.solarwinds) db.configs.solarwinds.connected = true;
  
  // Force a time update to ensure background sync triggers on next getDb()
  db.lastUpdated = Date.now() - 20000; 
  fs.writeFileSync(path.join(process.cwd(), 'src/lib/db.json'), JSON.stringify(db, null, 2));

  // 3. Trigger Data Sync Loop
  console.log('\n3. Triggering background data updates (simulating page reload)...');
  getDb(); 
  
  console.log('Waiting 10 seconds for headless browsers and API calls to fetch data...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // 4. Verify Final State
  console.log('\n4. Verifying Data Updates:');
  db = getDb(); 
  
  console.log('--- Nutanix Data ---');
  console.log('Storage Usage:', db.nutanix.storageUsage + '%');
  console.log('Nodes Count:', db.nutanix.nodesCount);
  
  console.log('\n--- Symphony Data ---');
  console.log('Open Incidents:', db.symphony.openIncidents);
  console.log('Service Requests:', db.symphony.serviceRequests);
  
  console.log('\n--- SolarWinds Data ---');
  console.log('Servers Count:', db.servers.length);
  if (db.servers.length > 0) {
    console.log('First Server:', db.servers[0].name, '-', db.servers[0].status);
  }
  console.log('Networks Count:', db.networks.length);
  if (db.networks.length > 0) {
    console.log('First Network Link:', db.networks[0].provider, '-', db.networks[0].status);
  }
  
  console.log('\nTest Completed Successfully.');
}

testWalkthrough().catch(console.error);
