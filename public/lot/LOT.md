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

## Intégration et gestion des données de base

### Chargement des données de base

- Les données de base (formats, types, matières, fibres, etc.) sont stockées dans `/base_data` sous forme de fichiers JSON.
- Au chargement de la page `/lot`, tous ces fichiers sont chargés via `fetch` (ou injectés via Bubble) et stockés dans `window.baseData`.
- Le module lit toujours les données de base via `window.baseData` pour garantir la compatibilité local/Bubble.

**Exemple d’initialisation dans `index.html` :**

```js
const baseFiles = {
  types: '../base_data/types.json',
  formats: '../base_data/formats.json',
  matieres: '../base_data/matieres.json',
  fibres: '../base_data/fibres.json',
  qualite: '../base_data/qualite.json',
  proprete: '../base_data/proprete.json',
  perturbateurs: '../base_data/perturbateurs.json',
  couleurs: '../base_data/couleurs.json',
};
Promise.all(
  Object.entries(baseFiles).map(([key, path]) =>
    fetch(path)
      .then(r => r.json())
      .then(data => [key, data])
  )
).then(entries => {
  window.baseData = Object.fromEntries(entries);
  // ...
});
```

**Pour Bubble** : injecter les données dans `window.baseData` via `<script type="application/json">` ou via les states Bubble.

---

## Fonctionnement de l’UI et logique d’ajout

### Navigation et interaction

- La navigation se fait via un chemin (`cheminSelection`) : tableau d’objets `{ dimension, valeur }`.
- À chaque niveau, l’UI lit dynamiquement les dimensions accessibles à partir du nœud courant.
- Le button group central affiche toutes les dimensions accessibles, la dimension active étant en "selected".
- Le renommage d’un segment conserve la couleur et la position dans la stackbar.
- L’édition du titre du lot et des segments se fait inline (input au clic, validation Enter/blur).
- Les pourcentages sont toujours cohérents et recalculés à chaque modification (ajout/suppression/drag).
- Les modifications sont répercutées en temps réel dans le JSON du lot.

### Ajout d’un élément (popup)

- Lorsqu’on clique sur le bouton +, une popup s’ouvre pour ajouter un élément à la dimension courante.
- Le champ texte a été remplacé par un dropdown listant les éléments disponibles dans la donnée de base correspondante (ex : tous les types si on est sur la dimension "types").
- Les éléments déjà présents dans l’objet courant sont exclus de la liste.
- L’utilisateur sélectionne un élément dans le dropdown :
  - Si c’est le premier élément de la dimension, le champ pourcentage est masqué et la valeur est fixée à 100 %.
  - Sinon, l’utilisateur renseigne un pourcentage (input stylé, suffixe %).
- Lors de la validation, la structure complète de l’élément (profondeur incluse) est copiée depuis la donnée de base dans l’objet courant, avec le pourcentage renseigné.
- Si d’autres éléments existent déjà, leurs pourcentages sont réajustés pour que le total fasse 100 %.

### Suppression et renommage

- La suppression d’un segment réajuste automatiquement les pourcentages restants.
- Le renommage d’un segment met à jour la clé dans l’objet parent et dans le chemin de navigation.

---

## Composants principaux

- **Stackbar** : Affiche la répartition d’une dimension (ex : types d’un format) sous forme de segments proportionnels.
- **Header** : Affiche le titre, le pourcentage, le poids, les boutons de navigation et d’édition.
- **Button group** : Permet de changer dynamiquement de dimension à chaque niveau.
- **Modal d’ajout** : Permet d’ajouter un segment à une dimension, avec gestion automatique des pourcentages et sélection dans la donnée de base.

---

## Compatibilité Bubble et bonnes pratiques

- Le module fonctionne aussi bien en local que dans Bubble, à condition que `window.baseData` soit correctement initialisé.
- Toujours mettre à jour les fichiers de base dans `/base_data` pour ajouter ou modifier des valeurs disponibles.
- Pour Bubble, privilégier l’injection des données via `<script type="application/json">` ou via les states Bubble.
- L’UI peut être intégrée dans n’importe quelle page web ou plugin Bubble.

---

## Exemples d’utilisation

```js
// Initialisation dans une page web
lancerLotUI(document.getElementById('stackbar-container'), window.lotInitial);
```

---

## Points d’attention

- Toute modification (renommage, ajout, suppression, drag) met à jour le JSON du lot en temps réel.
- Les clés de dimension et de valeur sont lues dans l’ordre du JSON.
- Le champ `title` est toujours prioritaire pour l’affichage.
- Les segments spéciaux sont automatiquement stylés.
- La navigation multi-dimension est gérée proprement via le chemin.
- Les couleurs sont cohérentes et déterministes (palette statique ou D3 selon la dimension).

---

Pour toute évolution de la logique ou de l’UI, adapter ce fichier en conséquence.

---

## Intégration dans Bubble (iframe)

Pour intégrer le module Lot dans Bubble, il suffit d'utiliser une balise `<iframe>` pointant vers l'URL suivante :

```html
<iframe
  id="lot-iframe"
  src="https://valoramix-api.vercel.app/lot/index.html?id=VOTRE_ID_LOT&isLive=true"
  style="width: 100%; height: 600px; border: none;"
  allow="clipboard-write"
></iframe>
```

- Remplacez `VOTRE_ID_LOT` par l'identifiant du lot à charger.
- Le paramètre `isLive` peut être `true` ou `false` selon l'environnement.
- Vous pouvez ajouter d'autres paramètres à l'URL si besoin (ex : `&width=800px`).

**Attention :**

- L'URL doit pointer vers `/lot/index.html` (et non juste `/lot/`).
- Si vous modifiez la structure du projet ou déployez sur un autre domaine, adaptez l'URL en conséquence.

### Communication avec Bubble

- L'iframe envoie des messages à la page par `postMessage` (ex : `LOT_UPDATED`, `IFRAME_HEIGHT`).
- Vous pouvez écouter ces messages dans Bubble pour synchroniser les données ou ajuster la hauteur automatiquement.

**Exemple de gestion des messages :**

```js
window.addEventListener('message', function (event) {
  if (event.data.type === 'LOT_UPDATED') {
    // Le lot a été modifié dans l'iframe
    console.log('Lot modifié:', event.data.data);
    // Mettre à jour vos données Bubble ici
  }
  if (event.data.type === 'IFRAME_HEIGHT') {
    document.getElementById('lot-iframe').style.height =
      event.data.height + 'px';
  }
});
```

---
