// Nouvelle transformation adaptée à lotType : sélection par format
function selectByFormat(lot, selectedFormats) {
  // Deep clone pour ne pas modifier l'objet d'origine
  const dist = lot.formats;
  let selected = {};
  let rest = {};
  let selectedPct = 0;
  let restPct = 0;

  Object.entries(dist).forEach(([key, value]) => {
    if (selectedFormats.includes(key)) {
      selected[key] = { ...value };
      if (value.color) selected[key].color = value.color;
      selectedPct += value.pourcentage;
    } else {
      rest[key] = { ...value };
      if (value.color) rest[key].color = value.color;
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

  // Création des deux lots avec deep clone
  const targetLot = JSON.parse(JSON.stringify(lot));
  targetLot.formats = selected;
  targetLot.total = lot.total * selectedPct / 100;

  const coProductLot = JSON.parse(JSON.stringify(lot));
  coProductLot.formats = rest;
  coProductLot.total = lot.total * restPct / 100;

  if (Math.abs(lot.total - ((targetLot?.total || 0) + (coProductLot?.total || 0))) > 2) {
    console.warn('[selectByFormat] Poids incohérent : origine =', lot.total, 'target =', targetLot?.total || 0, 'reste =', coProductLot?.total || 0, 'somme =', (targetLot?.total || 0) + (coProductLot?.total || 0));
  }

  return { targetLot, coProductLot };
}

// Sélectionne un ou plusieurs types dans un format donné (niveau 2)
function selectByType(lot, selectedTypes) {
  const targetLot = JSON.parse(JSON.stringify(lot));
  const coProductLot = JSON.parse(JSON.stringify(lot));
  let selectedMassTotal = 0;
  let restMassTotal = 0;

  Object.entries(lot.formats).forEach(([formatKey, formatObj]) => {
    const dist = formatObj.types;
    let selected = {};
    let rest = {};
    let selectedPct = 0;
    let restPct = 0;

    Object.entries(dist).forEach(([key, value]) => {
      let pct = typeof value === 'number' ? value : value.pourcentage;
      if (selectedTypes.includes(key)) {
        selected[key] = JSON.parse(JSON.stringify(value));
        if (value.color) selected[key].color = value.color;
        selected[key].pourcentage = pct;
        selectedPct += pct;
      } else {
        rest[key] = JSON.parse(JSON.stringify(value));
        if (value.color) rest[key].color = value.color;
        rest[key].pourcentage = pct;
        restPct += pct;
      }
    });

    // Recalcul des pourcentages pour ce format
    Object.keys(selected).forEach(k => {
      if (selectedPct > 0) selected[k].pourcentage = selected[k].pourcentage / selectedPct * 100;
      else selected[k].pourcentage = 0;
    });
    Object.keys(rest).forEach(k => {
      if (restPct > 0) rest[k].pourcentage = rest[k].pourcentage / restPct * 100;
      else rest[k].pourcentage = 0;
    });

    // Mise à jour des lots pour ce format
    const formatMass = lot.total * (formatObj.pourcentage / 100);
    const selectedMass = formatMass * (selectedPct / 100);
    const restMass = formatMass * (restPct / 100);

    targetLot.formats[formatKey].types = selected;
    coProductLot.formats[formatKey].types = rest;

    selectedMassTotal += selectedMass;
    restMassTotal += restMass;
  });

  // Mise à jour des totaux
  targetLot.total = selectedMassTotal;
  coProductLot.total = restMassTotal;

  if (Math.abs(lot.total - (targetLot.total + coProductLot.total)) > 2) {
    console.warn('[selectByType] Poids incohérent : origine =', lot.total, 'target =', targetLot.total, 'reste =', coProductLot.total, 'somme =', targetLot.total + coProductLot.total);
  }

  return { targetLot, coProductLot };
}

// Sélectionne une ou plusieurs matières dans un type donné (niveau 3)
function selectByMatiere(lot, selectedMatieres) {
  const targetLot = JSON.parse(JSON.stringify(lot));
  const coProductLot = JSON.parse(JSON.stringify(lot));
  let selectedMassTotal = 0;
  let restMassTotal = 0;

  Object.entries(lot.formats).forEach(([formatKey, formatObj]) => {
    const typesObj = formatObj.types;
    let selectedTypes = {};
    let restTypes = {};
    let typeMassesSelected = {};
    let typeMassesRest = {};
    let formatSelectedMass = 0;
    let formatRestMass = 0;

    Object.entries(typesObj).forEach(([typeKey, typeObj]) => {
      const matieresObj = typeObj.matieres || {};
      let selectedMatieresObj = {};
      let restMatieresObj = {};
      let selectedPct = 0;
      let restPct = 0;

      // Si le type n'a pas de matières, le traiter comme un type "reste"
      if (Object.keys(matieresObj).length === 0) {
        restTypes[typeKey] = JSON.parse(JSON.stringify(typeObj));
        if (typeObj.color) restTypes[typeKey].color = typeObj.color;
        const typeMass = lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100);
        typeMassesRest[typeKey] = typeMass;
        formatRestMass += typeMass;
        return; // Passer au type suivant
      }

      Object.entries(matieresObj).forEach(([nom, matiere]) => {
        if (selectedMatieres.includes(nom)) {
          selectedMatieresObj[nom] = JSON.parse(JSON.stringify(matiere));
          if (matiere.color) selectedMatieresObj[nom].color = matiere.color;
          selectedPct += matiere.pourcentage;
        } else {
          restMatieresObj[nom] = JSON.parse(JSON.stringify(matiere));
          if (matiere.color) restMatieresObj[nom].color = matiere.color;
          restPct += matiere.pourcentage;
        }
      });

      const typeMass = lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100);
      const selectedMass = typeMass * (selectedPct / 100);
      const restMass = typeMass * (restPct / 100);

      // Toujours ajouter le type, même si aucune matière n'est sélectionnée
      if (selectedPct > 0) {
        Object.keys(selectedMatieresObj).forEach(nom => {
          selectedMatieresObj[nom].pourcentage = selectedMatieresObj[nom].pourcentage / selectedPct * 100;
        });
        selectedTypes[typeKey] = {
          ...typeObj,
          matieres: selectedMatieresObj
        };
        if (typeObj.color) selectedTypes[typeKey].color = typeObj.color;
        typeMassesSelected[typeKey] = selectedMass;
        formatSelectedMass += selectedMass;
      }
      
      // Toujours ajouter le type au reste, même si toutes les matières sont sélectionnées
      if (restPct > 0) {
        Object.keys(restMatieresObj).forEach(nom => {
          restMatieresObj[nom].pourcentage = restMatieresObj[nom].pourcentage / restPct * 100;
        });
        restTypes[typeKey] = {
          ...typeObj,
          matieres: restMatieresObj
        };
        if (typeObj.color) restTypes[typeKey].color = typeObj.color;
        typeMassesRest[typeKey] = restMass;
        formatRestMass += restMass;
      }
      
      // Si le type n'a ni matières sélectionnées ni matières restantes, l'ajouter au reste
      if (selectedPct === 0 && restPct === 0) {
        restTypes[typeKey] = JSON.parse(JSON.stringify(typeObj));
        if (typeObj.color) restTypes[typeKey].color = typeObj.color;
        typeMassesRest[typeKey] = typeMass;
        formatRestMass += typeMass;
      }
    });

    // Recalcul des pourcentages des types dans chaque format
    if (formatSelectedMass > 0) {
      Object.keys(selectedTypes).forEach(typeKey => {
        selectedTypes[typeKey].pourcentage = (typeMassesSelected[typeKey] / formatSelectedMass) * 100;
      });
      targetLot.formats[formatKey].types = selectedTypes;
    }
    if (formatRestMass > 0) {
      Object.keys(restTypes).forEach(typeKey => {
        restTypes[typeKey].pourcentage = (typeMassesRest[typeKey] / formatRestMass) * 100;
      });
      coProductLot.formats[formatKey].types = restTypes;
    }

    selectedMassTotal += formatSelectedMass;
    restMassTotal += formatRestMass;
  });

  // Mise à jour des totaux
  targetLot.total = selectedMassTotal;
  coProductLot.total = restMassTotal;

  if (Math.abs(lot.total - (targetLot.total + coProductLot.total)) > 2) {
    console.warn('[selectByMatiere] Poids incohérent : origine =', lot.total, 'target =', targetLot.total, 'reste =', coProductLot.total, 'somme =', targetLot.total + coProductLot.total);
  }

  return { targetLot, coProductLot };
}

// Patch pour selectByQualite
function selectByQualite(lot, selectedQualites) {
  // Deep clone pour ne pas modifier l'objet d'origine
  const dist = lot.qualite;
  let selected = {};
  let rest = {};
  let selectedPct = 0;
  let restPct = 0;

  Object.entries(dist).forEach(([key, value]) => {
    // Gestion des deux formats possibles (nombre ou objet avec pourcentage)
    const pct = typeof value === 'object' && value !== null 
      ? (value.pourcentage !== undefined ? value.pourcentage : 0)
      : value;

    if (selectedQualites.includes(key)) {
      selected[key] = {
        pourcentage: pct
      };
      if (value.color) selected[key].color = value.color;
      selectedPct += pct;
    } else {
      rest[key] = {
        pourcentage: pct
      };
      if (value.color) rest[key].color = value.color;
      restPct += pct;
    }
  });

  // Recalcul des pourcentages
  Object.keys(selected).forEach(k => {
    if (selectedPct > 0) {
      selected[k].pourcentage = selected[k].pourcentage / selectedPct * 100;
    } else {
      selected[k].pourcentage = 0;
    }
  });
  Object.keys(rest).forEach(k => {
    if (restPct > 0) {
      rest[k].pourcentage = rest[k].pourcentage / restPct * 100;
    } else {
      rest[k].pourcentage = 0;
    }
  });

  // Création des deux lots
  let targetLot = null;
  let coProductLot = null;

  if (selectedPct > 0) {
    targetLot = JSON.parse(JSON.stringify(lot));
    targetLot.qualite = selected;
    targetLot.total = lot.total * (selectedPct / 100);
  }

  if (restPct > 0) {
    coProductLot = JSON.parse(JSON.stringify(lot));
    coProductLot.qualite = rest;
    coProductLot.total = lot.total * (restPct / 100);
  }

  if (Math.abs(lot.total - ((targetLot?.total || 0) + (coProductLot?.total || 0))) > 2) {
    console.warn('[selectByQualite] Poids incohérent : origine =', lot.total, 'target =', targetLot?.total || 0, 'reste =', coProductLot?.total || 0, 'somme =', (targetLot?.total || 0) + (coProductLot?.total || 0));
  }

  return { targetLot, coProductLot };
}

// Sélectionne une ou plusieurs couleurs dans un lot
function selectByCouleur(lot, selectedCouleurs) {
  // Deep clone pour ne pas modifier l'objet d'origine
  const newLot = JSON.parse(JSON.stringify(lot));
  let selectedPct = 0;
  let restPct = 0;

  // Parcourir tous les formats et types pour agréger les couleurs
  Object.entries(lot.formats).forEach(([formatKey, formatObj]) => {
    Object.entries(formatObj.types).forEach(([typeKey, typeObj]) => {
      if (typeObj.couleurs) {
        Object.entries(typeObj.couleurs).forEach(([couleur, couleurObj]) => {
          const pct = couleurObj.pourcentage * (typeObj.pourcentage / 100) * (formatObj.pourcentage / 100);
          if (selectedCouleurs.includes(couleur)) {
            selectedPct += pct;
          } else {
            restPct += pct;
          }
        });
      }
    });
  });

  // Création des deux lots
  const targetLot = JSON.parse(JSON.stringify(lot));
  const coProductLot = JSON.parse(JSON.stringify(lot));

  // Mise à jour des couleurs dans les deux lots
  Object.entries(targetLot.formats).forEach(([formatKey, formatObj]) => {
    Object.entries(formatObj.types).forEach(([typeKey, typeObj]) => {
      if (typeObj.couleurs) {
        const selected = {};
        const rest = {};
        Object.entries(typeObj.couleurs).forEach(([couleur, couleurObj]) => {
          if (selectedCouleurs.includes(couleur)) {
            selected[couleur] = { ...couleurObj };
            if (couleurObj.color) selected[couleur].color = couleurObj.color;
          } else {
            rest[couleur] = { ...couleurObj };
            if (couleurObj.color) rest[couleur].color = couleurObj.color;
          }
        });
        // Mettre à jour les couleurs dans le type
        typeObj.couleurs = selected;
      }
    });
  });

  Object.entries(coProductLot.formats).forEach(([formatKey, formatObj]) => {
    Object.entries(formatObj.types).forEach(([typeKey, typeObj]) => {
      if (typeObj.couleurs) {
        const selected = {};
        const rest = {};
        Object.entries(typeObj.couleurs).forEach(([couleur, couleurObj]) => {
          if (selectedCouleurs.includes(couleur)) {
            selected[couleur] = { ...couleurObj };
            if (couleurObj.color) selected[couleur].color = couleurObj.color;
          } else {
            rest[couleur] = { ...couleurObj };
            if (couleurObj.color) rest[couleur].color = couleurObj.color;
          }
        });
        // Mettre à jour les couleurs dans le type
        typeObj.couleurs = rest;
      }
    });
  });

  // Mise à jour des totaux
  targetLot.total = lot.total * (selectedPct / 100);
  coProductLot.total = lot.total * (restPct / 100);

  if (Math.abs(lot.total - ((targetLot?.total || 0) + (coProductLot?.total || 0))) > 2) {
    console.warn('[selectByCouleur] Poids incohérent : origine =', lot.total, 'target =', targetLot?.total || 0, 'reste =', coProductLot?.total || 0, 'somme =', (targetLot?.total || 0) + (coProductLot?.total || 0));
  }

  return { targetLot, coProductLot };
}

// Sélectionne une ou plusieurs fibres dans un lot
function selectByFibre(lot, selectedFibres, threshold = null, condition = null) {
  const targetLot = JSON.parse(JSON.stringify(lot));
  const coProductLot = JSON.parse(JSON.stringify(lot));
  let selectedMassTotal = 0;
  let restMassTotal = 0;

  Object.entries(lot.formats).forEach(([formatKey, formatObj]) => {
    const typesObj = formatObj.types;
    let selectedTypes = {};
    let restTypes = {};
    let typeMassesSelected = {};
    let typeMassesRest = {};
    let formatSelectedMass = 0;
    let formatRestMass = 0;

    Object.entries(typesObj).forEach(([typeKey, typeObj]) => {
      const matieresObj = typeObj.matieres || {};
      let selectedMatieresObj = {};
      let restMatieresObj = {};
      let selectedPct = 0;
      let restPct = 0;

      Object.entries(matieresObj).forEach(([nom, matiere]) => {
        // On vérifie la présence d'une fibre sélectionnée dans la matière
        const hasSelectedFibre = matiere.fibres && Object.entries(matiere.fibres).some(([fibre, fibreObj]) => {
          const pctFibre = typeof fibreObj === 'object' && fibreObj !== null
            ? (fibreObj.pourcentage !== undefined ? fibreObj.pourcentage : fibreObj)
            : fibreObj;
          if (!selectedFibres.includes(fibre)) return false;
          if (threshold !== null && condition !== null) {
            if (condition === 'over') return pctFibre >= threshold;
            if (condition === 'under') return pctFibre <= threshold;
            return false;
          }
          return true;
        });
        if (hasSelectedFibre) {
          selectedMatieresObj[nom] = JSON.parse(JSON.stringify(matiere));
          if (matiere.color) selectedMatieresObj[nom].color = matiere.color;
          selectedPct += matiere.pourcentage;
        } else {
          restMatieresObj[nom] = JSON.parse(JSON.stringify(matiere));
          if (matiere.color) restMatieresObj[nom].color = matiere.color;
          restPct += matiere.pourcentage;
        }
      });

      const typeMass = lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100);
      const selectedMass = typeMass * (selectedPct / 100);
      const restMass = typeMass * (restPct / 100);

      if (selectedPct > 0) {
        Object.keys(selectedMatieresObj).forEach(nom => {
          selectedMatieresObj[nom].pourcentage = selectedMatieresObj[nom].pourcentage / selectedPct * 100;
        });
        selectedTypes[typeKey] = {
          ...typeObj,
          matieres: selectedMatieresObj
        };
        if (typeObj.color) selectedTypes[typeKey].color = typeObj.color;
        typeMassesSelected[typeKey] = selectedMass;
        formatSelectedMass += selectedMass;
      }
      if (restPct > 0) {
        Object.keys(restMatieresObj).forEach(nom => {
          restMatieresObj[nom].pourcentage = restMatieresObj[nom].pourcentage / restPct * 100;
        });
        restTypes[typeKey] = {
          ...typeObj,
          matieres: restMatieresObj
        };
        if (typeObj.color) restTypes[typeKey].color = typeObj.color;
        typeMassesRest[typeKey] = restMass;
        formatRestMass += restMass;
      }
    });

    // Recalcul des pourcentages des types dans chaque format
    if (formatSelectedMass > 0) {
      Object.keys(selectedTypes).forEach(typeKey => {
        selectedTypes[typeKey].pourcentage = (typeMassesSelected[typeKey] / formatSelectedMass) * 100;
      });
      targetLot.formats[formatKey].types = selectedTypes;
    }
    if (formatRestMass > 0) {
      Object.keys(restTypes).forEach(typeKey => {
        restTypes[typeKey].pourcentage = (typeMassesRest[typeKey] / formatRestMass) * 100;
      });
      coProductLot.formats[formatKey].types = restTypes;
    }

    selectedMassTotal += formatSelectedMass;
    restMassTotal += formatRestMass;
  });

  // Mise à jour des totaux
  targetLot.total = selectedMassTotal;
  coProductLot.total = restMassTotal;

  if (Math.abs(lot.total - (targetLot.total + coProductLot.total)) > 2) {
    console.warn('[selectByFibre] Poids incohérent : origine =', lot.total, 'target =', targetLot.total, 'reste =', coProductLot.total, 'somme =', targetLot.total + coProductLot.total);
  }

  return { targetLot, coProductLot };
}

function selectByProprete(lot, selectedProprete) {
    // Accepte un tableau ou une valeur unique
    const selectedArray = Array.isArray(selectedProprete) ? selectedProprete : [selectedProprete];
    const targetLot = JSON.parse(JSON.stringify(lot));
    const coProductLot = JSON.parse(JSON.stringify(lot));
    
    // Calculer les masses pour chaque lot
    let targetMass = 0;
    let coProductMass = 0;
    
    if (lot.proprete) {
        Object.entries(lot.proprete).forEach(([prop, pct]) => {
            const mass = lot.total * (pct.pourcentage / 100);
            if (selectedArray.includes(prop)) {
                targetMass += mass;
            } else {
                coProductMass += mass;
            }
        });
    }
    
    // Mettre à jour les totaux
    targetLot.total = targetMass;
    coProductLot.total = coProductMass;
    
    // Mettre à jour les pourcentages de propreté
    if (targetMass > 0) {
        const targetProprete = {};
        Object.entries(lot.proprete).forEach(([prop, pct]) => {
            if (selectedArray.includes(prop)) {
                targetProprete[prop] = {
                    pourcentage: (pct.pourcentage * lot.total) / targetMass
                };
                if (pct.color) targetProprete[prop].color = pct.color;
            }
        });
        targetLot.proprete = targetProprete;
    }
    
    if (coProductMass > 0) {
        const coProductProprete = {};
        Object.entries(lot.proprete).forEach(([prop, pct]) => {
            if (!selectedArray.includes(prop)) {
                coProductProprete[prop] = {
                    pourcentage: (pct.pourcentage * lot.total) / coProductMass
                };
                if (pct.color) coProductProprete[prop].color = pct.color;
            }
        });
        coProductLot.proprete = coProductProprete;
    }
    
    if (Math.abs(lot.total - ((targetLot?.total || 0) + (coProductLot?.total || 0))) > 2) {
      console.warn('[selectByProprete] Poids incohérent : origine =', lot.total, 'target =', targetLot?.total || 0, 'reste =', coProductLot?.total || 0, 'somme =', (targetLot?.total || 0) + (coProductLot?.total || 0));
    }
    
    return { targetLot, coProductLot };
}

// Sélectionne un ou plusieurs perturbateurs dans un lot
function selectByPerturbateur(lot, selectedPerturbateurs) {
  // Deep clone pour ne pas modifier l'objet d'origine
  const newLot = JSON.parse(JSON.stringify(lot));
  let selectedPct = 0;
  let restPct = 0;

  // Parcourir tous les formats et types pour agréger les perturbateurs
  Object.entries(lot.formats).forEach(([formatKey, formatObj]) => {
    Object.entries(formatObj.types).forEach(([typeKey, typeObj]) => {
      if (typeObj.perturbateurs) {
        Object.entries(typeObj.perturbateurs).forEach(([perturbateur, perturbateurObj]) => {
          const pct = perturbateurObj.pourcentage * (typeObj.pourcentage / 100) * (formatObj.pourcentage / 100);
          if (selectedPerturbateurs.includes(perturbateur)) {
            selectedPct += pct;
          } else {
            restPct += pct;
          }
        });
      }
    });
  });

  // Création des deux lots
  const targetLot = JSON.parse(JSON.stringify(lot));
  const coProductLot = JSON.parse(JSON.stringify(lot));

  // Mise à jour des perturbateurs dans les deux lots
  Object.entries(targetLot.formats).forEach(([formatKey, formatObj]) => {
    Object.entries(formatObj.types).forEach(([typeKey, typeObj]) => {
      if (typeObj.perturbateurs) {
        const selected = {};
        const rest = {};
        Object.entries(typeObj.perturbateurs).forEach(([perturbateur, perturbateurObj]) => {
          if (selectedPerturbateurs.includes(perturbateur)) {
            selected[perturbateur] = { ...perturbateurObj };
            if (perturbateurObj.color) selected[perturbateur].color = perturbateurObj.color;
          } else {
            rest[perturbateur] = { ...perturbateurObj };
            if (perturbateurObj.color) rest[perturbateur].color = perturbateurObj.color;
          }
        });
        // Mettre à jour les perturbateurs dans le type
        typeObj.perturbateurs = selected;
      }
    });
  });

  Object.entries(coProductLot.formats).forEach(([formatKey, formatObj]) => {
    Object.entries(formatObj.types).forEach(([typeKey, typeObj]) => {
      if (typeObj.perturbateurs) {
        const selected = {};
        const rest = {};
        Object.entries(typeObj.perturbateurs).forEach(([perturbateur, perturbateurObj]) => {
          if (selectedPerturbateurs.includes(perturbateur)) {
            selected[perturbateur] = { ...perturbateurObj };
            if (perturbateurObj.color) selected[perturbateur].color = perturbateurObj.color;
          } else {
            rest[perturbateur] = { ...perturbateurObj };
            if (perturbateurObj.color) rest[perturbateur].color = perturbateurObj.color;
          }
        });
        // Mettre à jour les perturbateurs dans le type
        typeObj.perturbateurs = rest;
      }
    });
  });

  // Mise à jour des totaux
  targetLot.total = lot.total * (selectedPct / 100);
  coProductLot.total = lot.total * (restPct / 100);

  if (Math.abs(lot.total - ((targetLot?.total || 0) + (coProductLot?.total || 0))) > 2) {
    console.warn('[selectByPerturbateur] Poids incohérent : origine =', lot.total, 'target =', targetLot?.total || 0, 'reste =', coProductLot?.total || 0, 'somme =', (targetLot?.total || 0) + (coProductLot?.total || 0));
  }

  return { targetLot, coProductLot };
}


// Les processes 

function processLavage(lot, keys = [], params = {}) {
  // params.yield = rendement (par défaut 1)
  const yieldPct = params.yield !== undefined ? params.yield : 1;
  const newLot = JSON.parse(JSON.stringify(lot));
  newLot.proprete = { propre: 100 };
  newLot.total = lot.total * yieldPct;
  // SUPPRIMER le titre si présent
  delete newLot.titre;
  // Pas de coproduit si yield = 1
  let coProductLot = null;
  if (yieldPct < 1) {
    coProductLot = JSON.parse(JSON.stringify(lot));
    coProductLot.total = lot.total * (1 - yieldPct);
    delete coProductLot.titre;
  }
  return { targetLot: newLot, coProductLot };
}

function processDelissage(lot, keys = [], params = {}) {
  const yieldPct = params.yield !== undefined ? params.yield : 0.9;
  const total = lot.total || 0;

  // Fonction utilitaire pour fusionner les répartitions pondérées
  function mergeDistrib(lot, mass) {
    const matieres = {};
    const fibres = {};
    const couleurs = {};
    let totalMatiereMass = 0;
    let totalCouleurMass = 0;
    // Parcours tous les formats/types/matières/couleurs
    Object.entries(lot.formats || {}).forEach(([formatKey, formatObj]) => {
      const formatMass = mass * (formatObj.pourcentage / 100);
      Object.entries(formatObj.types || {}).forEach(([typeKey, typeObj]) => {
        const typeMass = formatMass * (typeObj.pourcentage / 100);
        // Matières
        Object.entries(typeObj.matieres || {}).forEach(([matiereKey, matiereObj]) => {
          const matiereMass = typeMass * (matiereObj.pourcentage / 100);
          matieres[matiereKey] = (matieres[matiereKey] || 0) + matiereMass;
          totalMatiereMass += matiereMass;
          // Fibres
          Object.entries(matiereObj.fibres || {}).forEach(([fibreKey, fibreObj]) => {
            const pctFibre = typeof fibreObj === 'object' && fibreObj !== null ? (fibreObj.pourcentage !== undefined ? fibreObj.pourcentage : fibreObj) : fibreObj;
            const fibreMass = matiereMass * (pctFibre / 100);
            if (!fibres[matiereKey]) fibres[matiereKey] = {};
            fibres[matiereKey][fibreKey] = (fibres[matiereKey][fibreKey] || 0) + fibreMass;
          });
        });
        // Couleurs
        Object.entries(typeObj.couleurs || {}).forEach(([couleurKey, couleurObj]) => {
          const couleurPct = typeof couleurObj === 'object' && couleurObj !== null ? (couleurObj.pourcentage !== undefined ? couleurObj.pourcentage : couleurObj) : couleurObj;
          const couleurMass = typeMass * (couleurPct / 100);
          couleurs[couleurKey] = (couleurs[couleurKey] || 0) + couleurMass;
          totalCouleurMass += couleurMass;
        });
      });
    });
    // Normalisation en pourcentages
    const matieresPct = {};
    Object.entries(matieres).forEach(([k, v]) => {
      matieresPct[k] = totalMatiereMass > 0 ? (v / totalMatiereMass) * 100 : 0;
    });
    // Fibres imbriquées dans chaque matière
    const fibresPct = {};
    Object.entries(fibres).forEach(([matiereKey, fibresObj]) => {
      const matiereMass = matieres[matiereKey] || 0;
      fibresPct[matiereKey] = {};
      Object.entries(fibresObj).forEach(([fibreKey, fibreMass]) => {
        fibresPct[matiereKey][fibreKey] = matiereMass > 0 ? (fibreMass / matiereMass) * 100 : 0;
      });
    });
    // Couleurs imbriquées avec color
    const couleursPct = {};
    Object.entries(couleurs).forEach(([k, v]) => {
      // Chercher la couleur dans le lot d'origine
      let color = null;
      Object.entries(lot.formats || {}).forEach(([formatKey, formatObj]) => {
        Object.entries(formatObj.types || {}).forEach(([typeKey, typeObj]) => {
          if (typeObj.couleurs && typeObj.couleurs[k] && typeObj.couleurs[k].color) color = typeObj.couleurs[k].color;
        });
      });
      couleursPct[k] = {
        pourcentage: totalCouleurMass > 0 ? (v / totalCouleurMass) * 100 : 0
      };
      if (color) couleursPct[k].color = color;
    });
    return { matieresPct, fibresPct, couleursPct };
  }

  // Fusion pondérée de la répartition d'origine
  const { matieresPct, fibresPct, couleursPct } = mergeDistrib(lot, total);

  // Création du lot principal (morceaux de tissu)
  const mainLot = JSON.parse(JSON.stringify(lot));
  mainLot.total = total * yieldPct;
  mainLot.formats = {
    "tissu": {
      pourcentage: 100,
      types: {
        "morceaux de tissu": {
          pourcentage: 100,
          matieres: {},
          couleurs: {}
        }
      }
    }
  };
  // Applique la répartition fusionnée
  Object.entries(matieresPct).forEach(([matiere, pct]) => {
    // Chercher la couleur de la matière
    let matiereColor = null;
    Object.entries(lot.formats || {}).forEach(([formatKey, formatObj]) => {
      Object.entries(formatObj.types || {}).forEach(([typeKey, typeObj]) => {
        if (typeObj.matieres && typeObj.matieres[matiere] && typeObj.matieres[matiere].color) matiereColor = typeObj.matieres[matiere].color;
      });
    });
    mainLot.formats["tissu"].types["morceaux de tissu"].matieres[matiere] = {
      pourcentage: pct,
      fibres: fibresPct[matiere] || {}
    };
    if (matiereColor) mainLot.formats["tissu"].types["morceaux de tissu"].matieres[matiere].color = matiereColor;
  });
  mainLot.formats["tissu"].types["morceaux de tissu"].couleurs = couleursPct;

  // Création du coproduit (points durs)
  let coProductLot = null;
  if (yieldPct < 1) {
    coProductLot = JSON.parse(JSON.stringify(lot));
    coProductLot.total = total * (1 - yieldPct);
    coProductLot.formats = {
      "tissu": {
        pourcentage: 100,
        types: {
          "points durs": {
            pourcentage: 100,
            matieres: {},
            couleurs: {}
          }
        }
      }
    };
    Object.entries(matieresPct).forEach(([matiere, pct]) => {
      // Chercher la couleur de la matière
      let matiereColor = null;
      Object.entries(lot.formats || {}).forEach(([formatKey, formatObj]) => {
        Object.entries(formatObj.types || {}).forEach(([typeKey, typeObj]) => {
          if (typeObj.matieres && typeObj.matieres[matiere] && typeObj.matieres[matiere].color) matiereColor = typeObj.matieres[matiere].color;
        });
      });
      coProductLot.formats["tissu"].types["points durs"].matieres[matiere] = {
        pourcentage: pct,
        fibres: fibresPct[matiere] || {}
      };
      if (matiereColor) coProductLot.formats["tissu"].types["points durs"].matieres[matiere].color = matiereColor;
    });
    coProductLot.formats["tissu"].types["points durs"].couleurs = couleursPct;
  }

  delete mainLot.titre;
  if (coProductLot) delete coProductLot.titre;

  return { targetLot: mainLot, coProductLot };
}

function processSeparation(lot, keys = [], params = {}) {
  const total = lot.total || 0;
  const fibreMasses = {};
  const fibreColors = {};

  console.log('[processSeparation] Lot d\'entrée:', lot);

  // Parcourir tous les formats et types pour agréger les fibres
  Object.entries(lot.formats || {}).forEach(([formatKey, formatObj]) => {
    Object.entries(formatObj.types || {}).forEach(([typeKey, typeObj]) => {
      const typeMass = total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100);
      
      Object.entries(typeObj.matieres || {}).forEach(([matiereKey, matiereObj]) => {
        const matiereMass = typeMass * (matiereObj.pourcentage / 100);
        
        Object.entries(matiereObj.fibres || {}).forEach(([fibreKey, fibreObj]) => {
          const fibrePct = typeof fibreObj === 'object' && fibreObj !== null 
            ? (fibreObj.pourcentage !== undefined ? fibreObj.pourcentage : fibreObj)
            : fibreObj;
          
          const fibreMass = matiereMass * (fibrePct / 100);
          
          // Agréger les masses par fibre
          fibreMasses[fibreKey] = (fibreMasses[fibreKey] || 0) + fibreMass;
          
          // Récupérer la couleur de la fibre si disponible
          if (!fibreColors[fibreKey] && fibreObj && fibreObj.color) {
            fibreColors[fibreKey] = fibreObj.color;
          }
        });
      });
    });
  });

  console.log('[processSeparation] Fibres trouvées:', fibreMasses);

  // Vérifier qu'on a exactement 2 fibres
  const fibreKeys = Object.keys(fibreMasses);
  if (fibreKeys.length !== 2) {
    console.warn('[processSeparation] Nombre de fibres incorrect:', fibreKeys.length, 'fibres trouvées:', fibreKeys);
    // Retourner le lot original comme targetLot, pas de coproduit
    return { 
      targetLot: JSON.parse(JSON.stringify(lot)), 
      coProductLot: null 
    };
  }

  // Créer les deux lots de sortie
  const [fibre1, fibre2] = fibreKeys;
  const mass1 = fibreMasses[fibre1];
  const mass2 = fibreMasses[fibre2];

  // Lot 1 - Première fibre
  const lot1 = {
    total: mass1,
    formats: {
      "fibre en vrac": {
        pourcentage: 100,
        types: {
          "fibre séparée": {
            pourcentage: 100,
            matieres: {
              [fibre1]: {
                pourcentage: 100,
                fibres: { [fibre1]: 100 }
              }
            },
            couleurs: {}
          }
        }
      }
    },
    qualite: JSON.parse(JSON.stringify(lot.qualite || {})),
    proprete: JSON.parse(JSON.stringify(lot.proprete || {})),
    titre: fibre1
  };

  // Ajouter la couleur si disponible
  if (fibreColors[fibre1]) {
    lot1.formats["fibre en vrac"].types["fibre séparée"].matieres[fibre1].color = fibreColors[fibre1];
  }

  // Lot 2 - Deuxième fibre
  const lot2 = {
    total: mass2,
    formats: {
      "fibre en vrac": {
        pourcentage: 100,
        types: {
          "fibre séparée": {
            pourcentage: 100,
            matieres: {
              [fibre2]: {
                pourcentage: 100,
                fibres: { [fibre2]: 100 }
              }
            },
            couleurs: {}
          }
        }
      }
    },
    qualite: JSON.parse(JSON.stringify(lot.qualite || {})),
    proprete: JSON.parse(JSON.stringify(lot.proprete || {})),
    titre: fibre2
  };

  // Ajouter la couleur si disponible
  if (fibreColors[fibre2]) {
    lot2.formats["fibre en vrac"].types["fibre séparée"].matieres[fibre2].color = fibreColors[fibre2];
  }

  console.log('[processSeparation] Lots de sortie:', { lot1, lot2 });

  return { targetLot: lot1, coProductLot: lot2 };
}

// Table de correspondance entre les noms techniques et les noms d'affichage
const transformationTypes = {
  selectByFormat: { 
    label: 'Sélection par format', 
    description: 'Sélectionne les articles selon leur format (vêtements, chaussures, etc.)',
    keyList: 'formats',
    requiredKey: true
  },
  selectByType: { 
    label: 'Sélection par type', 
    description: 'Sélectionne les articles selon leur type (après format)',
    keyList: 'types',
    requiredKey: true
  },
  selectByMatiere: { 
    label: 'Sélection par matière', 
    description: 'Sélectionne les articles selon leur matière',
    keyList: 'matieres',
    requiredKey: true
  },
  selectByQualite: { 
    label: 'Sélection par qualité', 
    description: 'Sélectionne les articles selon leur qualité',
    keyList: 'qualite',
    requiredKey: true
  },
  selectByCouleur: { 
    label: 'Sélection par couleur', 
    description: 'Sélectionne les articles selon leur couleur',
    keyList: 'couleurs',
    requiredKey: true
  },
  selectByFibre: { 
    label: 'Sélection par fibre', 
    description: 'Sélectionne les articles selon leur composition en fibres',
    keyList: 'fibres',
    requiredKey: true
  },
  selectByProprete: { 
    label: 'Sélection par propreté', 
    description: 'Sélectionne les articles selon leur propreté',
    keyList: 'proprete',
    requiredKey: true
  },
  selectByPerturbateur: { 
    label: 'Sélection par perturbateur', 
    description: 'Sélectionne les articles selon la présence de perturbateurs',
    keyList: 'perturbateurs',
    requiredKey: true
  },
  processLavage: { 
    label: 'Lavage', 
    description: 'Nettoie les articles et modifie leur état de propreté'
  },
  processDelissage: { 
    label: 'Délissage', 
    description: 'Transforme les articles en morceaux de tissu'
  },
  processSeparation: { 
    label: 'Séparation', 
    description: 'Sépare les fibres d\'un tissu composé'
  }
};

const transformationUtils = {
  getTransformationLabel(type) {
    return transformationTypes[type]?.label || type;
  },
  getTransformationDescription(type) {
    return transformationTypes[type]?.description || '';
  },
  getAvailableTransformations() {
    return Object.entries(transformationTypes).map(([value, info]) => ({
      value,
      label: info.label,
      description: info.description
    }));
  }
};

window.processes = {
  selectByFormat,
  selectByType,
  selectByMatiere,
  selectByQualite,
  selectByCouleur,
  selectByFibre,
  selectByProprete,
  selectByPerturbateur,
  processLavage,
  processDelissage,
  processSeparation
};

window.transformationUtils = transformationUtils;
window.transformationTypes = transformationTypes;

