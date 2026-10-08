const fs = require('fs');

function fixHTML(file) {
  let text = fs.readFileSync(file, 'utf8');
  let newSpan = '<span id="nextStepLabel" style="font-size:12px; color:var(--text-secondary); margin-right:auto;">Próxima etapa:</span>';
  // Use a regex that ignores any whitespace inside the span declaration
  text = text.replace(/<span[^>]*margin-right:auto[^>]*>Pr(?:ó|)xima etapa:(?:.*?)<\/span>/, newSpan);
  fs.writeFileSync(file, text, 'utf8');
}

fixHTML('new_modal.html');
fixHTML('index.html');
console.log('Fixed span ID');
