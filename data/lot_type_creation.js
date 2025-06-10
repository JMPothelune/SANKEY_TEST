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

// Modification de la fonction createLotType pour générer le lotType à partir de formats_types
function createLotType() {
  // On s'assure que tous les JSONs sont créés dans le bon ordre
  window.createAllJsons();
  
  // On récupère les données des formats qui ont été générées
  const allFormatsData = window.collectFormats();
  
  // On ne garde que les formats définis dans formats_types
  const formatsData = {};
  Object.keys(formats_types).forEach(format => {
    if (allFormatsData[format]) {
      formatsData[format] = allFormatsData[format];
    }
  });

  // On récupère les palettes de couleurs pour qualite et proprete
  const qualiteColors = window.collectQualite();
  const propreteColors = window.collectProprete();

  // On ajoute les couleurs pour qualite et proprete
  const qualiteWithColors = {};
  Object.entries(qualiteDistrib).forEach(([key, value]) => {
    qualiteWithColors[key] = {
      pourcentage: value.pourcentage,
      color: qualiteColors[key]?.color || '#bbb'
    };
  });

  const propreteWithColors = {};
  Object.entries(propreteDistrib).forEach(([key, value]) => {
    propreteWithColors[key] = {
      pourcentage: value.pourcentage,
      color: propreteColors[key]?.color || '#bbb'
    };
  });
  
  const lotType = {
    formats: formatsData,
    qualite: qualiteWithColors,
    proprete: propreteWithColors
  };

  // Téléchargement
  const blob = new Blob([JSON.stringify(lotType, null, 2)], { type: "application/json" });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = "lotType.json";
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Exposer la fonction dans le scope global
window.createLotType = createLotType;




