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

// Nouvelle fonction de parsing du scénario
function applyScenario(lot, scenario, parentNodeId = '0', nodes = null, links = null, idGenObj = null, isRoot = true, transformations_appliquees = [], depth = 0, pathNum = '1') {
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
    // Support nouvelle structure : type et keys sont des tableaux
    const type = Array.isArray(transfo.type) ? transfo.type[0] : transfo.type;
    const keys = Array.isArray(transfo.keys) ? transfo.keys[0] : transfo.keys;

    if (type === 'selectByFormat') {
      result = window.processes['selectByFormat'](resteLot, keys);
    } else if (type === 'selectByType') {
      result = window.processes['selectByType'](resteLot, keys);
    } else if (type === 'selectByMatiere') {
      result = window.processes['selectByMatiere'](resteLot, keys);
    } else if (type === 'selectByQualite') {
      result = window.processes['selectByQualite'](resteLot, keys);
    } else if (type === 'selectByCouleur') {
      result = window.processes['selectByCouleur'](resteLot, keys);
    } else if (type === 'selectByFibre') {
      if ('threshold' in transfo && 'condition' in transfo) {
        result = window.processes['selectByFibre'](resteLot, keys, transfo.threshold, transfo.condition);
      } else {
        result = window.processes['selectByFibre'](resteLot, keys);
      }
    } else if (type === 'selectByProprete') {
      result = window.processes['selectByProprete'](resteLot, keys);
    } else if (type === 'selectByPerturbateur') {
      result = window.processes['selectByPerturbateur'](resteLot, keys);
    } else if (window.processes && window.processes[type]) {
      const params = { yield: transfo.yield };
      const { targetLot, coProductLot } = window.processes[type](resteLot, keys, params);
      result = { targetLot, coProductLot };
    } else {
      throw new Error('Type de transformation non géré : ' + type);
    }
    const { targetLot, coProductLot } = result;
    if (!targetLot) return;

    // Ajout de la target au lot si elle existe dans le scénario
    if (transfo.scenario && transfo.scenario.target) {
      targetLot.target = transfo.scenario.target;
    }

    // Utiliser le title de la transformation s'il existe, sinon générer un titre unique
    const titre = transfo.title || `${pathNum}.${idx + 1}`;
    if (!targetLot.title) targetLot.title = titre;
    console.log('Création lot:', targetLot);
    const nodeId = `${idGenObj.id++}`;
    const newTransformations = [...transformations_appliquees, transfo];
    
    // Ajout du nom de la target dans le nom du nœud si elle existe
    const nodeName = targetLot.target 
      ? `${type}: ${keys.join(' + ')} → ${targetLot.target}`
      : `${type}: ${keys.join(' + ')}`;
    
    // Ajout de l'ID au lot
    targetLot.id = nodeId;
    
    // On crée d'abord le nœud
    nodes.push({ 
      id: nodeId, 
      name: nodeName, 
      lot: targetLot, 
      transformations_appliquees: newTransformations
    });
    
    // Puis le lien qui part du parent vers ce nœud
    links.push({ 
      source: parentNodeId, 
      target: nodeId, 
      value: targetLot.total,
      transformation: transfo  // La transformation qui part du parent vers ce nœud
    });
    totalChildren += targetLot.total;

    // Sous-scenario récursif (sur le lot sélectionné, relié à ce nœud)
    if (transfo.scenario && transfo.scenario.transformations && transfo.scenario.transformations.length > 0) {
      applyScenario(targetLot, transfo.scenario, nodeId, nodes, links, idGenObj, false, newTransformations, depth + 1, titre);
    }
    // On retire cette part du reste global
    resteLot = coProductLot;
  });

  // Gestion du coproduit (reste)
  if (resteLot && resteLot.total > 0.1) {
    // Utiliser le title du coproduct s'il existe, sinon générer un titre unique
    const titre = scenario.coproduct_scenario?.title || `${pathNum}.${(scenario.transformations || []).length + 1}`;
    if (!resteLot.title) resteLot.title = titre;
    // Ajout de la target au coproduit si elle existe
    if (scenario.coproduct_scenario && scenario.coproduct_scenario.target) {
      resteLot.target = scenario.coproduct_scenario.target;
    }
    
    console.log('Création lot:', resteLot);
    const coproductNodeId = `${idGenObj.id++}`;
    
    // Ajout de l'ID au lot coproduit
    resteLot.id = coproductNodeId;
    
    // Ajout du nom de la target dans le nom du nœud du coproduit si elle existe
    const nodeName = resteLot.target 
      ? `Reste → ${resteLot.target}`
      : 'Reste';
      
    nodes.push({ 
      id: coproductNodeId, 
      name: nodeName, 
      lot: resteLot, 
      transformations_appliquees: transformations_appliquees 
    });
    
    links.push({ 
      source: parentNodeId, 
      target: coproductNodeId, 
      value: resteLot.total,
      transformation: scenario.coproduct_scenario?.transformations?.[0] || null  // La transformation du coproduit si elle existe
    });
    totalChildren += resteLot.total;
    
    if (scenario.coproduct_scenario && scenario.coproduct_scenario.transformations && scenario.coproduct_scenario.transformations.length > 0) {
      applyScenario(resteLot, scenario.coproduct_scenario, coproductNodeId, nodes, links, idGenObj, false, transformations_appliquees, depth + 1, titre);
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

// Générer les données pour le Sankey
// const sankeyScenario = applyScenario(lotType, scenario); // Désactivé pour laisser le contrôle au dropdown
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
    newlot.formats = formatObj;

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






// Remplissage dynamique du dropdown de scénarios et gestion du changement
window.addEventListener('DOMContentLoaded', function() {
  if (window.scenarios && Array.isArray(window.scenarios)) {
    const select = document.getElementById('scenario-selector');
    select.innerHTML = '';
    window.scenarios.forEach((sc, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = sc.title;
      select.appendChild(opt);
    });
    // Sélectionne 'Avant' par défaut
    select.selectedIndex = 0;
    // (SUPPRIMÉ) Initialisation automatique du Sankey
    // window.sankeyScenario = applyScenario(window.lotType, window.scenarios[0].scenario);
    // if (typeof updateSankey === 'function') updateSankey();
    // Met à jour le Sankey quand on change de scénario
    select.addEventListener('change', function() {
      // (SUPPRIMÉ) Relance automatique du Sankey
      // const idx = parseInt(this.value, 10);
      // window.sankeyScenario = applyScenario(window.lotType, window.scenarios[idx].scenario);
      // const currentDimension = document.getElementById('dimension-selector').value;
      // if (typeof updateSankey === 'function') updateSankey(currentDimension);
      // Désormais, c'est runSankey qui doit être appelé explicitement
    });
    console.log('[scenario.js] sankeyScenarioReady dispatché, select rempli:', select.innerHTML);
    window.dispatchEvent(new Event('sankeyScenarioReady'));
  }
});

function mergeLots(lots) {
    // 1. Première passe : calculer les masses totales
    const masses = {
        total: 0,
        formats: {},
        types: {},
        matieres: {},
        couleurs: {},
        fibres: {},
        perturbateurs: {},
        qualites: {},
        propres: {}
    };

    lots.forEach(lot => {
        masses.total += lot.total;
        Object.entries(lot.formats).forEach(([format, formatObj]) => {
            masses.formats[format] = (masses.formats[format] || 0) + lot.total * (formatObj.pourcentage / 100);
            Object.entries(formatObj.types).forEach(([type, typeObj]) => {
                masses.types[type] = (masses.types[type] || 0) + lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100);
                // Matières
                Object.entries(typeObj.matieres || {}).forEach(([matiere, matiereObj]) => {
                    masses.matieres[matiere] = (masses.matieres[matiere] || 0) + lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100) * (matiereObj.pourcentage / 100);
                    // Fibres
                    Object.entries(matiereObj.fibres || {}).forEach(([fibre, fibreObj]) => {
                        masses.fibres[fibre] = (masses.fibres[fibre] || 0) + lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100) * (matiereObj.pourcentage / 100) * (fibreObj.pourcentage / 100);
                    });
                });
                // Couleurs
                Object.entries(typeObj.couleurs || {}).forEach(([couleur, couleurObj]) => {
                    masses.couleurs[couleur] = (masses.couleurs[couleur] || 0) + lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100) * (couleurObj.pourcentage / 100);
                });
                // Perturbateurs
                Object.entries(typeObj.perturbateurs || {}).forEach(([perturbateur, perturbateurObj]) => {
                    masses.perturbateurs[perturbateur] = (masses.perturbateurs[perturbateur] || 0) + lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100) * (perturbateurObj.pourcentage / 100);
                });
                // Qualités
                Object.entries(typeObj.qualites || {}).forEach(([qualite, qualiteObj]) => {
                    masses.qualites[qualite] = (masses.qualites[qualite] || 0) + lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100) * (qualiteObj.pourcentage / 100);
                });
                // Propres
                Object.entries(typeObj.propres || {}).forEach(([propre, propreObj]) => {
                    masses.propres[propre] = (masses.propres[propre] || 0) + lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100) * (propreObj.pourcentage / 100);
                });
            });
        });
    });

    const total = masses.total;

    // 2. Deuxième passe : reconstruire la structure avec les pourcentages calculés
    const result = {
        total,
        formats: {}
    };

    // Formats
    Object.entries(masses.formats).forEach(([format, masse]) => {
        // Chercher la couleur dans les lots fusionnés
        let formatColor = null;
        lots.forEach(lot => {
            if (lot.formats && lot.formats[format] && lot.formats[format].color) formatColor = lot.formats[format].color;
        });
        result.formats[format] = {
            pourcentage: (masse / total) * 100,
            types: {}
        };
        if (formatColor) result.formats[format].color = formatColor;

        // Types pour ce format
        const typesInFormat = new Set();
        lots.forEach(lot => {
            if (lot.formats && lot.formats[format] && lot.formats[format].types) {
                Object.keys(lot.formats[format].types).forEach(type => typesInFormat.add(type));
            }
        });

        typesInFormat.forEach(type => {
            if (!masses.types[type]) return;
            // Chercher la couleur dans les lots fusionnés
            let typeColor = null;
            lots.forEach(lot => {
                if (lot.formats && lot.formats[format] && lot.formats[format].types[type] && lot.formats[format].types[type].color) typeColor = lot.formats[format].types[type].color;
            });
            result.formats[format].types[type] = {
                pourcentage: (masses.types[type] / masse) * 100,
                matieres: {},
                couleurs: {},
                perturbateurs: {},
                qualites: {},
                propres: {}
            };
            if (typeColor) result.formats[format].types[type].color = typeColor;

            // Matières pour ce type
            const matieresInType = new Set();
            lots.forEach(lot => {
                if (lot.formats && lot.formats[format] && lot.formats[format].types[type] && lot.formats[format].types[type].matieres) {
                    Object.keys(lot.formats[format].types[type].matieres).forEach(matiere => matieresInType.add(matiere));
                }
            });

            matieresInType.forEach(matiere => {
                if (!masses.matieres[matiere]) return;
                // Chercher la couleur dans les lots fusionnés
                let matiereColor = null;
                lots.forEach(lot => {
                    if (lot.formats && lot.formats[format] && lot.formats[format].types[type] && lot.formats[format].types[type].matieres[matiere] && lot.formats[format].types[type].matieres[matiere].color) matiereColor = lot.formats[format].types[type].matieres[matiere].color;
                });

                // Calculer la distribution des fibres
                const fibresAgg = {};
                let fibresSum = 0;
                lots.forEach(lot => {
                    if (lot.formats && lot.formats[format] && lot.formats[format].types[type] && lot.formats[format].types[type].matieres[matiere] && lot.formats[format].types[type].matieres[matiere].fibres) {
                        const matiereObj = lot.formats[format].types[type].matieres[matiere];
                        const pctMatiere = typeof matiereObj.pourcentage === 'number' ? matiereObj.pourcentage : 100;
                        const pctType = typeof lot.formats[format].types[type].pourcentage === 'number' ? lot.formats[format].types[type].pourcentage : 100;
                        const pctFormat = typeof lot.formats[format].pourcentage === 'number' ? lot.formats[format].pourcentage : 100;
                        Object.entries(matiereObj.fibres).forEach(([fibre, fibreObj]) => {
                            const pctFibre = typeof fibreObj === 'object' && fibreObj !== null
                                ? (fibreObj.pourcentage !== undefined ? fibreObj.pourcentage : fibreObj)
                                : fibreObj;
                            const pct = (pctFibre / 100) * (pctMatiere / 100) * (pctType / 100) * (pctFormat / 100) * 100;
                            fibresAgg[fibre] = (fibresAgg[fibre] || 0) + pct;
                            fibresSum += pct;
                        });
                    }
                });

                // Normaliser les fibres
                const fibresObj = {};
                if (fibresSum > 0) {
                    Object.entries(fibresAgg).forEach(([fibre, pct]) => {
                        fibresObj[fibre] = {
                            pourcentage: pct / fibresSum * 100
                        };
                        // Chercher la couleur de la fibre dans les lots fusionnés
                        lots.forEach(lot => {
                            if (lot.formats && lot.formats[format] && lot.formats[format].types[type] && 
                                lot.formats[format].types[type].matieres[matiere] && 
                                lot.formats[format].types[type].matieres[matiere].fibres[fibre] &&
                                lot.formats[format].types[type].matieres[matiere].fibres[fibre].color) {
                                fibresObj[fibre].color = lot.formats[format].types[type].matieres[matiere].fibres[fibre].color;
                            }
                        });
                    });
                }

                result.formats[format].types[type].matieres[matiere] = {
                    pourcentage: (masses.matieres[matiere] / masses.types[type]) * 100,
                    fibres: fibresObj
                };
                if (matiereColor) result.formats[format].types[type].matieres[matiere].color = matiereColor;
            });

            // Couleurs pour ce type
            const couleursInType = new Set();
            lots.forEach(lot => {
                if (lot.formats && lot.formats[format] && lot.formats[format].types[type] && lot.formats[format].types[type].couleurs) {
                    Object.keys(lot.formats[format].types[type].couleurs).forEach(couleur => couleursInType.add(couleur));
                }
            });

            couleursInType.forEach(couleur => {
                if (!masses.couleurs[couleur]) return;
                // Chercher la couleur dans les lots fusionnés
                let couleurColor = null;
                lots.forEach(lot => {
                    if (lot.formats && lot.formats[format] && lot.formats[format].types[type] && 
                        lot.formats[format].types[type].couleurs[couleur] && 
                        lot.formats[format].types[type].couleurs[couleur].color) {
                        couleurColor = lot.formats[format].types[type].couleurs[couleur].color;
                    }
                });

                result.formats[format].types[type].couleurs[couleur] = {
                    pourcentage: (masses.couleurs[couleur] / masses.types[type]) * 100
                };
                if (couleurColor) result.formats[format].types[type].couleurs[couleur].color = couleurColor;
            });

            // Perturbateurs pour ce type
            const perturbateursInType = new Set();
            lots.forEach(lot => {
                if (lot.formats && lot.formats[format] && lot.formats[format].types[type] && lot.formats[format].types[type].perturbateurs) {
                    Object.keys(lot.formats[format].types[type].perturbateurs).forEach(perturbateur => perturbateursInType.add(perturbateur));
                }
            });

            perturbateursInType.forEach(perturbateur => {
                if (!masses.perturbateurs[perturbateur]) return;
                // Chercher la couleur dans les lots fusionnés
                let perturbateurColor = null;
                lots.forEach(lot => {
                    if (lot.formats && lot.formats[format] && lot.formats[format].types[type] && 
                        lot.formats[format].types[type].perturbateurs[perturbateur] && 
                        lot.formats[format].types[type].perturbateurs[perturbateur].color) {
                        perturbateurColor = lot.formats[format].types[type].perturbateurs[perturbateur].color;
                    }
                });

                result.formats[format].types[type].perturbateurs[perturbateur] = {
                    pourcentage: (masses.perturbateurs[perturbateur] / masses.types[type]) * 100
                };
                if (perturbateurColor) result.formats[format].types[type].perturbateurs[perturbateur].color = perturbateurColor;
            });

            // Qualités pour ce type
            const qualitesInType = new Set();
            lots.forEach(lot => {
                if (lot.formats && lot.formats[format] && lot.formats[format].types[type] && lot.formats[format].types[type].qualites) {
                    Object.keys(lot.formats[format].types[type].qualites).forEach(qualite => qualitesInType.add(qualite));
                }
            });

            qualitesInType.forEach(qualite => {
                if (!masses.qualites[qualite]) return;
                // Chercher la couleur dans les lots fusionnés
                let qualiteColor = null;
                lots.forEach(lot => {
                    if (lot.formats && lot.formats[format] && lot.formats[format].types[type] && 
                        lot.formats[format].types[type].qualites[qualite] && 
                        lot.formats[format].types[type].qualites[qualite].color) {
                        qualiteColor = lot.formats[format].types[type].qualites[qualite].color;
                    }
                });

                result.formats[format].types[type].qualites[qualite] = {
                    pourcentage: (masses.qualites[qualite] / masses.types[type]) * 100
                };
                if (qualiteColor) result.formats[format].types[type].qualites[qualite].color = qualiteColor;
            });

            // Propres pour ce type
            const propresInType = new Set();
            lots.forEach(lot => {
                if (lot.formats && lot.formats[format] && lot.formats[format].types[type] && lot.formats[format].types[type].propres) {
                    Object.keys(lot.formats[format].types[type].propres).forEach(propre => propresInType.add(propre));
                }
            });

            propresInType.forEach(propre => {
                if (!masses.propres[propre]) return;
                // Chercher la couleur dans les lots fusionnés
                let propreColor = null;
                lots.forEach(lot => {
                    if (lot.formats && lot.formats[format] && lot.formats[format].types[type] && 
                        lot.formats[format].types[type].propres[propre] && 
                        lot.formats[format].types[type].propres[propre].color) {
                        propreColor = lot.formats[format].types[type].propres[propre].color;
                    }
                });

                result.formats[format].types[type].propres[propre] = {
                    pourcentage: (masses.propres[propre] / masses.types[type]) * 100
                };
                if (propreColor) result.formats[format].types[type].propres[propre].color = propreColor;
            });
        });
    });

    // Après la fusion des formats/types, fusionner la propreté et la qualité au niveau racine
    // Propreté
    const allPropretes = Array.from(new Set(lots.flatMap(lot => lot.proprete ? Object.keys(lot.proprete) : [])));
    result.proprete = {};
    allPropretes.forEach(prop => {
        let sum = 0;
        let color = null;
        lots.forEach(lot => {
            if (lot.proprete && lot.proprete[prop]) {
                const val = typeof lot.proprete[prop] === 'number' ? lot.proprete[prop] : (lot.proprete[prop].pourcentage || 0);
                sum += lot.total * val / 100;
                if (lot.proprete[prop].color) color = lot.proprete[prop].color;
            }
        });
        result.proprete[prop] = {
            pourcentage: (sum / total) * 100
        };
        if (color) result.proprete[prop].color = color;
    });
    // Qualité
    const allQualites = Array.from(new Set(lots.flatMap(lot => lot.qualite ? Object.keys(lot.qualite) : [])));
    result.qualite = {};
    allQualites.forEach(qual => {
        let sum = 0;
        let color = null;
        lots.forEach(lot => {
            if (lot.qualite && lot.qualite[qual]) {
                const val = typeof lot.qualite[qual] === 'number' ? lot.qualite[qual] : (lot.qualite[qual].pourcentage || 0);
                sum += lot.total * val / 100;
                if (lot.qualite[qual].color) color = lot.qualite[qual].color;
            }
        });
        result.qualite[qual] = {
            pourcentage: (sum / total) * 100
        };
        if (color) result.qualite[qual].color = color;
    });

    return result;
}