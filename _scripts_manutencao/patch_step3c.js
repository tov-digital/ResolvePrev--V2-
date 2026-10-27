const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
const detalheViewHTML = `
              <div id="perguntaDetalheView" style="display:none; padding:16px 20px; border-right:0.5px solid var(--border); flex-direction:column; gap: 16px;">
                <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:4px;">
                  <button type="button" id="btnVoltarPerguntas" style="background:none; border:none; padding:4px; display:flex; align-items:center; color:var(--text-muted); cursor:pointer; margin-right: 8px;"><i class="ti ti-arrow-left" style="font-size:18px;"></i></button>
                  <p id="perguntaDetalheTitle" style="margin:0; font-size:15px; font-weight:500; color:var(--text-primary); flex-grow:1; line-height: 1.4;"></p>
                </div>
                
                <div style="display:flex; flex-direction:column; gap: 8px;">
                  <div style="display:flex; gap: 8px; align-items: center;">
                    <textarea id="perguntaDetalheText" placeholder="Resposta..." style="flex-grow:1; min-height: 80px; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text-primary); font-family: inherit; font-size: 13px; resize: vertical; outline: none;"></textarea>
                    <button type="button" id="btnEnviarDetalhe" title="Enviar para Detalhes do caso" style="background: var(--primary); color: white; border: none; border-radius: 8px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;"><i class="ti ti-send" style="font-size: 18px;"></i></button>
                  </div>
                </div>

                <div style="display:flex; flex-direction:column; gap: 12px; margin-top: 4px;">
                  <div style="display:flex; align-items:center; justify-content:space-between;">
                    <span style="font-size:13px; color:var(--text-secondary);">Implicação</span>
                    <label class="switch" style="position:relative; display:inline-block; width:36px; height:20px;">
                      <input type="checkbox" id="toggleImplicacao" style="opacity:0; width:0; height:0;">
                      <span class="slider round" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#cbd5e1; transition:.4s; border-radius:20px;"></span>
                    </label>
                  </div>
                  <div style="display:flex; align-items:center; justify-content:space-between;">
                    <span style="font-size:13px; color:var(--text-secondary);">Solução</span>
                    <label class="switch" style="position:relative; display:inline-block; width:36px; height:20px;">
                      <input type="checkbox" id="toggleSolucao" style="opacity:0; width:0; height:0;">
                      <span class="slider round" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#cbd5e1; transition:.4s; border-radius:20px;"></span>
                    </label>
                  </div>
                </div>
              </div>`;

html = html.replace(/(<div id="perguntasView"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)/, "$1\n" + detalheViewHTML);
fs.writeFileSync('index.html', html);

let script = fs.readFileSync('script.js', 'utf8');

const oldLoop = /questions\.forEach\(\(q, idx\) => \{[\s\S]*?pList\.appendChild\(div\);\s*\}\);/m;
const newLoop = `questions.forEach((q, idx) => {
          const div = document.createElement('div');
          div.style.padding = '10px 14px';
          div.style.border = '1px solid var(--border)';
          div.style.borderRadius = '8px';
          div.style.cursor = 'pointer';
          div.style.fontSize = '13px';
          div.style.color = 'var(--text-primary)';
          div.style.transition = 'all 0.2s';
          
          div.style.whiteSpace = 'nowrap';
          div.style.overflow = 'hidden';
          div.style.textOverflow = 'ellipsis';
          
          div.onmouseover = () => {
             div.style.background = 'var(--surface-hover)';
             div.style.borderColor = 'var(--primary)';
          };
          div.onmouseout = () => {
             div.style.background = 'transparent';
             div.style.borderColor = 'var(--border)';
          };
          div.textContent = q.label;
          div.onclick = () => window.openPerguntaDetalhe(q);
          pList.appendChild(div);
        });`;
script = script.replace(oldLoop, newLoop);

const newLogic = `
  const pDetalheView = document.getElementById('perguntaDetalheView');
  const btnVoltarPerguntas = document.getElementById('btnVoltarPerguntas');
  const btnEnviarDetalhe = document.getElementById('btnEnviarDetalhe');
  
  if (btnVoltarPerguntas) {
    btnVoltarPerguntas.addEventListener('click', () => {
      document.getElementById('perguntaDetalheView').style.display = 'none';
      document.getElementById('perguntasView').style.display = 'flex';
    });
  }

  window.openPerguntaDetalhe = function(q) {
    document.getElementById('perguntasView').style.display = 'none';
    const pDetalheView = document.getElementById('perguntaDetalheView');
    pDetalheView.style.display = 'flex';
    
    document.getElementById('perguntaDetalheTitle').textContent = q.label;
    document.getElementById('perguntaDetalheText').value = '';
    document.getElementById('toggleImplicacao').checked = false;
    document.getElementById('toggleSolucao').checked = false;
  };

  flex-grow:1;
  if (btnEnviarDetalhe) {
    btnEnviarDetalhe.addEventListener('click', () => {
      const respDetalhes = document.getElementById('respDetalhes');
      const textVal = document.getElementById('perguntaDetalheText').value.trim();
      const titleVal = document.getElementById('perguntaDetalheTitle').textContent;
      
      if (textVal) {
         let currentVal = respDetalhes.value;
         if (currentVal && !currentVal.endsWith('\\n\\n')) {
             currentVal += '\\n\\n';
         }
         respDetalhes.value = currentVal + "P: " + titleVal + "\\nR: " + textVal + "\\n";
         
         const icon = btnEnviarDetalhe.querySelector('i');
         icon.className = 'ti ti-check';
         setTimeout(() => { icon.className = 'ti ti-send'; }, 1000);
      }
    });
  }
`;

script = script.replace(/}\);\s*$/, newLogic + "\n});");
fs.writeFileSync('script.js', script);
console.log("Patched correctly");
