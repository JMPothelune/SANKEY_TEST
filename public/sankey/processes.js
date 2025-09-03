// Nouvelle transformation adaptée à lotType : sélection par format
function selectByFormat(lot, selectedFormats) {
  // Deep clone pour ne pas modifier l'objet d'origine
  const dist = lot.formats;
  let selected = {};
  let rest = {};
  let selectedPct = 0;
  let restPct = 0;

  Object.entries(dist).forEach(([key, value]) => {
    // Comparer avec les bubble_id au lieu des noms
    if (selectedFormats.includes(value.bubble_id)) {
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
    selected[k].pourcentage = (selected[k].pourcentage / selectedPct) * 100;
  });
  Object.keys(rest).forEach(k => {
    rest[k].pourcentage = (rest[k].pourcentage / restPct) * 100;
  });

  // Création des deux lots avec deep clone
  const targetLot = JSON.parse(JSON.stringify(lot));
  targetLot.formats = selected;
  targetLot.total = (lot.total * selectedPct) / 100;

  const coProductLot = JSON.parse(JSON.stringify(lot));
  coProductLot.formats = rest;
  coProductLot.total = (lot.total * restPct) / 100;

  if (
    Math.abs(
      lot.total - ((targetLot?.total || 0) + (coProductLot?.total || 0))
    ) > 2
  ) {
    console.warn(
      '[selectByFormat] Poids incohérent : origine =',
      lot.total,
      'target =',
      targetLot?.total || 0,
      'reste =',
      coProductLot?.total || 0,
      'somme =',
      (targetLot?.total || 0) + (coProductLot?.total || 0)
    );
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
      // Comparer uniquement avec les bubble_id
      if (selectedTypes.includes(value.bubble_id)) {
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

    // Si aucun type n'est sélectionné, tout va au reste
    if (selectedPct === 0) {
      restPct = 100;
    }

    // Recalcul des pourcentages pour ce format
    Object.keys(selected).forEach(k => {
      if (selectedPct > 0)
        selected[k].pourcentage = (selected[k].pourcentage / selectedPct) * 100;
      else selected[k].pourcentage = 0;
    });
    Object.keys(rest).forEach(k => {
      if (restPct > 0)
        rest[k].pourcentage = (rest[k].pourcentage / restPct) * 100;
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
    console.warn(
      '[selectByType] Poids incohérent : origine =',
      lot.total,
      'target =',
      targetLot.total,
      'reste =',
      coProductLot.total,
      'somme =',
      targetLot.total + coProductLot.total
    );
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
        const typeMass =
          lot.total *
          (formatObj.pourcentage / 100) *
          (typeObj.pourcentage / 100);
        typeMassesRest[typeKey] = typeMass;
        formatRestMass += typeMass;
        return; // Passer au type suivant
      }

      Object.entries(matieresObj).forEach(([nom, matiere]) => {
        // Comparer avec les bubble_id au lieu des noms
        if (selectedMatieres.includes(matiere.bubble_id)) {
          selectedMatieresObj[nom] = JSON.parse(JSON.stringify(matiere));
          if (matiere.color) selectedMatieresObj[nom].color = matiere.color;
          selectedPct += matiere.pourcentage;
        } else {
          restMatieresObj[nom] = JSON.parse(JSON.stringify(matiere));
          if (matiere.color) restMatieresObj[nom].color = matiere.color;
          restPct += matiere.pourcentage;
        }
      });

      const typeMass =
        lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100);
      const selectedMass = typeMass * (selectedPct / 100);
      const restMass = typeMass * (restPct / 100);

      // Toujours ajouter le type, même si aucune matière n'est sélectionnée
      if (selectedPct > 0) {
        Object.keys(selectedMatieresObj).forEach(nom => {
          selectedMatieresObj[nom].pourcentage =
            (selectedMatieresObj[nom].pourcentage / selectedPct) * 100;
        });
        selectedTypes[typeKey] = {
          ...typeObj,
          matieres: selectedMatieresObj,
        };
        if (typeObj.color) selectedTypes[typeKey].color = typeObj.color;
        typeMassesSelected[typeKey] = selectedMass;
        formatSelectedMass += selectedMass;
      }

      // Toujours ajouter le type au reste, même si toutes les matières sont sélectionnées
      if (restPct > 0) {
        Object.keys(restMatieresObj).forEach(nom => {
          restMatieresObj[nom].pourcentage =
            (restMatieresObj[nom].pourcentage / restPct) * 100;
        });
        restTypes[typeKey] = {
          ...typeObj,
          matieres: restMatieresObj,
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
        selectedTypes[typeKey].pourcentage =
          (typeMassesSelected[typeKey] / formatSelectedMass) * 100;
      });
      targetLot.formats[formatKey].types = selectedTypes;
    }
    if (formatRestMass > 0) {
      Object.keys(restTypes).forEach(typeKey => {
        restTypes[typeKey].pourcentage =
          (typeMassesRest[typeKey] / formatRestMass) * 100;
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
    console.warn(
      '[selectByMatiere] Poids incohérent : origine =',
      lot.total,
      'target =',
      targetLot.total,
      'reste =',
      coProductLot.total,
      'somme =',
      targetLot.total + coProductLot.total
    );
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
    const pct =
      typeof value === 'object' && value !== null
        ? value.pourcentage !== undefined
          ? value.pourcentage
          : 0
        : value;

    // Comparer avec les bubble_id au lieu des noms
    if (selectedQualites.includes(value.bubble_id)) {
      selected[key] = {
        pourcentage: pct,
      };
      if (value.color) selected[key].color = value.color;
      selectedPct += pct;
    } else {
      rest[key] = {
        pourcentage: pct,
      };
      if (value.color) rest[key].color = value.color;
      restPct += pct;
    }
  });

  // Recalcul des pourcentages
  Object.keys(selected).forEach(k => {
    if (selectedPct > 0) {
      selected[k].pourcentage = (selected[k].pourcentage / selectedPct) * 100;
    } else {
      selected[k].pourcentage = 0;
    }
  });
  Object.keys(rest).forEach(k => {
    if (restPct > 0) {
      rest[k].pourcentage = (rest[k].pourcentage / restPct) * 100;
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

  if (
    Math.abs(
      lot.total - ((targetLot?.total || 0) + (coProductLot?.total || 0))
    ) > 2
  ) {
    console.warn(
      '[selectByQualite] Poids incohérent : origine =',
      lot.total,
      'target =',
      targetLot?.total || 0,
      'reste =',
      coProductLot?.total || 0,
      'somme =',
      (targetLot?.total || 0) + (coProductLot?.total || 0)
    );
  }

  return { targetLot, coProductLot };
}

// Sélectionne une ou plusieurs couleurs dans un lot
function selectByCouleur(lot, selectedCouleurs) {
  const targetLot = JSON.parse(JSON.stringify(lot));
  const coProductLot = JSON.parse(JSON.stringify(lot));
  let selectedMassTotal = 0;
  let restMassTotal = 0;

  // Initialiser les formats vides
  targetLot.formats = {};
  coProductLot.formats = {};

  Object.entries(lot.formats).forEach(([formatKey, formatObj]) => {
    const typesObj = formatObj.types;
    let selectedTypes = {};
    let restTypes = {};
    let typeMassesSelected = {};
    let typeMassesRest = {};
    let formatSelectedMass = 0;
    let formatRestMass = 0;

    Object.entries(typesObj).forEach(([typeKey, typeObj]) => {
      const couleursObj = typeObj.couleurs || {};
      let selectedCouleursObj = {};
      let restCouleursObj = {};
      let selectedPct = 0;
      let restPct = 0;

      // Si le type n'a pas de couleurs, le traiter comme un type "reste"
      if (Object.keys(couleursObj).length === 0) {
        restTypes[typeKey] = JSON.parse(JSON.stringify(typeObj));
        if (typeObj.color) restTypes[typeKey].color = typeObj.color;
        const typeMass =
          lot.total *
          (formatObj.pourcentage / 100) *
          (typeObj.pourcentage / 100);
        typeMassesRest[typeKey] = typeMass;
        formatRestMass += typeMass;
        return; // Passer au type suivant
      }

      Object.entries(couleursObj).forEach(([couleur, couleurObj]) => {
        // Comparer avec les bubble_id au lieu des noms
        if (selectedCouleurs.includes(couleurObj.bubble_id)) {
          selectedCouleursObj[couleur] = JSON.parse(JSON.stringify(couleurObj));
          if (couleurObj.color)
            selectedCouleursObj[couleur].color = couleurObj.color;
          selectedPct += couleurObj.pourcentage;
        } else {
          restCouleursObj[couleur] = JSON.parse(JSON.stringify(couleurObj));
          if (couleurObj.color)
            restCouleursObj[couleur].color = couleurObj.color;
          restPct += couleurObj.pourcentage;
        }
      });

      const typeMass =
        lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100);
      const selectedMass = typeMass * (selectedPct / 100);
      const restMass = typeMass * (restPct / 100);

      // Toujours ajouter le type, même si aucune couleur n'est sélectionnée
      if (selectedPct > 0) {
        Object.keys(selectedCouleursObj).forEach(couleur => {
          selectedCouleursObj[couleur].pourcentage =
            (selectedCouleursObj[couleur].pourcentage / selectedPct) * 100;
        });
        selectedTypes[typeKey] = {
          ...typeObj,
          couleurs: selectedCouleursObj,
        };
        if (typeObj.color) selectedTypes[typeKey].color = typeObj.color;
        typeMassesSelected[typeKey] = selectedMass;
        formatSelectedMass += selectedMass;
      }

      // Toujours ajouter le type au reste, même si toutes les couleurs sont sélectionnées
      if (restPct > 0) {
        Object.keys(restCouleursObj).forEach(couleur => {
          restCouleursObj[couleur].pourcentage =
            (restCouleursObj[couleur].pourcentage / restPct) * 100;
        });
        restTypes[typeKey] = {
          ...typeObj,
          couleurs: restCouleursObj,
        };
        if (typeObj.color) restTypes[typeKey].color = typeObj.color;
        typeMassesRest[typeKey] = restMass;
        formatRestMass += restMass;
      }

      // Si le type n'a ni couleurs sélectionnées ni couleurs restantes, l'ajouter au reste
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
        selectedTypes[typeKey].pourcentage =
          (typeMassesSelected[typeKey] / formatSelectedMass) * 100;
      });
      targetLot.formats[formatKey] = {
        ...formatObj,
        types: selectedTypes,
        pourcentage: (formatSelectedMass / lot.total) * 100,
      };
    }
    if (formatRestMass > 0) {
      Object.keys(restTypes).forEach(typeKey => {
        restTypes[typeKey].pourcentage =
          (typeMassesRest[typeKey] / formatRestMass) * 100;
      });
      coProductLot.formats[formatKey] = {
        ...formatObj,
        types: restTypes,
        pourcentage: (formatRestMass / lot.total) * 100,
      };
    }

    // Si le format n'a pas de types avec couleurs, l'ajouter au reste
    if (formatSelectedMass === 0 && formatRestMass === 0) {
      const formatMass = lot.total * (formatObj.pourcentage / 100);
      coProductLot.formats[formatKey] = {
        ...formatObj,
        types: typesObj, // Garder tous les types
        pourcentage: (formatMass / lot.total) * 100,
      };
      restMassTotal += formatMass;
    } else {
      selectedMassTotal += formatSelectedMass;
      restMassTotal += formatRestMass;
    }
  });

  // Mise à jour des totaux
  targetLot.total = selectedMassTotal;
  coProductLot.total = restMassTotal;

  if (Math.abs(lot.total - (targetLot.total + coProductLot.total)) > 2) {
    console.warn(
      '[selectByCouleur] Poids incohérent : origine =',
      lot.total,
      'target =',
      targetLot.total,
      'reste =',
      coProductLot.total,
      'somme =',
      targetLot.total + coProductLot.total
    );
  }

  return { targetLot, coProductLot };
}

// Sélectionne une ou plusieurs fibres dans un lot
function selectByFibre(
  lot,
  selectedFibres,
  threshold = null,
  condition = null
) {
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
        const hasSelectedFibre =
          matiere.fibres &&
          Object.entries(matiere.fibres).some(([fibre, fibreObj]) => {
            const pctFibre =
              typeof fibreObj === 'object' && fibreObj !== null
                ? fibreObj.pourcentage !== undefined
                  ? fibreObj.pourcentage
                  : fibreObj
                : fibreObj;
            // Comparer avec les bubble_id au lieu des noms
            if (!selectedFibres.includes(fibreObj.bubble_id)) return false;
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

      const typeMass =
        lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100);
      const selectedMass = typeMass * (selectedPct / 100);
      const restMass = typeMass * (restPct / 100);

      if (selectedPct > 0) {
        Object.keys(selectedMatieresObj).forEach(nom => {
          selectedMatieresObj[nom].pourcentage =
            (selectedMatieresObj[nom].pourcentage / selectedPct) * 100;
        });
        selectedTypes[typeKey] = {
          ...typeObj,
          matieres: selectedMatieresObj,
        };
        if (typeObj.color) selectedTypes[typeKey].color = typeObj.color;
        typeMassesSelected[typeKey] = selectedMass;
        formatSelectedMass += selectedMass;
      }
      if (restPct > 0) {
        Object.keys(restMatieresObj).forEach(nom => {
          restMatieresObj[nom].pourcentage =
            (restMatieresObj[nom].pourcentage / restPct) * 100;
        });
        restTypes[typeKey] = {
          ...typeObj,
          matieres: restMatieresObj,
        };
        if (typeObj.color) restTypes[typeKey].color = typeObj.color;
        typeMassesRest[typeKey] = restMass;
        formatRestMass += restMass;
      }
    });

    // Recalcul des pourcentages des types dans chaque format
    if (formatSelectedMass > 0) {
      Object.keys(selectedTypes).forEach(typeKey => {
        selectedTypes[typeKey].pourcentage =
          (typeMassesSelected[typeKey] / formatSelectedMass) * 100;
      });
      targetLot.formats[formatKey].types = selectedTypes;
    }
    if (formatRestMass > 0) {
      Object.keys(restTypes).forEach(typeKey => {
        restTypes[typeKey].pourcentage =
          (typeMassesRest[typeKey] / formatRestMass) * 100;
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
    console.warn(
      '[selectByFibre] Poids incohérent : origine =',
      lot.total,
      'target =',
      targetLot.total,
      'reste =',
      coProductLot.total,
      'somme =',
      targetLot.total + coProductLot.total
    );
  }

  return { targetLot, coProductLot };
}

function selectByProprete(lot, selectedProprete) {
  // Accepte un tableau ou une valeur unique
  const selectedArray = Array.isArray(selectedProprete)
    ? selectedProprete
    : [selectedProprete];
  const targetLot = JSON.parse(JSON.stringify(lot));
  const coProductLot = JSON.parse(JSON.stringify(lot));

  // Calculer les masses pour chaque lot
  let targetMass = 0;
  let coProductMass = 0;

  if (lot.proprete) {
    Object.entries(lot.proprete).forEach(([prop, pct]) => {
      const mass = lot.total * (pct.pourcentage / 100);
      // Comparer avec les bubble_id au lieu des noms
      if (selectedArray.includes(pct.bubble_id)) {
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
      // Comparer avec les bubble_id au lieu des noms
      if (selectedArray.includes(pct.bubble_id)) {
        targetProprete[prop] = {
          pourcentage: (pct.pourcentage * lot.total) / targetMass,
        };
        if (pct.color) targetProprete[prop].color = pct.color;
      }
    });
    targetLot.proprete = targetProprete;
  }

  if (coProductMass > 0) {
    const coProductProprete = {};
    Object.entries(lot.proprete).forEach(([prop, pct]) => {
      // Comparer avec les bubble_id au lieu des noms
      if (!selectedArray.includes(pct.bubble_id)) {
        coProductProprete[prop] = {
          pourcentage: (pct.pourcentage * lot.total) / coProductMass,
        };
        if (pct.color) coProductProprete[prop].color = pct.color;
      }
    });
    coProductLot.proprete = coProductProprete;
  }

  if (
    Math.abs(
      lot.total - ((targetLot?.total || 0) + (coProductLot?.total || 0))
    ) > 2
  ) {
    console.warn(
      '[selectByProprete] Poids incohérent : origine =',
      lot.total,
      'target =',
      targetLot?.total || 0,
      'reste =',
      coProductLot?.total || 0,
      'somme =',
      (targetLot?.total || 0) + (coProductLot?.total || 0)
    );
  }

  return { targetLot, coProductLot };
}

// Sélectionne un ou plusieurs perturbateurs dans un lot
function selectByPerturbateur(lot, selectedPerturbateurs) {
  // Deep clone pour ne pas modifier l'objet d'origine
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
      const perturbateursObj = typeObj.perturbateurs || {};
      let selectedPerturbateursObj = {};
      let restPerturbateursObj = {};
      let selectedPct = 0;
      let restPct = 0;

      // Si le type n'a pas de perturbateurs, le traiter comme un type "reste"
      if (Object.keys(perturbateursObj).length === 0) {
        restTypes[typeKey] = JSON.parse(JSON.stringify(typeObj));
        if (typeObj.color) restTypes[typeKey].color = typeObj.color;
        const typeMass =
          lot.total *
          (formatObj.pourcentage / 100) *
          (typeObj.pourcentage / 100);
        typeMassesRest[typeKey] = typeMass;
        formatRestMass += typeMass;
        return; // Passer au type suivant
      }

      Object.entries(perturbateursObj).forEach(([nom, perturbateur]) => {
        // Comparer avec les bubble_id au lieu des noms
        if (selectedPerturbateurs.includes(perturbateur.bubble_id)) {
          selectedPerturbateursObj[nom] = JSON.parse(
            JSON.stringify(perturbateur)
          );
          if (perturbateur.color)
            selectedPerturbateursObj[nom].color = perturbateur.color;
          selectedPct += perturbateur.pourcentage;
        } else {
          restPerturbateursObj[nom] = JSON.parse(JSON.stringify(perturbateur));
          if (perturbateur.color)
            restPerturbateursObj[nom].color = perturbateur.color;
          restPct += perturbateur.pourcentage;
        }
      });

      const typeMass =
        lot.total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100);
      const selectedMass = typeMass * (selectedPct / 100);
      const restMass = typeMass * (restPct / 100);

      // Toujours ajouter le type, même si aucun perturbateur n'est sélectionné
      if (selectedPct > 0) {
        Object.keys(selectedPerturbateursObj).forEach(nom => {
          selectedPerturbateursObj[nom].pourcentage =
            (selectedPerturbateursObj[nom].pourcentage / selectedPct) * 100;
        });
        selectedTypes[typeKey] = {
          ...typeObj,
          perturbateurs: selectedPerturbateursObj,
        };
        if (typeObj.color) selectedTypes[typeKey].color = typeObj.color;
        typeMassesSelected[typeKey] = selectedMass;
        formatSelectedMass += selectedMass;
      }

      if (restPct > 0) {
        Object.keys(restPerturbateursObj).forEach(nom => {
          restPerturbateursObj[nom].pourcentage =
            (restPerturbateursObj[nom].pourcentage / restPct) * 100;
        });
        restTypes[typeKey] = {
          ...typeObj,
          perturbateurs: restPerturbateursObj,
        };
        if (typeObj.color) restTypes[typeKey].color = typeObj.color;
        typeMassesRest[typeKey] = restMass;
        formatRestMass += restMass;
      }
    });

    // Mise à jour des formats dans les deux lots
    if (Object.keys(selectedTypes).length > 0) {
      targetLot.formats[formatKey] = {
        ...formatObj,
        types: selectedTypes,
      };
      if (formatObj.color) targetLot.formats[formatKey].color = formatObj.color;
      selectedMassTotal += formatSelectedMass;
    }

    if (Object.keys(restTypes).length > 0) {
      coProductLot.formats[formatKey] = {
        ...formatObj,
        types: restTypes,
      };
      if (formatObj.color)
        coProductLot.formats[formatKey].color = formatObj.color;
      restMassTotal += formatRestMass;
    }
  });

  // Mise à jour des totaux
  targetLot.total = selectedMassTotal;
  coProductLot.total = restMassTotal;

  if (Math.abs(lot.total - (targetLot.total + coProductLot.total)) > 2) {
    console.warn(
      '[selectByPerturbateur] Poids incohérent : origine =',
      lot.total,
      'target =',
      targetLot.total,
      'reste =',
      coProductLot.total,
      'somme =',
      targetLot.total + coProductLot.total
    );
  }

  return { targetLot, coProductLot };
}

// Table de correspondance entre les noms techniques et les noms d'affichage
const transformationTypes = {
  selectByFormat: {
    label: 'Sélection par format',
    description:
      'Sélectionne les articles selon leur format (vêtements, chaussures, etc.)',
    keyList: 'formats',
    requiredKey: true,
    step: 'sorting',
  },
  selectByType: {
    label: 'Sélection par type',
    description: 'Sélectionne les articles selon leur type (après format)',
    keyList: 'types',
    requiredKey: true,
    step: 'sorting',
  },
  selectByMatiere: {
    label: 'Sélection par matière',
    description: 'Sélectionne les articles selon leur matière',
    keyList: 'matieres',
    requiredKey: true,
    step: 'sorting',
  },
  selectByQualite: {
    label: 'Sélection par qualité',
    description: 'Sélectionne les articles selon leur qualité',
    keyList: 'qualite',
    requiredKey: true,
    step: 'sorting',
  },
  selectByCouleur: {
    label: 'Sélection par couleur',
    description: 'Sélectionne les articles selon leur couleur',
    keyList: 'couleurs',
    requiredKey: true,
    step: 'sorting',
  },
  selectByFibre: {
    label: 'Sélection par fibre',
    description: 'Sélectionne les articles selon leur composition en fibres',
    keyList: 'fibres',
    requiredKey: true,
    step: 'sorting',
  },
  selectByProprete: {
    label: 'Sélection par propreté',
    description: 'Sélectionne les articles selon leur propreté',
    keyList: 'proprete',
    requiredKey: true,
    step: 'sorting',
  },
  selectByPerturbateur: {
    label: 'Sélection par perturbateur',
    description: 'Sélectionne les articles selon la présence de perturbateurs',
    keyList: 'perturbateurs',
    requiredKey: true,
    step: 'sorting',
  },
};

// Cache pour les transformations dynamiques
let dynamicTransfosCache = new Map();
let dynamicTransfosLoaded = false;

// Fonction pour charger les transformations dynamiques depuis l'API Bubble
async function loadDynamicTransformations() {
  try {
    const params = getUrlParams();
    const isLive = params.isLive === 'yes';

    const response = await fetch('/api/bubble', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'transfos',
        params: { isLive },
        method: 'GET',
      }),
    });

    if (!response.ok) {
      console.warn(
        'Impossible de charger les transformations dynamiques:',
        response.status
      );
      return [];
    }

    const data = await response.json();
    console.log('Transformations dynamiques chargées:', data);

    // Vider le cache
    dynamicTransfosCache.clear();

    // Mettre en cache les transformations
    Object.entries(data).forEach(([title, transfo]) => {
      dynamicTransfosCache.set(transfo.bubble_id, {
        ...transfo,
        title: title,
      });
    });

    // ← NOUVEAU : Charger les détails complets de chaque transformation
    console.log('Chargement des détails complets des transformations...');
    const detailedTransformations = [];

    for (const [title, transfo] of Object.entries(data)) {
      try {
        const detailedTransfo = await getDetailedTransfo(
          transfo.bubble_id,
          params.isLive
        );
        if (detailedTransfo) {
          // Mettre à jour le cache avec les détails complets
          dynamicTransfosCache.set(transfo.bubble_id, {
            ...detailedTransfo,
            title: title,
          });
          detailedTransformations.push(detailedTransfo);
          console.log(`Détails chargés pour ${title}:`, detailedTransfo);
        }
      } catch (error) {
        console.warn(
          `Erreur lors du chargement des détails pour ${title}:`,
          error
        );
        // Garder la version basique en cache
      }
    }

    console.log('Cache mis à jour avec les détails complets');

    dynamicTransfosLoaded = true;
    return Array.from(dynamicTransfosCache.values());
  } catch (error) {
    console.warn(
      'Erreur lors du chargement des transformations dynamiques:',
      error
    );
    return [];
  }
}

// Fonction pour obtenir une transformation dynamique par son ID
function getDynamicTransfo(bubbleId) {
  return dynamicTransfosCache.get(bubbleId);
}

// ← NOUVELLE FONCTION : Obtenir les détails complets d'une transformation
async function getDetailedTransfo(bubbleId, isLive) {
  try {
    const response = await fetch('/api/bubble', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'transfo',
        params: { id: bubbleId, isLive },
        method: 'POST',
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Détails complets pour ${bubbleId}:`, data);
    return data;
  } catch (error) {
    console.error(
      `Erreur lors du chargement des détails pour ${bubbleId}:`,
      error
    );
    return null;
  }
}

const transformationUtils = {
  getTransformationLabel(type) {
    // Vérifier d'abord les transformations statiques
    if (transformationTypes[type]) {
      return transformationTypes[type].label;
    }

    // Vérifier les transformations dynamiques
    if (type.startsWith('dynamic_transfo_')) {
      const bubbleId = type.replace('dynamic_transfo_', '');
      const transfo = getDynamicTransfo(bubbleId);
      return transfo ? transfo.title : type;
    }

    return type;
  },

  getTransformationDescription(type) {
    // Vérifier d'abord les transformations statiques
    if (transformationTypes[type]) {
      return transformationTypes[type].description;
    }

    // Vérifier les transformations dynamiques
    if (type.startsWith('dynamic_transfo_')) {
      const bubbleId = type.replace('dynamic_transfo_', '');
      const transfo = getDynamicTransfo(bubbleId);
      return transfo ? `Transformation dynamique: ${transfo.step}` : '';
    }

    return '';
  },

  async getAvailableTransformations() {
    // Transformations statiques
    const staticTransformations = Object.entries(transformationTypes).map(
      ([value, info]) => ({
        value,
        label: info.label,
        description: info.description,
        isStatic: true,
      })
    );

    // Charger les transformations dynamiques si pas encore fait
    if (!dynamicTransfosLoaded) {
      await loadDynamicTransformations();
    }

    // Transformations dynamiques
    const dynamicTransformations = Array.from(
      dynamicTransfosCache.values()
    ).map(transfo => ({
      value: `dynamic_transfo_${transfo.bubble_id}`,
      label: transfo.title,
      description: `Transformation dynamique: ${transfo.step}`,
      isDynamic: true,
      bubbleId: transfo.bubble_id,
      version: transfo.version,
    }));

    // Retourner avec séparateur
    return [
      ...staticTransformations,
      {
        value: 'separator',
        label: '--- Transformations dynamiques ---',
        isSeparator: true,
      },
      ...dynamicTransformations,
    ];
  },

  // Fonction pour obtenir les détails d'une transformation dynamique
  async getDynamicTransfoDetails(bubbleId) {
    if (dynamicTransfosCache.has(bubbleId)) {
      return dynamicTransfosCache.get(bubbleId);
    }

    try {
      const params = getUrlParams();
      const isLive = params.isLive === 'yes';

      const response = await fetch('/api/bubble', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: 'transfo',
          params: { id: bubbleId, isLive },
          method: 'POST',
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();

      // Mettre à jour le cache
      dynamicTransfosCache.set(bubbleId, data);

      return data;
    } catch (error) {
      console.error(
        'Erreur lors du chargement des détails de la transformation:',
        error
      );
      return null;
    }
  },

  // Fonction synchrone pour obtenir les détails depuis le cache uniquement
  getDynamicTransfoDetailsSync(bubbleId) {
    if (dynamicTransfosCache.has(bubbleId)) {
      return dynamicTransfosCache.get(bubbleId);
    }
    return null;
  },
};

// Fonction pour exécuter les transformations dynamiques
function executeDynamicTransfo(lot, transfoDetails) {
  console.log('executeDynamicTransfo appelée avec:', { lot, transfoDetails });

  // Utiliser le moteur de transformation générique unifié
  if (!window.genericTransformationEngine) {
    window.genericTransformationEngine = new GenericTransformationEngine();
  }

  return window.genericTransformationEngine.executeTransformation(
    lot,
    transfoDetails
  );
}

window.processes = {
  selectByFormat,
  selectByType,
  selectByMatiere,
  selectByQualite,
  selectByCouleur,
  selectByFibre,
  selectByProprete,
  selectByPerturbateur,
  executeDynamicTransfo,
};

window.transformationUtils = transformationUtils;
window.transformationTypes = transformationTypes;

// ← NOUVEAU : Exposer le cache globalement pour le debug
window.dynamicTransfosCache = dynamicTransfosCache;
window.dynamicTransfosLoaded = dynamicTransfosLoaded;

// MOTEUR GÉNÉRIQUE UNIFIÉ : Une seule logique pour TOUTES les transformations dynamiques
class GenericTransformationEngine {
  constructor() {
    // Import de la Bible des dimensions depuis config/dimensions.js
    this.dimensionHierarchy = window.DIMENSION_HIERARCHY;
    this.processingOrder = window.DIMENSION_PROCESSING_ORDER;

    if (!this.processingOrder) {
      console.error(
        'DIMENSION_PROCESSING_ORDER non trouvé ! Vérifiez que config/dimensions.js est chargé'
      );
      // Fallback si le fichier n'est pas chargé
      this.processingOrder = [
        'formats',
        'types',
        'matieres',
        'fibres',
        'couleurs',
        'perturbateurs',
        'proprete',
        'qualite',
      ];
    }
  }

  // Méthode principale qui orchestre la transformation
  executeTransformation(lot, transfoDetails) {
    console.log(
      'GenericTransformationEngine.executeTransformation appelée pour:',
      transfoDetails.title
    );

    // Vérifications de base
    if (!transfoDetails || !transfoDetails.dimensions) {
      console.error('transfoDetails ou dimensions manquants:', transfoDetails);
      throw new Error('Configuration de transformation invalide');
    }

    // 1. Identifier la dimension primaire selon les règles du .md
    const primaryDimension = this.identifyPrimaryDimension(
      transfoDetails.dimensions
    );
    console.log('Dimension primaire identifiée:', primaryDimension);

    if (!primaryDimension) {
      throw new Error(
        'Aucune dimension primaire identifiée pour la transformation'
      );
    }

    // 2. Appliquer la transformation selon la hiérarchie de config/dimensions.js
    const transformedLot = this.applyHierarchicalTransformation(
      lot,
      transfoDetails,
      primaryDimension
    );

    // 3. Créer la structure attendue { targetLot, coProductLot }
    const targetLot = { ...transformedLot };
    const coProductLot = { ...lot };

    // Appliquer le yield
    const yieldPercent = transfoDetails.yield || 100;
    targetLot.total = (lot.total * yieldPercent) / 100;
    coProductLot.total = (lot.total * (100 - yieldPercent)) / 100;

    // Ajouter les titres
    targetLot.title = transfoDetails.title || 'Transformation dynamique';
    coProductLot.title = `Co-produit ${transfoDetails.title || 'dynamique'}`;

    return { targetLot, coProductLot };
  }

  // Identifier la dimension primaire selon les règles du .md
  identifyPrimaryDimension(dimensions) {
    // Règle 1: Dimension avec co-produit défini
    for (const [dimension, config] of Object.entries(dimensions)) {
      if (this.hasCoproduct(config.coproduct)) {
        console.log(`Dimension primaire trouvée par co-produit: ${dimension}`);
        return dimension;
      }
    }

    // Règle 2: Première dimension avec target défini selon DIMENSION_PROCESSING_ORDER
    // de config/dimensions.js
    for (const dimension of this.processingOrder) {
      if (this.hasTarget(dimensions[dimension]?.target)) {
        console.log(`Dimension primaire trouvée par target: ${dimension}`);
        return dimension;
      }
    }

    console.log('Aucune dimension primaire identifiée');
    return null;
  }

  // Appliquer la transformation selon la hiérarchie
  applyHierarchicalTransformation(lot, transfoDetails, primaryDimension) {
    console.log(
      'Application de la transformation hiérarchique selon:',
      this.processingOrder
    );

    // 1. PRÉSERVER LA STRUCTURE COMPLÈTE du lot d'origine avec deep clone
    let processedLot = JSON.parse(JSON.stringify(lot));

    // 2. Traitement séquentiel selon DIMENSION_PROCESSING_ORDER de config/dimensions.js
    for (const dimension of this.processingOrder) {
      const dimensionConfig = transfoDetails.dimensions[dimension];

      if (this.hasConfiguration(dimensionConfig)) {
        console.log(`Traitement de la dimension: ${dimension}`);
        processedLot = this.processDimension(
          processedLot,
          dimensionConfig,
          dimension
        );
      }
    }

    return processedLot;
  }

  // Traiter une dimension spécifique
  processDimension(lot, dimensionConfig, dimensionName) {
    const { input, target, coproduct } = dimensionConfig;

    // Filtrage par critères d'entrée
    if (this.hasInputCriteria(input)) {
      console.log(`Filtrage par critères d'entrée pour ${dimensionName}`);
      lot = this.filterByInputCriteria(lot, input, dimensionName);
    }

    // Application de la transformation cible
    if (this.hasTarget(target)) {
      console.log(
        `Application de la transformation cible pour ${dimensionName}`
      );
      lot = this.applyTargetTransformation(lot, target, dimensionName);
    }

    // Gestion des co-produits
    if (this.hasCoproduct(coproduct)) {
      console.log(`Gestion des co-produits pour ${dimensionName}`);
      lot = this.handleCoproducts(lot, coproduct, dimensionName);
    }

    return lot;
  }

  // Vérifier si une dimension a une configuration
  hasConfiguration(dimensionConfig) {
    return (
      dimensionConfig &&
      (this.hasInputCriteria(dimensionConfig.input) ||
        this.hasTarget(dimensionConfig.target) ||
        this.hasCoproduct(dimensionConfig.coproduct))
    );
  }

  // Vérifier si des critères d'entrée sont définis
  hasInputCriteria(input) {
    return input && Object.keys(input).length > 0;
  }

  // Vérifier si une transformation cible est définie
  hasTarget(target) {
    return target && Object.keys(target).length > 0;
  }

  // Vérifier si des co-produits sont définis
  hasCoproduct(coproduct) {
    return coproduct && Object.keys(coproduct).length > 0;
  }

  // Filtrer le lot selon les critères d'entrée
  filterByInputCriteria(lot, input, dimensionName) {
    // Filtrage par bubble_id selon les critères d'entrée
    const inputBubbleIds = Object.values(input).map(item => item.bubble_id);

    if (inputBubbleIds.length === 0) {
      return lot; // Aucun critère = accepte tout
    }

    // Filtrer le lot selon les bubble_ids d'entrée avec deep clone
    const filteredLot = JSON.parse(JSON.stringify(lot));
    filteredLot[dimensionName] = {};

    for (const [key, value] of Object.entries(lot[dimensionName] || {})) {
      if (inputBubbleIds.includes(value.bubble_id)) {
        filteredLot[dimensionName][key] = value;
      }
    }

    return filteredLot;
  }

  // Appliquer la transformation cible
  applyTargetTransformation(lot, target, dimensionName) {
    // Concaténation de toutes les clés en une seule clé cible
    const targetBubbleId = Object.values(target)[0].bubble_id;
    const targetKey = Object.keys(target)[0];

    // Deep clone pour préserver la structure complète
    const transformedLot = JSON.parse(JSON.stringify(lot));

    // Remplacer SEULEMENT la dimension spécifiée
    transformedLot[dimensionName] = {};

    // Créer la nouvelle clé cible en préservant TOUTES les propriétés
    const targetValue = Object.values(target)[0];
    transformedLot[dimensionName][targetKey] = { ...targetValue };

    // Concaténer les distributions existantes de cette dimension
    const existingKeys = Object.keys(lot[dimensionName] || {});
    if (existingKeys.length > 0) {
      // Récupérer la première clé existante pour copier ses propriétés (color, etc.)
      const firstExistingKey = existingKeys[0];
      const firstExistingValue = lot[dimensionName][firstExistingKey];

      // Préserver les propriétés importantes (color, pourcentage, etc.)
      if (firstExistingValue.color) {
        transformedLot[dimensionName][targetKey].color =
          firstExistingValue.color;
      }
      if (firstExistingValue.pourcentage !== undefined) {
        // Calculer le pourcentage total concaténé
        let totalPourcentage = 0;
        existingKeys.forEach(key => {
          const value = lot[dimensionName][key];
          if (value && value.pourcentage !== undefined) {
            totalPourcentage += value.pourcentage;
          }
        });
        transformedLot[dimensionName][targetKey].pourcentage = totalPourcentage;
      }

      console.log(
        `Transformation appliquée: ${existingKeys.join(', ')} → ${targetKey} avec pourcentage total: ${transformedLot[dimensionName][targetKey].pourcentage}`
      );
    }

    return transformedLot;
  }

  // Gérer les co-produits
  handleCoproducts(lot, coproduct, dimensionName) {
    // Gestion des co-produits avec pourcentages
    // TODO: Implémenter la logique de distribution des co-produits
    console.log(`Co-produits à gérer pour ${dimensionName}:`, coproduct);

    return lot;
  }
}

// Exposer le moteur de transformation générique globalement
window.GenericTransformationEngine = GenericTransformationEngine;
