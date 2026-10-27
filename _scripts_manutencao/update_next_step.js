const fs = require('fs');

// 1. Update HTML files to add id="nextStepLabel"
function addIdToSpan(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let searchStr = '<span style="font-size:12px; color:var(--text-secondary); margin-right:auto;">Próxima etapa: Proposta</span>';
  let searchStr2 = '<span style="font-size:12px; color:var(--text-secondary); margin-right:auto;">Prxima etapa: Proposta</span>';
  
  let target = '<span id="nextStepLabel" style="font-size:12px; color:var(--text-secondary); margin-right:auto;">Próxima etapa: Proposta</span>';

  // Replace all occurrences using regex to handle encoding issues
  content = content.replace(/<span style="font-size:12px; color:var\(--text-secondary\); margin-right:auto;">Pr.*?xima etapa: Proposta<\/span>/g, target);

  fs.writeFileSync(filePath, content, 'utf8');
}

addIdToSpan('new_modal.html');
addIdToSpan('index.html');

// 2. Update script.js to dynamically calculate next step
let scriptContent = fs.readFileSync('script.js', 'utf8');

const oldUpdateStatus = `  function updateStatusTagUI(stage) {
    if (sheetStatusText) sheetStatusText.textContent = stageLabels[stage] || 'Novo';
    if (sheetStatusDot) {
      sheetStatusDot.className = 'status-tag-dot ' + (stageDotClasses[stage] || 'dot-novo');
    }
  }`;

const newUpdateStatus = `  function updateStatusTagUI(stage) {
    if (sheetStatusText) sheetStatusText.textContent = stageLabels[stage] || 'Novo';
    if (sheetStatusDot) {
      sheetStatusDot.className = 'status-tag-dot ' + (stageDotClasses[stage] || 'dot-novo');
    }
    
    // Atualizar próxima etapa
    const nextStepLabel = document.getElementById('nextStepLabel');
    if (nextStepLabel) {
      let stages = [];
      if (window.currentTab === 'comercial') {
        stages = ['novo', 'qualificacao', 'acompanhamento', 'reuniao', 'proposta'];
      } else if (window.currentTab === 'operacao') {
        stages = ['documentacao', 'na_fila', 'requerido', 'exigencia', 'concedido'];
      } else if (window.currentTab === 'judicial') {
        stages = ['negado'];
      }
      
      const currentIndex = stages.indexOf(stage);
      if (currentIndex !== -1 && currentIndex < stages.length - 1) {
        const nextStage = stages[currentIndex + 1];
        nextStepLabel.textContent = 'Próxima etapa: ' + (stageLabels[nextStage] || nextStage);
      } else if (currentIndex === stages.length - 1) {
        nextStepLabel.textContent = 'Última etapa';
      } else {
        nextStepLabel.textContent = 'Próxima etapa: Indisponível';
      }
    }
  }`;

if (scriptContent.includes('function updateStatusTagUI(stage) {')) {
  // Regex to replace the entire function block
  scriptContent = scriptContent.replace(/function updateStatusTagUI\(stage\) \{[\s\S]*?\n  \}/, newUpdateStatus.trim());
  fs.writeFileSync('script.js', scriptContent, 'utf8');
}

console.log('Next step logic added');
