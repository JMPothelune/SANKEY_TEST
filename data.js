const couleurDistrib = {
    "Noir": 170,
    "Blanc": 160,
    "Bleu": 150,
    "Gris": 120,
    "Marron": 70,
    "Rouge": 50,
    "Vert": 40,
    "Violet": 30,
    "Orange": 15,
    "Jaune": 15,
    "Inconnu": 20,
    "Multicolore": 160
};

const formats_types = {
  "Vêtements": {
    "pourcentage": 72.4,
    "types": {
      "Autres pantalons etc.": 16,
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
  formatDistrib[format] = Math.round(obj.pourcentage * 10) / 10;
});

// Générer l'objet matière pour chaque lien à partir de matieres_fibres
function getMatiereObj() {
    const obj = {};
    Object.entries(matieres_fibres).forEach(([nom, data]) => {
        obj[nom] = Math.round(data.pourcentage * 10) / 10;
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
  "100% acrylique": { "pourcentage": 6.9, "fibres": { "Acrylique": 100 } },
  "100% inconnu": { "pourcentage": 8.5, "fibres": { "Autre": 100 } },
  "100% laine": { "pourcentage": 1.9, "fibres": { "Laine": 100 } },
  "100% viscose": { "pourcentage": 1.4, "fibres": { "Viscose": 100 } },
  "100% polyamide": { "pourcentage": 1.3, "fibres": { "Polyamide": 100 } },
  "mélange 4 matières": { "pourcentage": 1.3, "fibres": { "Autre": 100 } },
  "autres compositions": { "pourcentage": 4.8, "fibres": { "Autre": 100 } },
  "100% autre": { "pourcentage": 0.4, "fibres": { "Autre": 100 } },
  "100% soie": { "pourcentage": 0.3, "fibres": { "Soie": 100 } },
};

// Vérification de la somme des pourcentages top-level des matières
let totalPourcentage = 0;
Object.values(matieres_fibres).forEach(obj => {
  totalPourcentage += obj.pourcentage;
});
console.log("Somme des pourcentages top-level des matières :", totalPourcentage);

const data = {
    "nodes": [
        { "id": "collecte", "name": "Collecte", "type": "etape" },
        { "id": "craquage", "name": "Craquage", "type": "etape" },
        { "id": "pretri", "name": "Pré-tri", "type": "etape" },
        { "id": "tri_creme", "name": "Tri Crème", "type": "etape" },
        { "id": "tri_matiere", "name": "Tri Matière", "type": "etape" },
        { "id": "dechets", "name": "Déchets", "type": "etape" }
    ],
    "links": [
        // Collecte vers Craquage et Pré-tri
        {
            "source": "collecte",
            "target": "craquage",
            "value": 600,
            "percentage": 60,
            "dimensions": {
                "matiere": getMatiereObj(),
                "format": formatDistrib,
                "couleur": couleurDistrib
            }
        },
        {
            "source": "collecte",
            "target": "pretri",
            "value": 400,
            "percentage": 40,
            "dimensions": {
                "matiere": getMatiereObj(),
                "format": formatDistrib,
                "couleur": couleurDistrib
            }
        },
        // Craquage vers Tri Crème et Tri Matière
        {
            "source": "craquage",
            "target": "tri_creme",
            "value": 300,
            "percentage": 50,
            "dimensions": {
                "matiere": getMatiereObj(),
                "format": formatDistrib,
                "couleur": couleurDistrib
            }
        },
        {
            "source": "craquage",
            "target": "tri_matiere",
            "value": 200,
            "percentage": 33.3,
            "dimensions": {
                "matiere": getMatiereObj(),
                "format": formatDistrib,
                "couleur": couleurDistrib
            }
        },
        {
            "source": "craquage",
            "target": "dechets",
            "value": 100,
            "percentage": 16.7,
            "dimensions": {
                "matiere": getMatiereObj(),
                "format": formatDistrib,
                "couleur": couleurDistrib
            }
        },
        // Pré-tri vers Tri Crème et Déchets
        {
            "source": "pretri",
            "target": "tri_creme",
            "value": 200,
            "percentage": 50,
            "dimensions": {
                "matiere": getMatiereObj(),
                "format": formatDistrib,
                "couleur": couleurDistrib
            }
        },
        {
            "source": "pretri",
            "target": "dechets",
            "value": 200,
            "percentage": 50,
            "dimensions": {
                "matiere": getMatiereObj(),
                "format": formatDistrib,
                "couleur": couleurDistrib
            }
        }
    ],
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
        }
    }
}; 