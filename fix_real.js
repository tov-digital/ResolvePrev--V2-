const fs = require('fs');

function fixEverything(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace Enviar mensagem
  let newEnviar = `<button class="btn-whatsapp" style="border:1px solid var(--border); background:var(--surface-1); border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--color-primary);">
                <i class="ti ti-brand-whatsapp" style="font-size:16px" aria-hidden="true"></i>Enviar mensagem</button>`;
  
  content = content.replace(/<button[^>]*ti-brand-whatsapp[\s\S]*?<\/button>/, newEnviar);

  // Replace Agendar reunião
  let newAgendar = `<button class="btn-gmail" style="border:1px solid var(--border); background:var(--surface-1); border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--color-primary);">
                <i class="ti ti-calendar-plus" style="font-size:16px" aria-hidden="true"></i>Agendar reunião</button>`;
  
  // Notice there's a typo in the original HTML "Agendar reunio". We can match up to </button>
  content = content.replace(/<button[^>]*ti-calendar-plus[\s\S]*?<\/button>/, newAgendar);

  // Replace Mover etapa
  let newMover = `<button style="background:var(--fill-accent); color:var(--on-accent); border:none; border-radius:8px; padding:8px 14px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:6px; cursor:pointer;">Mover etapa<i class="ti ti-arrow-right" style="font-size:16px" aria-hidden="true"></i></button>`;
  
  content = content.replace(/<button[^>]*Mover etapa[\s\S]*?<\/button>/, newMover);

  fs.writeFileSync(filePath, content, 'utf8');
}

fixEverything('new_modal.html');
fixEverything('index.html');
console.log('Fixed button designs and added classes');
