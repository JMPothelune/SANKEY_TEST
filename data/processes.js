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
  mainlot.formats = {
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
    mainlot.formats["tissu"].types["morceaux de tissu"].matieres[matiere] = {
      pourcentage: pct,
      fibres: fibresPct[matiere] || {}
    };
  });
  mainlot.formats["tissu"].types["morceaux de tissu"].couleurs = couleursPct;

  // Création du coproduit (points durs)
  let coProductLot = null;
  if (yieldPct < 1) {
    coProductLot = JSON.parse(JSON.stringify(lot));
    coProductLot.total = total * (1 - yieldPct);
    coProductlot.formats = {
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
      coProductlot.formats["tissu"].types["points durs"].matieres[matiere] = {
        pourcentage: pct,
        fibres: fibresPct[matiere] || {}
      };
    });
    coProductlot.formats["tissu"].types["points durs"].couleurs = couleursPct;
  }

  delete mainLot.titre;
  if (coProductLot) delete coProductLot.titre;

  return { targetLot: mainLot, coProductLot };
}

function processSeparation(lot, keys = [], params = {}) {
  const total = lot.total || 0;
  const fibreLots = {};

  Object.entries(lot.formats || {}).forEach(([formatKey, formatObj]) => {
    Object.entries(formatObj.types || {}).forEach(([typeKey, typeObj]) => {
      const typeMass = total * (formatObj.pourcentage / 100) * (typeObj.pourcentage / 100);
      const matieres = Object.entries(typeObj.matieres || {});
      if (matieres.length !== 1) return; // On ne traite que les types à une seule matière
      const [matiereKey, matiereObj] = matieres[0];
      const fibres = Object.entries(matiereObj.fibres || {});
      if (fibres.length !== 2) return; // On ne traite que les matières à 2 fibres
      fibres.forEach(([fibre, fibrePct]) => {
        const fibreMass = typeMass * (fibrePct / 100);
        if (!fibreLots[fibre]) fibreLots[fibre] = [];
        // Création du sous-lot pour cette fibre
        const lotFibre = {
          total: fibreMass,
          format: {
            "tissu": {
              pourcentage: 100,
              types: {
                "matrice": {
                  pourcentage: 100,
                  matieres: {
                    [matiereKey]: {
                      pourcentage: 100,
                      fibres: { [fibre]: 100 }
                    }
                  },
                  couleurs: JSON.parse(JSON.stringify(typeObj.couleurs || {}))
                }
              }
            }
          },
          qualite: JSON.parse(JSON.stringify(lot.qualite || {})),
          proprete: JSON.parse(JSON.stringify(lot.proprete || {})),
          titre: fibre
        };
        fibreLots[fibre].push(lotFibre);
      });
    });
  });

  // Fusionne tous les lots par fibre (si plusieurs types d'origine)
  const resultLots = Object.entries(fibreLots).map(([fibre, lots]) => {
    if (lots.length === 1) return lots[0];
    // Fusionne les masses et les couleurs (autres propriétés sont identiques)
    const totalFibreMass = lots.reduce((sum, l) => sum + l.total, 0);
    const couleursFusion = {};
    lots.forEach(l => {
      Object.entries(l.format.tissu.types.matrice.couleurs || {}).forEach(([c, pct]) => {
        couleursFusion[c] = (couleursFusion[c] || 0) + pct * l.total / totalFibreMass;
      });
    });
    // Normalise les couleurs
    Object.keys(couleursFusion).forEach(c => {
      couleursFusion[c] = Number(couleursFusion[c].toFixed(2));
    });
    // On prend la structure du premier lot, on met à jour total, couleurs et titre
    const merged = JSON.parse(JSON.stringify(lots[0]));
    merged.total = totalFibreMass;
    merged.format.tissu.types.matrice.couleurs = couleursFusion;
    merged.titre = fibre;
    return merged;
  });

  // Retourne les deux lots comme targetLot et coProductLot
  return { targetLot: resultLots[0], coProductLot: resultLots[1] };
}

window.processes = {
  lavage: processLavage,
  delissage: processDelissage,
  separation: processSeparation
};

