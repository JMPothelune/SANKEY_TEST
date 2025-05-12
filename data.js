const couleurDistrib = {
    "Noir": 17,
    "Blanc": 16,
    "Bleu": 15,
    "Gris": 12,
    "Marron": 7,
    "Rouge": 5,
    "Vert": 4,
    "Violet": 3,
    "Orange": 1.5,
    "Jaune": 1.5,
    "Inconnu": 2,
    "Multicolore": 16
};

const formats_types = {
  "Vêtements": {
    "pourcentage": 72.4,
    "types": {
      "Autres pantalons, shorts et jupes": 16,
      "Hauts type T-shirt": 16,
      "Hauts type chemise": 5,
      "Hauts type pull": 20,
      "Lingerie": 1,
      "Pantalons en jean": 9,
      "Pyjama et ensemble de sport": 3,
      "Robes": 5,
      "Sous-vêtements": 7,
      "Vestes, manteaux etc.": 14,
      "Vêtements bébé": 4
    }
  },
  "Linges et rideaux": {
    "pourcentage": 9,
    "types": {
      "Linge de bain / toilette": 14,
      "Linge de lit": 60,
      "Rideaux et voilage": 11,
      "Autre linge de maison": 14
    }
  },
  "Chaussures et bottes": {
    "pourcentage": 9.4,
    "types": {
      "bottes": 26,
      "basses": 22,
      "basket": 27,
      "été": 17,
      "intérieur": 4,
      "bébé": 4
    }
  },
  "non TLC": {
    "pourcentage": 9.2,
    "types": {
      "non tlc": 100
    }
  }
};

// Générer la distribution simple pour les formats à partir de formats_types
const formatDistrib = {};
Object.entries(formats_types).forEach(([format, obj]) => {
  formatDistrib[format] = obj.pourcentage;
});

// Générer l'objet matière pour chaque lien à partir de matieres_fibres
function getMatiereObj() {
    const obj = {};
    Object.entries(matieres_fibres).forEach(([nom, data]) => {
        obj[nom] = data.pourcentage;
    });
    return obj;
}

const matieres_fibres = {
  "100% coton": {
    "pourcentage": 27.6,
    "fibres": { "Coton": 100 }
  },
  "100% polyester": {
    "pourcentage": 11.0,
    "fibres": { "Polyester": 100 }
  },
  "coton/polyester": {
    "pourcentage": 8.8,
    "fibres": { "Coton": 57, "Polyester": 43 }
  },
  "coton/élasthanne": {
    "pourcentage": 4.9,
    "fibres": { "Coton": 96, "Élasthanne": 4 }
  },
  "laine/acrylique": {
    "pourcentage": 3.1,
    "fibres": { "Laine": 38, "Acrylique": 62 }
  },
  "coton/acrylique": {
    "pourcentage": 2.3,
    "fibres": { "Coton": 45, "Acrylique": 55 }
  },
  "coton/polyester/élasthanne": {
    "pourcentage": 1.7,
    "fibres": { "Coton": 71, "Polyester": 26, "Élasthanne": 3 }
  },
  "coton/viscose": {
    "pourcentage": 1.3,
    "fibres": { "Coton": 55, "Viscose": 45 }
  },
  "polyester/élasthanne": {
    "pourcentage": 1.3,
    "fibres": { "Polyester": 93, "Élasthanne": 7 }
  },
  "laine/polyamide": {
    "pourcentage": 1.3,
    "fibres": { "Laine": 65, "Polyamide": 35 }
  },
  "viscose/élasthanne": {
    "pourcentage": 1.2,
    "fibres": { "Viscose": 93, "Élasthanne": 7 }
  },
  "viscose/polyamide": {
    "pourcentage": 1.2,
    "fibres": { "Viscose": 70, "Polyamide": 30 }
  },
  "coton/polyamide": {
    "pourcentage": 1.1,
    "fibres": { "Coton": 69, "Polyamide": 31 }
  },
  "polyester/viscose": {
    "pourcentage": 1.0,
    "fibres": { "Polyester": 44, "Viscose": 56 }
  },
  "polyester/viscose/élasthanne": {
    "pourcentage": 0.9,
    "fibres": { "Polyester": 59, "Viscose": 37, "Élasthanne": 4 }
  },
  "polyester/laine": {
    "pourcentage": 0.7,
    "fibres": { "Polyester": 58, "Laine": 42 }
  },
  "polyester/acrylique": {
    "pourcentage": 0.7,
    "fibres": { "Polyester": 45, "Acrylique": 55 }
  },
  "acrylique/polyamide": {
    "pourcentage": 0.6,
    "fibres": { "Acrylique": 68, "Polyamide": 32 }
  },
  "coton/polyamide/élasthanne": {
    "pourcentage": 0.6,
    "fibres": { "Coton": 72, "Polyamide": 24, "Élasthanne": 4 }
  },
  "polyamide/élasthanne": {
    "pourcentage": 0.6,
    "fibres": { "Polyamide": 86, "Élasthanne": 14 }
  },
  "coton/laine": {
    "pourcentage": 0.5,
    "fibres": { "Coton": 57, "Laine": 43 }
  },
  "laine/acrylique/polyamide": {
    "pourcentage": 0.4,
    "fibres": { "Laine": 27, "Acrylique": 52, "Polyamide": 21 }
  },
  "polyester/polyamide": {
    "pourcentage": 0.3,
    "fibres": { "Polyester": 60, "Polyamide": 40 }
  },
  "coton/autre": {
    "pourcentage": 0.4,
    "fibres": { "Coton": 60, "Autre": 40 }
  },
  "viscose/polyamide/élasthanne": {
    "pourcentage": 0.3,
    "fibres": { "Viscose": 74, "Polyamide": 21, "Élasthanne": 5 }
  },
  "100% acrylique": {
    "pourcentage": 6.9, 
    "fibres": { "Acrylique": 100 } 
  },
  "100% inconnu": { 
    "pourcentage": 8.5, 
    "fibres": { "Autre": 100 } 
  },
  "100% laine": {
    "pourcentage": 1.9,
    "fibres": { "Laine": 100 } 
  },
  "100% viscose": {
    "pourcentage": 1.4, 
    "fibres": { "Viscose": 100 } 
  },
  "100% polyamide": {
    "pourcentage": 1.3, 
    "fibres": { "Polyamide": 100 } 
  },
  "mélange 4 matières": {
     "pourcentage": 1.3, 
     "fibres": { "Autre": 100 } 
  },
  "autres compositions": {
    "pourcentage": 4.8, 
    "fibres": { "Autre": 100 } 
  },
  "100% autre": {
    "pourcentage": 0.4, 
    "fibres": { "Autre": 100 } 
  },
  "100% soie": {
    "pourcentage": 0.3, 
    "fibres": { "Soie": 100 } 
  }
};

// Vérification de la somme des pourcentages top-level des matières
let totalPourcentage = 0;
Object.values(matieres_fibres).forEach(obj => {
  totalPourcentage += obj.pourcentage;
});
console.log("Somme des pourcentages top-level des matières :", totalPourcentage);

const qualiteDistrib = {
    "Neuf étiqueté": 5,
    "Parfait état": 15,
    "Bon état": 15,
    "Usé": 25,
    "Abîmé": 32,
    "Inutilisable": 8
};

const data = {
    "dimensions": {
        "matiere": {
            "name": "Matière",
            "values": Object.keys(matieres_fibres)
        },
        "format": {
            "name": "Format",
            "values": ["Vêtements", "Linges et rideaux", "Chaussures et bottes", "non TLC"]
        },
        "couleur": {
            "name": "Couleur",
            "values": ["Noir", "Blanc", "Bleu", "Gris", "Marron", "Rouge", "Vert", "Violet", "Orange", "Jaune", "Inconnu", "Multicolore"]
        },
        "qualite": {
            "name": "Qualité",
            "values": Object.keys(qualiteDistrib)
        }
    }
}; 

// Liste des distributions par type 

const repartitionParType = {
  // Pantalon en jean 
  "Pantalons en jean": {
    "matieres": [
      { "nom": "coton/élasthanne", "pourcentage": 31.2 },
      { "nom": "100% coton", "pourcentage": 27.3 },
      { "nom": "coton/polyester/élasthanne", "pourcentage": 20.3 },
      { "nom": "coton/polyester", "pourcentage": 4.8 },
      { "nom": "mélange 4 matières", "pourcentage": 4.2 },
      { "nom": "coton/polyester/viscose", "pourcentage": 1.3 },
      { "nom": "coton/autre", "pourcentage": 0.7 },
      { "nom": "coton/autre/élasthanne", "pourcentage": 0.6 },
      { "nom": "coton/viscose", "pourcentage": 0.2 },
      { "nom": "viscose/polyamide/élasthanne", "pourcentage": 0.1 },
      { "nom": "100% inconnu", "pourcentage": 0.5 },
      { "nom": "Autres compositions", "pourcentage": 8.8 }
    ],
    "couleurs": [
      { "nom": "bleu", "pourcentage": 68 },
      { "nom": "noir", "pourcentage": 14 },
      { "nom": "gris", "pourcentage": 10 },
      { "nom": "vert", "pourcentage": 2 },
      { "nom": "autres", "pourcentage": 6 }
    ]
  },
  // Autre linge de maison
  "Autre linge de maison": {
    "matieres": [
      { "nom": "100% coton", "pourcentage": 53.1 },
      { "nom": "coton/viscose", "pourcentage": 12.3 },
      { "nom": "100% polyester", "pourcentage": 11.2 },
      { "nom": "coton/polyester", "pourcentage": 5.9 },
      { "nom": "100% laine", "pourcentage": 2.2 },
      { "nom": "polyester/polyamide", "pourcentage": 1.6 },
      { "nom": "100% acrylique", "pourcentage": 1.2 },
      { "nom": "coton/élasthanne", "pourcentage": 1.1 },
      { "nom": "polyester/acrylique", "pourcentage": 0.9 },
      { "nom": "coton/autre", "pourcentage": 0.9 },
      { "nom": "100% inconnu", "pourcentage": 5.1 },
      { "nom": "Autres compositions", "pourcentage": 4.4 }
    ],
    "couleurs": [
      { "nom": "blanc", "pourcentage": 40 },
      { "nom": "multicolore", "pourcentage": 33 },
      { "nom": "bleu", "pourcentage": 6 },
      { "nom": "vert", "pourcentage": 4 },
      { "nom": "marron", "pourcentage": 3 },
      { "nom": "orange", "pourcentage": 3 },
      { "nom": "rouge", "pourcentage": 3 },
      { "nom": "jaune", "pourcentage": 2 },
      { "nom": "gris", "pourcentage": 6 }
    ]
  },
  // Autres pantalons, shorts et jupes
  "Autres pantalons, shorts et jupes": {
    "matieres": [
      { "nom": "100% coton", "pourcentage": 18.4 },
      { "nom": "coton/polyester", "pourcentage": 13.8 },
      { "nom": "100% polyester", "pourcentage": 12.1 },
      { "nom": "coton/élasthanne", "pourcentage": 11.8 },
      { "nom": "polyester/élasthanne", "pourcentage": 3.9 },
      { "nom": "coton/polyester/élasthanne", "pourcentage": 3.8 },
      { "nom": "polyester/viscose/élasthanne", "pourcentage": 3.3 },
      { "nom": "100% laine", "pourcentage": 2.2 },
      { "nom": "polyester/laine", "pourcentage": 2.1 },
      { "nom": "polyester/viscose", "pourcentage": 1.8 },
      { "nom": "100% inconnu", "pourcentage": 9.8 },
      { "nom": "Autres compositions", "pourcentage": 17.0 }
    ],
    "couleurs": [
      { "nom": "noir", "pourcentage": 27 },
      { "nom": "gris", "pourcentage": 17 },
      { "nom": "bleu", "pourcentage": 16 },
      { "nom": "multicolore", "pourcentage": 12 },
      { "nom": "blanc", "pourcentage": 9 },
      { "nom": "marron", "pourcentage": 9 },
      { "nom": "vert", "pourcentage": 5 },
      { "nom": "rouge", "pourcentage": 3 },
      { "nom": "violet", "pourcentage": 2 }
    ]
  },
  "Hauts type chemise": {
    "matieres": [
      { "nom": "100% coton", "pourcentage": 48.6 },
      { "nom": "coton/polyester", "pourcentage": 18.8 },
      { "nom": "100% polyester", "pourcentage": 6.8 },
      { "nom": "100% viscose", "pourcentage": 5.5 },
      { "nom": "coton/élasthanne", "pourcentage": 3.5 },
      { "nom": "polyester/viscose", "pourcentage": 1.6 },
      { "nom": "100% polyamide", "pourcentage": 1.5 },
      { "nom": "viscose/élasthanne", "pourcentage": 1.3 },
      { "nom": "polyester/élasthanne", "pourcentage": 1.2 },
      { "nom": "coton/autre", "pourcentage": 1.2 },
      { "nom": "100% inconnu", "pourcentage": 2.6 },
      { "nom": "Autres compositions", "pourcentage": 7.4 }
    ],
    "couleurs": [
      { "nom": "multicolore", "pourcentage": 31 },
      { "nom": "blanc", "pourcentage": 27 },
      { "nom": "bleu", "pourcentage": 16 },
      { "nom": "gris", "pourcentage": 5 },
      { "nom": "marron", "pourcentage": 5 },
      { "nom": "vert", "pourcentage": 4 },
      { "nom": "noir", "pourcentage": 4 },
      { "nom": "rouge", "pourcentage": 3 },
      { "nom": "violet", "pourcentage": 3 },
      { "nom": "autre", "pourcentage": 2 }
    ]
  },
  "Hauts type pull": {
    "matieres": [
      { "nom": "100% acrylique", "pourcentage": 15.6 },
      { "nom": "100% coton", "pourcentage": 15.1 },
      { "nom": "coton/polyester", "pourcentage": 8.4 },
      { "nom": "laine/acrylique", "pourcentage": 8.1 },
      { "nom": "100% polyester", "pourcentage": 6.6 },
      { "nom": "coton/acrylique", "pourcentage": 5.4 },
      { "nom": "100% laine", "pourcentage": 3.1 },
      { "nom": "viscose/polyamide", "pourcentage": 2.7 },
      { "nom": "laine/polyamide", "pourcentage": 2.4 },
      { "nom": "coton/polyamide", "pourcentage": 1.9 },
      { "nom": "100% inconnu", "pourcentage": 11.3 },
      { "nom": "Autres compositions", "pourcentage": 20.4 }
    ],
    "couleurs": [
      { "nom": "multicolore", "pourcentage": 18 },
      { "nom": "noir", "pourcentage": 17 },
      { "nom": "gris", "pourcentage": 15 },
      { "nom": "bleu", "pourcentage": 12 },
      { "nom": "blanc", "pourcentage": 10 },
      { "nom": "marron", "pourcentage": 8 },
      { "nom": "rouge", "pourcentage": 7 },
      { "nom": "vert", "pourcentage": 5 },
      { "nom": "violet", "pourcentage": 4 },
      { "nom": "orange", "pourcentage": 2 },
      { "nom": "autre", "pourcentage": 2 }
    ]
  },
  "Hauts type T-shirt": {
    "matieres": [
      { "nom": "100% coton", "pourcentage": 57.6 },
      { "nom": "coton/polyester", "pourcentage": 6.8 },
      { "nom": "coton/élasthanne", "pourcentage": 6.5 },
      { "nom": "viscose/élasthanne", "pourcentage": 5.1 },
      { "nom": "100% polyester", "pourcentage": 3.2 },
      { "nom": "100% viscose", "pourcentage": 2.4 },
      { "nom": "coton/viscose", "pourcentage": 2.2 },
      { "nom": "polyester/élasthanne", "pourcentage": 1.7 },
      { "nom": "100% acrylique", "pourcentage": 1.2 },
      { "nom": "viscose/polyamide", "pourcentage": 1.0 },
      { "nom": "100% inconnu", "pourcentage": 3.7 },
      { "nom": "Autres compositions", "pourcentage": 8.6 }
    ],
    "couleurs": [
      { "nom": "blanc", "pourcentage": 34 },
      { "nom": "noir", "pourcentage": 14 },
      { "nom": "multicolore", "pourcentage": 13 },
      { "nom": "bleu", "pourcentage": 10 },
      { "nom": "gris", "pourcentage": 9 },
      { "nom": "marron", "pourcentage": 5 },
      { "nom": "rouge", "pourcentage": 5 },
      { "nom": "violet", "pourcentage": 3 },
      { "nom": "vert", "pourcentage": 3 },
      { "nom": "autre", "pourcentage": 4 }
    ]
  },
  "Linge de bain et toilette": {
    "matieres": [
      { "nom": "100% coton", "pourcentage": 81.5 },
      { "nom": "100% polyester", "pourcentage": 9.1 },
      { "nom": "coton/polyamide", "pourcentage": 3.4 },
      { "nom": "coton/polyester", "pourcentage": 2.6 },
      { "nom": "coton/laine", "pourcentage": 0.5 },
      { "nom": "coton/élasthanne", "pourcentage": 0.4 },
      { "nom": "polyester/acrylique", "pourcentage": 0.3 },
      { "nom": "100% acrylique", "pourcentage": 0.3 },
      { "nom": "100% polyamide", "pourcentage": 0.2 },
      { "nom": "coton/viscose", "pourcentage": 0.2 },
      { "nom": "100% inconnu", "pourcentage": 1.4 },
      { "nom": "Autres compositions", "pourcentage": 0.3 }
    ],
    "couleurs": [
      { "nom": "blanc", "pourcentage": 29 },
      { "nom": "multicolore", "pourcentage": 22 },
      { "nom": "bleu", "pourcentage": 15 },
      { "nom": "gris", "pourcentage": 6 },
      { "nom": "marron", "pourcentage": 6 },
      { "nom": "rouge", "pourcentage": 5 },
      { "nom": "vert", "pourcentage": 4 },
      { "nom": "jaune", "pourcentage": 3 },
      { "nom": "violet", "pourcentage": 8 },
      { "nom": "autre", "pourcentage" : 2}
    ]
  },
  "Linge de lit": {
    "matieres": [
      { "nom": "100% coton", "pourcentage": 60.8 },
      { "nom": "100% polyester", "pourcentage": 10.6 },
      { "nom": "coton/polyester", "pourcentage": 10.3 },
      { "nom": "coton/viscose", "pourcentage": 2.3 },
      { "nom": "coton/laine", "pourcentage": 1.7 },
      { "nom": "100% laine", "pourcentage": 1.5 },
      { "nom": "100% acrylique", "pourcentage": 1.2 },
      { "nom": "coton/acrylique", "pourcentage": 1.0 },
      { "nom": "polyester/viscose", "pourcentage": 0.8 },
      { "nom": "coton/élasthanne", "pourcentage": 0.6 },
      { "nom": "100% inconnu", "pourcentage": 4.8 },
      { "nom": "Autres compositions", "pourcentage": 4.4 }
    ],
    "couleurs": [
      { "nom": "blanc", "pourcentage": 36 },
      { "nom": "multicolore", "pourcentage": 25 },
      { "nom": "bleu", "pourcentage": 8 },
      { "nom": "gris", "pourcentage": 6 },
      { "nom": "marron", "pourcentage": 5 },
      { "nom": "vert", "pourcentage": 4 },
      { "nom": "violet", "pourcentage": 4 },
      { "nom": "jaune", "pourcentage": 3 },
      { "nom": "orange", "pourcentage": 3 },
      { "nom": "rouge", "pourcentage": 3 },
      { "nom": "autre", "pourcentage": 3}
    ]
  },
  "Lingerie": {
    "matieres": [
      { "nom": "polyamide/élasthanne", "pourcentage": 28.4 },
      { "nom": "polyester/polyamide/élasthanne", "pourcentage": 9.6 },
      { "nom": "coton/élasthanne", "pourcentage": 8.8 },
      { "nom": "100% coton", "pourcentage": 7.4 },
      { "nom": "100% polyester", "pourcentage": 7.4 },
      { "nom": "100% polyamide", "pourcentage": 7.3 },
      { "nom": "coton/polyamide/élasthanne", "pourcentage": 6.1 },
      { "nom": "polyester/élasthanne", "pourcentage": 4.7 },
      { "nom": "mélange 4 matières", "pourcentage": 3.2 },
      { "nom": "viscose/élasthanne", "pourcentage": 2.0 },
      { "nom": "100% inconnu", "pourcentage": 5.7 },
      { "nom": "Autres compositions", "pourcentage": 9.4 }
    ],
    "couleurs": [
      { "nom": "blanc", "pourcentage": 33 },
      { "nom": "noir", "pourcentage": 19 },
      { "nom": "multicolore", "pourcentage": 9 },
      { "nom": "gris", "pourcentage": 9 },
      { "nom": "bleu", "pourcentage": 6 },
      { "nom": "rouge", "pourcentage": 6 },
      { "nom": "marron", "pourcentage": 4 },
      { "nom": "vert", "pourcentage": 2 },
      { "nom": "violet", "pourcentage": 4 },
      { "nom": "orange", "pourcentage": 4 },
      { "nom": "autre", "pourcentage": 4 }
    ]
  },
  "Pyjama et ensembles de sport": {
    "matieres": [
      { "nom": "100% coton", "pourcentage": 37.4 },
      { "nom": "100% polyester", "pourcentage": 20.0 },
      { "nom": "coton/polyester", "pourcentage": 16.3 },
      { "nom": "coton/élasthanne", "pourcentage": 4.8 },
      { "nom": "100% acrylique", "pourcentage": 2.1 },
      { "nom": "polyester/acrylique", "pourcentage": 1.7 },
      { "nom": "100% viscose", "pourcentage": 1.4 },
      { "nom": "viscose/élasthanne", "pourcentage": 1.4 },
      { "nom": "coton/viscose", "pourcentage": 1.3 },
      { "nom": "coton/polyester/élasthanne", "pourcentage": 1.0 },
      { "nom": "100% inconnu", "pourcentage": 7 },
      { "nom": "Autres compositions", "pourcentage": 5.6 }
    ],
    "couleurs": [
      { "nom": "multicolore", "pourcentage": 29 },
      { "nom": "bleu", "pourcentage": 17 },
      { "nom": "blanc", "pourcentage": 11 },
      { "nom": "gris", "pourcentage": 9 },
      { "nom": "noir", "pourcentage": 8 },
      { "nom": "rouge", "pourcentage": 8 },
      { "nom": "violet", "pourcentage": 5 },
      { "nom": "marron", "pourcentage": 4 },
      { "nom": "vert", "pourcentage": 4 },
      { "nom": "autre", "pourcentage": 5 }
    ]
  },
  "Rideaux et voilages": {
    "matieres": [
      { "nom": "100% coton", "pourcentage": 32.8 },
      { "nom": "100% polyester", "pourcentage": 27.6 },
      { "nom": "coton/polyester", "pourcentage": 9.7 },
      { "nom": "100% viscose", "pourcentage": 8.8 },
      { "nom": "100% acrylique", "pourcentage": 5.7 },
      { "nom": "coton/viscose", "pourcentage": 3.5 },
      { "nom": "polyester/laine", "pourcentage": 1.7 },
      { "nom": "polyester/acrylique", "pourcentage": 1.2 },
      { "nom": "polyester/viscose", "pourcentage": 0.8 },
      { "nom": "polyester/polyamide", "pourcentage": 0.7 },
      { "nom": "100% inconnu", "pourcentage": 5.4 },
      { "nom": "Autres compositions", "pourcentage": 2.0 }
    ],
    "couleurs": [
      { "nom": "blanc", "pourcentage": 25 },
      { "nom": "multicolore", "pourcentage": 23 },
      { "nom": "marron", "pourcentage": 12 },
      { "nom": "rouge", "pourcentage": 10 },
      { "nom": "bleu", "pourcentage": 6 },
      { "nom": "vert", "pourcentage": 6 },
      { "nom": "gris", "pourcentage": 5 },
      { "nom": "violet", "pourcentage": 5 },
      { "nom": "orange", "pourcentage": 5 },
      { "nom": "autre", "pourcentage": 3 }
    ]
  },
  "Robes": {
    "matieres": [
      { "nom": "100% coton", "pourcentage": 11.8 },
      { "nom": "100% polyester", "pourcentage": 11.4 },
      { "nom": "100% acrylique", "pourcentage": 8.4 },
      { "nom": "polyester/élasthanne", "pourcentage": 7.0 },
      { "nom": "coton/viscose", "pourcentage": 5.8 },
      { "nom": "viscose/élasthanne", "pourcentage": 5.6 },
      { "nom": "polyester/viscose/élasthanne", "pourcentage": 3.9 },
      { "nom": "100% viscose", "pourcentage": 3.5 },
      { "nom": "coton/élasthanne", "pourcentage": 3.4 },
      { "nom": "coton/polyester", "pourcentage": 3.2 },
      { "nom": "100% inconnu", "pourcentage": 7.4 },
      { "nom": "Autres compositions", "pourcentage": 28.5 }
    ],
    "couleurs": [
      { "nom": "multicolore", "pourcentage": 30 },
      { "nom": "noir", "pourcentage": 24 },
      { "nom": "blanc", "pourcentage": 11 },
      { "nom": "gris", "pourcentage": 8 },
      { "nom": "marron", "pourcentage": 7 },
      { "nom": "bleu", "pourcentage": 7 },
      { "nom": "rouge", "pourcentage": 5 },
      { "nom": "violet", "pourcentage": 4 },
      { "nom": "vert", "pourcentage": 3 },
      { "nom": "autre", "pourcentage": 1 }
    ]
  },
  "Sous-vêtements (hors lingerie) et accessoires": {
    "matieres": [
      { "nom": "100% coton", "pourcentage": 16.4 },
      { "nom": "100% acrylique", "pourcentage": 12.5 },
      { "nom": "100% polyester", "pourcentage": 9.1 },
      { "nom": "coton/élasthanne", "pourcentage": 6.7 },
      { "nom": "coton/polyamide/élasthanne", "pourcentage": 6.5 },
      { "nom": "polyamide/élasthanne", "pourcentage": 5.0 },
      { "nom": "laine/acrylique", "pourcentage": 3.0 },
      { "nom": "coton/polyester/élasthanne", "pourcentage": 2.8 },
      { "nom": "coton/polyester", "pourcentage": 2.7 },
      { "nom": "100% laine", "pourcentage": 1.9 },
      { "nom": "100% inconnu", "pourcentage": 15.1 },
      { "nom": "Autres compositions", "pourcentage": 18.3 }
    ],
    "couleurs": [
      { "nom": "noir", "pourcentage": 20 },
      { "nom": "multicolore", "pourcentage": 20 },
      { "nom": "blanc", "pourcentage": 17 },
      { "nom": "gris", "pourcentage": 11 },
      { "nom": "bleu", "pourcentage": 10 },
      { "nom": "marron", "pourcentage": 7 },
      { "nom": "rouge", "pourcentage": 5 },
      { "nom": "violet", "pourcentage": 4 },
      { "nom": "vert", "pourcentage": 4 },
      { "nom": "autre", "pourcentage": 2 }
    ]
  },
  "Vestes, manteaux et costumes": {
    "matieres": [
      { "nom": "100% polyester", "pourcentage": 31.1 },
      { "nom": "100% coton", "pourcentage": 12.0 },
      { "nom": "coton/polyester", "pourcentage": 10.6 },
      { "nom": "100% polyamide", "pourcentage": 4.7 },
      { "nom": "100% viscose", "pourcentage": 3.1 },
      { "nom": "100% laine", "pourcentage": 3.0 },
      { "nom": "polyester/viscose", "pourcentage": 2.3 },
      { "nom": "polyester/laine", "pourcentage": 2.2 },
      { "nom": "laine/polyamide", "pourcentage": 1.9 },
      { "nom": "polyester/élasthanne", "pourcentage": 1.8 },
      { "nom": "100% inconnu", "pourcentage": 9.0 },
      { "nom": "Autres compositions", "pourcentage": 18.3 }
    ],
    "couleurs": [
      { "nom": "noir", "pourcentage": 28 },
      { "nom": "bleu", "pourcentage": 15 },
      { "nom": "marron", "pourcentage": 12 },
      { "nom": "blanc", "pourcentage": 10 },
      { "nom": "multicolore", "pourcentage": 10 },
      { "nom": "gris", "pourcentage": 11 },
      { "nom": "vert", "pourcentage": 6 },
      { "nom": "rouge", "pourcentage": 4 },
      { "nom": "violet", "pourcentage": 2 },
      { "nom": "autre", "pourcentage": 2 }
    ]
  },
  "Vêtements bébé": {
    "matieres": [
      { "nom": "100% coton", "pourcentage": 42.4 },
      { "nom": "coton/polyester", "pourcentage": 13.9 },
      { "nom": "100% acrylique", "pourcentage": 10.1 },
      { "nom": "100% polyester", "pourcentage": 5.8 },
      { "nom": "coton/élasthanne", "pourcentage": 4.3 },
      { "nom": "coton/acrylique", "pourcentage": 3.6 },
      { "nom": "laine/acrylique", "pourcentage": 2.2 },
      { "nom": "coton/polyamide", "pourcentage": 2.0 },
      { "nom": "100% laine", "pourcentage": 1.6 },
      { "nom": "mélange 4 matières", "pourcentage": 1.4 },
      { "nom": "100% inconnu", "pourcentage": 4.2 },
      { "nom": "Autres compositions", "pourcentage": 8.5 }
    ],
    "couleurs": [
      { "nom": "multicolore", "pourcentage": 22 },
      { "nom": "blanc", "pourcentage": 19 },
      { "nom": "bleu", "pourcentage": 17 },
      { "nom": "gris", "pourcentage": 11 },
      { "nom": "marron", "pourcentage": 7 },
      { "nom": "violet", "pourcentage": 7 },
      { "nom": "rouge", "pourcentage": 7 },
      { "nom": "noir", "pourcentage": 3 },
      { "nom": "vert", "pourcentage": 3 },
      { "nom": "jaune", "pourcentage": 3 },
      { "nom": "autre", "pourcentage": 1 }
    ]
  }
}

// Génération de l'objet lotType au chargement
const total = 1000;
const lotType = {
  total,
  format: {},
  qualite: qualiteDistrib
};

Object.entries(formats_types).forEach(([format, formatObj]) => {
  lotType.format[format] = {
    pourcentage: formatObj.pourcentage,
    types: {}
  };
  Object.entries(formatObj.types).forEach(([type, typePct]) => {
    const repType = repartitionParType[type] || {};
    // Matières
    const matieres = {};
    (repType.matieres || []).forEach(m => {
      const matiereFibres = matieres_fibres[m.nom] || {};
      matieres[m.nom] = {
        pourcentage: m.pourcentage,
        fibres: matiereFibres.fibres || {}
      };
    });
    // Couleurs
    const couleurs = {};
    (repType.couleurs || []).forEach(c => {
      couleurs[c.nom] = { pourcentage: c.pourcentage };
    });
    lotType.format[format].types[type] = {
      pourcentage: typePct,
      matieres,
      couleurs
    };
  });
});

console.log('lotType généré :', lotType);


