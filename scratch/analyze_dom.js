const fs = require('fs');
const doms = JSON.parse(fs.readFileSync('./scratch/dom_dumps.json', 'utf8'));

for (const [url, html] of Object.entries(doms)) {
  console.log(`\n\n=== Analyzing ${url} ===`);
  
  if (url.includes('10.23.50.27')) {
    // Nutanix
    console.log("Looking for CPU/Mem/Storage patterns...");
    const regexes = [
      /class="[^"]*".{0,50}CPU Usage.{0,200}?(\d+(\.\d+)?)%/i,
      /class="[^"]*".{0,50}Memory Usage.{0,200}?(\d+(\.\d+)?)%/i,
      /class="[^"]*".{0,50}Storage.{0,200}?(\d+(\.\d+)?)%/i,
      /<svg[^>]*>.*?<\/svg>/i,
    ];
    for (const r of regexes) {
      const match = html.match(r);
      if (match) console.log(`Matched: ${match[0].substring(0, 150)}`);
    }
  }

  if (url.includes('10.36.91.45') || url.includes('10.36.91.46')) {
    console.log("Looking for SolarWinds node tables...");
    // Find table structures or specific classes
    const match = html.match(/<table[^>]*class="[^"]*?GridView[^"]*"[^>]*>.*?<\/table>/is);
    if (match) {
      console.log(`Found Data Table. Length: ${match[0].length} chars. Sample:`);
      console.log(match[0].substring(0, 300));
    } else {
      console.log("No GridView table found. Checking general tables...");
      const t = html.match(/<table.*?<\/table>/is);
      if (t) console.log(t[0].substring(0, 300));
    }
  }
}
