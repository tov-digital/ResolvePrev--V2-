const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');
c = c.replace(/<p style="margin:0; font-size:14px; font-weight:500; display:flex; align-items:center; gap:6px;"><i class="ti ti-list" style="font-size:18px; color:var\(--text-accent\)" aria-hidden="true"><\/i>Perguntas<\/p>/g, '<p id="perguntasViewTitle" style="margin:0; font-size:14px; font-weight:500; display:flex; align-items:center; gap:6px;"><i class="ti ti-list" style="font-size:18px; color:var(--text-accent)" aria-hidden="true"></i><span>Perguntas</span></p>');
c = c.replace(/<div style="display:flex; flex-direction:column; gap:8px;">/g, '<div id="perguntasViewList" style="display:flex; flex-direction:column; gap:8px;">');
fs.writeFileSync('index.html', c);
console.log('HTML updated');
