const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');
c = c.replace(/<div style="display:flex; align-items:center; gap:4px;">\s*<label\s+for="([^"]+)" style="margin:0; font-weight:normal; cursor:pointer;">([^<]+)<\/label>\s*<i class="ti ti-help" style="font-size:14px; cursor:pointer; color:var\(--text-muted\);" title="Ajuda"><\/i>\s*<\/div>/g, '<label for="$1" style="margin:0; font-weight:normal; cursor:pointer;">$2</label>');
fs.writeFileSync('index.html', c);
console.log('Replaced.');
