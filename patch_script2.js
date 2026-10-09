const fs = require('fs');
let c = fs.readFileSync('script.js', 'utf8');

const regex = /const originalOpenAddInfoModal = [\s\S]+?};/g;

const newCode = \
  const originalOpenAddInfoModal = typeof openAddInfoModal !== 'undefined' ? openAddInfoModal : null;
  
  const customTitles = {
    'respJaContribuiu': 'Qualidade de Segurado'
  };

  const questionsConfigOverride = {
      'respTempoContribuicao': [
        { id: 'addInfoMilitar', label: 'Prestou serviço militar?', type: 'textarea' }
      ],
      'respSolicitouBeneficio': [
        { id: 'addInfoMotivoNegativa', label: 'Se tentou e foi negado, qual foi o motivo da negativa?', type: 'textarea' },
        { id: 'addInfoNovoPedido', label: 'Foi feito um novo pedido ou protocolado algum processo?', type: 'textarea' }
      ],
      'respJaContribuiu': [
        { id: 'addInfoTempoParou', label: 'Há quanto tempo parou de contribuir?', type: 'textarea' },
        { id: 'addInfoQualidadeSegurado', label: 'Você sabe se ainda tem qualidade de segurado?', type: 'textarea' },
        { id: 'addInfo120Contribuicoes', label: 'Sabe se fez mais de 120 contribuições sem interrupção?', type: 'textarea' },
        { id: 'addInfo12MesesSem', label: 'Sabe se ficou um período maior que 12 meses sem contribuir?', type: 'textarea' }
      ],
      'respExerceuAtividadeEspecial': [
        { id: 'addInfoAtivEspecial1', label: 'Por quanto tempo, e qual era a atividade?', type: 'textarea' },
        { id: 'addInfoAtivEspecial2', label: 'As empresas ainda existem, caso precise fazer alguma correção ou pedir documentos?', type: 'textarea' },
        { id: 'addInfoAtivEspecial3', label: 'Sabe a classificação de exposição aos agentes nocivos?', type: 'textarea' },
        { id: 'addInfoAtivEspecial4', label: 'Sabe se o uso de EPIs neutraliza a exposição a ponto de anular o direito?', type: 'textarea' }
      ]
  };

  window.openAddInfoModal = function(fieldId, originalLabel) {
    const qView = document.getElementById('qualificacaoView');
    const pView = document.getElementById('perguntasView');
    const pTitle = document.getElementById('perguntasViewTitle');
    const pList = document.getElementById('perguntasViewList');

    if (qView && pView && pTitle && pList) {
      qView.style.display = 'none';
      pView.style.display = 'flex';
      
      // Set Title
      if (customTitles[fieldId]) {
        pTitle.querySelector('span').textContent = customTitles[fieldId];
      } else {
        pTitle.querySelector('span').textContent = 'Perguntas';
      }

      // Populate list
      pList.innerHTML = '';
      const questions = questionsConfigOverride[fieldId] || [];
      
      if (questions.length === 0) {
        const div = document.createElement('div');
        div.style.padding = '10px 14px';
        div.style.border = '1px solid var(--border)';
        div.style.borderRadius = '8px';
        div.style.fontSize = '13px';
        div.style.color = 'var(--text-secondary)';
        div.textContent = 'Nenhuma pergunta adicional para este campo.';
        pList.appendChild(div);
      } else {
        questions.forEach((q, idx) => {
          const div = document.createElement('div');
          div.style.padding = '10px 14px';
          div.style.border = '1px solid var(--border)';
          div.style.borderRadius = '8px';
          div.style.cursor = 'pointer';
          div.style.fontSize = '13px';
          div.style.color = 'var(--text-primary)';
          div.style.transition = 'all 0.2s';
          div.onmouseover = () => div.style.background = 'var(--surface-hover)';
          div.onmouseout = () => div.style.background = 'transparent';
          div.textContent = q.label;
          pList.appendChild(div);
        });
      }
    } else if (originalOpenAddInfoModal) {
      originalOpenAddInfoModal(fieldId, originalLabel);
    }
  };
\;

c = c.replace(regex, newCode);
fs.writeFileSync('script.js', c);
console.log('script.js updated');
