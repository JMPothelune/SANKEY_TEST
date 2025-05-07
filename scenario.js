// Lot de départ générique (exemple sur 1000 kg)
const lotInitial = {
    total: 1000,
    format: Object.fromEntries(Object.entries(formats_types).map(([format, obj]) => [
        format,
        {
            pourcentage: obj.pourcentage,
            types: obj.types ? { ...obj.types } : {} // Toujours un objet, même vide
        }
    ])),
    matiere: Object.fromEntries(Object.entries(matieres_fibres).map(([mat, obj]) => [
        mat,
        {
            pourcentage: obj.pourcentage,
            fibres: obj.fibres ? JSON.parse(JSON.stringify(obj.fibres)) : {}
        }
    ])),
    couleur: Object.fromEntries(Object.entries(couleurDistrib).map(([coul, pct]) => [coul, { pourcentage: pct } ])),
    qualite: Object.fromEntries(Object.entries(qualiteDistrib).map(([qual, pct]) => [qual, { pourcentage: pct } ])),
};

console.log('lotInitial.matiere', lotInitial.matiere);

// Fonction de transformation générique : sélectionne des éléments de premier niveau dans une dimension
function selectFirstLevel(lot, dimension, selectedKeys) {
    const newLot = JSON.parse(JSON.stringify(lot)); // deep copy
    const dist = lot[dimension];
    let newDist = {};
    let newTotal = 0;
    let restDist = {};
    let restTotal = 0;

    if (dimension === 'format') {
        // Cas spécial pour les formats qui ont une structure à deux niveaux
        Object.entries(dist).forEach(([key, value]) => {
            if (selectedKeys.includes(key)) {
                newDist[key] = {
                    pourcentage: value.pourcentage,
                    types: value.types
                };
                newTotal += value.pourcentage;
            } else {
                restDist[key] = {
                    pourcentage: value.pourcentage,
                    types: value.types
                };
                restTotal += value.pourcentage;
            }
        });
        // Recalcul des pourcentages dans la dimension concernée
        Object.keys(newDist).forEach(key => {
            newDist[key].pourcentage = newDist[key].pourcentage / newTotal * 100;
        });
        Object.keys(restDist).forEach(key => {
            restDist[key].pourcentage = restDist[key].pourcentage / restTotal * 100;
        });
    } else {
        // Cas standard pour les autres dimensions
        Object.entries(dist).forEach(([key, value]) => {
            if (selectedKeys.includes(key)) {
                newDist[key] = typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value;
                newTotal += typeof value === 'object' ? value.pourcentage : value;
            } else {
                restDist[key] = typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value;
                restTotal += typeof value === 'object' ? value.pourcentage : value;
            }
        });
        // Recalcul des pourcentages dans la dimension concernée
        Object.keys(newDist).forEach(key => {
            if (typeof newDist[key] === 'object' && newDist[key] !== null) {
                newDist[key].pourcentage = newDist[key].pourcentage / newTotal * 100;
            } else {
                newDist[key] = newDist[key] / newTotal * lot.total;
            }
        });
        Object.keys(restDist).forEach(key => {
            if (typeof restDist[key] === 'object' && restDist[key] !== null) {
                restDist[key].pourcentage = restDist[key].pourcentage / restTotal * 100;
            } else {
                restDist[key] = restDist[key] / restTotal * lot.total;
            }
        });
    }

    // Création des deux lots avec conversion en kg
    const targetLot = {
        ...newLot,
        [dimension]: newDist,
        total: lot.total * newTotal / 100
    };

    const coProductLot = {
        ...newLot,
        [dimension]: restDist,
        total: lot.total * restTotal / 100
    };

    return { targetLot, coProductLot };
}

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

// Nouvelle structure de scénario (vide pour l'instant)
const scenario = {
  transformations: [
    {
        type: 'selectFirstLevel',
        dimension: 'format',
        keys: ['Chaussures et bottes'],
        scenario: {
            transformations: [
                {
                    type: 'selectFirstLevel',
                    dimension: 'qualite',
                    keys: ['Neuf étiqueté', 'Parfait état', 'Bon état'],
                    scenario: {}
                }
            ],
            coproduct_transformations: {}
        }
    },
    {
        type: 'selectFirstLevel',
        dimension: 'format',
        keys: ['non TLC'],
        scenario: {}
    },
    {
        type: 'selectFirstLevel',
        dimension: 'format',
        keys: ['Vêtements'],
        scenario: {
            transformations: [
                {
                    type: 'selectFirstLevel',
                    dimension: 'qualite',
                    keys: ['Neuf étiqueté', 'Parfait état', 'Bon état'],
                    scenario: {}
                }
            ],
            coproduct_transformations: {}
        }
    },
    {
        type: 'selectFirstLevel',
        dimension: 'matiere',
        keys: ['100% coton'],
        scenario: {}
    }
  ],
  coproduct_transformations: {
    transformations: [
        {
            type: 'selectFirstLevel',
            dimension: 'matiere',
            keys: ['100% soie'],
            scenario: {}
        }
    ],
    coproduct_transformations: {}
  }
};

// Nouvelle fonction de parsing du scénario (squelette)
function applyScenario(lotInitial, scenario, parentNodeId = '0', nodes = null, links = null, idGenObj = null, isRoot = true) {
  // Créer le nœud Lot initial uniquement à la racine
  if (!nodes) {
    nodes = [{ id: parentNodeId, name: 'Lot initial', lot: cloneLot(lotInitial) }];
  }
  if (!links) links = [];
  if (!idGenObj) idGenObj = { id: 1 };

  // On travaille toujours sur une copie du lot du parent
  let resteLot = cloneLot(lotInitial);
  const parentTotal = lotInitial.total;
  let totalChildren = 0;

  // 1. Appliquer toutes les transformations principales (indépendantes)
  (scenario.transformations || []).forEach(transfo => {
    const { targetLot, coProductLot } = selectFirstLevel(resteLot, transfo.dimension, transfo.keys);
    if (!targetLot) return;
    const nodeId = `${idGenObj.id++}`;
    nodes.push({ id: nodeId, name: `${transfo.dimension}: ${transfo.keys.join(' + ')}`, lot: targetLot });
    links.push({ source: parentNodeId, target: nodeId, value: targetLot.total });
    totalChildren += targetLot.total;

    // Sous-scenario récursif (sur le lot sélectionné, relié à ce nœud)
    if (transfo.scenario && transfo.scenario.transformations && transfo.scenario.transformations.length > 0) {
      applyScenario(targetLot, transfo.scenario, nodeId, nodes, links, idGenObj, false);
    }
    // On retire cette part du reste global
    resteLot = coProductLot;
  });

  // 2. Appliquer les transformations du coproduit (le "reste"), récursivement sur le reste
  let coproductUsed = false;
  if (resteLot && resteLot.total > 0.1) {
    const coproductNodeId = `${idGenObj.id++}`;
    nodes.push({ id: coproductNodeId, name: 'Reste', lot: resteLot });
    links.push({ source: parentNodeId, target: coproductNodeId, value: resteLot.total });
    totalChildren += resteLot.total;
    if (scenario.coproduct_transformations && Object.keys(scenario.coproduct_transformations).length > 0) {
      coproductUsed = true;
      applyScenario(resteLot, scenario.coproduct_transformations, coproductNodeId, nodes, links, idGenObj, false);
    }
  }

  // Correction des proportions :
  // Si la somme des enfants diffère du parent, on ajuste le dernier nœud pour garantir la conservation de la masse
  if (!isRoot && Math.abs(totalChildren - parentTotal) > 0.1 && nodes.length > 1) {
    // On ajuste le dernier nœud créé
    const lastNode = nodes[nodes.length - 1];
    const diff = parentTotal - totalChildren;
    lastNode.lot.total += diff;
    // On ajuste aussi le lien
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
const sankeyScenario = applyScenario(lotInitial, scenario);
// sankeyScenario.nodes et sankeyScenario.links sont à utiliser dans sankey.js 

// Pour tester :
// const sankeyScenario = applyScenarioIndependentSelections(lotInitial, scenario);

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
                dimObj[val] = {
                    pourcentage: Number((valKg / lotMass * 100).toFixed(1)),
                    fibres: lot[dim][val] && lot[dim][val].fibres ? JSON.parse(JSON.stringify(lot[dim][val].fibres)) : {}
                };
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

    if (newLot.matiere) {
        console.log('NEWLOT MATIERE', newLot.matiere);
    }

    return newLot;
}

