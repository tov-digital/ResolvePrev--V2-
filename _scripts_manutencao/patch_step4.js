const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const detalheViewHTML = `
              <div id="perguntaDetalheView" style="display:none; padding:16px 20px; border-right:0.5px solid var(--border); flex-direction:column; gap: 16px;">
                <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:4px;">
                  <button type="button" id="btnVoltarPerguntas" style="background:none; border:none; padding:4px; display:flex; align-items:center; color:var(--text-muted); cursor:pointer; margin-right:8px; visibility:hidden;"><i class="ti ti-arrow-left" style="font-size:18px;"></i></button>
                  <p id="perguntaDetalheTitle" style="margin:0; font-size:15px; font-weight:500; color:var(--text-primary); flex-grow:1; line-height: 1.4; padding-right: 12px;"></p>
                  <button type="button" id="btnVoltarPerguntas" class="btnVoltar" style="background:none; border:none; padding:4px; display:flex; align-items:center; color:var(--text-muted); cursor:pointer;"><i class="ti ti-arrow-left" style="font-size:18px;"></i></button>
                </div>
                
                <div style="display:flex; align-items:center; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 4px 4px 12px; background: white;">
                  <input type="text" id="perguntaDetalheText" placeholder="Nova observação..." style="flex-grow:1; border:none; outline:none; font-size:13px; font-family:inherit; background:transparent; color:var(--text-primary);">
                  <button type="button" id="btnEnviarDetalhe" title="Enviar para Detalhes do caso" style="background: var(--primary); color: white; border: none; border-radius: 4px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;"><i class="ti ti-send" style="font-size: 16px;"></i></button>
                </div>

                <div style="display:flex; flex-direction:column; gap: 12px; margin-top: 4px;">
                  <div style="display:flex; align-items:center; gap: 6px; cursor: pointer;">
                    <i class="ti ti-caret-right" style="font-size: 14px; color: #334155;"></i>
                    <span style="font-size:14px; color:#0f172a; font-weight: 500;">Implicação</span>
                  </div>
                  <div style="display:flex; align-items:center; gap: 6px; cursor: pointer;">
                    <i class="ti ti-caret-right" style="font-size: 14px; color: #334155;"></i>
                    <span style="font-size:14px; color:#0f172a; font-weight: 500;">Solução</span>
                  </div>
                </div>
              </div>`;

let startIndex = html.indexOf('<div id="perguntaDetalheView"');
let endIndex = html.indexOf('<div style="padding:16px 20px;', startIndex);
if (startIndex !== -1 && endIndex !== -1) {
  let before = html.substring(0, startIndex);
  // find the last </div> before endIndex (the one that closes perguntaDetalheView)
  let after = html.substring(endIndex);
  html = before + detalheViewHTML + "\n\n              " + after;
}
fs.writeFileSync('index.html', html);

console.log("Patched index.html correctly");
