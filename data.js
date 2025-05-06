const matieres = [
    { nom: "100% coton", pct: 27.6 },
    { nom: "100% polyester", pct: 11.0 },
    { nom: "coton/polyester", pct: 8.8 },
    { nom: "100% inconnu", pct: 8.5 },
    { nom: "100% acrylique", pct: 6.9 },
    { nom: "coton/élasthanne", pct: 4.9 },
    { nom: "autres compositions", pct: 4.8 },
    { nom: "laine/acrylique", pct: 3.1 },
    { nom: "100% laine", pct: 1.9 },
    { nom: "coton/acrylique", pct: 2.3 },
    { nom: "coton/polyester/élasthanne", pct: 1.7 },
    { nom: "100% viscose", pct: 1.4 },
    { nom: "100% polyamide", pct: 1.3 },
    { nom: "mélange 4 matières", pct: 1.3 },
    { nom: "coton/viscose", pct: 1.3 },
    { nom: "polyester/élasthanne", pct: 1.3 },
    { nom: "laine/polyamide", pct: 1.3 },
    { nom: "viscose/élasthanne", pct: 1.2 },
    { nom: "viscose/polyamide", pct: 1.2 },
    { nom: "coton/polyamide", pct: 1.1 },
    { nom: "polyester/viscose", pct: 1.0 },
    { nom: "polyester/viscose/élasthanne", pct: 0.9 },
    { nom: "polyester/laine", pct: 0.7 },
    { nom: "polyester/acrylique", pct: 0.7 },
    { nom: "acrylique/polyamide", pct: 0.6 },
    { nom: "coton/polyamide/élasthanne", pct: 0.6 },
    { nom: "polyamide/élasthanne", pct: 0.6 },
    { nom: "coton/laine", pct: 0.5 },
    { nom: "laine/acrylique/polyamide", pct: 0.4 },
    { nom: "100% autre", pct: 0.4 },
    { nom: "polyester/polyamide", pct: 0.3 },
    { nom: "100% soie", pct: 0.3 }
];

const formatDistrib = {
    "Vêtements": 724,
    "Linges et rideaux": 90,
    "Chaussures et bottes": 94,
    "non TLC": 92
};

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

// Générer l'objet matière pour chaque lien
function getMatiereObj() {
    const obj = {};
    matieres.forEach(m => {
        obj[m.nom] = Math.round(m.pct * 10) / 10; // pourcentage sur 1000kg
    });
    return obj;
}

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
            "values": matieres.map(m => m.nom)
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