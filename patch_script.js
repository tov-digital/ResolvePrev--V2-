const fs = require('fs');
let c = fs.readFileSync('script.js', 'utf8');

const codeToAppend = \

  // Logic to show/hide Perguntas View
  const btnVoltarQualificacao = document.getElementById('btnVoltarQualificacao');
  if (btnVoltarQualificacao) {
    btnVoltarQualificacao.addEventListener('click', () => {
      const qView = document.getElementById('qualificacaoView');
      const pView = document.getElementById('perguntasView');
      if (qView && pView) {
        pView.style.display = 'none';
        qView.style.display = 'block';
      }
    });
  }

  document.querySelectorAll('.sheet-field-group label').forEach(label => {
    label.addEventListener('click', (e) => {
      const group = label.closest('.sheet-field-group');
      if (group) {
        const btn = group.querySelector('.btn-add-info');
        if (btn && btn.style.pointerEvents !== 'none') {
          e.preventDefault();
          const qView = document.getElementById('qualificacaoView');
          const pView = document.getElementById('perguntasView');
          if (qView && pView) {
            qView.style.display = 'none';
            pView.style.display = 'flex';
          }
        }
      }
    });
  });

  // Override openAddInfoModal to show inline view instead
  const originalOpenAddInfoModal = typeof openAddInfoModal !== 'undefined' ? openAddInfoModal : null;
  window.openAddInfoModal = function(fieldId, originalLabel) {
    const qView = document.getElementById('qualificacaoView');
    const pView = document.getElementById('perguntasView');
    if (qView && pView) {
      qView.style.display = 'none';
      pView.style.display = 'flex';
    } else if (originalOpenAddInfoModal) {
      originalOpenAddInfoModal(fieldId, originalLabel);
    }
  };
\;

c += codeToAppend;
fs.writeFileSync('script.js', c);
console.log('Patched script.js');
