const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

const functionCode = 
  function updateAddInfoButtonsVisibility() {
    const rules = {
      'respSolicitouBeneficio': 'Não - nunca tentei aposentar.',
      'respJaContribuiu': 'Sim - e continuo contribuindo.',
      'respTipoTrabalho': 'Outro',
      'respExerceuAtividadeEspecial': 'Não - nunca trabalhei com isso.'
    };

    Object.keys(rules).forEach(id => {
      const selectEl = document.getElementById(id);
      if (!selectEl) return;
      const group = selectEl.closest('.sheet-field-group');
      if (group) {
        const btn = group.querySelector('.btn-add-info');
        if (btn) {
          if (selectEl.value === rules[id]) {
            btn.style.opacity = '0.3';
            btn.style.pointerEvents = 'none';
          } else {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
          }
        }
      }
    });
  }

  // Bind change events directly to the specific selects
  ;['respSolicitouBeneficio', 'respJaContribuiu', 'respTipoTrabalho', 'respExerceuAtividadeEspecial'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', updateAddInfoButtonsVisibility);
    }
  });

  // Also call it right away to set initial state
  updateAddInfoButtonsVisibility();
;

// Find a good place to insert it. e.g. after btnAddInfoList.forEach
const targetLine = "if (closeAddInfoModal) {";
if (code.includes(targetLine)) {
  code = code.replace(targetLine, functionCode + '\n  ' + targetLine);
  fs.writeFileSync('script.js', code);
  console.log('Patched script.js successfully!');
} else {
  console.log('Target line not found');
}
