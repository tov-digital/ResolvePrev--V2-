const fs = require('fs');

function forceFix(file) {
  let lines = fs.readFileSync(file, 'utf8').split('\n');
  let inIcon = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('ti-circle-plus') || lines[i].includes('btn-add-info')) {
      inIcon = true;
    }
    
    if (inIcon && lines[i].includes('14px')) {
      lines[i] = lines[i].replace('14px', '18px');
      inIcon = false; // Reset after changing
    }
    
    if (lines[i].includes('</button>')) {
      inIcon = false;
    }
  }
  
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
}

forceFix('index.html');
forceFix('new_modal.html');
console.log('Force fixed!');
