const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

// Replace .sheet-section-title
css = css.replace(
  /\.sheet-section-title\s*{[^}]*}/,
  `.sheet-section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-neutral);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
}`
);

fs.writeFileSync('styles.css', css, 'utf8');
console.log('Fixed title font');
