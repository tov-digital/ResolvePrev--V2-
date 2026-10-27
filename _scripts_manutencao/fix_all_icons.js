const fs = require('fs');

function fixAll(file) {
  let text = fs.readFileSync(file, 'utf8');
  
  // Replace font-size:14px with font-size:18px when it is inside an <i> tag containing ti-circle-plus
  // By breaking it into pieces or using the /s flag
  text = text.replace(/<i[^>]*ti-circle-plus[^>]*>/gs, (match) => {
    return match.replace(/14px/g, '18px');
  });
  
  fs.writeFileSync(file, text, 'utf8');
}

fixAll('index.html');
fixAll('new_modal.html');
console.log('Fixed ALL icons');
