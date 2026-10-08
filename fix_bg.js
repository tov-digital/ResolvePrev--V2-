const fs = require('fs');

function removeCurrentColor(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/ background:currentColor;/g, '');
  fs.writeFileSync(filePath, content, 'utf8');
}

removeCurrentColor('new_modal.html');
removeCurrentColor('index.html');
console.log('Done removing background:currentColor;');
