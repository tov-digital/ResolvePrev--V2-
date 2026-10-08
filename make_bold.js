const fs = require('fs');

function boldName(file) {
  let text = fs.readFileSync(file, 'utf8');
  let regex = /(id="sheetClientNameInput"[^>]*?font-weight:)500/g;
  text = text.replace(regex, '$1bold');
  fs.writeFileSync(file, text, 'utf8');
}

boldName('new_modal.html');
boldName('index.html');
console.log('Made client name bold');
