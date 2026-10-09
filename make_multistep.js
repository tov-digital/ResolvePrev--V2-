const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Modificando index.html
const formStartRegex = /<form id="clientAnswersForm"[^>]*>/;
const formEndRegex = /<\/form>/;

let htmlParts = html.split(formStartRegex);
if(htmlParts.length === 2) {
    let formContent = htmlParts[1].split(formEndRegex)[0];
    
    // Esconder os botões btn-add-info existentes
    formContent = formContent.replace(/<button type="button" title="Adicionar" class="btn-add-info"/g, '<button type="button" title="Adicionar" class="btn-add-info" style="display:none;"');

    const newFormHtml = `
<div id="multiStepFormContainer" style="display: flex; flex-direction: column; flex-grow: 1; position: relative;">
    <div id="formTrackingBar" style="display: flex; gap: 4px; margin-bottom: 16px;">
        <div class="step-indicator active" style="flex: 1; height: 4px; background: var(--fill-accent); border-radius: 2px;"></div>
    </div>
    <form id="clientAnswersForm" style="display: flex; flex-direction: column; flex-grow: 1; overflow-y: auto;">
        <div id="step-1" class="form-step">
            ` + formContent + `
        </div>
    </form>
    <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 10px; border-top: 1px solid var(--border);">
       <button id="btnVoltarStep" type="button" style="display: none; padding: 8px 16px; border: 1px solid var(--border); background: var(--surface-2); border-radius: 8px; cursor: pointer; color: var(--text-primary); font-weight: 500;">Voltar</button>
       <button id="btnProximoStep" type="button" style="padding: 8px 16px; background: var(--fill-accent); color: var(--on-accent); border: none; border-radius: 8px; cursor: pointer; margin-left: auto; font-weight: 500;">Próximo</button>
       <button id="btnFinalizarStep" type="button" style="display: none; padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; margin-left: auto; font-weight: 500;">Finalizar</button>
    </div>
</div>
`;
    
    let newHtml = htmlParts[0] + newFormHtml + htmlParts[1].split(formEndRegex)[1];
    fs.writeFileSync('index.html', newHtml, 'utf8');
    console.log('index.html modified');
} else {
    console.log('Could not find form start in index.html');
}

// Modificando script.js
let js = fs.readFileSync('script.js', 'utf8');

const multiStepLogic = `
// ==================== LÓGICA DO MULTI-STEP FORM ====================
let currentStep = 1;
let totalSteps = 1;
let dynamicStepsData = [];

function getQuestionsConfig(fieldId, val) {
    const questionsConfig = {
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

    if (fieldId === 'respTipoTrabalho') {
      if (val === 'Emprego de carteira assinada (CLT)') {
        return [
          { id: 'addInfoCLT1', label: 'Como CLT, com o que você trabalhava?', type: 'textarea' },
          { id: 'addInfoCLT2', label: 'Alguém já analisou o seu CNIS pra ver se todo o período em que trabalhou como CLT está registrado corretamente?', type: 'textarea' },
          { id: 'addInfoCLT3', label: 'Você sabe se tem alguma contribuição que foi registrada com valor errado ou abaixo de um salário mínimo?', type: 'textarea' },
          { id: 'addInfoCLT4', label: 'Você sabe se tem alguma data de entrada, saída ou de intervalo que precisa ser corrigida ?', type: 'textarea' }
        ];
      } else if (val === 'Empresário / Autônomo / MEI') {
        return [
          { id: 'addInfoMEI1', label: 'Como autônomo, com o que você trabalhava, e suas contribuições eram no carnê, ou como MEI?', type: 'textarea' },
          { id: 'addInfoMEI2', label: 'Alguém já analisou como essas contribuições aparecem no seu CNIS, se existe alguma lacuna ou se algo não foi contabilizado?', type: 'textarea' },
          { id: 'addInfoMEI3', label: 'Você sabe se tem alguma contribuição duplicada?', type: 'textarea' },
          { id: 'addInfoMEI4', label: 'Você sabe se todas as contribuições foram feitas no código correto?', type: 'textarea' }
        ];
      } else if (val === 'Trabalhador rural') {
        return [
          { id: 'addInfoRural1', label: 'Na roça, para quem você trabalhava?', type: 'textarea' },
          { id: 'addInfoRural2', label: 'As terras eram da sua família, e se sim, sabe quantos hectares ?', type: 'textarea' },
          { id: 'addInfoRural3', label: 'Você tem algum registro documental desse tempo de trabalho e que você produzia na terra?', type: 'textarea' },
          { id: 'addInfoRural4', label: 'Ainda existem testemunhas vivas do seu trabalho rural?', type: 'textarea' },
          { id: 'addInfoRural5', label: 'Você tem algum registro documental da sua relação com a terra?', type: 'textarea' }
        ];
      } else if (val === 'Servidor público') {
        return [];
      } else {
        return [
          { id: 'addInfoGeneric_Trabalho', label: 'Por favor, detalhe mais sobre o seu tipo de trabalho.', type: 'textarea' }
        ];
      }
    }
    
    return questionsConfig[fieldId] || [];
}

function calculateSteps() {
    const valSolicitou = document.getElementById('respSolicitouBeneficio')?.value || '';
    const valContribuiu = document.getElementById('respJaContribuiu')?.value || '';
    const valTrabalho = document.getElementById('respTipoTrabalho')?.value || '';
    const valEspecial = document.getElementById('respExerceuAtividadeEspecial')?.value || '';

    dynamicStepsData = [];
    
    // Se solicitou for diferente de "Não - nunca tentei aposentar.", trava o form e não tem próximos steps
    if (valSolicitou && valSolicitou !== 'Não - nunca tentei aposentar.') {
        return; // não adiciona mais steps
    }

    // Já contribuiu
    if (valContribuiu && valContribuiu !== 'Sim - e continuo contribuindo.') {
        const fields = getQuestionsConfig('respJaContribuiu');
        if (fields.length) dynamicStepsData.push({ title: 'Contribuição', fields });
    }

    // Tipo de trabalho
    if (valTrabalho) {
        const fields = getQuestionsConfig('respTipoTrabalho', valTrabalho);
        if (fields.length) dynamicStepsData.push({ title: 'Tipo de Trabalho', fields });
    }

    // Atividade especial
    if (valEspecial && valEspecial !== 'Não - nunca trabalhei com isso.') {
        const fields = getQuestionsConfig('respExerceuAtividadeEspecial');
        if (fields.length) dynamicStepsData.push({ title: 'Atividade Especial', fields });
    }
}

function renderSteps() {
    const formEl = document.getElementById('clientAnswersForm');
    if(!formEl) return;
    
    // Remover todos os steps dinâmicos anteriores
    formEl.querySelectorAll('.dynamic-step').forEach(el => el.remove());
    
    totalSteps = 1 + dynamicStepsData.length;
    
    dynamicStepsData.forEach((stepData, index) => {
        const stepNum = index + 2;
        const stepDiv = document.createElement('div');
        stepDiv.id = 'step-' + stepNum;
        stepDiv.className = 'form-step dynamic-step';
        stepDiv.style.display = 'none';
        
        let html = '<h3 style="margin-top:0; color:var(--text-accent); font-size:16px;">' + stepData.title + '</h3>';
        
        stepData.fields.forEach(f => {
            html += \`
              <div class="sheet-field-group" style="margin-bottom: 1rem;">
                <label for="\${f.id}" style="display: block; font-weight: 600; font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--text-dark);">\${f.label}</label>
                <textarea id="\${f.id}" class="sheet-input multistep-textarea" rows="3" style="width: 100%; resize: vertical; padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border); font-size: 0.95rem; font-family: inherit; background-color: var(--surface-2); color: var(--text-primary); outline:none;"></textarea>
              </div>
            \`;
        });
        
        stepDiv.innerHTML = html;
        formEl.appendChild(stepDiv);
    });
    
    renderTrackingBar();
    updateStepView();
}

function renderTrackingBar() {
    const bar = document.getElementById('formTrackingBar');
    if(!bar) return;
    bar.innerHTML = '';
    for(let i = 1; i <= totalSteps; i++) {
        const indicator = document.createElement('div');
        indicator.className = 'step-indicator ' + (i <= currentStep ? 'active' : '');
        indicator.style.flex = '1';
        indicator.style.height = '4px';
        indicator.style.borderRadius = '2px';
        indicator.style.background = i <= currentStep ? 'var(--fill-accent)' : 'var(--border)';
        bar.appendChild(indicator);
    }
}

function updateStepView() {
    document.querySelectorAll('.form-step').forEach(el => el.style.display = 'none');
    const curr = document.getElementById('step-' + currentStep);
    if(curr) curr.style.display = 'block';
    
    document.getElementById('btnVoltarStep').style.display = currentStep > 1 ? 'block' : 'none';
    
    const valSolicitou = document.getElementById('respSolicitouBeneficio')?.value || '';
    if (valSolicitou && valSolicitou !== 'Não - nunca tentei aposentar.') {
        // Bloqueado
        document.getElementById('btnProximoStep').style.display = 'none';
        document.getElementById('btnFinalizarStep').style.display = 'none';
        
        const detailsField = document.getElementById('respDetalhes');
        if(detailsField && !detailsField.value) {
            detailsField.value = 'Cliente travado no formulário.\\nJá solicitou: ' + valSolicitou;
        }
        return;
    }
    
    if (currentStep === totalSteps) {
        document.getElementById('btnProximoStep').style.display = 'none';
        document.getElementById('btnFinalizarStep').style.display = 'block';
    } else {
        document.getElementById('btnProximoStep').style.display = 'block';
        document.getElementById('btnFinalizarStep').style.display = 'none';
    }
    
    renderTrackingBar();
}

function summarizeFormToDetails() {
    let summary = "=== Resumo do Formulário ===\\n\\n";
    
    // Step 1
    const q1 = document.getElementById('respSolicitouBeneficio');
    if(q1 && q1.value) summary += "Já solicitou? " + q1.value + "\\n";
    
    const q2 = document.getElementById('respJaContribuiu');
    if(q2 && q2.value) summary += "Já contribuiu? " + q2.value + "\\n";
    
    const q3 = document.getElementById('respTipoTrabalho');
    if(q3 && q3.value) summary += "Tipo de trabalho: " + q3.value + "\\n";
    
    const q4 = document.getElementById('respExerceuAtividadeEspecial');
    if(q4 && q4.value) summary += "Atividade especial? " + q4.value + "\\n";
    
    summary += "\\n";
    
    // Dinâmicos
    document.querySelectorAll('.multistep-textarea').forEach(ta => {
        if(ta.value.trim()) {
            const label = ta.previousElementSibling ? ta.previousElementSibling.innerText : ta.id;
            summary += label + "\\nR: " + ta.value.trim() + "\\n\\n";
        }
    });
    
    const detalhes = document.getElementById('respDetalhes');
    if(detalhes) {
        const existing = detalhes.value.trim();
        detalhes.value = (existing ? existing + "\\n\\n" : "") + summary;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnProx = document.getElementById('btnProximoStep');
    const btnVolt = document.getElementById('btnVoltarStep');
    const btnFin = document.getElementById('btnFinalizarStep');
    
    ['respSolicitouBeneficio', 'respJaContribuiu', 'respTipoTrabalho', 'respExerceuAtividadeEspecial'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('change', () => {
                calculateSteps();
                renderSteps();
            });
        }
    });
    
    if(btnProx) {
        btnProx.addEventListener('click', () => {
            if(currentStep < totalSteps) {
                currentStep++;
                updateStepView();
            }
        });
    }
    
    if(btnVolt) {
        btnVolt.addEventListener('click', () => {
            if(currentStep > 1) {
                currentStep--;
                updateStepView();
            }
        });
    }
    
    if(btnFin) {
        btnFin.addEventListener('click', () => {
            summarizeFormToDetails();
            alert('Formulário finalizado! Detalhes atualizados.');
        });
    }
    
    // Inicializar os steps na primeira carga
    setTimeout(() => {
        calculateSteps();
        renderSteps();
    }, 500);
});
`;

if (!js.includes('LÓGICA DO MULTI-STEP FORM')) {
    fs.writeFileSync('script.js', js + '\\n\\n' + multiStepLogic, 'utf8');
    console.log('script.js modified');
} else {
    console.log('script.js already modified');
}
