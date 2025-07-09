import fs from 'fs';

function fixTailwindPaths() {
  const cssPath = 'public/styles/tailwind.css';

  if (!fs.existsSync(cssPath)) {
    console.log('❌ Fichier CSS Tailwind non trouvé');
    return;
  }

  let css = fs.readFileSync(cssPath, 'utf8');

  // Corriger les chemins des polices
  css = css.replace(/\/_next\/static\/media\//g, '/_next/static/media/');

  // Pour les pages statiques, nous devons copier les polices aussi
  // ou utiliser des polices système
  css = css.replace(
    /font-family:Geist/g,
    'font-family:system-ui, -apple-system, sans-serif'
  );
  css = css.replace(
    /font-family:Geist Fallback/g,
    'font-family:system-ui, -apple-system, sans-serif'
  );

  // Supprimer les @font-face qui pointent vers des chemins Next.js
  css = css.replace(/@font-face\{[^}]+\}/g, '');

  fs.writeFileSync(cssPath, css);
  console.log('✅ Chemins CSS Tailwind corrigés pour les pages statiques');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fixTailwindPaths();
}

export default fixTailwindPaths;
