// Fonction pour cloner un lot (deep copy)
function cloneLot(lot) {
  return JSON.parse(JSON.stringify(lot));
}

// Fonction pour retirer des clés d'une dimension d'un lot
function removeKeysFromLot(lot, dimension, keysToRemove) {
  const newLot = cloneLot(lot);
  Object.keys(newLot[dimension]).forEach(key => {
    if (keysToRemove.includes(key)) {
      delete newLot[dimension][key];
    }
  });
  
  // Calcul du total des pourcentages restants
  const totalPct = Object.values(newLot[dimension]).reduce((sum, obj) => sum + obj.pourcentage, 0);
  
  // Normalisation des pourcentages sur 100
  Object.values(newLot[dimension]).forEach(obj => {
    obj.pourcentage = obj.pourcentage / totalPct * 100;
  });
  
  // Calcul du nouveau total du lot en fonction des pourcentages restants
  newLot.total = lot.total * (totalPct / 100);
  
  return newLot;
}

// Fonction pour obtenir le complément des clés sélectionnées dans une dimension
function getComplementKeys(lot, dimension, selectedKeys) {
  return Object.keys(lot[dimension]).filter(k => !selectedKeys.includes(k));
}

// Fonction utilitaire pour normaliser les pourcentages d'un objet (top-levels)
function normalizePourcentages(obj) {
    const keys = Object.keys(obj).filter(k => obj[k] && typeof obj[k].pourcentage === 'number');
    if (keys.length === 0) return;
    let total = keys.reduce((acc, k) => acc + obj[k].pourcentage, 0);
    let acc = 0;
    keys.forEach((k, i) => {
        if (i < keys.length - 1) {
            obj[k].pourcentage = Number((obj[k].pourcentage / total * 100).toFixed(1));
            acc += obj[k].pourcentage;
        } else {
            obj[k].pourcentage = Number((100 - acc).toFixed(1));
        }
    });
}

// Nouvelle fonction de parsing du scénario (squelette)
function applyScenario(lot, scenario, parentNodeId = '0', nodes = null, links = null, idGenObj = null, isRoot = true, transformations_appliquees = [], depth = 0, pathNum = '') {
  if (!nodes) {
    const lotInit = JSON.parse(JSON.stringify(lot));
    lotInit.titre = 'lot Type';
    console.log('Création lot:', lotInit);
    nodes = [{ id: parentNodeId, name: 'Lot initial', lot: lotInit, transformations_appliquees: [] }];
  }
  if (!links) links = [];
  if (!idGenObj) idGenObj = { id: 1 };

  let resteLot = JSON.parse(JSON.stringify(lot));
  const parentTotal = lot.total;
  let totalChildren = 0;

  (scenario.transformations || []).forEach((transfo, idx) => {
    let result;
    if (transfo.type === 'selectByFormat') {
      result = selectByFormat(resteLot, transfo.keys);
    } else if (transfo.type === 'selectByType') {
      result = selectByType(resteLot, transfo.keys);
    } else if (transfo.type === 'selectByMatiere') {
      result = selectByMatiere(resteLot, transfo.keys);
    } else {
      throw new Error('Type de transformation non géré : ' + transfo.type);
    }
    const { targetLot, coProductLot } = result;
    if (!targetLot) return;
    // Génération du titre
    const titre = pathNum ? `${depth + 1}.${idx + 1}` : `${depth + 1}`;
    targetLot.titre = titre;
    console.log('Création lot:', targetLot);
    const nodeId = `${idGenObj.id++}`;
    const newTransformations = [...transformations_appliquees, transfo];
    nodes.push({ id: nodeId, name: `${transfo.type}: ${transfo.keys.join(' + ')}`, lot: targetLot, transformations_appliquees: newTransformations });
    links.push({ source: parentNodeId, target: nodeId, value: targetLot.total });
    totalChildren += targetLot.total;

    // Sous-scenario récursif (sur le lot sélectionné, relié à ce nœud)
    if (transfo.scenario && transfo.scenario.transformations && transfo.scenario.transformations.length > 0) {
      applyScenario(targetLot, transfo.scenario, nodeId, nodes, links, idGenObj, false, newTransformations, depth + 1, titre);
    }
    // On retire cette part du reste global
    resteLot = coProductLot;
  });

  // 2. Appliquer les transformations du coproduit (le "reste"), récursivement sur le reste
  if (resteLot && resteLot.total > 0.1) {
    const titre = pathNum ? `${depth + 1}.${(scenario.transformations || []).length + 1}` : `${depth + 1}`;
    resteLot.titre = titre;
    console.log('Création lot:', resteLot);
    const coproductNodeId = `${idGenObj.id++}`;
    nodes.push({ id: coproductNodeId, name: 'Reste', lot: resteLot, transformations_appliquees: transformations_appliquees });
    links.push({ source: parentNodeId, target: coproductNodeId, value: resteLot.total });
    totalChildren += resteLot.total;
    if (scenario.coproduct_transformations && scenario.coproduct_transformations.transformations && scenario.coproduct_transformations.transformations.length > 0) {
      applyScenario(resteLot, scenario.coproduct_transformations, coproductNodeId, nodes, links, idGenObj, false, transformations_appliquees, depth + 1, titre);
    }
  }

  // Correction des proportions
  if (!isRoot && Math.abs(totalChildren - parentTotal) > 0.1 && nodes.length > 1) {
    const lastNode = nodes[nodes.length - 1];
    const diff = parentTotal - totalChildren;
    lastNode.lot.total += diff;
    const lastLink = links[links.length - 1];
    lastLink.value += diff;
  }

  return { nodes, links };
}

// Génère le produit cartésien des sélections du scénario
function cartesianProduct(arrays) {
    return arrays.reduce((a, b) => a.flatMap(d => b.map(e => d.concat([e]))), [[]]);
}

// Calcule la part du lot initial correspondant à une combinaison de sélections
function filterLotByCombination(lot, combination) {
    let filteredLot = cloneLot(lot);
    let pct = 1;
    combination.forEach(sel => {
        const { dimension, key } = sel;
        if (!filteredLot[dimension][key]) {
            pct = 0;
            return;
        }
        pct *= filteredLot[dimension][key].pourcentage / 100;
        // On ne garde que la clé sélectionnée dans la dimension
        Object.keys(filteredLot[dimension]).forEach(k => {
            if (k !== key) delete filteredLot[dimension][k];
        });
    });
    filteredLot.total = lot.total * pct;
    return filteredLot.total > 0 ? filteredLot : null;
}

// Fonction principale pour parser le scénario en produit croisé (toutes les combinaisons)
function applyScenarioCrossProductFromInitial(lotInitial, scenario) {
    const nodes = [{ id: '0', name: 'Lot initial', lot: cloneLot(lotInitial) }];
    const links = [];
    let idGen = 1;
    // Prépare les sélections par dimension
    const selections = scenario.map(step => {
        return step.transform.keys.map(key => ({ dimension: step.transform.dimension, key }));
    });
    // Produit cartésien de toutes les sélections
    const combos = cartesianProduct(selections);
    let totalSelected = 0;
    combos.forEach(combo => {
        const filteredLot = filterLotByCombination(lotInitial, combo);
        if (filteredLot && filteredLot.total > 0) {
            const comboName = combo.map(sel => sel.dimension + ': ' + sel.key).join(' | ');
            const comboId = `${idGen++}`;
            nodes.push({ id: comboId, name: comboName, lot: filteredLot });
            links.push({ source: '0', target: comboId, value: filteredLot.total });
            totalSelected += filteredLot.total;
        }
    });
    // Calcule le reste
    const resteTotal = Number((lotInitial.total - totalSelected).toFixed(1));
    if (resteTotal > 0.1) {
        const restId = `${idGen++}_reste`;
        // Pour le lot "reste", on ne retire aucune sélection
        nodes.push({ id: restId, name: 'Reste', lot: { ...cloneLot(lotInitial), total: resteTotal } });
        links.push({ source: '0', target: restId, value: resteTotal });
    }
    return { nodes, links };
}

// Calcule la part du lot initial correspondant à une sélection sur une dimension (somme sur toutes les autres dimensions)
function filterLotBySingleSelection(lot, dimension, key) {
    if (!lot[dimension][key]) return null;
    // Pourcentage de la clé sélectionnée
    const pct = lot[dimension][key].pourcentage / 100;
    // On clone le lot et on ne garde que la clé sélectionnée dans la dimension
    let filteredLot = cloneLot(lot);
    Object.keys(filteredLot[dimension]).forEach(k => {
        if (k !== key) delete filteredLot[dimension][k];
    });
    // Le total est la part correspondante
    filteredLot.total = Number((lot.total * pct).toFixed(1));
    // Les autres dimensions gardent leur distribution
    // Les sous-niveaux (sous/types/fibres) restent inchangés
    return filteredLot.total > 0 ? filteredLot : null;
}

// Fonction principale pour parser le scénario en découpant des sélections indépendantes (toutes dimensions confondues)
function applyScenarioIndependentSelections(lotInitial, scenario) {
    const nodes = [{ id: '0', name: 'Lot initial', lot: cloneLot(lotInitial) }];
    const links = [];
    let idGen = 1;
    let resteLot = cloneLot(lotInitial);
    scenario.forEach(step => {
        const dimension = step.transform.dimension;
        const keys = step.transform.keys;
        keys.forEach(key => {
            if (!resteLot[dimension][key]) return;
            // Calcule la part correspondante dans le reste
            const filteredLot = filterLotBySingleSelection(resteLot, dimension, key);
            if (!filteredLot) return;
            const targetId = `${idGen++}`;
            nodes.push({ id: targetId, name: `${dimension}: ${key}`, lot: filteredLot });
            links.push({ source: '0', target: targetId, value: filteredLot.total });
            // Retire cette part du reste global (dans toutes les dimensions)
            const pctToRemove = resteLot[dimension][key].pourcentage / 100;
            // Supprime la clé du top level sans toucher aux sous-niveaux
            delete resteLot[dimension][key];
            // Normalise les pourcentages du top-level restant
            normalizePourcentages(resteLot[dimension]);
            // Met à jour le total du reste
            resteLot.total = Number((resteLot.total - filteredLot.total).toFixed(1));
            // Met à jour les autres dimensions proportionnellement, sans toucher aux sous-niveaux
            Object.keys(resteLot).forEach(dim => {
                if (dim === 'total' || !resteLot[dim]) return;
                Object.keys(resteLot[dim]).forEach(k => {
                    if (resteLot[dim][k] && typeof resteLot[dim][k].pourcentage === 'number') {
                        resteLot[dim][k].pourcentage = Number((resteLot[dim][k].pourcentage / (1 - pctToRemove)).toFixed(1));
                    }
                });
                // Normalise aussi les autres dimensions
                normalizePourcentages(resteLot[dim]);
            });
        });
    });
    // Ajoute le reste à la fin
    if (resteLot && resteLot.total > 0.1) {
        const restId = `${idGen++}_reste`;
        nodes.push({ id: restId, name: 'Reste', lot: resteLot });
        links.push({ source: '0', target: restId, value: resteLot.total });
    }
    return { nodes, links };
}

// Générer les données pour le Sankey
const sankeyScenario = applyScenario(lotType, scenario);
// sankeyScenario.nodes et sankeyScenario.links sont à utiliser dans sankey.js 


// Fonction pour recalculer la distribution d'une dimension sur un sous-lot
function crossDistrib(lot, formats, formatsMass, lotMass) {
    const newLot = { total: lotMass };

    // FORMAT : ne garder que les formats concernés, recalculer les pourcentages
    const formatObj = {};
    let sumFormat = 0;
    Object.entries(formats).forEach(([key, value]) => {
        formatObj[key] = { ...value };
        sumFormat += value.pourcentage;
    });
    // On ne garde que les formats présents dans ce sous-lot
    Object.keys(formatObj).forEach(k => {
        formatObj[k].pourcentage = Number((formatObj[k].pourcentage / sumFormat * 100).toFixed(1));
    });
    newLot.format = formatObj;

    // AUTRES DIMENSIONS : produit en croix
    ['matiere', 'couleur', 'qualite'].forEach(dim => {
        const dimObj = {};
        let sum = 0;
        Object.entries(lot[dim]).forEach(([val, pct]) => {
            let valKg = 0;
            Object.entries(formats).forEach(([fKey, fVal]) => {
                // Masse de ce format dans le sous-lot
                const fKg = lot.total * fVal.pourcentage / 100;
                // Contribution de cette valeur dans ce format (en supposant la même répartition que dans le lot initial)
                valKg += fKg * (pct / 100);
            });
            // On ramène à la masse du sous-lot
            valKg = valKg * (lotMass / formatsMass);
            if (dim === 'matiere') {
                // On recalcule la distribution des fibres pour chaque matière, pondérée par la masse réelle de la matière dans le sous-lot
                dimObj[val] = {
                    pourcentage: Number((valKg / lotMass * 100).toFixed(1)),
                    fibres: {} // <-- Correction ici
                };
                // Si la matière existe dans le lot initial et a des fibres
                if (lot[dim][val] && lot[dim][val].fibres) {
                    Object.entries(lot[dim][val].fibres).forEach(([fibre, pctFibre]) => {
                        // La masse de la fibre dans la matière = masse matière * % fibre
                        dimObj[val].fibres[fibre] = pctFibre;
                    });
                }
            } else {
                dimObj[val] = Number((valKg / lotMass * 100).toFixed(1));
            }
            sum += valKg;
        });
        // Normalisation pour que la somme fasse lotMass
        if (dim === 'matiere') {
            let totalKg = Object.values(dimObj).reduce((acc, obj) => acc + (obj.pourcentage * lotMass / 100), 0);
            Object.values(dimObj).forEach(obj => {
                obj.pourcentage = Number((obj.pourcentage * lotMass / totalKg).toFixed(1));
            });
        } else {
            let totalKg = Object.values(dimObj).reduce((acc, v) => acc + v, 0);
            Object.keys(dimObj).forEach(k => {
                dimObj[k] = Number((dimObj[k] * lotMass / totalKg).toFixed(1));
            });
        }
        newLot[dim] = dimObj;
    });

    return newLot;
}

// Nouvelle transformation adaptée à lotType : sélection par format
function selectByFormat(lot, selectedFormats) {
  // Deep clone pour ne pas modifier l'objet d'origine
  const newLot = JSON.parse(JSON.stringify(lot));
  const dist = lot.format;
  let selected = {};
  let rest = {};
  let selectedPct = 0;
  let restPct = 0;

  Object.entries(dist).forEach(([key, value]) => {
    if (selectedFormats.includes(key)) {
      selected[key] = value;
      selectedPct += value.pourcentage;
    } else {
      rest[key] = value;
      restPct += value.pourcentage;
    }
  });

  // Recalcul des pourcentages
  Object.keys(selected).forEach(k => {
    selected[k].pourcentage = selected[k].pourcentage / selectedPct * 100;
  });
  Object.keys(rest).forEach(k => {
    rest[k].pourcentage = rest[k].pourcentage / restPct * 100;
  });

  // Création des deux lots
  const targetLot = {
    ...newLot,
    format: selected,
    total: lot.total * selectedPct / 100
  };
  const coProductLot = {
    ...newLot,
    format: rest,
    total: lot.total * restPct / 100
  };

  return { targetLot, coProductLot };
}

// Sélectionne un ou plusieurs types dans un format donné (niveau 2)
function selectByType(lot, selectedTypes) {
  const formatKeys = Object.keys(lot.format);
  if (formatKeys.length !== 1) throw new Error('selectByType attend un lot avec un seul format');
  const formatKey = formatKeys[0];
  const formatObj = lot.format[formatKey];
  const dist = formatObj.types;
  let selected = {};
  let rest = {};
  let selectedPct = 0;
  let restPct = 0;

  Object.entries(dist).forEach(([key, value]) => {
    // value peut être un nombre ou un objet (si déjà enrichi)
    let pct = typeof value === 'number' ? value : value.pourcentage;
    // On récupère la structure objet des matières et couleurs du lot courant
    let matieres = (typeof value === 'object' && value.matieres) ? value.matieres : {};
    let couleurs = (typeof value === 'object' && value.couleurs) ? value.couleurs : {};
    if (selectedTypes.includes(key)) {
      selected[key] = {
        pourcentage: pct,
        matieres: matieres,
        couleurs: couleurs
      };
      selectedPct += pct;
    } else {
      rest[key] = {
        pourcentage: pct,
        matieres: matieres,
        couleurs: couleurs
      };
      restPct += pct;
    }
  });

  // Recalcul des pourcentages
  Object.keys(selected).forEach(k => {
    if (selectedPct > 0) selected[k].pourcentage = selected[k].pourcentage / selectedPct * 100;
    else selected[k].pourcentage = 0;
  });
  Object.keys(rest).forEach(k => {
    if (restPct > 0) rest[k].pourcentage = rest[k].pourcentage / restPct * 100;
    else rest[k].pourcentage = 0;
  });

  const targetLot = JSON.parse(JSON.stringify(lot));
  targetLot.format[formatKey].types = selected;
  targetLot.total = lot.total * selectedPct / 100;

  const coProductLot = JSON.parse(JSON.stringify(lot));
  coProductLot.format[formatKey].types = rest;
  coProductLot.total = lot.total * restPct / 100;

  return { targetLot, coProductLot };
}

// Sélectionne une ou plusieurs matières dans un type donné (niveau 3)
function selectByMatiere(lot, selectedMatieres) {
  // On suppose que lot ne contient qu'un seul format et un seul type (après selectByFormat et selectByType)
  const formatKeys = Object.keys(lot.format);
  if (formatKeys.length !== 1) throw new Error('selectByMatiere attend un lot avec un seul format');
  const formatKey = formatKeys[0];
  const typeKeys = Object.keys(lot.format[formatKey].types);
  if (typeKeys.length !== 1) throw new Error('selectByMatiere attend un lot avec un seul type');
  const typeKey = typeKeys[0];
  const typeObj = lot.format[formatKey].types[typeKey];

  // On travaille sur l'objet matieres du type courant
  const matieresObj = typeObj.matieres || {};
  let selected = {};
  let rest = {};
  let selectedPct = 0;
  let restPct = 0;

  Object.entries(matieresObj).forEach(([nom, matiere]) => {
    if (selectedMatieres.includes(nom)) {
      selected[nom] = { ...matiere };
      selectedPct += matiere.pourcentage;
    } else {
      rest[nom] = { ...matiere };
      restPct += matiere.pourcentage;
    }
  });

  // Recalcul des pourcentages
  Object.keys(selected).forEach(nom => {
    selected[nom].pourcentage = selected[nom].pourcentage / selectedPct * 100;
  });
  Object.keys(rest).forEach(nom => {
    rest[nom].pourcentage = rest[nom].pourcentage / restPct * 100;
  });

  // Récupérer le pourcentage du type parent
  const typePourcentage = typeof typeObj.pourcentage === 'number' ? typeObj.pourcentage : 100;

  // Création des deux lots
  const targetLot = JSON.parse(JSON.stringify(lot));
  targetLot.format[formatKey].types[typeKey].matieres = selected;
  targetLot.format[formatKey].types[typeKey].pourcentage = typePourcentage;
  targetLot.total = lot.total * (typePourcentage / 100) * (selectedPct / 100);

  const coProductLot = JSON.parse(JSON.stringify(lot));
  coProductLot.format[formatKey].types[typeKey].matieres = rest;
  coProductLot.format[formatKey].types[typeKey].pourcentage = typePourcentage;
  coProductLot.total = lot.total * (typePourcentage / 100) * (restPct / 100);

  return { targetLot, coProductLot };
}

// Sélectionne une ou plusieurs qualités dans un lot (même logique que selectByFormat)
function selectByQualite(lot, selectedQualites) {
  // Deep clone pour ne pas modifier l'objet d'origine
  const newLot = JSON.parse(JSON.stringify(lot));
  const dist = lot.qualite;
  let selected = {};
  let rest = {};
  let selectedPct = 0;
  let restPct = 0;

  Object.entries(dist).forEach(([key, value]) => {
    if (selectedQualites.includes(key)) {
      selected[key] = value;
      selectedPct += value;
    } else {
      rest[key] = value;
      restPct += value;
    }
  });

  // Recalcul des pourcentages
  Object.keys(selected).forEach(k => {
    selected[k] = selected[k] / selectedPct * 100;
  });
  Object.keys(rest).forEach(k => {
    rest[k] = rest[k] / restPct * 100;
  });

  // Création des lots sélectionnés et reste
  const lots = [];
  if (selectedPct > 0) {
    const lotSel = JSON.parse(JSON.stringify(lot));
    lotSel.qualite = selected;
    lotSel.total = lot.total * (selectedPct / 100);
    lots.push(lotSel);
  }
  if (restPct > 0) {
    const lotRest = JSON.parse(JSON.stringify(lot));
    lotRest.qualite = rest;
    lotRest.total = lot.total * (restPct / 100);
    lots.push(lotRest);
  }
  return lots;
}

