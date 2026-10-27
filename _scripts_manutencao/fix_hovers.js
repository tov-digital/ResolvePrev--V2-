const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

// Replace .btn-delete-card:hover
css = css.replace(
  /\.btn-delete-card:hover\s*{[^}]*}/,
  `.btn-delete-card:hover {
  background-color: transparent;
  color: var(--danger-color);
}`
);

// Replace .input-action-btn:hover
css = css.replace(
  /\.input-action-btn:hover\s*{[^}]*}/,
  `.input-action-btn:hover {
  background-color: transparent;
  color: #16A34A;
  transform: translateY(-50%);
}`
);

fs.writeFileSync('styles.css', css, 'utf8');
console.log('Fixed hovers');
