const fs = require('fs');

let script = fs.readFileSync('script.js', 'utf8');

// Replace the questions loop with the accordion logic
const oldLoopRegex = /questions\.forEach\(\(q, idx\) => \{[\s\S]*?pList\.appendChild(div);\s*\}\);/m;

const newLoop = `
        let activeItem = null;
        questions.forEach((q, idx) => {
          const container = document.createElement('div');
          container.style.marginBottom = '8px';
          container.style.border = '1px solid var(--border)';
          container.style.borderRadius = '8px';
          container.style.overflow = 'hidden';
          container.style.transition = 'all 0.2s';
          
          const header = document.createElement('div');
          header.style.padding = '10px 14px';
          header.style.cursor = 'pointer';
          header.style.fontSize = '13px';
          header.style.color = 'var(--text-primary)';
          header.style.transition = 'all 0.2s';
          header.style.whiteSpace = 'nowrap';
          header.style.overflow = 'hidden';
          header.style.textOverflow = 'ellipsis';
          header.textContent = q.label;
          
          header.onmouseover = () => {
             if (activeItem !== container) {
                container.style.background = 'var(--surface-hover)';
                container.style.borderColor = 'var(--primary)';
             }
          };
          header.onmouseout = () => {
             if (activeItem !== container) {
                container.style.background = 'transparent';
                container.style.borderColor = 'var(--border)';
             }
          };
          
          const body = document.createElement('div');
          body.style.display = 'none';
          body.style.padding = '0 14px 14px 14px';
          body.style.flexDirection = 'column';
          
          const inputCont = document.createElement('div');
          inputCont.style.display = 'flex';
          inputCont.style.alignItems = 'center';
          inputCont.style.border = '1px solid #cbd5e1';
          inputCont.style.borderRadius = '6px';
          inputCont.style.padding = '4px 4px 4px 12px';
          inputCont.style.background = 'white';
          
          const input = document.createElement('input');
          input.type = 'text';
       input.placeholder = 'Nova observação...';
          input.style.flexGrow = '1';
          input.style.border = 'none';
          input.style.outline = 'none';
          input.style.fontSize = '13px';
          input.style.fontFamily = 'inherit';
          input.style.background = 'transparent';
          input.style.color = 'var(--text-primary)';
          
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.title = 'Enviar para Detalhes do caso';
       btn.style.background = 'var(--primary)';
          btn.style.color = 'white';
          btn.style.border = 'none';
          btn.style.borderRadius = '4px';
       btn.style.width = '32px';
          btn.style.height = '32px';
          btn.style.display = 'flex';
          btn.style.alignItems = 'center';
          btn.style.justifyContent = 'center';
          btn.style.cursor = 'pointer';
          btn.style.transition = '0.2s';
          btn.innerHTML = '<i class="ti ti-send" style="font-size: 16px;"></i>';
          
          btn.onclick = (e) => {
             e8stopPropagation();
             const respDetalhes = document.getElementById('respDetalhes');
             const textVal = input.value.trim();
             
             if (textVal) {
                let currentVal = respDetalhes.value;
                if (currentVal && !currentVal.endsWith('\\n\\n')) {
                    currentVal += '\\n\\n';
                }
                respDetalhes.value = currentVal + "P: " + q.label + "\\nR: " + textVal + "\\n";
                
                const icon = btn.querySelector('i');
                icon.className = 'ti ti-check';
                setTimeout(() => {
                   icon.className = 'ti ti-send';
                   input.value = '';
                }, 1000);
             }
          };
          
          inputCont.appendChild(input);
          inputCont.appendChild(btn);
          body.appendChild(inputCont);
          
          container.appendChild(header);
          container.appendChild(body);
          
          header.onclick = () => {
             if (activeItem && activeItem !== container) {
                activeItem.querySelector('div:nth-child(2)').style.display = 'none';
                activeItem.querySelector('div:first-child').style.whiteSpace = 'nowrap';
                activeItem.style.borderColor = 'var(--border)';
                activeItem.style.background = 'transparent';
             }
             
             if (body.style.display === 'none') {
                body.style.display = 'flex';
                header.style.whiteSpace = 'normal'; // Expand text
                container.style.borderColor = 'var(--primary)';
                container.style.background = 'var(--surface-hover)';
                activeItem = container;
             } else {
                body.style.display = 'none';
                header.style.whiteSpace = 'nowrap';
                container.style.borderColor = 'var(--border)';
                container.style.background = 'transparent';
                activeItem = null;
             }
          };
          
          pList.appendChild(container);
        }`;

script = script.replace(oldLoopRegex, newLoop.replace('match;', ''));

// Remove the old openPerguntaDetalhe function and events since we don't need them
script = script.replace(/\s*const pDetalheView = document\.getElementById\('perguntaDetalheView'\);\r\n[\s\S]*$min/g, '');
fs.writeFileSync('script.js', script);
console.log("Patched script correctly");
