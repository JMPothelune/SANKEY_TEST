# Visualisation Sankey - Valorisation des Matières Textiles

## Description
Ce projet est un prototype de visualisation interactive de type Sankey pour suivre le flux de valorisation des matières textiles. Il permet de visualiser les différents parcours de valorisation d'un lot de textile, avec la possibilité de voir différentes dimensions (matière, format, couleur, qualité, fibres) à travers les étapes de traitement.

## Fonctionnalités Principales

### Visualisation et Navigation
- **Diagramme Sankey horizontal** : Visualisation interactive des flux de valorisation
- **Dimensions multiples** : Affichage dynamique des différentes dimensions (format, type, matière, fibres, couleur, qualité, propreté)
- **Stackbars colorées** : Représentation visuelle de la répartition des dimensions avec des palettes de couleurs harmonieuses
- **Tooltips informatifs** : Affichage détaillé des informations au survol des éléments

### Gestion des Lots
- **Structure hiérarchique** : Organisation des données en format > type > matière > fibres
- **Calculs dynamiques** : Génération automatique des pourcentages et des masses
- **Validation des destinations** : Indication visuelle des lots valorisés avec leur destination finale

### Système de Transformation
- **Scénario dynamique** : Structure flexible permettant des transformations imbriquées
- **Filtres avancés** : Sélection par format, type, matière, couleur, qualité, propreté et fibres
- **Seuils de fibres** : Filtrage précis des matières selon leur composition en fibres

## Utilisation

### Structure du Scénario
Le scénario est défini comme un objet avec deux propriétés principales :
```js
const scenario = {
  transformations: [
    {
      type: 'selectByFormat', // ou autre type de sélection
      keys: ['vêtements'],    // valeurs à sélectionner
      scenario: {            // sous-scénario optionnel
        target: 'CT2',       // destination finale
        transformations: []  // transformations supplémentaires
      }
    }
  ],
  coproduct_scenario: {} // transformations pour le reste
};
```

### Types de Sélection Disponibles
1. **Sélections de base**
   - `selectByFormat` : Sélection par format (vêtements, chaussures, etc.)
   - `selectByType` : Sélection par type (après format)
   - `selectByMatiere` : Sélection par matière (après format et type)
   - `selectByCouleur` : Sélection par couleur
   - `selectByQualite` : Sélection par qualité
   - `selectByProprete` : Sélection par propreté

2. **Sélection avancée par fibres**
   ```js
   {
     type: 'selectByFibre',
     keys: ['coton'],
     threshold: 60,        // optionnel
     condition: 'over',    // optionnel
     scenario: { /* ... */ }
   }
   ```

### Validation des Destinations
- Chaque lot peut avoir une destination finale (`target`)
- Les lots validés sont marqués d'une icône de validation
- Le tooltip affiche :
  - La destination du lot
  - Le poids du lot
  - Le total des lots ayant la même destination

## Intégration Technique

### Structure des Fichiers
- `index.html` : Structure de base
- `styles.css` : Styles et apparence
- `data.js` : Données et constantes
- `scenario.js` : Logique de transformation
- `sankey.js` : Visualisation et interaction

### Dépendances
- D3.js v7
- d3-sankey v0.12.3

## Développement

### Ajout de Nouvelles Dimensions
1. Ajouter la dimension dans les constantes de données
2. Créer une fonction de sélection correspondante
3. Ajouter la palette de couleurs appropriée
4. Mettre à jour le sélecteur de dimensions

### Modification de la Structure
- Adapter le générateur de `lotType` dans `data.js`
- Maintenir la cohérence des clés entre le scénario et les données
- Utiliser la génération dynamique des listes de valeurs

## Limitations
- Optimisé pour les petits à moyens volumes de données
- Nécessite une structure de données hiérarchique cohérente
- Les clés doivent correspondre exactement (casse, accents, espaces)

## Nouveautés et évolutions récentes (2025)

### Palette et affichage des couleurs
- **Palettes dynamiques** : Les palettes de couleurs sont générées dynamiquement pour chaque dimension (matière, format, type, couleur, qualité) à partir des vraies données présentes dans le lot.
- **Couleurs des matières robustes** : Les couleurs des matières sont désormais alignées sur les matières réellement présentes dans les données (plus de stackbars grises ou de matières manquantes).
- **Stackbars visuelles** : Les stackbars sont colorées avec opacité, contour et border-radius. Un fond hachuré s'affiche si la dimension est vide.

### Stackbars et gestion des dimensions
- **Affichage robuste** : Les stackbars affichent la répartition de la dimension sélectionnée (format, type, matière, fibres, couleur, qualité) et ignorent les clés techniques (`_missing`).
- **Gestion des cas particuliers** : Les stackbars restent robustes même si certaines branches sont vides ou incomplètes.

### Tooltips
- **Détail dynamique** : Les tooltips affichent le détail de la dimension courante pour chaque path, calculé dynamiquement à partir du lot cible.
- **Pourcentages et poids** : Les valeurs sont toujours normalisées et cohérentes avec la structure réelle du lot.

### Icônes d'action
- **Ajout de transformation** : Une icône "+" s'affiche sur chaque nœud feuille et sur le carré du dernier path "Reste", avec un tooltip "Ajouter une transformation".

### Affichage des titres
- **Nom du lot au-dessus du nœud** : Le nom du lot (ex : "Lot initial", "Reste", etc.) est affiché au-dessus de chaque nœud, centré sur la stackbar.

### Suppression de l'objet `data`
- **Plus de dépendance statique** : L'objet `data` n'est plus utilisé. Toutes les listes de valeurs sont générées dynamiquement à partir des vraies données (`lotType`, `matieres_fibres`, etc.).
- **Synchronisation automatique** : Plus aucune dépendance à un objet statique pour les dimensions : tout est synchronisé avec les données affichées.

### Robustesse et nettoyage
- **Nettoyage du code** : Suppression de tout code mort, debug ou variables inutilisées.
- **Synchronisation palettes/données** : Les palettes et les mappings sont toujours synchronisés avec les données affichées.

### Scénario dynamique
- **Scénario imbriqué** : Le scénario de transformations est totalement dynamique et peut être imbriqué à volonté.
- **Correspondance stricte des clés** : Les clés du scénario doivent être en accord exact (casse, accents, espaces) avec les clés des données.

### Instructions pour modification
- **Ajout de dimension ou palette** : Pour ajouter une nouvelle dimension ou palette, il suffit d'ajouter une entrée dans la section correspondante du code JS.
- **Modification de la structure des lots** : Adapter le générateur de `lotType` dans `data.js` pour toute évolution de la structure.

### Filtrage avancé par fibre (`selectByFibre`)

Vous pouvez désormais filtrer les matières selon la proportion d'une ou plusieurs fibres, grâce à deux nouveaux paramètres optionnels :  
- `threshold` : valeur seuil (entre 0 et 100)
- `condition` : "over" (plus que) ou "under" (moins que)

**Exemples d'utilisation dans le scénario :**

#### Cas simple (présence d'une fibre, comportement historique)
```js
{
  type: 'selectByFibre',
  keys: ['coton', 'polyester'],
  scenario: { /* ... */ }
}
```
→ Sélectionne toutes les matières contenant au moins une des fibres listées, quel que soit le pourcentage.

#### Cas avancé (avec seuil et condition)
```js
{
  type: 'selectByFibre',
  keys: ['coton'],
  threshold: 60,
  condition: 'over',
  scenario: { /* ... */ }
}
```
→ Sélectionne uniquement les matières contenant **au moins 60% de coton**.

```js
{
  type: 'selectByFibre',
  keys: ['polyester'],
  threshold: 20,
  condition: 'under',
  scenario: { /* ... */ }
}
```
→ Sélectionne uniquement les matières contenant **moins de 20% de polyester**.

#### Plusieurs fibres avec seuil
```js
{
  type: 'selectByFibre',
  keys: ['coton', 'polyester'],
  threshold: 30,
  condition: 'over',
  scenario: { /* ... */ }
}
```
→ Sélectionne toutes les matières contenant **au moins 30% de coton ou de polyester**.

**Remarques :**
- Si `threshold` et `condition` ne sont pas fournis, le comportement par défaut (présence de la fibre) est conservé.
- Vous pouvez passer une ou plusieurs fibres dans `keys`.

### Sélections classiques (format, type, matière, couleur, qualité)

Pour filtrer sur une dimension précise, utilisez les types de transformation suivants dans votre scénario :

- `selectByFormat` : sélectionne un ou plusieurs formats
- `selectByType` : sélectionne un ou plusieurs types (nécessite d'avoir déjà sélectionné un format)
- `selectByMatiere` : sélectionne une ou plusieurs matières (nécessite d'avoir déjà sélectionné un format et un type)
- `selectByCouleur` : sélectionne une ou plusieurs couleurs
- `selectByQualite` : sélectionne une ou plusieurs qualités

**Exemples d'utilisation dans le scénario :**

#### Sélection par format
```js
{
  type: 'selectByFormat',
  keys: ['Vêtements', 'Chaussures et bottes'],
  scenario: { /* ... */ }
}
```
→ Sélectionne tous les lots dont le format est "Vêtements" ou "Chaussures et bottes".

#### Sélection par type
```js
{
  type: 'selectByType',
  keys: ['T-shirt', 'Pantalon en jean'],
  scenario: { /* ... */ }
}
```
→ Sélectionne tous les lots dont le type est "T-shirt" ou "Pantalon en jean" (après avoir sélectionné un format).

#### Sélection par matière
```js
{
  type: 'selectByMatiere',
  keys: ['100% coton', 'coton/polyester'],
  scenario: { /* ... */ }
}
```
→ Sélectionne tous les lots dont la matière est "100% coton" ou "coton/polyester" (après avoir sélectionné un format et un type).

#### Sélection par couleur
```js
{
  type: 'selectByCouleur',
  keys: ['blanc', 'noir'],
  scenario: { /* ... */ }
}
```
→ Sélectionne tous les lots dont la couleur est "blanc" ou "noir".

#### Sélection par qualité
```js
{
  type: 'selectByQualite',
  keys: ['neuf étiqueté', 'parfait état'],
  scenario: { /* ... */ }
}
```
→ Sélectionne tous les lots dont la qualité est "neuf étiqueté" ou "parfait état".

**Remarques :**
- Pour les sélections imbriquées (type, matière), il faut d'abord avoir filtré sur le niveau supérieur (format, puis type).
- Vous pouvez passer une ou plusieurs valeurs dans `keys` pour chaque type de sélection.

---

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
- Un ou plusieurs fichiers JavaScript pour la logique et la génération dynamique des données

### Structure des Données
La structure des données est générée dynamiquement à partir des constantes du projet (`formats_types`, `repartitionParType`, `matieres_fibres`, etc.) et produit un objet hiérarchique `lotType` : format > type > matière > fibres, avec la répartition des couleurs et la qualité.

## Fonctionnalités principales
- Visualisation Sankey horizontale, responsive
- Sélection dynamique de la dimension à afficher (format, type, matière, fibres, couleur, qualité)
- Stackbars colorées et robustes pour chaque dimension
- Tooltips détaillés et dynamiques
- Icônes d'action pour ajouter des transformations
- Affichage du nom du lot au-dessus de chaque nœud
- Gestion dynamique et imbriquée des scénarios de transformation

## Intégration
Le diagramme est conçu pour être facilement intégrable dans d'autres applications, notamment Bubble. Il suffit d'inclure les fichiers nécessaires et d'initialiser le diagramme avec les données appropriées.

## Limitations Actuelles
- Version prototype avec fonctionnalités avancées mais non exhaustives
- Optimisé pour les petits à moyens volumes de données
- Nécessite une structure de données hiérarchique cohérente

## Note
Ce projet évolue rapidement. Pour toute modification, bien vérifier la correspondance exacte des clés entre le scénario et les données, et privilégier la génération dynamique des listes de valeurs pour garantir la robustesse de la visualisation.

## Système de transformations dynamiques (scénario Sankey)

### Principe général du parsing (logique actuelle)

- **Chaque transformation** du tableau `transformations` découpe sa part dans le lot initial (toutes dimensions confondues).
- **Tous les paths partent du lot initial** : chaque sélection crée un nœud et un lien depuis le lot initial.
- **Le "reste"** est ce qui n'a pas été sélectionné dans aucune transformation (toutes dimensions confondues), et il est ajouté à la fin comme un nœud supplémentaire.
- **Aucune logique séquentielle ni croisée** : chaque sélection est indépendante, il n'y a pas d'enchaînement ni d'intersection entre les sélections.
- **Les sous-scenarios (`scenario`) et les `coproduct_scenario` ne sont pas encore gérés** dans le parsing actuel.

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
  coproduct_scenario: []
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
- `coproduct_scenario` : tableau de transformations appliquées au "reste" (coproduit)

Chaque transformation est un objet :
- `transform` : { type, dimension, keys } (type = "select", dimension = nom de la dimension, keys = valeurs sélectionnées)
- `scenario` : (optionnel) sous-scénario imbriqué, même structure (objet avec transformations/coproduct_scenario)

#### Exemple minimal (vide)
```js
const scenario = {
  transformations: [],
  coproduct_scenario: []
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
              coproduct_scenario: []
            }
          }
        ],
        coproduct_scenario: []
      }
    }
  ],
  coproduct_scenario: [
    // transformations à appliquer au reste du lot initial
  ]
};
```

- À chaque niveau, tu peux imbriquer autant de sous-scénarios que tu veux.
- Les transformations du "reste" (coproduit) sont toujours dans le champ `coproduct_scenario`.
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

## Affichage du « + » dans le Sankey

### Règle actuelle
- Le « + » s'affiche sur les nœuds feuilles sans lien sortant, sauf si le nœud a une destination finale (`target`) ou s'il est un nœud destination (`isTarget`).
- Le « + » s'affiche également sur le lien « Reste » (coproduit) pour indiquer qu'une transformation supplémentaire peut être ajoutée.

### Dernières modifications
- Le champ `isProcess` est ajouté uniquement sur le résultat principal d'un process (le flux principal), **pas** sur le coproduit.
- Le « + » ne s'affiche plus sur le coproduit d'un process (le « reste » du process), mais reste affiché sur les autres coproduits.

#### Exemple de scénario
```js
{
  type: 'processLavage',
  yield: 0.8,
  scenario: { /* ... */ }
}
```
→ Le résultat principal du lavage aura `isProcess: true` et n'aura pas de « + », tandis que le coproduit (le reste) aura le « + ».
