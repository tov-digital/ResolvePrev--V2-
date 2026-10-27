const fs = require('fs');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Update sheetStatusDropdownBtn
  let btnRegex = /<button id="sheetStatusDropdownBtn"[\s\S]*?<\/button>/m;
  let newBtn = `<button id="sheetStatusDropdownBtn" style="display:flex; align-items:center; gap:6px; background:var(--bg-input); color:var(--color-primary); padding:6px 12px; border-radius:var(--radius); font-size:13px; font-weight:500; border: 1px solid var(--border); cursor: pointer;">
              <span class="status-tag-dot" id="sheetStatusDot" style="display:inline-block; margin-right:2px; background:currentColor;"></span>
              <span id="sheetStatusText">Reunião</span>
              <i class="ti ti-chevron-down" style="font-size:14px" aria-hidden="true"></i>
            </button>`;
  content = content.replace(btnRegex, newBtn);

  // Update sheetNotesBtn
  let notesRegex = /<button id="sheetNotesBtn"[\s\S]*?<\/button>/m;
  let newNotes = `<button id="sheetNotesBtn" style="position:relative; display:flex; align-items:center; justify-content:center; width:36px; height:36px; border:1px solid var(--border); border-radius:8px; font-size:18px; background: var(--surface-1); cursor: pointer; color: var(--color-primary);">
            <i class="ti ti-message" aria-hidden="true"></i>
            <span id="sheetNotesCountBadge" class="hidden" style="position:absolute; top:-6px; right:-6px; background:#ef4444; color:white; font-size:10px; font-weight:bold; width:18px; height:18px; display:flex; align-items:center; justify-content:center; border-radius:50%; border:2px solid white;">0</span>
          </button>`;
  content = content.replace(notesRegex, newNotes);

  fs.writeFileSync(filePath, content, 'utf8');
}

updateFile('new_modal.html');
updateFile('index.html');
console.log('Done');
