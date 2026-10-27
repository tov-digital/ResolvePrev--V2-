const fs = require('fs');

function enlargeIcons(file) {
  let text = fs.readFileSync(file, 'utf8');
  // Change ti-circle-plus font-size:14px to font-size:18px
  text = text.replace(/class="ti ti-circle-plus" style="font-size:14px;"/g, 'class="ti ti-circle-plus" style="font-size:18px;"');
  
  // Also change the SVG in select in styles.css
  if (file.endsWith('styles.css')) {
    text = text.replace(/width='14' height='14'/g, "width='18' height='18'");
  }
  
  fs.writeFileSync(file, text, 'utf8');
}

enlargeIcons('index.html');
enlargeIcons('new_modal.html');
enlargeIcons('styles.css');
console.log('Enlarged icons');
