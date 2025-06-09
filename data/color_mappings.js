// Palette statique pour les couleurs métier
const colorMappings = {
  couleur: {
    'noir': '#222',
    'blanc': '#f5f5f5',
    'bleu': '#2980b9',
    'gris': '#7f8c8d',
    'marron': '#8d5524',
    'rouge': '#e74c3c',
    'vert': '#27ae60',
    'violet': '#8e44ad',
    'orange': '#e67e22',
    'jaune': '#f1c40f',
    'inconnu': '#b2bec3',
    'multicolore': '#fd79a8'
  }
};

// Génération dynamique pour matières et fibres si besoin
(function fillDynamicPalettes() {
  if (typeof window !== 'undefined' && window.matieres_fibres) {
    const matieres = Object.keys(window.matieres_fibres);
    matieres.forEach((m, i) => {
      colorMappings.matieres[m] = d3.interpolateCool(0.15 + 0.7 * (i / (matieres.length - 1)));
    });
    // Fibres
    const fibreSet = new Set();
    Object.values(window.matieres_fibres).forEach(mObj => {
      if (mObj.fibres) Object.keys(mObj.fibres).forEach(f => fibreSet.add(f));
    });
    const fibres = Array.from(fibreSet);
    fibres.forEach((f, i) => {
      colorMappings.fibres[f] = d3.interpolateRainbow(0.15 + 0.7 * (i / (fibres.length - 1)));
    });
  }
})();

// Exporter les mappings
window.colorMappings = colorMappings; 