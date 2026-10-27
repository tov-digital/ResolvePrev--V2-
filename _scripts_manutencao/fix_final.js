const fs = require('fs');

// 1. Update styles.css
let styles = fs.readFileSync('styles.css', 'utf8');

// Add .header-action-icon for the top 3 buttons
if (!styles.includes('.header-action-icon')) {
  styles += `\n
/* Ícones de ação no cabeçalho */
.header-action-icon {
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease, filter 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.header-action-icon:hover {
  background-color: var(--surface-hover, rgba(0,0,0,0.08));
  filter: none !important;
}
`;
}

// Ensure .dot-* classes override .status-tag-dot
// We can just add !important to the 11 dot classes by replacing them.
// They look like: .dot-novo { background-color: #64748B; }
styles = styles.replace(/(\.dot-[a-zA-Z0-9_-]+)\s*\{\s*background-color:\s*([^;}]+);?\s*\}/g, '$1 { background-color: $2 !important; }');

fs.writeFileSync('styles.css', styles, 'utf8');

// 2. Update new_modal.html and index.html
function updateHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add header-action-icon class to the 3 icons
  content = content.replace(/<i class="ti ti-user-check"/g, '<i class="ti ti-user-check header-action-icon"');
  content = content.replace(/<i class="ti ti-trash danger-action"/g, '<i class="ti ti-trash danger-action header-action-icon"');
  content = content.replace(/<i class="ti ti-x" id="closeClientSheetModal"/g, '<i class="ti ti-x header-action-icon" id="closeClientSheetModal"');
  
  // Change sheetStatusDropdownBtn background to var(--surface-1)
  content = content.replace(/background:var\(--bg-input\);/g, 'background:var(--surface-1);');

  fs.writeFileSync(filePath, content, 'utf8');
}

updateHtml('new_modal.html');
updateHtml('index.html');

console.log('Fix applied.');
