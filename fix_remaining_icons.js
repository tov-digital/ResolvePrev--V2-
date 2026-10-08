const fs = require('fs');

function fixRemainingIcons(file) {
  let text = fs.readFileSync(file, 'utf8');
  
  // Replace font-size:14px for ti-circle-plus even if it spans newlines
  text = text.replace(/(class="ti\s+ti-circle-plus"[^>]*?style="[^"]*?font-size:\s*)14px/g, '$118px');
  text = text.replace(/(style="[^"]*?font-size:\s*)14px([^"]*?"[^>]*?class="ti\s+ti-circle-plus")/g, '$118px$2');
  
  fs.writeFileSync(file, text, 'utf8');
}

fixRemainingIcons('index.html');
fixRemainingIcons('new_modal.html');
console.log('Fixed remaining icons');
