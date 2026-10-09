const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const labelsToReplace = [
  'for="respJaContribuiu"',
  'for="respTipoTrabalho"',
  'for="respExerceuAtividadeEspecial"'
];

labelsToReplace.forEach(forAttr => {
  const regex = new RegExp('<label\\s+' + forAttr + '[^>]*>.*?</label>', 'gs');
  code = code.replace(regex, (match) => {
    return '<div style="display:flex; align-items:center; gap:4px;">\n                        ' + match + '\n                        <i class="ti ti-help" style="font-size:14px; cursor:pointer; color:var(--text-muted);" title="Ajuda"></i>\n                      </div>';
  });
});

fs.writeFileSync('index.html', code);
console.log('Patched labels successfully!');
