# Visualisation Sankey - Valorisation des Matières Textiles

## Description
Ce projet est un prototype de visualisation interactive de type Sankey pour suivre le flux de valorisation des matières textiles. Il permet de visualiser les différents parcours de valorisation d'un lot de textile, avec la possibilité de voir différentes dimensions (matière, format, couleur) à travers les étapes de traitement.

## Structure Technique

### Technologies Utilisées
- HTML5
- CSS3
- JavaScript (Vanilla)
- D3.js (pour la visualisation Sankey)

### Architecture
Le projet est conçu pour être léger et facilement intégrable dans d'autres applications (notamment Bubble). Il se compose de :
- Un fichier HTML principal
- Un fichier CSS pour le style
- Un fichier JavaScript pour la logique
- Un fichier JSON pour les données

### Structure des Données
Le format JSON suit cette structure :
```json
{
  "nodes": [
    {
      "id": "string",
      "name": "string",
      "type": "string" // étape ou dimension
    }
  ],
  "links": [
    {
      "source": "string", // id du nœud source
      "target": "string", // id du nœud cible
      "value": number,    // valeur en kg
      "percentage": number // pourcentage
    }
  ],
  "dimensions": {
    "matiere": {
      "name": "Matière",
      "values": ["coton", "polyester", ...]
    },
    "format": {
      "name": "Format",
      "values": ["vêtements", "chutes", ...]
    },
    "couleur": {
      "name": "Couleur",
      "values": ["bleu", "rouge", ...]
    }
  }
}
```

### Fonctionnalités
1. **Visualisation Sankey Horizontale**
   - Représentation des flux de matière entre les différentes étapes
   - Adaptation responsive à la taille du conteneur

2. **Dimensions Multiples**
   - Possibilité de basculer entre différentes dimensions (matière, format, couleur)
   - Chaque dimension est représentée comme une stackbar dans les nœuds

3. **Interactivité**
   - Clic sur les éléments pour afficher :
     - Pourcentage de valorisation
     - Quantité en kg
   - Tooltips informatifs

4. **Responsive Design**
   - Adaptation automatique à la taille du conteneur
   - Optimisé pour l'intégration dans Bubble

## Intégration
Le diagramme est conçu pour être facilement intégrable dans d'autres applications, notamment Bubble. Il suffit d'inclure les fichiers nécessaires et d'initialiser le diagramme avec les données appropriées.

## Développement
Pour modifier ou étendre le projet :
1. Modifier le fichier JSON pour mettre à jour les données
2. Ajuster le CSS pour personnaliser l'apparence
3. Modifier le JavaScript pour ajouter de nouvelles fonctionnalités

## Limitations Actuelles
- Version prototype avec fonctionnalités de base
- Optimisé pour les petits à moyens volumes de données
- Nécessite une structure de données spécifique 

## Système de transformations dynamiques (scénario Sankey)

### Principe
Le Sankey peut être généré dynamiquement à partir d'un lot de départ (distribution initiale sur 1000 kg) et d'une suite de transformations appliquées à ce lot. Chaque transformation modifie la répartition d'une dimension (format, matière, couleur, qualité, etc.) et génère un nouveau lot. Le Sankey affiche tous les lots intermédiaires, chaque transformation créant un nouveau nœud et un lien dans le diagramme.

### Structure d'un lot
Un lot est un objet contenant la répartition de chaque dimension sur un volume total :
```js
const lot = {
  total: 1000,
  format: { "Vêtements": 724, "Chaussures et bottes": 94, ... },
  matiere: { ... },
  couleur: { ... },
  qualite: { ... }
};
```

### Transformations
- **Une transformation ne modifie qu'une seule dimension à la fois.**
- Après chaque transformation, les pourcentages de la dimension concernée sont recalculés pour que la somme fasse 100%.
- Les sous-dimensions (ex : fibres dans matière) ne sont pas recalculées automatiquement pour l'instant.
- Exemple de transformation de base : `selectFirstLevel(lot, dimension, selectedKeys)`
  - Garde uniquement les valeurs sélectionnées dans la dimension, recalcule les pourcentages et le total du lot.

### Scénario/arbre de transformations
- Un scénario est une suite (ou un arbre) de transformations appliquées à un lot.
- Chaque transformation est définie par :
  - un identifiant unique (`id`)
  - le parent (`from`) : l'id du lot d'origine (ou `null` pour le lot initial)
  - la transformation à appliquer (`transform`)
- Exemple de scénario (arbre à 2 branches par nœud) :
```js
const scenario = [
  { id: '1', from: null, transform: { type: 'selectFirstLevel', dimension: 'format', keys: ['Vêtements'] } },
  { id: '2', from: null, transform: { type: 'selectFirstLevel', dimension: 'format', keys: ['Chaussures et bottes'] } },
  { id: '3', from: '1', transform: { type: 'selectFirstLevel', dimension: 'qualite', keys: ['Bon état (usure légère)', 'Usé (usure moyenne)'] } },
  // etc.
];
```
- Le Sankey généré affichera tous les lots intermédiaires (chaque étape comme un nœud), et les liens représenteront les transformations.

### Extension future
- Possibilité d'ajouter d'autres types de transformations (filtrage par seuil, fusion de catégories, etc.).
- Possibilité d'avoir plus de 2 branches à chaque nœud.
- Possibilité de recalculer les sous-dimensions si besoin.
