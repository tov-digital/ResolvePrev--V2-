const fs = require('fs');

function applyAdjustments(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Reduce gap between top 3 icons
  // Looking for the div containing the icons. It has "gap:14px;"
  content = content.replace(/gap:\s*14px;/g, 'gap:4px;');

  // 2. Set height:36px to the sheetStatusDropdownBtn
  // It currently has style="display:flex; align-items:center; gap:6px; background:var(--surface-1); color:var(--color-primary); padding:6px 12px; border-radius:var(--radius); font-size:13px; font-weight:500; border: 1px solid var(--border); cursor: pointer;"
  // We can just inject " height:36px;" before " padding:"
  content = content.replace(/(<button id="sheetStatusDropdownBtn" style="[^"]*?)(padding:6px 12px;)/g, '$1height:36px; $2');

  fs.writeFileSync(filePath, content, 'utf8');
}

applyAdjustments('new_modal.html');
applyAdjustments('index.html');

console.log('Adjustments applied.');
