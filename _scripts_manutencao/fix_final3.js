const fs = require('fs');
let c = fs.readFileSync('script.js', 'utf8');

c = c.replace(/document\.querySelectorAll\('\.sheet-field-group label'\)\.forEach\(label => {[\s\S]*?qView\.style\.display = 'none';\s*pView\.style\.display = 'flex';\s*}\s*}\s*}\s*}\);\s*}\);/m, 
`document.querySelectorAll('.sheet-field-group label').forEach(label => {
    label.addEventListener('click', (e) => {
      const group = label.closest('.sheet-field-group');
      if (group) {
        const btn = group.querySelector('.btn-add-info');
        if (btn && btn.style.pointerEvents !== 'none') {
          e.preventDefault();
          const fieldId = label.getAttribute('for');
          if (window.openAddInfoModal) {
            window.openAddInfoModal(fieldId, label.textContent);
          }
        }
      }
    });
  });`);

c = c.replace(/Prestou servio militar\?/g, 'Prestou serviço militar?');
c = c.replace(/Hǭ quanto tempo parou de contribuir\?/g, 'Há quanto tempo parou de contribuir?');
c = c.replace(/VocǦ sabe se ainda tem qualidade de segurado\?/g, 'Você sabe se ainda tem qualidade de segurado?');
c = c.replace(/Sabe se fez mais de 120 contribuies sem interrupǜo\?/g, 'Sabe se fez mais de 120 contribuições sem interrupção?');
c = c.replace(/Sabe se ficou um perodo maior que 12 meses sem contribuir\?/g, 'Sabe se ficou um período maior que 12 meses sem contribuir?');
c = c.replace(/alguma correǜo ou pedir documentos\?/g, 'alguma correção ou pedir documentos?');
c = c.replace(/classificaǜo de exposiǜo/g, 'classificação de exposição');
c = c.replace(/exposiǜo a ponto de anular o direito\?/g, 'exposição a ponto de anular o direito?');

fs.writeFileSync('script.js', c);
console.log('Fixed');
