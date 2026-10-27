const fs = require('fs');
let data = fs.readFileSync('script.js', 'utf8');

const targetRegex = /<button type="button" class="doc-status-badge(.*?)>([\s\S]*?)<\/button>\s*<button type="button" class="btn-remove-doc"(.*?)>([\s\S]*?)<\/button>/g;

data = data.replace(targetRegex, '<button type="button" class="btn-remove-doc"$3>$4</button>\n          <button type="button" class="doc-status-badge$1>$2</button>');

fs.writeFileSync('script.js', data);
