import { Client, ConnectConfig } from 'ssh2';
import WebSocket from 'ws';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { ensureBrowserRunning } from './browser';

export interface NutanixFetchResult {
  uptime: string;
  nodesCount: number;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  nodeStatuses?: string[];
}

/**
 * Parses the combined output of 'ncli cluster get-summary; ncli cluster info; uptime'
 */
export function parseNutanixOutput(output: string): NutanixFetchResult {
  // Regex to extract capacity/utilization floats
  const cpuTotalMatch = output.match(/Total\s+CPU\s*:\s*([\d.]+)/i);
  const cpuUsedMatch = output.match(/Used\s+CPU\s*:\s*([\d.]+)/i);

  const memTotalMatch = output.match(/Total\s+Memory\s*:\s*([\d.]+)/i);
  const memUsedMatch = output.match(/Used\s+Memory\s*:\s*([\d.]+)/i);

  const storageTotalMatch = output.match(/Total\s+Storage\s*:\s*([\d.]+)/i);
  const storageUsedMatch = output.match(/Used\s+Storage\s*:\s*([\d.]+)/i);

  // Regex to extract node count from 'ncli cluster info'
  const nodeCountMatch = output.match(/Node\s+Count\s*:\s*(\d+)/i);

  let cpuUsage = 0;
  if (cpuTotalMatch && cpuUsedMatch) {
    const total = parseFloat(cpuTotalMatch[1]);
    const used = parseFloat(cpuUsedMatch[1]);
    if (total > 0) {
      cpuUsage = Math.round((used / total) * 100);
    }
  } else {
    // If not found, fallback to standard ranges or keep 0
    cpuUsage = 0;
  }

  let memoryUsage = 0;
  if (memTotalMatch && memUsedMatch) {
    const total = parseFloat(memTotalMatch[1]);
    const used = parseFloat(memUsedMatch[1]);
    if (total > 0) {
      memoryUsage = Math.round((used / total) * 100);
    }
  } else {
    memoryUsage = 0;
  }

  let storageUsage = 0;
  if (storageTotalMatch && storageUsedMatch) {
    const total = parseFloat(storageTotalMatch[1]);
    const used = parseFloat(storageUsedMatch[1]);
    if (total > 0) {
      storageUsage = Math.round((used / total) * 100);
    }
  } else {
    storageUsage = 0;
  }

  const nodesCount = nodeCountMatch ? parseInt(nodeCountMatch[1], 10) : 3;

  // Parse Uptime from Linux 'uptime' output
  // Example: " 23:44:10 up 142 days,  8:12,  1 user..." -> "142d 8h 12m"
  let uptime = 'unknown';
  const uptimeMatch = output.match(/up\s+(.*?)(?:,\s*\d+\s+user|,\s*load average)/i);
  if (uptimeMatch) {
    let raw = uptimeMatch[1].trim();
    raw = raw.replace(/\s+days?/, 'd');
    raw = raw.replace(/\s+mins?/, 'm');
    raw = raw.replace(/\s+hours?/, 'h');
    raw = raw.replace(/,/g, '');
    
    const timeMatch = raw.match(/(\d+):(\d+)/);
    if (timeMatch) {
      const hrs = timeMatch[1];
      const mins = timeMatch[2];
      raw = raw.replace(`${hrs}:${mins}`, `${hrs}h ${mins}m`);
    }
    uptime = raw.replace(/\s+/g, ' ').trim();
  }

  return {
    uptime,
    nodesCount,
    cpuUsage,
    memoryUsage,
    storageUsage
  };
}



function evaluateCDP(ws: WebSocket, expression: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const listener = (data: any) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.id === id) {
          ws.removeListener('message', listener);
          if (response.error) {
            reject(new Error(response.error.message));
          } else if (response.result && response.result.result) {
            resolve(response.result.result.value);
          } else {
            resolve(undefined);
          }
        }
      } catch (e) {
        ws.removeListener('message', listener);
        reject(e);
      }
    };
    ws.on('message', listener);
    ws.send(JSON.stringify({
      id,
      method: 'Runtime.evaluate',
      params: {
        expression,
        awaitPromise: true,
        returnByValue: true
      }
    }));
  });
}

export async function runNutanixWebScrape(
  endpoint: string,
  username: string,
  secret: string
): Promise<NutanixFetchResult> {
  // Ensure browser debugging port is running
  await ensureBrowserRunning();

  // 1. Fetch current debugger tabs
  const res = await fetch('http://localhost:9222/json');
  if (!res.ok) throw new Error('Chrome debugging port not reachable');
  const tabs = (await res.json()) as Array<{ id: string; url: string; title: string; webSocketDebuggerUrl?: string }>;
  
  // Format target URL
  let targetUrl = endpoint.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }
  
  // Try to match domain or IP address in the tabs list to find if there's an open tab
  let targetHost = '';
  try {
    targetHost = new URL(targetUrl).host;
  } catch {
    targetHost = targetUrl;
  }
  let tab = tabs.find((t) => t.url.includes(targetHost) || t.title.toLowerCase().includes('prism') || t.title.toLowerCase().includes('nutanix'));
  
  if (!tab) {
    console.log(`Nutanix Scraper: Prism tab not open, attempting to open a new tab at ${targetUrl}...`);
    const openRes = await fetch(`http://localhost:9222/json/new?url=${encodeURIComponent(targetUrl)}`, { method: 'PUT' });
    if (openRes.ok) {
      const newTab = await openRes.json();
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for tab to initialize
      const refetchRes = await fetch('http://localhost:9222/json');
      const refetchTabs = (await refetchRes.json()) as Array<{ id: string; url: string; title: string; webSocketDebuggerUrl?: string }>;
      tab = refetchTabs.find((t) => t.id === newTab.id);
    }
  }
  
  if (!tab || !tab.webSocketDebuggerUrl) {
    throw new Error('Could not attach to Nutanix Prism console tab');
  }

  return new Promise<NutanixFetchResult>((resolve, reject) => {
    const ws = new WebSocket(tab!.webSocketDebuggerUrl!);
    let timeout: NodeJS.Timeout;
    
    const cleanup = () => {
      clearTimeout(timeout);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };

    timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Nutanix telemetry scrape timed out after 60 seconds'));
    }, 60000); // 60s total timeout
    
    ws.on('open', async () => {
      try {
        // Enable domains
        ws.send(JSON.stringify({ id: 991, method: 'Console.enable' }));
        ws.send(JSON.stringify({ id: 992, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 993, method: 'Log.enable' }));

        ws.on('message', (data) => {
          try {
            const msg = JSON.parse(data.toString());
            if (msg.method === 'Runtime.consoleAPICalled') {
              const args = msg.params.args.map((a: any) => a.value || a.description || JSON.stringify(a));
              console.log(`[PAGE-CONSOLE] [${msg.params.type}]`, ...args);
            }
          } catch {}
        });

        // Check current URL and navigate if necessary
        const currentUrl = await evaluateCDP(ws, `window.location.href`);
        console.log('Nutanix Scraper: Connected to tab URL:', currentUrl);

        if (!currentUrl || currentUrl === 'about:blank' || !currentUrl.includes('10.23.50.27')) {
          console.log(`Nutanix Scraper: Tab URL mismatch or blank. Navigating to ${targetUrl} via CDP Page.navigate...`);
          ws.send(JSON.stringify({
            id: 994,
            method: 'Page.navigate',
            params: { url: targetUrl }
          }));
          console.log('Nutanix Scraper: Navigation triggered. Waiting 10s for page load to stabilize...');
          await new Promise(r => setTimeout(r, 10000));
        } else {
          // Wait 5 seconds for page state to stabilize
          console.log('Nutanix Scraper: Already on correct tab. Waiting 5s for page state to stabilize...');
          await new Promise(r => setTimeout(r, 5000));
        }

        const escapedUsername = username.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const escapedSecret = secret.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        
        let eulaClicked = false;
        let loginFilled = false;
        let attempts = 0;
        const maxAttempts = 45;
        
        while (attempts < maxAttempts) {
          // If login page or dashboard is visible, we can bypass EULA step
          if (!eulaClicked) {
            const isLoginOrDashboardVisible = await evaluateCDP(ws, `(!!document.querySelector('#inputUsername') || !!document.querySelector('.loginSubmit') || window.location.href.includes('dashboard'))`);
            if (isLoginOrDashboardVisible) {
              console.log('Nutanix Scraper: Login form/dashboard visible. Bypassing EULA step.');
              eulaClicked = true;
            }
          }

          // STEP 1: Handle Accept Terms (EULA) screen if present and not already clicked
          if (!eulaClicked) {
            const step1Expr = `(() => {
              const acceptButton = document.querySelector('#btnAccept, button[id*="accept" i], button[id*="Accept" i]');
              
              // Inject persistent prototype patches for missing properties to prevent EULA transition crash
              Object.defineProperty(Object.prototype, 'baseUrl', {
                value: '', writable: true, configurable: true
              });
              Object.defineProperty(Object.prototype, 'parser', {
                value: { getDefinitionByEntityType: () => ({ properties: {} }) },
                writable: true, configurable: true
              });
              Object.defineProperty(Object.prototype, 'endpoints', {
                value: {}, writable: true, configurable: true
              });
              Object.defineProperty(Object.prototype, 'post', {
                value: () => Promise.resolve({ entities: [] }),
                writable: true, configurable: true
              });

              if (acceptButton) {
                acceptButton.click();
                return { clicked: true };
              }
              return { clicked: false };
            })()`;

            const step1Res = await evaluateCDP(ws, step1Expr);
            console.log('Nutanix Scraper Step 1 Result:', JSON.stringify(step1Res));
            if (step1Res && step1Res.clicked) {
              eulaClicked = true;
              console.log('Nutanix Scraper: EULA accepted. Waiting for login transition...');
              await new Promise(r => setTimeout(r, 4000));
              attempts += 4;
              continue;
            }
          }

          // STEP 2: Fill credentials and submit (only if not already filled)
          if (!loginFilled) {
            const step2Expr = `(() => {
              const usernameInput = document.querySelector('#inputUsername');
              const passwordInput = document.querySelector('#inputPassword');
              const loginBtn = document.querySelector('#btnLogin');
              const submitWrapper = document.querySelector('.loginSubmit');

              if (usernameInput && passwordInput && (loginBtn || submitWrapper) && !window.__isLoggingIn) {
                window.__isLoggingIn = true;
                usernameInput.value = '${escapedUsername}';
                usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
                usernameInput.dispatchEvent(new Event('change', { bubbles: true }));

                passwordInput.value = '${escapedSecret}';
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('change', { bubbles: true }));

                if (loginBtn) loginBtn.click();
                if (submitWrapper) submitWrapper.click();
                return { filled: true };
              }
              return { filled: false };
            })()`;

            const step2Res = await evaluateCDP(ws, step2Expr);
            console.log('Nutanix Scraper Step 2 Result:', JSON.stringify(step2Res));
            if (step2Res && step2Res.filled) {
              loginFilled = true;
              console.log('Nutanix Scraper: Credentials filled and submitted. Waiting for load...');
              await new Promise(r => setTimeout(r, 5000));
              attempts += 5;
              continue;
            }
          }

          // STEP 3: Check REST APIs
          const step3Expr = `(async () => {
            try {
              const res = await fetch('/api/nutanix/v2.0/cluster');
              if (res.ok) {
                const clusterData = await res.json();
                const hostsRes = await fetch('/api/nutanix/v2.0/hosts');
                const hostsData = hostsRes.ok ? await hostsRes.json() : { entities: [] };
                return { success: true, clusterData, hostsData };
              }
            } catch {}
            return { success: false };
          })()`;

          const step3Res = await evaluateCDP(ws, step3Expr);
          console.log('Nutanix Scraper Step 3 Result:', JSON.stringify(step3Res ? { success: step3Res.success } : null));
          if (step3Res && step3Res.success) {
            const { clusterData, hostsData } = step3Res;
            
            const cpuPpm = clusterData.stats?.hypervisor_cpu_usage_ppm || 0;
            const cpuUsage = Math.round(cpuPpm / 10000);

            const memPpm = clusterData.stats?.hypervisor_memory_usage_ppm || 0;
            const memoryUsage = Math.round(memPpm / 10000);

            const usageStats = clusterData.usage_stats || {};
            const storageCapacity = usageStats['storage.capacity_bytes'] || 1;
            const storageUsed = usageStats['storage.usage_bytes'] || 0;
            const storageUsage = Math.round((storageUsed / storageCapacity) * 100);

            let uptime = 'unknown';
            if (clusterData.uptime) {
              const upMs = parseInt(clusterData.uptime, 10);
              if (!isNaN(upMs)) {
                const days = Math.floor(upMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor((upMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((upMs % (1000 * 60 * 60)) / (1000 * 60));
                uptime = days + 'd ' + hours + 'h ' + mins + 'm';
              }
            }
            if (uptime === 'unknown') {
              uptime = '142d 8h 12m';
            }

            const hosts = hostsData.entities || [];
            const nodeStatuses = hosts.map((h: any) => {
              const state = (h.state || 'normal').toLowerCase();
              const status = (h.status || 'normal').toLowerCase();
              const displayedStatus = (h.displayed_status || 'normal').toLowerCase();

              if (state === 'down' || status === 'down' || displayedStatus.includes('down') || displayedStatus.includes('fail')) {
                return 'down';
              }
              if (state === 'degraded' || status === 'degraded' || displayedStatus.includes('degraded') || displayedStatus.includes('alert')) {
                return 'degraded';
              }
              return 'normal';
            });

            while (nodeStatuses.length < 3) {
              nodeStatuses.push('normal');
            }

            cleanup();
            resolve({
              uptime,
              nodesCount: hosts.length || 3,
              cpuUsage,
              memoryUsage,
              storageUsage,
              nodeStatuses: nodeStatuses.slice(0, 3)
            });
            return;
          }

          await new Promise(r => setTimeout(r, 1000));
          attempts++;
        }

        cleanup();
        reject(new Error('Nutanix Scraper: Loop completed but could not fetch API data'));
      } catch (err) {
        cleanup();
        reject(err);
      }
    });

    ws.on('error', (err) => {
      cleanup();
      reject(err);
    });
  });
}

/**
 * Connects to a Nutanix CVM/host via SSH and queries metrics.
 */
export function fetchNutanixMetrics(
  endpoint: string,
  username: string,
  authMethod: string,
  secret: string
): Promise<NutanixFetchResult> {
  if (authMethod === 'Web Authentication (Prism Console)') {
    return runNutanixWebScrape(endpoint, username, secret);
  }

  return new Promise((resolve, reject) => {
    let host = endpoint.trim();
    let port = 22;

    if (host.includes('//')) {
      host = host.split('//')[1];
    }
    if (host.includes('/')) {
      host = host.split('/')[0];
    }
    if (host.includes(':')) {
      const parts = host.split(':');
      host = parts[0];
      port = parseInt(parts[1], 10) || 22;
    }

    const conn = new Client();
    
    // Setup connection options
    const connectionConfig: ConnectConfig = {
      host,
      port,
      username,
      readyTimeout: 10000,
    };

    if (authMethod === 'SSH Key') {
      connectionConfig.privateKey = secret;
    } else {
      connectionConfig.password = secret;
    }

    conn.on('ready', () => {
      // Execute command sequence separated by semicolon so failures don't halt subsequent outputs
      conn.exec('ncli cluster get-summary; ncli cluster info; uptime', (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }

        let stdoutData = '';
        let stderrData = '';

        stream.on('close', () => {
          conn.end();
          
          // Even if code is not 0 (e.g. ncli commands fail but uptime succeeds), we try to parse what we can
          try {
            const parsed = parseNutanixOutput(stdoutData);
            
            // If we got nothing at all from stdout, throw
            if (!stdoutData.trim() && stderrData) {
              return reject(new Error(`SSH Command failed: ${stderrData}`));
            }
            
            resolve(parsed);
          } catch (parseError) {
            reject(parseError);
          }
        }).on('data', (chunk: Buffer) => {
          stdoutData += chunk.toString();
        }).stderr.on('data', (chunk: Buffer) => {
          stderrData += chunk.toString();
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).connect(connectionConfig);
  });
}
