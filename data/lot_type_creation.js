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

function createLotType({formats, matieres_fibres, qualiteDistrib, propreteDistrib, repartitionParType}) {
  const lotType = {
    formats: {},
    qualite: qualiteDistrib,
    proprete: Object.fromEntries(
      Object.entries(propreteDistrib).map(([k, v]) => [k, { pourcentage: v }])
    )
  };
  Object.entries(formats).forEach(([format, formatObj]) => {
    lotType.formats[format] = { types: {} };
    Object.entries(formatObj.types).forEach(([type, typeObj]) => {
      // ... (ta logique de génération)
    });
  });
  return lotType;
}

window.createLotType = createLotType;




