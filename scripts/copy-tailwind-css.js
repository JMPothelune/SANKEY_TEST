import fs from 'fs';
import path from 'path';

// Fonction pour corriger les chemins dans le CSS
function fixTailwindPaths(cssPath) {
  let css = fs.readFileSync(cssPath, 'utf8');

  // Remplacer les polices Geist par des polices système
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

  // Supprimer les références aux polices Next.js dans les classes CSS
  css = css.replace(/\.__className_[a-zA-Z0-9]+/g, '');
  css = css.replace(/\.__variable_[a-zA-Z0-9]+/g, '');

  fs.writeFileSync(cssPath, css);
  console.log('✅ Chemins CSS Tailwind corrigés pour les pages statiques');
}

// Fonction pour copier le CSS Tailwind compilé
function copyTailwindCSS() {
  const cssDir = '.next/static/css';
  const targetDir = 'public/styles';

  // Créer le dossier de destination s'il n'existe pas
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Chercher le fichier CSS compilé
  if (fs.existsSync(cssDir)) {
    const files = fs.readdirSync(cssDir);
    const cssFile = files.find(file => file.endsWith('.css'));

    if (cssFile) {
      const sourcePath = path.join(cssDir, cssFile);
      const targetPath = path.join(targetDir, 'tailwind.css');

      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ CSS Tailwind copié de ${sourcePath} vers ${targetPath}`);

      // Corriger les chemins
      fixTailwindPaths(targetPath);
    } else {
      console.log('❌ Aucun fichier CSS trouvé dans .next/static/css');
    }
  } else {
    console.log(
      "❌ Dossier .next/static/css non trouvé. Assurez-vous d'avoir fait un build."
    );
  }
}

// Exécuter si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  copyTailwindCSS();
}

export default copyTailwindCSS;
