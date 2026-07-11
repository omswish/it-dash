const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const doms = JSON.parse(fs.readFileSync('./scratch/dom_dumps.json', 'utf8'));

for (const [url, html] of Object.entries(doms)) {
  console.log(`\n\n=== Analyzing ${url} ===`);
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  if (url.includes('10.23.50.27')) {
    // Nutanix
    console.log("Nutanix Data:");
    console.log("Storage:", doc.querySelector('.storage-capacity-bar-wrapper .used-capacity.bar')?.style.width);
    
    // Find texts
    const allDivs = Array.from(doc.querySelectorAll('div, span, text'));
    allDivs.forEach(div => {
      const text = div.textContent.trim();
      if (text.includes('CPU') || text.includes('Memory') || text.includes('%')) {
         if (text.length < 50 && !text.includes('function')) console.log("Possible Match:", text);
      }
    });
  }

  if (url.includes('10.36.91.45') || url.includes('10.36.91.46')) {
    // SolarWinds
    const trs = Array.from(doc.querySelectorAll('tr'));
    const rows = trs.map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()).filter(Boolean).join(' | ')).filter(r => r.length > 5);
    
    console.log(`Found ${rows.length} valid table rows. Samples:`);
    console.log(rows.slice(0, 30));
  }
}
