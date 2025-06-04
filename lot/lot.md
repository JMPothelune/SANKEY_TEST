# Documentation – Module Lot (stackbars dynamiques)

## Présentation
Ce module permet de visualiser, éditer et naviguer dynamiquement dans la structure d’un lot textile multi-dimensionnel (format, type, matière, fibre, etc.) via une interface de stackbars interactive, inspirée d’un Sankey, mais adaptée à la logique de lots.

L’UI est totalement pilotée par la structure réelle du JSON du lot : chaque niveau, chaque dimension et chaque valeur sont lus et affichés dynamiquement.

---

## Structure du lot (JSON)

Un lot est un objet arborescent, chaque niveau représentant une dimension (ex : formats, types, matières, fibres…).

Exemple simplifié :
```json
{
  "title": "Lot de vêtements",
  "total": 1000,
  "formats": {
    "vêtements": {
      "pourcentage": 100,
      "types": {
        "t-shirt": {
          "pourcentage": 60,
          "matieres": {
            "coton": { "pourcentage": 80 },
            "polyester": { "pourcentage": 20 }
          }
        },
        "pantalon": { "pourcentage": 40 }
      }
    }
  }
}
```

- Chaque dimension (formats, types, matieres, etc.) est une clé contenant un objet.
- Chaque valeur (ex : "t-shirt") est une clé de cet objet, contenant à son tour un objet avec un champ `pourcentage` et éventuellement une dimension enfant.
- Le champ `title` est utilisé pour l’affichage du nom du lot ou d’un segment.
- Le champ `total` (au niveau racine) indique le poids total (kg).

**Remarques** :
- Les clés de dimension peuvent être renommées (ex : "format" → "formats") : l’UI s’adapte dynamiquement.
- Les segments spéciaux ("autre", "inconnu", "autres compositions") sont stylés différemment (fond pointillé, bordure grise).

---

## Navigation et UX

- La navigation se fait via un chemin (`cheminSelection`) : tableau d’objets `{ dimension, valeur }`.
- À chaque niveau, l’UI lit dynamiquement les dimensions accessibles à partir du nœud courant.
- Le button group central affiche toutes les dimensions accessibles, la dimension active étant en "selected".
- Le renommage d’un segment conserve la couleur et la position dans la stackbar.
- L’édition du titre du lot et des segments se fait inline (input au clic, validation Enter/blur).
- Les pourcentages sont toujours cohérents et recalculés à chaque modification (ajout/suppression/drag).
- Les modifications sont répercutées en temps réel dans le JSON du lot.

---

## Composants principaux

- **Stackbar** : Affiche la répartition d’une dimension (ex : types d’un format) sous forme de segments proportionnels.
- **Header** : Affiche le titre, le pourcentage, le poids, les boutons de navigation et d’édition.
- **Button group** : Permet de changer dynamiquement de dimension à chaque niveau.
- **Modal d’ajout** : Permet d’ajouter un segment à une dimension, avec gestion automatique des pourcentages.

---

## Bonnes pratiques d’intégration

- Le module ne dépend que de la structure du lot : il s’adapte à tout JSON conforme.
- Les classes CSS sont minimisées pour éviter les conflits (voir `styles.css`).
- L’UI peut être intégrée dans Bubble ou tout autre environnement web.
- Pour initialiser : `lancerLotUI(container, lotInitial)`.

---

## Points d’attention

- Toute modification (renommage, ajout, suppression, drag) met à jour le JSON du lot en temps réel.
- Les clés de dimension et de valeur sont lues dans l’ordre du JSON.
- Le champ `title` est toujours prioritaire pour l’affichage.
- Les segments spéciaux sont automatiquement stylés.
- La navigation multi-dimension est gérée proprement via le chemin.
- Les couleurs sont cohérentes et déterministes (palette statique ou D3 selon la dimension).

---

## Exemples d’utilisation

```js
// Initialisation dans une page web
lancerLotUI(document.getElementById('stackbar-container'), window.lotInitial);
```

---

## Historique et évolutions
- Navigation refactorisée pour supporter `{ dimension, valeur }`.
- Affichage dynamique des dimensions et titres.
- Gestion robuste des renommages, couleurs et pourcentages.
- Suppression des dépendances inutiles dans le CSS.
- Prise en compte du champ `title` pour l’affichage.
- Adaptation à l’intégration Bubble.


