const fs = require('fs');

function updateBottomButtons(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex para "Enviar mensagem"
  const regexEnviar = /<button style="border:0\.5px solid var\(--border-strong\); background:transparent; border-radius:var\(--radius\); padding:7px 12px; font-size:13px; display:flex; align-items:center; gap:6px; cursor:pointer; color:var\(--text-primary\);"><i class="ti ti-brand-whatsapp"/g;
  const newEnviar = '<button style="border:1px solid var(--border); background:transparent; border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--color-primary);"><i class="ti ti-brand-whatsapp"';

  // Regex para "Agendar reunião"
  const regexAgendar = /<button style="border:0\.5px solid var\(--border-strong\); background:transparent; border-radius:var\(--radius\); padding:7px 12px; font-size:13px; display:flex; align-items:center; gap:6px; cursor:pointer; color:var\(--text-primary\);"><i class="ti ti-calendar-plus"/g;
  const newAgendar = '<button style="border:1px solid var(--border); background:transparent; border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--color-primary);"><i class="ti ti-calendar-plus"';

  // Regex para "Mover etapa"
  const regexMover = /<button style="background:var\(--fill-accent\); color:var\(--on-accent\); border:none; border-radius:var\(--radius\); padding:7px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer;">Mover etapa<i class="ti ti-arrow-right"/g;
  const newMover = '<button style="background:var(--fill-accent); color:var(--on-accent); border:none; border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer;">Mover etapa<i class="ti ti-arrow-right"';

  content = content.replace(regexEnviar, newEnviar);
  content = content.replace(regexAgendar, newAgendar);
  content = content.replace(regexMover, newMover);

  fs.writeFileSync(filePath, content, 'utf8');
}

updateBottomButtons('new_modal.html');
updateBottomButtons('index.html');

console.log('Bottom buttons updated.');
