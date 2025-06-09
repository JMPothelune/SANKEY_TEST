// Structure de référence pour la construction d'un lot (bible de l'imbrication des dimensions)
// À utiliser comme guide pour parser, générer ou valider les lots
const lotStructure = {
  formats: {
    types: {
      matieres: {
        fibres: null,
        couleurs: null,
        perturbateurs: null
      }
    }
  },
  qualite: null,
  proprete: null
};
window.lotStructure = lotStructure;

window.dimensionTree = {
  selectByFormat: {
    selectByType: {
      selectByMatiere: {
        selectByFibre: null
      },
      selectByCouleur: null
    }
  },
  selectByQualite: null,
  selectByProprete: null
};

window.moreFormats = [
  "tissu"
]

window.moreTypes = [
  "morceaux de tissu",
  "points durs",
  "matrice"
]

const formats_types = {
  "vêtements": {
    "pourcentage": 72.4,
    "types": {
      "autres pantalons, shorts et jupes": {
        "pourcentage": 16,
      },
      "hauts type t-shirt": {
        "pourcentage": 16,
      },
      "hauts type chemise": {
        "pourcentage": 5,
      },
      "hauts type pull": {
        "pourcentage": 20,
      },
      "lingerie": {
        "pourcentage": 1,
      },
      "pantalons en jean": {
        "pourcentage": 9,
      },
      "pyjama et ensembles de sport": {
        "pourcentage": 3,
      },
      "robes": {
        "pourcentage": 5,
      },
      "vestes, manteaux et costumes": {
        "pourcentage": 14,
      },
      "vêtements bébé": {
        "pourcentage": 4,
      }
    }
  },
  "linges et rideaux": {
    "pourcentage": 9,
    "types": {
      "linge de bain / toilette": {
        "pourcentage": 14,
      },
      "linge de lit": {
        "pourcentage": 60,
      },
      "rideaux et voilage": {
        "pourcentage": 12,
      },
      "autre linge de maison": {
        "pourcentage": 14,
      }
    }
  },
  "chaussures et bottes": {
    "pourcentage": 9.4,
    "types": {
      "bottes": {
        "pourcentage": 22,
      },
      "basket": {
        "pourcentage": 27,
      },
      "été": {
        "pourcentage": 17,
      },
      "intérieur": {
        "pourcentage": 4,
      },
      "bébé": {
        "pourcentage": 4,
      }
    }
  },
  "non TLC": {
    "pourcentage": 9.2,
    "types": {
      "non TLC": {
        "pourcentage": 100,
      }
    }
  }
};

// Générer la distribution simple pour les formats à partir de formats_types
const formatDistrib = {};
Object.entries(formats_types).forEach(([format, obj]) => {
  formatDistrib[format] = obj.pourcentage;
});


const matieres_fibres = {
  "100% coton": {
    "pourcentage": 27.6,
    "fibres": { 
      "coton": {
      "pourcentage": 100
      }
    }
  },
  "100% polyester": {
    "pourcentage": 11.0,
      "fibres": { 
        "polyester": {
          "pourcentage": 100
      }
    }
  },
  "coton/polyester": {
    "pourcentage": 8.8,
    "fibres": { 
      "coton": {
        "pourcentage": 57
      },
      "polyester": {
        "pourcentage": 43
      }
    }
  },
  "coton/élasthanne": {
    "pourcentage": 4.9,
    "fibres": { 
      "coton": {
        "pourcentage": 96
      },
      "élasthanne": {
        "pourcentage": 4
      }
    }
  },
  "laine/acrylique": {
    "pourcentage": 3.1,
    "fibres": { 
      "laine": {
        "pourcentage": 38
      },
      "acrylique": {
        "pourcentage": 62
      }
    }
  },
  "coton/acrylique": {
    "pourcentage": 2.3,
    "fibres": { 
      "coton": {
        "pourcentage": 45
      },
      "acrylique": {
        "pourcentage": 55
      }
    }
  },
  "coton/polyester/élasthanne": {
    "pourcentage": 1.7,
    "fibres": { 
      "coton": {
        "pourcentage": 71
      },
      "polyester": {
        "pourcentage": 26
      },
      "élasthanne": {
        "pourcentage": 3
      }
    }
  },
  "coton/viscose": {
    "pourcentage": 1.3,
    "fibres": { 
      "coton": {
        "pourcentage": 55
      },
      "viscose": {
        "pourcentage": 45
      }
    }
  },
  "polyester/élasthanne": {
    "pourcentage": 1.3,
    "fibres": { "polyester": {
        "pourcentage": 93
      },
      "élasthanne": {
        "pourcentage": 7
      }
    }
  },
  "laine/polyamide": {
    "pourcentage": 1.3,
    "fibres": { "laine": {
        "pourcentage": 65
      },
      "polyamide": {
        "pourcentage": 35
      }
    }
  },
  "viscose/élasthanne": {
    "pourcentage": 1.2,
    "fibres": { "viscose": {
        "pourcentage": 93
      },
      "élasthanne": {
        "pourcentage": 7
      }
    }
  },
  "viscose/polyamide": {
    "pourcentage": 1.2,
    "fibres": { "viscose": {
        "pourcentage": 70
      },
      "polyamide": {
        "pourcentage": 30
      }
    }
  },
  "coton/polyamide": {
    "pourcentage": 1.1,
    "fibres": { "coton": {
        "pourcentage": 69
      },
      "polyamide": {
        "pourcentage": 31
      }
    }
  },
  "polyester/viscose": {
    "pourcentage": 1.0,
    "fibres": { "polyester": {
        "pourcentage": 44
      },
      "viscose": {
        "pourcentage": 56
      }
    }
  },
  "polyester/viscose/élasthanne": {
    "pourcentage": 0.9,
    "fibres": { "polyester": {
        "pourcentage": 59
      },
      "viscose": {
        "pourcentage": 37
      },
      "élasthanne": {
        "pourcentage": 4
      }
    }
  },
  "polyester/laine": {
    "pourcentage": 0.7,
    "fibres": { "polyester": {
        "pourcentage": 58
      },
      "laine": {
        "pourcentage": 42
      }
    }
  },
  "polyester/acrylique": {
    "pourcentage": 0.7,
    "fibres": { "polyester": {
        "pourcentage": 45
      },
      "acrylique": {
        "pourcentage": 55
      }
    }
  },
  "acrylique/polyamide": {
    "pourcentage": 0.6,
    "fibres": { "acrylique": {
        "pourcentage": 68
      },
      "polyamide": {
        "pourcentage": 32
      }
    }
  },
  "coton/polyamide/élasthanne": {
    "pourcentage": 0.6,
    "fibres": { "coton": {
        "pourcentage": 72
      },
      "polyamide": {
        "pourcentage": 24
      },
      "élasthanne": {
        "pourcentage": 4
      }
    }
  },
  "polyamide/élasthanne": {
    "pourcentage": 0.6,
    "fibres": { "polyamide": {
        "pourcentage": 86
      },
      "élasthanne": {
        "pourcentage": 14
      }
    }
  },
  "coton/laine": {
    "pourcentage": 0.5,
    "fibres": { "coton": {
        "pourcentage": 57
      },
      "laine": {
        "pourcentage": 43
      }
    }
  },
  "laine/acrylique/polyamide": {
    "pourcentage": 0.4,
    "fibres": { "laine": {
        "pourcentage": 27
      },
      "acrylique": {
        "pourcentage": 52
      },
      "polyamide": {
        "pourcentage": 21
      }
    }
  },
  "polyester/polyamide": {
    "pourcentage": 0.3,
    "fibres": { "polyester": {
        "pourcentage": 60
      },
      "polyamide": {
        "pourcentage": 40
      }
    }
  },
  "coton/autre": {
    "pourcentage": 0.4,
    "fibres": { "coton": {
        "pourcentage": 60
      },
      "autre": {
        "pourcentage": 40
      }
    }
  },
  "viscose/polyamide/élasthanne": {
    "pourcentage": 0.3,
    "fibres": { 
      "viscose": {
        "pourcentage": 74
      },
      "polyamide": {
        "pourcentage": 21
      },
      "élasthanne": {
        "pourcentage": 5
      }
    }
  },
  "100% acrylique": {
    "pourcentage": 6.9, 
    "fibres": { "acrylique": {
        "pourcentage": 100
      }
    }
  },
  "inconnu": { 
    "pourcentage": 8.5, 
    "fibres": { "autre": {
        "pourcentage": 100
      }
    }
  },
  "100% laine": {
    "pourcentage": 1.9,
    "fibres": { "laine": {
        "pourcentage": 100
      }
    }
  },
  "100% viscose": {
    "pourcentage": 1.4, 
    "fibres": { "viscose": {
        "pourcentage": 100
      }
    }
  },
  "100% polyamide": {
    "pourcentage": 1.3, 
    "fibres": { "polyamide": {
        "pourcentage": 100
      }
    }
  },
  "mélange 4 matières": {
     "pourcentage": 1.3, 
     "fibres": { "autre": {
        "pourcentage": 100
      }
    }
  },
  "autres compositions": {
    "pourcentage": 4.8, 
    "fibres": { "autre": {
        "pourcentage": 100
      }
    }
  },
  "100% autre": {
    "pourcentage": 0.4, 
    "fibres": { "autre": {
        "pourcentage": 100
      }
    }
  },
  "100% soie": {
    "pourcentage": 0.3, 
    "fibres": { "soie": {
        "pourcentage": 100
      }
    }
  }
};

// Vérification de la somme des pourcentages top-level des matières
let totalPourcentage = 0;
Object.values(matieres_fibres).forEach(obj => {
  totalPourcentage += obj.pourcentage;
});

// Distribution de la qualité

const qualiteDistrib = {
    "neuf étiqueté": {
        "pourcentage": 5
    },
    "parfait état": {
        "pourcentage": 15
    },
    "bon état": {
        "pourcentage": 15
    },
    "usé": {
        "pourcentage": 25
    },
    "abîmé": {
        "pourcentage": 32
    },
    "inutilisable": {
        "pourcentage": 8
    }
};

// Distribution de la propreté

const propreteDistrib = {
    "propre": {
        "pourcentage": 45
    },
    "légèrement souillé": {
        "pourcentage": 40
    },
    "fortement souillé": {
        "pourcentage": 10
    },
    "contaminé": {
        "pourcentage": 5
    }
}; 

// Liste des distributions par type 

const repartitionParType = {
// Pantalon en jean 
  "pantalons en jean": {
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
      { "nom": "inconnu", "pourcentage": 0.5 },
      { "nom": "autres compositions", "pourcentage": 8.8 }
    ],
    "couleurs": [
      { "nom": "bleu", "pourcentage": 68 },
      { "nom": "noir", "pourcentage": 14 },
      { "nom": "gris", "pourcentage": 10 },
      { "nom": "vert", "pourcentage": 2 },
      { "nom": "autres", "pourcentage": 6 }
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 100 }
    ]
  },
  // Autre linge de maison
  "autre linge de maison": {
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
      { "nom": "inconnu", "pourcentage": 5.1 },
      { "nom": "autres compositions", "pourcentage": 4.4 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche sans perturbateur", "pourcentage": 72 },
      { "nom": "monocouche avec perturbateur", "pourcentage": 28 }
    ]
  },
  // Autres pantalons, shorts et jupes
  "autres pantalons, shorts et jupes": {
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
      { "nom": "inconnu", "pourcentage": 9.8 },
      { "nom": "autres compositions", "pourcentage": 17.0 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 92 },
      { "nom": "multicouche", "pourcentage": 4 },
      { "nom": "monocouche sans perturbateur", "pourcentage": 4 }
    ]
  },
  "hauts type chemise": {
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
      { "nom": "inconnu", "pourcentage": 2.6 },
      { "nom": "autres compositions", "pourcentage": 7.4 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 98 },
      { "nom": "monocouche sans perturbateur", "pourcentage": 2 }
    ]
  },
  "hauts type pull": {
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
      { "nom": "inconnu", "pourcentage": 11.3 },
      { "nom": "autres compositions", "pourcentage": 20.4 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 71 },
      { "nom": "monocouche sans perturbateur", "pourcentage": 29 }
    ]
  },
  "hauts type t-shirt": {
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
      { "nom": "inconnu", "pourcentage": 3.7 },
      { "nom": "autres compositions", "pourcentage": 8.6 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 73 },
      { "nom": "monocouche sans perturbateur", "pourcentage": 27 }
    ]
  },
  "linge de bain / toilette": {
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
      { "nom": "inconnu", "pourcentage": 1.4 },
      { "nom": "autres compositions", "pourcentage": 0.3 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 45 },
      { "nom": "monocouche sans perturbateur", "pourcentage": 55 }
    ]
  },
  "linge de lit": {
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
      { "nom": "inconnu", "pourcentage": 4.8 },
      { "nom": "autres compositions", "pourcentage": 4.4 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 41 },
      { "nom": "monocouche sans perturbateur", "pourcentage": 58 },
      { "nom": "multicouche", "pourcentage": 1 }
    ]
  },
  "lingerie": {
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
      { "nom": "inconnu", "pourcentage": 5.7 },
      { "nom": "autres compositions", "pourcentage": 9.4 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 96 },
      { "nom": "monocouche sans perturbateur", "pourcentage": 2 },
      { "nom": "multicouche", "pourcentage": 2 }
    ]
  },
  "pyjama et ensembles de sport": {
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
      { "nom": "inconnu", "pourcentage": 7 },
      { "nom": "autres compositions", "pourcentage": 5.6 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 88 },
      { "nom": "monocouche sans perturbateur", "pourcentage": 12 }
    ]
  },
  "rideaux et voilages": {
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
      { "nom": "inconnu", "pourcentage": 5.4 },
      { "nom": "autres compositions", "pourcentage": 2.0 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 84 },
      { "nom": "monocouche sans perturbateur", "pourcentage": 10 },
      { "nom": "multicouche", "pourcentage": 6 }
    ]
  },
  "robes": {
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
      { "nom": "inconnu", "pourcentage": 7.4 },
      { "nom": "autres compositions", "pourcentage": 28.5 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 71 },
      { "nom": "monocouche sans perturbateur", "pourcentage": 24 },
      { "nom": "multicouche", "pourcentage": 5 }
    ]
  },
  "sous-vêtements": {
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
      { "nom": "inconnu", "pourcentage": 15.1 },
      { "nom": "autres compositions", "pourcentage": 18.3 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 63 },
      { "nom": "monocouche sans perturbateur", "pourcentage": 37 }
    ]
  },
  "vestes, manteaux et costumes": {
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
      { "nom": "inconnu", "pourcentage": 9.0 },
      { "nom": "autres compositions", "pourcentage": 18.3 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 41 },
      { "nom": "monocouche sans perturbateur", "pourcentage": 2 },
      { "nom": "multicouche", "pourcentage": 57 }
    ]
  },
  "vêtements bébé": {
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
      { "nom": "inconnu", "pourcentage": 4.2 },
      { "nom": "autres compositions", "pourcentage": 8.5 }
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
    ],
    "perturbateurs": [
      { "nom": "monocouche avec perturbateur", "pourcentage": 89 },
      { "nom": "monocouche sans perturbateur", "pourcentage": 7 },
      { "nom": "multicouche", "pourcentage": 4 }
    ]
  }
}

// Génération de l'objet lotType au chargement
const total = 1000;
lotType = {
  total,
  format: {},
  qualite: qualiteDistrib,
  proprete: Object.fromEntries(
    Object.entries(propreteDistrib).map(([k, v]) => [k, { pourcentage: v }])
  )
};

console.log('lotType :', lotType);

Object.entries(formats_types).forEach(([format, formatObj]) => {
  lotType.formats[format] = {
    pourcentage: formatObj.pourcentage,
    types: {}
  };
  Object.entries(formatObj.types).forEach(([type, typePct]) => {
    const repType = repartitionParType[type] || {};
    // Matières
    const matieres = {};
    const matieresSource = (repType.matieres && repType.matieres.length)
      ? repType.matieres
      : [{ nom: 'inconnu', pourcentage: 100 }];
    matieresSource.forEach(m => {
      const matiereFibres = matieres_fibres[m.nom] || {};
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
      pourcentage: typePct,
      matieres,
      couleurs,
      perturbateurs: repType.perturbateurs || []
    };
  });
});

console.log('lotType généré :', lotType);








