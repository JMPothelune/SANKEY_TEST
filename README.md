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
