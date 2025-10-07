// Convention de path pour cibler une transformation dans un scénario imbriqué :
// - Le path est un tableau d'alternance de clés (string) et d'index (number)
// - Il commence toujours par 'main' (scénario principal) ou 'coproduct' (coproduit racine)
//   Exemple : ['main', 'transformations', 2, 'scenario', 'coproduct_scenario', 'transformations', 1]
//   Exemple : ['coproduct', 'transformations', 0]
//   Exemple : ['main', 'transformations', 2]
//
// Les fonctions utilitaires ci-dessous permettent de naviguer et modifier la structure du scénario dynamiquement.

function getAllDescendants(tree) {
  let descendants = [];
  for (const key in tree) {
    descendants.push(key);
    if (tree[key]) {
      descendants = descendants.concat(getAllDescendants(tree[key]));
    }
  }
  return descendants;
}

function generateAllBinomeChains(tree, result = []) {
  for (const key in tree) {
    // Fonction seule
    result.push([key]);
    if (tree[key]) {
      // Pour chaque descendant (à n'importe quelle profondeur)
      const descendants = getAllDescendants(tree[key]);
      for (const desc of descendants) {
        result.push([key, desc]);
      }
      // Appel récursif sur le sous-arbre
      generateAllBinomeChains(tree[key], result);
    }
  }
  return result;
}

// Exemple d'utilisation :
window.validChains = generateAllBinomeChains(window.dimensionTree);
console.log(window.validChains);

// Les fonctions non utilisées ont été supprimées pour éviter les erreurs ESLint
// Les fonctions suivantes étaient définies mais non utilisées :
// - getScenarioAtPath

// Fonctions pour déplacer les transformations dans un tableau imbriqué
function moveTransformationUp(scenario, path, index) {
  console.log('moveTransformationUp called:', { path, index });
  let arr = scenario;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (Array.isArray(arr)) {
      arr = arr[key];
    } else if (arr && typeof arr === 'object') {
      arr = arr[key];
    }
  }
  if (!Array.isArray(arr) || index <= 0 || index >= arr.length) {
    console.error('Invalid array or index for move up');
    return;
  }
  // Échanger avec l'élément précédent
  const temp = arr[index];
  arr[index] = arr[index - 1];
  arr[index - 1] = temp;
  // Mettre à jour les index des transformations échangées
  if (arr[index]._index !== undefined) arr[index]._index = index;
  if (arr[index - 1]._index !== undefined) arr[index - 1]._index = index - 1;
  console.log('Transformation moved up successfully');
}

function moveTransformationDown(scenario, path, index) {
  console.log('moveTransformationDown called:', { path, index });
  let arr = scenario;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (Array.isArray(arr)) {
      arr = arr[key];
    } else if (arr && typeof arr === 'object') {
      arr = arr[key];
    }
  }
  if (!Array.isArray(arr) || index < 0 || index >= arr.length - 1) {
    console.error('Invalid array or index for move down');
    return;
  }
  // Échanger avec l'élément suivant
  const temp = arr[index];
  arr[index] = arr[index + 1];
  arr[index + 1] = temp;
  // Mettre à jour les index des transformations échangées
  if (arr[index]._index !== undefined) arr[index]._index = index;
  if (arr[index + 1]._index !== undefined) arr[index + 1]._index = index + 1;
  console.log('Transformation moved down successfully');
}

// Fonction pour supprimer une transformation
function removeTransformation(scenario, path, index) {
  console.log('removeTransformation called:', { path, index });

  // Nettoyer le path s'il est incorrect
  const cleanedPath = cleanPath(path);
  if (JSON.stringify(cleanedPath) !== JSON.stringify(path)) {
    console.log('Path cleaned:', { original: path, cleaned: cleanedPath });
    path = cleanedPath;
  }

  // Naviguer jusqu'au tableau de transformations
  let arr = scenario;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (Array.isArray(arr)) {
      arr = arr[key];
    } else if (arr && typeof arr === 'object') {
      arr = arr[key];
    }
  }

  if (!Array.isArray(arr)) {
    console.error('Invalid array for removal');
    console.error('Path:', path);
    console.error('Final object:', arr);
    return;
  }

  if (index < 0 || index >= arr.length) {
    console.error('Invalid index for removal');
    console.error('Index:', index, 'Array length:', arr.length);
    return;
  }

  // Supprimer la transformation à l'index spécifié
  arr.splice(index, 1);

  // Mettre à jour les index des transformations restantes
  for (let i = index; i < arr.length; i++) {
    if (arr[i]._index !== undefined) {
      arr[i]._index = i;
    }
  }

  console.log('Transformation removed successfully');
  console.log('Remaining transformations count:', arr.length);
}

// Fonction pour nettoyer les paths incorrects
function cleanPath(path) {
  // Si le path contient 'transformations' juste avant 'coproduct_scenario', le supprimer
  const cleanedPath = [];
  for (let i = 0; i < path.length; i++) {
    if (
      path[i] === 'transformations' &&
      i + 1 < path.length &&
      path[i + 1] === 'coproduct_scenario'
    ) {
      // Sauter ce 'transformations' en trop
      continue;
    }
    cleanedPath.push(path[i]);
  }

  // S'assurer que le path se termine par 'transformations' pour pointer vers le tableau
  if (cleanedPath[cleanedPath.length - 1] !== 'transformations') {
    cleanedPath.push('transformations');
  }

  return cleanedPath;
}

function updateTransformation(scenario, path, index, newTransformation) {
  console.log('updateTransformation called:', {
    path,
    index,
    newTransformation,
  });

  // Nettoyer le path s'il est incorrect
  const cleanedPath = cleanPath(path);
  if (JSON.stringify(cleanedPath) !== JSON.stringify(path)) {
    console.log('Path cleaned:', { original: path, cleaned: cleanedPath });
    path = cleanedPath;
  }

  // Debug: afficher la structure du scénario à ce path
  let debugObj = scenario;
  console.log('Navigating through scenario:');
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    console.log(`Step ${i}: key="${key}", current object:`, debugObj);
    if (Array.isArray(debugObj)) {
      debugObj = debugObj[key];
    } else if (debugObj && typeof debugObj === 'object') {
      debugObj = debugObj[key];
    }
  }
  console.log('Final object at path:', debugObj);

  let arr = scenario;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (Array.isArray(arr)) {
      arr = arr[key];
    } else if (arr && typeof arr === 'object') {
      arr = arr[key];
    }
  }
  if (!Array.isArray(arr)) {
    console.error('Invalid array for update');
    console.error('Path:', path);
    console.error('Final object:', arr);
    return;
  }

  // Vérifier si l'index est valide, sinon utiliser le dernier index
  if (index < 0 || index >= arr.length) {
    console.warn(
      `Index ${index} is out of bounds for array of length ${arr.length}. Using last index.`
    );
    index = arr.length - 1;
  }

  // Mettre à jour la transformation en gardant les métadonnées existantes
  const oldTransformation = arr[index];

  // Nettoyage ciblé lorsque le type change entre dynamique et statique
  const getType = t => (Array.isArray(t?.type) ? t.type[0] : t?.type);
  const oldType = getType(oldTransformation);
  const newType = getType(newTransformation);

  const cleanedBase = { ...oldTransformation };
  // Ne jamais persister _nodeId dans le scénario (métadonnée d'affichage uniquement)
  delete cleanedBase._nodeId;
  if (newType === 'dynamic_transfo') {
    // On passe à une transfo dynamique: retirer les clés propres aux statiques
    delete cleanedBase.keys;
    delete cleanedBase._displayNames;
    // Conserver le titre éventuel pour les dynamiques (il peut être mis à jour ensuite)
  } else if (newType) {
    // On passe à une transfo statique: retirer les champs dynamiques
    delete cleanedBase.dynamic_transfo_id;
    delete cleanedBase.dynamic_transfo_version;
    // Un titre hérité d'une dynamique ne doit plus s'appliquer
    delete cleanedBase.title;
    // Conserver step (doit rester 'sorting' pour les statiques)
    if (!cleanedBase.step) cleanedBase.step = 'sorting';
  }

  // Fusion finale
  arr[index] = {
    ...cleanedBase,
    ...newTransformation,
    _index: index, // Garder l'index
    _path: path, // Garder le path nettoyé
  };
  // Assurer qu'on ne réintroduit pas _nodeId via newTransformation
  delete arr[index]._nodeId;
  console.log('Transformation updated successfully');
}

window.moveTransformationUp = moveTransformationUp;
window.moveTransformationDown = moveTransformationDown;
window.removeTransformation = removeTransformation;
window.updateTransformation = updateTransformation;
