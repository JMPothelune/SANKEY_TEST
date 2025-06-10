# Documentation des données de base (DATA)

## 1. Structure des données de base

Les données de base sont des fichiers JSON situés dans le dossier `/base_data` à la racine du projet. Ces fichiers décrivent les différentes dimensions et valeurs utilisées dans la construction des lots (formats, types, matières, fibres, qualités, propretés, perturbateurs, couleurs, etc.).

**Liste des fichiers de base :**
- `formats.json` : Définit les formats principaux (ex : vêtements, chaussures, etc.)
- `types.json` : Définit les types d'objets (ex : t-shirt, pantalon, etc.)
- `matieres.json` : Définit les matières (ex : coton/polyester, 100% coton, etc.)
- `fibres.json` : Définit les fibres (ex : coton, polyester, etc.)
- `qualite.json` : Définit les niveaux de qualité (ex : neuf, bon état, etc.)
- `proprete.json` : Définit les niveaux de propreté
- `perturbateurs.json` : Définit les perturbateurs
- `couleurs.json` : Définit les couleurs principales

Chaque fichier est un objet JSON dont les clés sont les noms des éléments, et les valeurs sont des objets décrivant les propriétés (couleur, sous-dimensions, etc.).

---

## 2. Chargement des données de base

### a) En local (développement)

Dans le fichier `lot/index.html`, tous les fichiers de base sont chargés dynamiquement au démarrage de l'application via `fetch`. Une fois chargés, ils sont stockés dans `window.baseData`.

Extrait du code :
```js
const baseFiles = {
  types: '../base_data/types.json',
  formats: '../base_data/formats.json',
  matieres: '../base_data/matieres.json',
  fibres: '../base_data/fibres.json',
  qualite: '../base_data/qualite.json',
  proprete: '../base_data/proprete.json',
  perturbateurs: '../base_data/perturbateurs.json',
  couleurs: '../base_data/couleurs.json'
};

Promise.all(
  Object.entries(baseFiles).map(([key, path]) =>
    fetch(path).then(r => r.json()).then(data => [key, data])
  )
).then(entries => {
  window.baseData = Object.fromEntries(entries);
  // ...
});
```

### b) Dans Bubble

Dans Bubble, il n'est pas possible d'utiliser `fetch` pour accéder à des fichiers locaux. Il faut donc injecter les données de base dans la page avant d'initialiser l'UI, par exemple via des champs Bubble, des states, ou des balises `<script type="application/json">`.

Exemple d'injection :
```html
<script id="base-types" type="application/json">
  { ... contenu de types.json ... }
</script>
<script>
  window.baseData = {
    types: JSON.parse(document.getElementById('base-types').textContent),
    // ... autres dimensions ...
  };
</script>
```

---

## 3. Utilisation dans le code (lot.js)

Dans le code, l'accès aux données de base se fait toujours via `window.baseData`. La fonction utilitaire suivante permet de récupérer les données pour une dimension donnée :

```js
function chargerDonneesBase(dimension) {
  if (window.baseData && window.baseData[dimension]) {
    return window.baseData[dimension];
  }
  return {};
}
```

Cette méthode garantit la compatibilité entre l'environnement local et Bubble.

---

## 4. Ajout d'un élément dans une dimension

Lorsqu'on ajoute un élément (ex : un type, une matière, etc.) via l'UI :
- Un dropdown affiche la liste des éléments disponibles pour la dimension, en excluant ceux déjà présents dans l'objet courant.
- L'utilisateur sélectionne un élément et renseigne un pourcentage (sauf si c'est le premier élément, auquel cas le pourcentage est fixé à 100% et le champ est masqué).
- Lors de l'ajout, la structure complète de l'élément (telle que définie dans le JSON de base) est copiée dans l'objet courant, avec le pourcentage renseigné.
- Si d'autres éléments existent déjà, leurs pourcentages sont réajustés pour que le total fasse 100%.

---

## 5. Bonnes pratiques
- Toujours mettre à jour les fichiers de base dans `/base_data` pour ajouter ou modifier des valeurs disponibles.
- S'assurer que `window.baseData` est bien initialisé avant d'utiliser l'UI.
- Pour Bubble, privilégier l'injection des données via `<script type="application/json">` ou via les states Bubble.

---

## 6. Exemple de structure d'un fichier de base

Exemple pour `matieres.json` :
```json
{
  "100% coton": {
    "color": "#414f98",
    "fibres": {
      "coton": {
        "pourcentage": 100,
        "color": "#b8452e"
      }
    }
  },
  "coton/polyester": {
    "color": "#464eaa",
    "fibres": {
      "coton": {
        "pourcentage": 57,
        "color": "#b8452e"
      },
      "polyester": {
        "pourcentage": 43,
        "color": "#d2603a"
      }
    }
  }
}
```

---

Pour toute modification de la structure ou de la logique de chargement, adapter ce fichier en conséquence.
