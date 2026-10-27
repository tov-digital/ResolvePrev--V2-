const fs = require('fs');

function replaceSafe(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Enviar mensagem
  let newEnviar = `<button class="btn-whatsapp" style="border:1px solid var(--border); background:var(--surface-1); border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--color-primary);">
                <i class="ti ti-brand-whatsapp" style="font-size:16px" aria-hidden="true"></i>Enviar mensagem</button>`;

  // Find the position of ti-brand-whatsapp
  let idxWpp = content.indexOf('ti-brand-whatsapp');
  if (idxWpp !== -1) {
    let startWpp = content.lastIndexOf('<button', idxWpp);
    let endWpp = content.indexOf('</button>', idxWpp) + 9;
    content = content.substring(0, startWpp) + newEnviar + content.substring(endWpp);
  }

  // Agendar reuniao
  let newAgendar = `<button class="btn-gmail" style="border:1px solid var(--border); background:var(--surface-1); border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--color-primary);">
                <i class="ti ti-calendar-plus" style="font-size:16px" aria-hidden="true"></i>Agendar reunião</button>`;

  let idxAgendar = content.indexOf('ti-calendar-plus');
  if (idxAgendar !== -1) {
    let startAgendar = content.lastIndexOf('<button', idxAgendar);
    let endAgendar = content.indexOf('</button>', idxAgendar) + 9;
    content = content.substring(0, startAgendar) + newAgendar + content.substring(endAgendar);
  }

  // Mover etapa
  let newMover = `<button style="background:var(--fill-accent); color:var(--on-accent); border:none; border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer;">Mover etapa<i class="ti ti-arrow-right" style="font-size:16px" aria-hidden="true"></i></button>`;

  let idxMover = content.indexOf('Mover etapa');
  if (idxMover !== -1) {
    let startMover = content.lastIndexOf('<button', idxMover);
    let endMover = content.indexOf('</button>', idxMover) + 9;
    content = content.substring(0, startMover) + newMover + content.substring(endMover);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

replaceSafe('new_modal.html');
replaceSafe('index.html');
console.log('Done replacing correctly.');
