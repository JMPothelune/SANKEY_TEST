# Spécifications : Création et modification interactive d’un lot sur /lot

## Objectif général

Permettre à l’utilisateur de visualiser, modifier et enrichir la répartition des dimensions d’un lot (ex : format, type, couleur…) via une interface interactive, inspirée du composant multi-thumb slider (stackbar) présenté ici :
- [CSS Tricks - Multi-thumb slider](https://css-tricks.com/lets-make-a-multi-thumb-slider-that-calculates-the-width-between-thumbs/)
- [CodePen démo](https://codepen.io/sim04ful/pen/QWjpLJm)

---

## Fonctionnalités à implémenter

### 1. Chargement du lot type

- Au chargement de la page `/lot`, on charge un lot type (structure de données existante).
- Ce lot contient la répartition initiale des formats, types, couleurs, etc.

### 2. Affichage de la stackbar principale

- Afficher une stackbar horizontale représentant la répartition des formats du lot.
- Chaque segment de la stackbar correspond à un format, avec sa couleur (identique à celle du Sankey).
- Afficher le nom du format et son pourcentage.
- Un bouton « + » permet d’ajouter un nouveau format (voir plus bas).

### 3. Navigation dans les dimensions

- **Clic sur un segment** : Affiche la répartition de la dimension suivante pour ce segment (ex : clic sur un format → affiche les types de ce format).
- **Navigation récursive** : À chaque clic, on descend d’un niveau dans la hiérarchie (type, matière, couleur, etc.).
- **Dropdown de dimension** : Si plusieurs dimensions sont disponibles à ce niveau (ex : couleur ou type), un menu déroulant permet de choisir la dimension à afficher.
- **Retour** : Un bouton ou un fil d’Ariane permet de remonter d’un niveau.

### 4. Modification des répartitions

- **Sliders multi-thumb** : Chaque stackbar est interactive, l’utilisateur peut déplacer les séparateurs pour modifier la répartition (en pourcentage) entre les segments.
- **Synchronisation** : La somme des pourcentages doit toujours faire 100%. Les déplacements d’un séparateur ajustent dynamiquement les valeurs voisines.
- **Ajout d’un segment** : Le bouton « + » permet d’ajouter un nouveau format/type/couleur à la répartition courante (avec une valeur minimale par défaut, à ajuster ensuite).
- **Suppression** : Si un segment tombe à 0%, il peut être supprimé de la répartition (option à confirmer).

### 5. Composant Stackbar générique

- Créer un composant `Stackbar` réutilisable qui prend en entrée :
  - Un objet de répartition `{ clé: pourcentage }`
  - Les couleurs associées à chaque clé (récupérées depuis la palette du Sankey)
  - Un callback pour notifier les modifications de répartition
  - Un callback pour la sélection d’un segment
  - Un bouton « + » pour ajouter un segment
- Ce composant doit gérer :
  - L’affichage des segments avec les bonnes couleurs
  - Les interactions de drag & drop pour ajuster les pourcentages
  - L’affichage des noms et pourcentages
  - Les arrondis sur les extrémités (premier/dernier segment)

### 6. Cohérence des couleurs

- Utiliser exactement la même palette de couleurs que dans le Sankey pour chaque dimension (format, type, couleur…).
- Les couleurs doivent être déterministes et cohérentes d’une session à l’autre.

### 7. Préparation à la création de lot « from scratch »

- Prévoir la possibilité de créer un lot à partir de zéro :
  - L’utilisateur choisit d’abord les formats à inclure (avec suggestions basées sur les répartitions types)
  - À chaque étape, proposer les répartitions types pour la dimension suivante (ex : pour un format donné, proposer la répartition type des types associés)
  - Permettre d’ajouter/supprimer des segments à chaque niveau

---

## Points techniques à anticiper

- **Validation** : Toujours vérifier que la somme des pourcentages fait 100% (arrondir si besoin).
- **Performance** : Optimiser le rendu pour éviter les recalculs inutiles lors des déplacements de sliders.
- **Accessibilité** : Rendre les sliders utilisables au clavier et accessibles (labels, aria).
- **Responsive** : Adapter la stackbar à toutes les tailles d’écran.
- **Gestion des cas limites** : 
  - Empêcher qu’un segment tombe en dessous d’un seuil minimal (ex : 1%) sauf pour suppression.
  - Gérer le cas où il ne reste qu’un seul segment (il doit prendre 100%).
- **Extensibilité** : Le composant Stackbar doit pouvoir être utilisé pour n’importe quelle dimension (format, type, couleur, etc.).

---

## Roadmap (étapes de développement)

1. **Charger et afficher la stackbar des formats du lot type**
2. **Permettre la navigation récursive dans les dimensions**
3. **Implémenter le composant Stackbar générique**
4. **Gérer l’ajout/suppression de segments**
5. **Synchroniser les couleurs avec le Sankey**
6. **Préparer la création de lot from scratch (optionnel, étape suivante)**

---

## Inspirations & Références

- [CSS Tricks - Multi-thumb slider](https://css-tricks.com/lets-make-a-multi-thumb-slider-that-calculates-the-width-between-thumbs/)
- [CodePen démo](https://codepen.io/sim04ful/pen/QWjpLJm)

---

**À discuter / valider :**
- Seuil minimal pour un segment (1% ? 5% ?)
- Modalités d’ajout/suppression de segments
- Navigation entre dimensions (UX)
- Gestion des lots « from scratch »

---

## Pseudo-code de la logique de la page /lot et du composant Stackbar

```pseudo
// --- Chargement initial de la page /lot ---

onPageLoad():
    lot = chargerLotType() // Récupère le lot type (objet complet)
    dimensionCourante = "format"
    cheminSelection = [] // Liste des clés sélectionnées à chaque niveau
    afficherStackbar(lot, dimensionCourante, cheminSelection)

// --- Affichage de la stackbar pour une dimension donnée ---

afficherStackbar(lot, dimension, cheminSelection):
    // 1. Récupérer la répartition à afficher
    repartition = getRepartition(lot, dimension, cheminSelection)
    couleurs = getCouleurs(dimension, repartition.cles)
    stackbar = Stackbar(
        repartition = repartition,
        couleurs = couleurs,
        onSegmentClick = (cle) => onSegmentClick(lot, dimension, cheminSelection, cle),
        onSliderChange = (nouvelleRepartition) => onSliderChange(lot, dimension, cheminSelection, nouvelleRepartition),
        onAddSegment = () => onAddSegment(lot, dimension, cheminSelection),
        dimensionsDisponibles = getDimensionsDisponibles(lot, cheminSelection),
        onChangeDimension = (nouvelleDimension) => afficherStackbar(lot, nouvelleDimension, cheminSelection)
    )
    render(stackbar)

// --- Navigation dans les dimensions (clic sur un segment) ---

onSegmentClick(lot, dimension, cheminSelection, cle):
    // Ajouter la clé sélectionnée au chemin
    nouveauChemin = cheminSelection + [cle]
    // Déterminer la prochaine dimension à afficher
    dimensionsSuivantes = getDimensionsDisponibles(lot, nouveauChemin)
    if dimensionsSuivantes.length == 1:
        nouvelleDimension = dimensionsSuivantes[0]
    else if dimensionsSuivantes.length > 1:
        // Afficher un dropdown pour choisir la dimension
        nouvelleDimension = afficherDropdown(dimensionsSuivantes)
    else:
        // Plus de dimension à afficher, on s'arrête là
        return
    afficherStackbar(lot, nouvelleDimension, nouveauChemin)

// --- Modification de la répartition (drag sur un slider) ---

onSliderChange(lot, dimension, cheminSelection, nouvelleRepartition):
    // Met à jour la répartition dans le lot à l'endroit correspondant
    setRepartition(lot, dimension, cheminSelection, nouvelleRepartition)
    // Rafraîchit la stackbar
    afficherStackbar(lot, dimension, cheminSelection)

// --- Ajout d'un segment (bouton +) ---

onAddSegment(lot, dimension, cheminSelection):
    // Afficher une modale ou un menu pour choisir la nouvelle clé à ajouter
    nouvelleCle = choisirNouvelleCle(dimension, lot, cheminSelection)
    // Ajouter la clé à la répartition avec une valeur minimale
    repartition = getRepartition(lot, dimension, cheminSelection)
    repartition[nouvelleCle] = valeurMinimale
    // Réajuster les autres valeurs pour que la somme fasse 100%
    repartition = normaliserRepartition(repartition)
    setRepartition(lot, dimension, cheminSelection, repartition)
    afficherStackbar(lot, dimension, cheminSelection)

// --- Fonctions utilitaires ---

getRepartition(lot, dimension, cheminSelection):
    // Parcourt le lot selon le cheminSelection pour atteindre la bonne sous-structure
    // Retourne l'objet { clé: pourcentage } pour la dimension demandée

setRepartition(lot, dimension, cheminSelection, nouvelleRepartition):
    // Met à jour la répartition dans le lot à l'endroit correspondant

getDimensionsDisponibles(lot, cheminSelection):
    // Retourne la liste des dimensions disponibles à ce niveau du lot

getCouleurs(dimension, cles):
    // Retourne un mapping { clé: couleur } cohérent avec la palette du Sankey

normaliserRepartition(repartition):
    // Ajuste les valeurs pour que la somme fasse 100% (arrondi, seuil minimal, etc.)

choisirNouvelleCle(dimension, lot, cheminSelection):
    // Affiche une liste des clés possibles à ajouter (celles qui ne sont pas déjà présentes)
    // Retourne la clé choisie par l'utilisateur

afficherDropdown(dimensions):
    // Affiche un menu pour choisir la dimension à explorer
    // Retourne la dimension choisie

render(component):
    // Affiche le composant dans la page
```
