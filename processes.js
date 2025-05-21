function processLavage(lot, keys = [], params = {}) {
  // params.yield = rendement (par défaut 1)
  const yieldPct = params.yield !== undefined ? params.yield : 1;
  const newLot = JSON.parse(JSON.stringify(lot));
  newLot.proprete = { propre: 100 };
  newLot.total = lot.total * yieldPct;
  // Pas de coproduit si yield = 1
  let coProductLot = null;
  if (yieldPct < 1) {
    coProductLot = JSON.parse(JSON.stringify(lot));
    coProductLot.total = lot.total * (1 - yieldPct);
    // Optionnel : marquer comme "pertes"
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
    Object.entries(lot.format || {}).forEach(([formatKey, formatObj]) => {
      const formatMass = mass * (formatObj.pourcentage / 100);
      Object.entries(formatObj.types || {}).forEach(([typeKey, typeObj]) => {
        const typeMass = formatMass * (typeObj.pourcentage / 100);
        // Matières
        Object.entries(typeObj.matieres || {}).forEach(([matiereKey, matiereObj]) => {
          const matiereMass = typeMass * (matiereObj.pourcentage / 100);
          matieres[matiereKey] = (matieres[matiereKey] || 0) + matiereMass;
          totalMatiereMass += matiereMass;
          // Fibres
          Object.entries(matiereObj.fibres || {}).forEach(([fibreKey, fibrePct]) => {
            const fibreMass = matiereMass * (fibrePct / 100);
            if (!fibres[matiereKey]) fibres[matiereKey] = {};
            fibres[matiereKey][fibreKey] = (fibres[matiereKey][fibreKey] || 0) + fibreMass;
          });
        });
        // Couleurs
        Object.entries(typeObj.couleurs || {}).forEach(([couleurKey, couleurObj]) => {
          const couleurPct = typeof couleurObj === 'number' ? couleurObj : couleurObj.pourcentage;
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
    const couleursPct = {};
    Object.entries(couleurs).forEach(([k, v]) => {
      couleursPct[k] = totalCouleurMass > 0 ? (v / totalCouleurMass) * 100 : 0;
    });
    return { matieresPct, fibresPct, couleursPct };
  }

  // Fusion pondérée de la répartition d'origine
  const { matieresPct, fibresPct, couleursPct } = mergeDistrib(lot, total);

  // Création du lot principal (morceaux de tissu)
  const mainLot = JSON.parse(JSON.stringify(lot));
  mainLot.total = total * yieldPct;
  mainLot.format = {
    "tissu": {
      pourcentage: 100,
      types: {
        "morceaux de tissu": {
          pourcentage: 100,
          matieres: {},
          couleurs: {},
        }
      }
    }
  };
  // Applique la répartition fusionnée
  Object.entries(matieresPct).forEach(([matiere, pct]) => {
    mainLot.format["tissu"].types["morceaux de tissu"].matieres[matiere] = {
      pourcentage: pct,
      fibres: fibresPct[matiere] || {}
    };
  });
  mainLot.format["tissu"].types["morceaux de tissu"].couleurs = couleursPct;

  // Création du coproduit (points durs)
  let coProductLot = null;
  if (yieldPct < 1) {
    coProductLot = JSON.parse(JSON.stringify(lot));
    coProductLot.total = total * (1 - yieldPct);
    coProductLot.format = {
      "tissu": {
        pourcentage: 100,
        types: {
          "points durs": {
            pourcentage: 100,
            matieres: {},
            couleurs: {},
          }
        }
      }
    };
    Object.entries(matieresPct).forEach(([matiere, pct]) => {
      coProductLot.format["tissu"].types["points durs"].matieres[matiere] = {
        pourcentage: pct,
        fibres: fibresPct[matiere] || {}
      };
    });
    coProductLot.format["tissu"].types["points durs"].couleurs = couleursPct;
  }

  return { targetLot: mainLot, coProductLot };
}

window.processes = {
  lavage: processLavage,
  delissage: processDelissage
};

