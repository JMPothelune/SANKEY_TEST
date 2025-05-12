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

### Principe général du parsing (logique actuelle)

- **Chaque transformation** du tableau `transformations` découpe sa part dans le lot initial (toutes dimensions confondues).
- **Tous les paths partent du lot initial** : chaque sélection crée un nœud et un lien depuis le lot initial.
- **Le "reste"** est ce qui n'a pas été sélectionné dans aucune transformation (toutes dimensions confondues), et il est ajouté à la fin comme un nœud supplémentaire.
- **Aucune logique séquentielle ni croisée** : chaque sélection est indépendante, il n'y a pas d'enchaînement ni d'intersection entre les sélections.
- **Les sous-scenarios (`scenario`) et les `coproduct_transformations` ne sont pas encore gérés** dans le parsing actuel.

#### Exemple de scénario
```js
const scenario = {
  transformations: [
    {
      type: 'selectFirstLevel',
      dimension: 'format',
      keys: ['Chaussures et bottes'],
      scenario: {}
    },
    {
      type: 'selectFirstLevel',
      dimension: 'matiere',
      keys: ['100% coton'],
      scenario: {}
    }
  ],
  coproduct_transformations: []
};
```

#### Résultat attendu dans le Sankey
- 1 nœud "Lot initial" à gauche
- 1 path pour la sélection "format: Chaussures et bottes"
- 1 path pour la sélection "matiere: 100% coton"
- 1 path "Reste" pour tout ce qui n'a pas été sélectionné

#### Différence avec un parsing séquentiel ou croisé
- **Séquentiel** : chaque transformation s'applique sur le reste du lot précédent (ce n'est PAS le cas ici)
- **Croisé** : chaque path correspond à une combinaison de sélections sur plusieurs dimensions (ce n'est PAS le cas ici)
- **Ici** : chaque sélection découpe sa part dans le lot initial, indépendamment des autres, puis le reste est ajouté à la fin.

### Principe
Le Sankey peut être généré dynamiquement à partir d'un lot de départ (distribution initiale sur 1000 kg) et d'un **scénario** arborescent de transformations. Chaque transformation modifie la répartition d'une dimension (format, matière, couleur, qualité, etc.) et génère un ou plusieurs nouveaux lots. Le Sankey affiche tous les lots intermédiaires, chaque transformation créant un nouveau nœud et un lien dans le diagramme.

### Nouvelle structure du scénario

Un scénario est un objet avec deux propriétés :
- `transformations` : tableau de transformations principales (sélections)
- `coproduct_transformations` : tableau de transformations appliquées au "reste" (coproduit)

Chaque transformation est un objet :
- `transform` : { type, dimension, keys } (type = "select", dimension = nom de la dimension, keys = valeurs sélectionnées)
- `scenario` : (optionnel) sous-scénario imbriqué, même structure (objet avec transformations/coproduct_transformations)

#### Exemple minimal (vide)
```js
const scenario = {
  transformations: [],
  coproduct_transformations: []
};
```

#### Exemple imbriqué
```js
const scenario = {
  transformations: [
    {
      transform: {
        type: "select",
        dimension: "format",
        keys: ["Chaussures et bottes"]
      },
      scenario: {
        transformations: [
          {
            transform: {
              type: "select",
              dimension: "matiere",
              keys: ["100% coton"]
            },
            scenario: {
              transformations: [],
              coproduct_transformations: []
            }
          }
        ],
        coproduct_transformations: []
      }
    }
  ],
  coproduct_transformations: [
    // transformations à appliquer au reste du lot initial
  ]
};
```

- À chaque niveau, tu peux imbriquer autant de sous-scénarios que tu veux.
- Les transformations du "reste" (coproduit) sont toujours dans le champ `coproduct_transformations`.
- Cette structure permet de représenter n'importe quel arbre de transformations, avec une logique homogène et facile à parser.

### Parsing
Le parsing du scénario se fait récursivement : à chaque niveau, on applique toutes les transformations principales, puis toutes les transformations du coproduit (reste), en descendant dans les sous-scénarios si présents.

## Génération dynamique de l'objet `lotType`

Au chargement de la page, un objet `lotType` est généré automatiquement à partir des constantes `formats_types`, `repartitionParType` et `matieres_fibres`.

Cet objet permet d'obtenir une structure hiérarchique complète : format > type > matière > fibres, avec la répartition des couleurs et la qualité.

### Exemple de structure générée

```js
{
  total: 1000,
  format: {
    "Vêtements": {
      pourcentage: 60,
      types: {
        "T-shirt": {
          pourcentage: 40,
          matieres: {
            "Coton": {
              pourcentage: 80,
              fibres: { /* ... */ }
            },
            // ...
          },
          couleurs: {
            "Bleu": { pourcentage: 50 },
            // ...
          }
        },
        // ...
      }
    },
    // ...
  },
  qualite: {
    "Neuf étiqueté": 5,
    "Parfait état": 15,
    "Bon état": 15,
    "Usé": 25,
    "Abîmé": 32,
    "Inutilisable": 8
  }
}
```

- Le champ `total` correspond à la masse totale de référence (exemple : 1000).
- Le champ `format` contient tous les formats, chacun avec ses types, matières, fibres et couleurs.
- Le champ `qualite` reprend la distribution qualité.

---

## Utilisation

- Toutes les données sont générées automatiquement à partir des fichiers de données (`data.js`).
- Pour voir la structure générée, ouvrez la console du navigateur : un log `lotType généré : ...` s'affiche au chargement de la page.

---

Pour toute question ou adaptation de la structure, contactez le développeur du projet.
