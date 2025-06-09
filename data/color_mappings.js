// Mappings de couleurs pour chaque dimension
const colorMappings = {
  // Couleurs de base pour les vêtements
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
  },
  // Couleurs pour les perturbateurs
  perturbateur: {
    'monocouche avec perturbateur': '#e74c3c', // Rouge
    'monocouche sans perturbateur': '#2ecc71', // Vert
    'multicouche': '#3498db' // Bleu
  },
  // Formats (palette verte)
  formats: {
    'vêtements': '#27ae60',
    'linges et rideaux': '#16a085',
    'chaussures et bottes': '#2ecc71',
    'non TLC': '#b2bec3'
  },
  // Types (palette plasma)
  types: {
    'autres pantalons, shorts et jupes': '#f39c12',
    'hauts type t-shirt': '#e67e22',
    'hauts type chemise': '#d35400',
    'hauts type pull': '#e74c3c',
    'lingerie': '#fd79a8',
    'pantalons en jean': '#2980b9',
    'pyjama et ensembles de sport': '#8e44ad',
    'robes': '#9b59b6',
    'vestes, manteaux et costumes': '#34495e',
    'vêtements bébé': '#f1c40f',
    'linge de bain / toilette': '#1abc9c',
    'linge de lit': '#2ecc71',
    'rideaux et voilage': '#7f8c8d',
    'autre linge de maison': '#b2bec3',
    'bottes': '#8d5524',
    'basket': '#e67e22',
    'été': '#f1c40f',
    'intérieur': '#7f8c8d',
    'bébé': '#fd79a8',
    'non TLC': '#b2bec3'
  },
  // Matières (palette cool)
  matieres: {}, // à remplir dynamiquement si besoin
  // Fibres (palette rainbow)
  fibres: {}, // à remplir dynamiquement si besoin
  // Qualité (palette oranges)
  qualite: {
    'neuf étiqueté': '#ffeda0',
    'parfait état': '#feb24c',
    'bon état': '#fd8d3c',
    'usé': '#fc4e2a',
    'abîmé': '#e31a1c',
    'inutilisable': '#b10026'
  },
  // Propreté (palette bleue)
  proprete: {
    'propre': '#c6dbef',
    'légèrement souillé': '#6baed6',
    'fortement souillé': '#2171b5',
    'contaminé': '#08306b'
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