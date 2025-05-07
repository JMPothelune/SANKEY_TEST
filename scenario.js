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
            newDist[key].pourcentage = Math.round((newDist[key].pourcentage / newTotal) * 100 * 10) / 10;
        });
        Object.keys(restDist).forEach(key => {
            restDist[key].pourcentage = Math.round((restDist[key].pourcentage / restTotal) * 100 * 10) / 10;
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
                newDist[key].pourcentage = Math.round((newDist[key].pourcentage / newTotal) * 100 * 10) / 10;
            } else {
                newDist[key] = Math.round((newDist[key] / newTotal) * lot.total * 10) / 10;
            }
        });
        Object.keys(restDist).forEach(key => {
            if (typeof restDist[key] === 'object' && restDist[key] !== null) {
                restDist[key].pourcentage = Math.round((restDist[key].pourcentage / restTotal) * 100 * 10) / 10;
            } else {
                restDist[key] = Math.round((restDist[key] / restTotal) * lot.total * 10) / 10;
            }
        });
    }

    // Création des deux lots
    const targetLot = {
        ...newLot,
        [dimension]: newDist,
        total: newTotal
    };

    const coProductLot = {
        ...newLot,
        [dimension]: restDist,
        total: restTotal
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
  // Recalcul des pourcentages restants
  let totalPct = 0;
  Object.values(newLot[dimension]).forEach(obj => { totalPct += obj.pourcentage; });
  Object.values(newLot[dimension]).forEach(obj => {
    obj.pourcentage = Math.round((obj.pourcentage / totalPct) * 1000) / 10;
  });
  // Recalcul du total du lot
  newLot.total = Math.round(lot.total * totalPct / 100 * 10) / 10;
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
            obj[k].pourcentage = Math.round((obj[k].pourcentage / total * 100) * 10) / 10;
            acc += obj[k].pourcentage;
        } else {
            obj[k].pourcentage = Math.round((100 - acc) * 10) / 10;
        }
    });
}

// Fonction principale pour parser le scénario en séquence (découpage du reste à chaque étape)
function applyScenarioSequentialFromInitial(lotInitial, scenario) {
    const nodes = [{ id: '0', name: 'Lot initial', lot: cloneLot(lotInitial) }];
    const links = [];
    let idGen = 1;
    let currentLot = cloneLot(lotInitial);
    let currentNodeId = '0';

    scenario.forEach((step, index) => {
        const { targetLot, coProductLot } = selectFirstLevel(currentLot, step.transform.dimension, step.transform.keys);
        
        // Ajout du lot cible
        const targetId = `${idGen++}`;
        nodes.push({ 
            id: targetId, 
            name: `${step.transform.dimension}: ${step.transform.keys.join(' + ')}`, 
            lot: targetLot 
        });
        
        // Lien depuis le lot précédent vers le lot cible
        links.push({ 
            source: currentNodeId, 
            target: targetId, 
            value: targetLot.total 
        });

        // Mise à jour du lot courant pour la prochaine itération
        currentLot = coProductLot;
        currentNodeId = targetId;
    });

    // Ajout du dernier reste s'il reste quelque chose
    if (currentLot && currentLot.total > 0) {
        const restId = `${idGen++}_reste`;
        nodes.push({ 
            id: restId, 
            name: 'Reste', 
            lot: currentLot 
        });
        links.push({ 
            source: currentNodeId, 
            target: restId, 
            value: currentLot.total 
        });
    }

    return { nodes, links };
}

// Fonction principale pour parser le scénario en PARALLÈLE (tous les paths partent du lot initial, découpage séquentiel)
function applyScenarioParallelFromInitial(lotInitial, scenario) {
    const nodes = [{ id: '0', name: 'Lot initial', lot: cloneLot(lotInitial) }];
    const links = [];
    let idGen = 1;
    let usedKeysByDimension = {};
    let resteLot = cloneLot(lotInitial);

    scenario.forEach(step => {
        const dimension = step.transform.dimension;
        const keys = step.transform.keys;
        // On retire les clés déjà utilisées dans cette dimension
        if (!usedKeysByDimension[dimension]) usedKeysByDimension[dimension] = [];
        const keysToSelect = keys.filter(k => !usedKeysByDimension[dimension].includes(k));
        if (keysToSelect.length === 0) return; // rien à sélectionner
        // Sélectionne la part dans le lot initial
        const { targetLot } = selectFirstLevel(lotInitial, dimension, keysToSelect);
        const targetId = `${idGen++}`;
        nodes.push({ id: targetId, name: `${dimension}: ${keysToSelect.join(' + ')}`, lot: targetLot });
        links.push({ source: '0', target: targetId, value: targetLot.total });
        // Met à jour le reste pour la fin
        resteLot = removeKeysFromLot(resteLot, dimension, keysToSelect);
        usedKeysByDimension[dimension].push(...keysToSelect);
    });
    // Ajoute le reste à la fin
    if (resteLot && resteLot.total > 0.1) {
        const restId = `${idGen++}_reste`;
        nodes.push({ id: restId, name: 'Reste', lot: resteLot });
        links.push({ source: '0', target: restId, value: resteLot.total });
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
    filteredLot.total = Math.round(lot.total * pct * 10) / 10;
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
    const resteTotal = Math.round((lotInitial.total - totalSelected) * 10) / 10;
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
    filteredLot.total = Math.round(lot.total * pct * 10) / 10;
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
            resteLot.total = Math.round((resteLot.total - filteredLot.total) * 10) / 10;
            // Met à jour les autres dimensions proportionnellement, sans toucher aux sous-niveaux
            Object.keys(resteLot).forEach(dim => {
                if (dim === 'total' || !resteLot[dim]) return;
                Object.keys(resteLot[dim]).forEach(k => {
                    if (resteLot[dim][k] && typeof resteLot[dim][k].pourcentage === 'number') {
                        resteLot[dim][k].pourcentage = Math.round(resteLot[dim][k].pourcentage / (1 - pctToRemove) * 10) / 10;
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

// Exemple de scénario à plat
const scenario = [
  {
    transform: {
      type: 'selectFirstLevel',
      dimension: 'format',
      keys: ['Chaussures et bottes']
    }
  },
  {
    transform: {
      type: 'selectFirstLevel',
      dimension: 'matiere',
      keys: ['100% coton']
    }
  }
];

// Générer les données pour le Sankey
const sankeyScenario = applyScenarioIndependentSelections(lotInitial, scenario);
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
        formatObj[k].pourcentage = Math.round(formatObj[k].pourcentage / sumFormat * 1000) / 10;
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
                    pourcentage: Math.round(valKg / lotMass * 1000) / 10,
                    fibres: lot[dim][val] && lot[dim][val].fibres ? JSON.parse(JSON.stringify(lot[dim][val].fibres)) : {}
                };
            } else {
                dimObj[val] = Math.round(valKg / lotMass * 1000) / 10;
            }
            sum += valKg;
        });
        // Normalisation pour que la somme fasse lotMass
        if (dim === 'matiere') {
            let totalPct = Object.values(dimObj).reduce((acc, obj) => acc + obj.pourcentage, 0);
            Object.values(dimObj).forEach(obj => {
                obj.pourcentage = Math.round(obj.pourcentage / totalPct * 1000) / 10;
            });
        } else {
            Object.keys(dimObj).forEach(k => {
                dimObj[k] = Math.round(dimObj[k] / sum * lotMass * 10) / 10;
            });
        }
        newLot[dim] = dimObj;
    });

    if (newLot.matiere) {
        console.log('NEWLOT MATIERE', newLot.matiere);
    }

    return newLot;
}

