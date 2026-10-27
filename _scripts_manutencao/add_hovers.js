const fs = require('fs');

// 1. Add classes to styles.css
let styles = fs.readFileSync('styles.css', 'utf8');

if (!styles.includes('.btn-whatsapp')) {
  styles += `
/* Hover Customizado WhatsApp */
.btn-whatsapp {
  transition: all 0.2s ease !important;
}
.btn-whatsapp:hover {
  background-color: #25D366 !important;
  color: #ffffff !important;
  border-color: #25D366 !important;
  filter: none !important;
}

/* Hover Customizado Gmail */
.btn-gmail {
  transition: all 0.2s ease !important;
}
.btn-gmail:hover {
  background-color: #EA4335 !important;
  color: #ffffff !important;
  border-color: #EA4335 !important;
  filter: none !important;
}
`;
  fs.writeFileSync('styles.css', styles, 'utf8');
}

// 2. Add classes to the buttons in HTML files
function addClasses(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Enviar mensagem -> add btn-whatsapp
  // Currently looks like: <button style="border:1px solid var(--border); background:var(--surface-1); border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--color-primary);"><i class="ti ti-brand-whatsapp"
  
  content = content.replace(/(<button style="border:1px solid var\(--border\);\s*background:var\(--surface-1\);[^>]*?)(><i class="ti ti-brand-whatsapp")/g, '$1" class="btn-whatsapp$2');
  
  // Actually, we can just replace the opening tag for both if they don't have a class attribute yet, or inject the class.
  // Wait, let's just use string replace for the specific HTML snippet.
  
  let wppTarget = '<button style="border:1px solid var(--border); background:var(--surface-1); border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--color-primary);"><i class="ti ti-brand-whatsapp"';
  let wppNew = '<button class="btn-whatsapp" style="border:1px solid var(--border); background:var(--surface-1); border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--color-primary);"><i class="ti ti-brand-whatsapp"';
  content = content.replace(wppTarget, wppNew);

  let gmailTarget = '<button style="border:1px solid var(--border); background:var(--surface-1); border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--color-primary);"><i class="ti ti-calendar-plus"';
  let gmailNew = '<button class="btn-gmail" style="border:1px solid var(--border); background:var(--surface-1); border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--color-primary);"><i class="ti ti-calendar-plus"';
  content = content.replace(gmailTarget, gmailNew);

  fs.writeFileSync(filePath, content, 'utf8');
}

addClasses('new_modal.html');
addClasses('index.html');

console.log('Hover effects applied.');
