# Plan de migration des projets JS pour intégration Bubble

## Objectif général

- Séparer chaque projet (lots, sankey, etc.) dans un dossier dédié, avec son propre JS, HTML et CSS.
- Préparer une structure claire pour l’intégration dans Bubble (chaque projet doit pouvoir être référencé directement).
- Centraliser la gestion des données de base dans un dossier `data`.
- Fournir un point d’entrée unique à la racine (`index.html`) pour naviguer entre les environnements/projets.

---

## 1. Structure cible des dossiers

```
/data
  lot_type.json
  ... (autres scripts de génération à venir)
/lots
  index.html
  lots.js
  styles.css
/sankey
  index.html
  sankey.js
  styles.css
/...
index.html   (menu de navigation)
migration.md
```

**Ce plan te permet de suivre la migration étape par étape, d’anticiper les points techniques, et de préparer l’intégration future dans Bubble.**  
On pourra ensuite traiter chaque point ensemble, dans l’ordre que tu veux.

---

## 2. Points à vérifier et étapes à suivre

### 2.1. Préparation des dossiers

- [x] Créer un dossier par projet (`/lots`, `/sankey`, etc.).
- [x] Créer un dossier `/data` pour les fichiers de données et scripts de génération.
- [x] S'assurer que chaque dossier projet contient :
  - un `index.html` autonome
  - un ou plusieurs fichiers JS (ex : `lots.js`)
  - un `styles.css` dédié

### 2.2. Adaptation des fichiers HTML

- [ ] Chaque `index.html` de projet doit :
  - [x] Charger le JS et le CSS du projet localement (pas de dépendance à la racine)
  - Fournir un point d'entrée JS (ex : un bouton ou un script qui lance l'UI avec la data)
  - Charger la data de base (`lot_type.json`) depuis `/data` (ou via un paramètre)
  - Être facilement référencé depuis Bubble (un seul fichier HTML à inclure)

### 2.3. Gestion des données

- [x] Centraliser les fichiers de données dans `/data`
- [ ] Prévoir des scripts (plus tard) pour générer dynamiquement les fichiers de données selon des paramètres d'input
- [x] Adapter les projets pour charger la data depuis `/data/lot_type.json` (ou autre selon le type)

### 2.4. Point d'entrée global

- [x] Créer un `index.html` à la racine qui propose des boutons/links pour accéder à chaque projet (`/lots/index.html`, `/sankey/index.html`, etc.)

### 2.5. Compatibilité Bubble

- [ ] Vérifier que chaque projet peut être lancé en standalone (HTML autonome)
- [ ] Prévoir une fonction d'initialisation qui prend en paramètre la data (pour Bubble)
- [ ] Documenter comment référencer chaque projet dans Bubble (URL, paramètres, etc.)

### 2.6. Migration du Sankey

- [ ] Adapter le Sankey pour qu'il fonctionne avec la nouvelle structure de `lot_type.json`
- [ ] Tester l'intégration avec les données du dossier `/data`

---

## 3. Points d'attention

- Ne pas toucher au dossier `/lot` tant que tout fonctionne.
- Bien vérifier les chemins relatifs pour le chargement des JS/CSS/data.
- Prévoir la possibilité d'ajouter d'autres projets/modules à l'avenir.
- Garder la logique d'initialisation simple et documentée pour Bubble.

---

## 4. Étapes à suivre (checklist)

1. [ ] Vérifier/compléter la structure des dossiers
2. [ ] Adapter les `index.html` de chaque projet
3. [ ] Centraliser et tester le chargement des données depuis `/data`
4. [ ] Créer le menu de navigation à la racine
5. [ ] Adapter le Sankey à la nouvelle structure de données
6. [ ] Tester chaque projet en standalone
7. [ ] Documenter l'intégration Bubble

---

## 5. À faire plus tard

- Génération dynamique de `lot_type.json` selon des paramètres d'input
- Ajout d'autres modules/projets
- Automatisation du build/déploiement si besoin

---
