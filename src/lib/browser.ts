import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

export function ensureBrowserRunning(): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const res = await fetch('http://localhost:9222/json');
      if (res.ok) {
        resolve();
        return;
      }
    } catch {
      // Not running, proceed to launch
    }

    console.log('Background Scraper: Remote debugging port not active. Attempting to start Windows browser instance...');

    // Windows specific browser paths - Exclusively targeting Organization Managed Edge
    let browserPath = '';
    const edgePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];

    for (const p of edgePaths) {
      if (fs.existsSync(p)) {
        browserPath = p;
        break;
      }
    }

    if (!browserPath) {
      reject(new Error('Organization managed Microsoft Edge not found on the Windows system. Please ensure Edge is installed.'));
      return;
    }

    console.log(`Background Scraper: Spawning browser from path: ${browserPath}`);
    const profileDir = path.join(os.tmpdir(), 'it-dash-browser-profile');
    
    // Create the tmp dir if it doesn't exist
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    const args = [
      '--remote-debugging-port=9222',
      '--headless=new',
      '--disable-gpu',
      '--ignore-certificate-errors',
      '--allow-insecure-localhost',
      `--user-data-dir=${profileDir}`,
      '--no-sandbox',
      '--disable-dev-shm-usage'
    ];

    try {
      const child = spawn(browserPath, args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true // Native Windows flag to hide the console window completely
      });
      child.unref();

      // Poll port 9222 for up to 5 seconds
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 500));
        try {
          const testRes = await fetch('http://localhost:9222/json');
          if (testRes.ok) {
            console.log('Background Scraper: Browser debugger started successfully on port 9222.');
            resolve();
            return;
          }
        } catch {
          // Wait and retry
        }
      }
      reject(new Error('Browser spawned but remote debugging port 9222 did not activate on Windows.'));
    } catch (spawnErr) {
      reject(new Error('Failed to launch Windows browser process: ' + (spawnErr as Error).message));
    }
  });
}
