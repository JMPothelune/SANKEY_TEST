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
  const lotType = {
    formats: {},
    qualite: qualiteDistrib,
    proprete: propreteDistrib
  };

  // On part de formats_types qui existe déjà
  Object.entries(formats_types).forEach(([format, formatObj]) => {
    lotType.formats[format] = {
      pourcentage: formatObj.pourcentage,
      color: window.colorMappings.formats[format].color,
      types: {}
    };
    
    // Pour chaque format, on va chercher ses types dans allFormats
    const formatTypes = allFormats[format]?.types || {};
    Object.entries(formatTypes).forEach(([type, typeObj]) => {
      const repType = repartitionParType[type] || {};
      
      // Matières
      const matieres = {};
      (repType.matieres || []).forEach(m => {
        matieres[m.nom] = {
          pourcentage: m.pourcentage,
          color: window.colorMappings.matieres[m.nom],
          fibres: (matieres_fibres[m.nom] && matieres_fibres[m.nom].fibres) || {}
        };
      });

      // Couleurs
      const couleurs = {};
      (repType.couleurs || []).forEach(c => {
        couleurs[c.nom] = { 
          pourcentage: c.pourcentage,
          color: window.colorMappings.couleur[c.nom]
        };
      });

      // Perturbateurs
      const perturbateurs = {};
      (repType.perturbateurs || []).forEach(p => {
        perturbateurs[p.nom] = { 
          pourcentage: p.pourcentage,
          color: window.colorMappings.perturbateurs[p.nom]
        };
      });

      lotType.formats[format].types[type] = {
        pourcentage: typeObj.pourcentage,
        color: window.colorMappings.types[type].color,
        matieres,
        couleurs,
        perturbateurs
      };
    });
  });

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

window.createLotType = createLotType;




