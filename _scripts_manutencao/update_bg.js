const fs = require('fs');

function updateBtnBackground(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match the button style for Enviar mensagem and Agendar reuniao
  // The current background is "background:transparent;" and we want to change it to "background:var(--surface-1);"
  // But we only want to change it for those two buttons, which have class="ti ti-brand-whatsapp" and "ti ti-calendar-plus"
  
  const regexEnviar = /(<button style="border:1px solid var\(--border\);\s*)background:transparent;(.*?<i class="ti ti-brand-whatsapp")/g;
  const regexAgendar = /(<button style="border:1px solid var\(--border\);\s*)background:transparent;(.*?<i class="ti ti-calendar-plus")/g;

  content = content.replace(regexEnviar, '$1background:var(--surface-1);$2');
  content = content.replace(regexAgendar, '$1background:var(--surface-1);$2');

  fs.writeFileSync(filePath, content, 'utf8');
}

updateBtnBackground('new_modal.html');
updateBtnBackground('index.html');

console.log('Background updated.');
