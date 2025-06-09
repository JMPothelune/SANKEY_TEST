// Création du lot type 

const formats_types = {
    "vêtements": {
        "pourcentage": 72.4
    },
    "linges et rideaux": {
        "pourcentage": 9
    },
    "chaussures et bottes": {
        "pourcentage": 9.4
    },
    "non TLC": {
        "pourcentage": 9.2
    }
};
  
// Générer la distribution simple pour les formats à partir de formats_types
const formatDistrib = {};
Object.entries(formats_types).forEach(([format, obj]) => {
  formatDistrib[format] = obj.pourcentage;
});


// Génération de l'objet lotType au chargement
const total = 1000;
const lotType = {
  total,
  format: {},
  qualite: qualiteDistrib,
  proprete: Object.fromEntries(
    Object.entries(propreteDistrib).map(([k, v]) => [k, { pourcentage: v }])
  )
};

console.log('lotType :', lotType);

// Génération du lotType à partir des données globales
function createLotType() {
  const lotType = {
    formats: {},
    qualite: window.qualiteDistrib,
    proprete: Object.fromEntries(
      Object.entries(window.propreteDistrib).map(([k, v]) => [k, { pourcentage: v }])
    )
  };
  Object.entries(window.allFormats).forEach(([format, formatObj]) => {
    lotType.formats[format] = { types: {} };
    Object.entries(formatObj.types).forEach(([type, typeObj]) => {
      const repType = window.repartitionParType[type] || {};
      // Matières
      const matieres = {};
      const matieresSource = (repType.matieres && repType.matieres.length)
        ? repType.matieres
        : [{ nom: 'inconnu', pourcentage: 100 }];
      matieresSource.forEach(m => {
        const matiereFibres = window.matieres_fibres[m.nom] || {};
        matieres[m.nom] = {
          pourcentage: m.pourcentage,
          fibres: matiereFibres.fibres || {}
        };
      });
      // Couleurs
      const couleurs = {};
      const couleursSource = (repType.couleurs && repType.couleurs.length)
        ? repType.couleurs
        : [{ nom: 'multicolore', pourcentage: 100 }];
      couleursSource.forEach(c => {
        couleurs[c.nom] = { pourcentage: c.pourcentage };
      });
      lotType.formats[format].types[type] = {
        pourcentage: typeObj.pourcentage,
        matieres,
        couleurs,
        perturbateurs: repType.perturbateurs || []
      };
    });
  });
  return lotType;
}
window.createLotType = createLotType;




