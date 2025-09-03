// Structure de référence pour la construction d'un lot (bible de l'imbrication des dimensions)
// À utiliser comme guide pour parser, générer ou valider les lots
// REMPLACÉ PAR public/config/dimensions.js

// Arbre des dimensions pour la génération des chaînes de transformations valides
// Utilisé par scenario.js pour generateAllBinomeChains()
window.dimensionTree = {
  selectByFormat: {
    selectByType: {
      selectByMatiere: {
        selectByFibre: null
      },
      selectByCouleur: null,
      selectByPerturbateur: null
    }
  },
  selectByQualite: null,
  selectByProprete: null
};
