// --- Nouvelle structure pour le chemin ---
let cheminSelection = [];

// --- Ajout d'une variable globale pour le lot courant (mutable) ---
let lotCourant = null;

// --- Fonction utilitaire pour obtenir les dimensions accessibles à partir d'un nœud (hors pourcentage, total, title)
function getDimensionsFromNode(node) {
  if (!node || typeof node !== 'object') return [];
  return Object.keys(node).filter(k => {
    if (["pourcentage", "percent", "name", "titre", "title", "total"].includes(k)) return false;
    const v = node[k];
    return typeof v === "object" && v !== null;
  });
}

// --- Fonction utilitaire pour obtenir le title d'une dimension ou d'une valeur
function getTitle(obj, key) {
  if (!obj) return key;
  if (obj[key] && obj[key].title) return obj[key].title;
  if (obj.title) return obj.title;
  return key;
}

// --- Fonction utilitaire pour manipuler le chemin ---
const CheminManager = {
  // Ajouter une dimension avec ou sans valeur
  ajouterDimension: (dimension, valeur = null) => {
    cheminSelection.push({ dimension, valeur });
  },

  // Mettre à jour la valeur d'une dimension existante
  mettreAJourValeur: (niveau, valeur) => {
    if (niveau >= 0 && niveau < cheminSelection.length) {
      cheminSelection[niveau].valeur = valeur;
    }
  },

  // Tronquer le chemin à un niveau donné
  tronquer: (niveau) => {
    cheminSelection = cheminSelection.slice(0, niveau);
  },

  // Obtenir le chemin jusqu'à un niveau donné
  getCheminJusquA: (niveau) => {
    return cheminSelection.slice(0, niveau);
  },

  // Obtenir la dimension et la valeur à un niveau donné
  getNiveau: (niveau) => {
    return niveau >= 0 && niveau < cheminSelection.length ? cheminSelection[niveau] : null;
  },

  // Vérifier si une dimension a une valeur à un niveau donné
  aValeur: (niveau) => {
    return niveau >= 0 && niveau < cheminSelection.length && cheminSelection[niveau].valeur !== null;
  },

  // Obtenir le node correspondant au chemin actuel
  getNode: (lot) => {
    let node = lot;
    for (const { dimension, valeur } of cheminSelection) {
      if (!valeur) break; // On s'arrête si on trouve une dimension sans valeur
      if (!node[dimension] || !node[dimension][valeur]) {
        node = null;
        break;
      }
      node = node[dimension][valeur];
    }
    return node;
  }
};

// --- Fonction centrale pour afficher les stackbars selon le chemin ---
function afficherStackbars(lot, chemin) {
  const container = document.getElementById('stackbar-container');
  container.innerHTML = '';

  let node = lot;
  let totalKg = lot.total || 0;
  let pctCumul = 100;

  // Si le chemin est vide, on commence par la première dimension
  if (cheminSelection.length === 0) {
    const dims = getDimensionsFromNode(node);
    if (dims.length > 0) {
      CheminManager.ajouterDimension(dims[0]);
    }
  }

  // On parcourt le cheminSelection pour afficher chaque niveau
  for (let niveau = 0; niveau < cheminSelection.length; niveau++) {
    const niveauCourant = CheminManager.getNiveau(niveau);
    if (!niveauCourant) break;

    const { dimension, valeur } = niveauCourant;

    // 1. Calcul du poids cumulé AVANT d'avancer dans l'arbre
    const poidsNiveau = totalKg * pctCumul / 100;

    // 2. Calcul du pourcentage local (pour l'affichage)
    let pctLocal = 100;
    if (niveau === 0) {
      pctLocal = 100;
    } else if (valeur && node[dimension] && node[dimension][valeur]) {
      const valNode = node[dimension][valeur];
      if (typeof valNode === 'object' && valNode.pourcentage !== undefined) {
        pctLocal = valNode.pourcentage;
      } else if (typeof valNode === 'number') {
        pctLocal = valNode;
      }
    }

    // 3. Affichage du header
    const titre = creerTitreStackbar(
      niveau,
      niveau === 0 ? (lotCourant.title || 'Lot') : CheminManager.getNiveau(niveau-1)?.valeur || '',
      niveau === 0 ? 100 : (() => {
        const parent = CheminManager.getNiveau(niveau-1);
        if (!parent || !parent.dimension || !parent.valeur) return 100;
        let node = lotCourant;
        for (let i = 0; i < niveau-1; i++) {
          const { dimension, valeur } = cheminSelection[i];
          if (!node[dimension] || !valeur || !node[dimension][valeur]) return 100;
          node = node[dimension][valeur];
        }
        const valNode = node[parent.dimension][parent.valeur];
        if (typeof valNode === 'object' && valNode.pourcentage !== undefined) {
          return valNode.pourcentage;
        } else if (typeof valNode === 'number') {
          return valNode;
        }
        return 100;
      })(),
      poidsNiveau
    );
    container.appendChild(titre);

    // Attacher le handler du bouton Ajouter
    const btnAdd = titre.querySelector('button[aria-label="Ajouter"]');
    if (btnAdd) {
      btnAdd.onclick = () => {
        // On veut la dimension du niveau courant
        const dimension = niveau === 0 ? 
          cheminSelection[0]?.dimension : // Pour le niveau 0, on prend la dimension active du button group
          cheminSelection[niveau]?.dimension; // Pour les autres niveaux, on prend la dimension du niveau courant
        afficherModalAjout(niveau, dimension);
      };
    }

    // Attacher le handler du bouton X juste après
    if (niveau > 0) {
      const btnClose = titre.querySelector('button[aria-label="Fermer"]');
      if (btnClose) {
        const niveauHeader = parseInt(titre.dataset.niveau, 10);
        btnClose.onclick = () => {
          CheminManager.tronquer(niveauHeader);
          afficherStackbars(lotCourant, cheminSelection);
        };
      }

      // Attacher le handler du bouton Supprimer
      const btnDelete = titre.querySelector('button[aria-label="Supprimer"]');
      if (btnDelete) {
        const niveauHeader = parseInt(titre.dataset.niveau, 10);
        btnDelete.onclick = () => {
          console.log('Suppression demandée pour niveauHeader :', niveauHeader);
          supprimerNoeudEtRepartir(niveauHeader);
        };
      }

      // Ajout de la logique pour les boutons gauche/droite (sauf niveau 0)
      if (niveau > 0) {
        setTimeout(() => {
          const btnLeft = titre.querySelector('.stackbar-caret-left');
          const btnRight = titre.querySelector('.stackbar-caret-right');
          if (btnLeft || btnRight) {
            // On veut naviguer entre les frères du niveau parent
            const dimensionParent = CheminManager.getNiveau(niveau-1)?.dimension;
            const valeurParent = CheminManager.getNiveau(niveau-1)?.valeur;
            // Trouver le node parent
            let nodeParent = lot;
            for (let i = 0; i < niveau-1; i++) {
              const { dimension, valeur } = CheminManager.getNiveau(i);
              if (!nodeParent[dimension] || !valeur || !nodeParent[dimension][valeur]) {
                nodeParent = null;
                break;
              }
              nodeParent = nodeParent[dimension][valeur];
            }
            let siblings = [];
            if (nodeParent && nodeParent[dimensionParent]) siblings = Object.keys(nodeParent[dimensionParent]).filter(k => k !== 'title');
            const idx = siblings.indexOf(valeurParent);
            if (btnLeft) {
              btnLeft.onclick = () => {
                if (!siblings.length) return;
                let newIdx = idx > 0 ? idx - 1 : siblings.length - 1;
                let newChemin = CheminManager.getCheminJusquA(niveau); // jusqu'au parent inclus
                newChemin[niveau-1] = { dimension: dimensionParent, valeur: siblings[newIdx] };
                // Ajoute la dimension enfant (celle du niveau courant) avec valeur null
                newChemin = newChemin.slice(0, niveau);
                newChemin.push({ dimension: dimension, valeur: null });
                cheminSelection = newChemin;
                afficherStackbars(lotCourant, cheminSelection);
              };
            }
            if (btnRight) {
              btnRight.onclick = () => {
                if (!siblings.length) return;
                let newIdx = idx < siblings.length - 1 && idx !== -1 ? idx + 1 : 0;
                let newChemin = CheminManager.getCheminJusquA(niveau); // jusqu'au parent inclus
                newChemin[niveau-1] = { dimension: dimensionParent, valeur: siblings[newIdx] };
                // Ajoute la dimension enfant (celle du niveau courant) avec valeur null
                newChemin = newChemin.slice(0, niveau);
                newChemin.push({ dimension: dimension, valeur: null });
                cheminSelection = newChemin;
                afficherStackbars(lotCourant, cheminSelection);
              };
            }
          }
        }, 0);
      }
    }

    // 4. Affichage de la stackbar
    if (node[dimension]) {
      const keys = Object.keys(node[dimension]).filter(k => k !== 'title');
      let repartition = keys.map(key => {
        const val = node[dimension][key];
        let pct = typeof val === 'object' && val.pourcentage !== undefined ? val.pourcentage : (typeof val === 'number' ? val : 0);
        return { name: key, key, percent: pct };
      });
      renderStackbar(
        repartition,
        null,
        dimension,
        null,
        container,
        valeur // sélectionne la valeur si présente
      );
    }

    // 5. Mettre à jour le pourcentage cumulé et avancer dans l'arbre
    if (valeur && node[dimension] && node[dimension][valeur]) {
      const valNode = node[dimension][valeur];
      let pctPourCumul = 100;
      if (typeof valNode === 'object' && valNode.pourcentage !== undefined) {
        pctPourCumul = valNode.pourcentage;
      } else if (typeof valNode === 'number') {
        pctPourCumul = valNode;
      }
      pctCumul = pctCumul * pctPourCumul / 100;
      node = valNode;
    } else {
      break;
    }
  }
}

// --- Initialisation ---
fetch('../lot_type.json')
  .then(res => res.json())
  .then(lotType => {
    window._lotType = lotType;
    lotCourant = deepCopy(lotType);
    cheminSelection = [];
    afficherStackbars(lotCourant, cheminSelection);
  });

// --- renderStackbar modifiée pour gérer la sélection fluide ---
function renderStackbar(repartition, colorMap, dimension, parentKey, container, selectedKey) {
  const stackbar = document.createElement('div');
  stackbar.id = `stackbar-${dimension}` + (parentKey ? `-${parentKey}` : '');
  stackbar.className = 'flex w-full h-16 overflow-hidden rounded-xl shadow-sm mb-5 relative';

  let repartitionState = repartition.map(r => ({ ...r }));

  function updateSegments() {
    for (let i = 0; i < repartitionState.length; i++) {
      const seg = stackbar.querySelector(`.stackbar-segment[data-idx='${i}']`);
      if (seg) seg.style.width = repartitionState[i].percent + '%';
      const label = seg.querySelector('.stackbar-label');
      if (label) label.innerHTML = `
        <span class="text-black font-medium text-xs leading-tight truncate w-full" title="${repartitionState[i].name}">${repartitionState[i].name}</span>
        <span class="text-black font-normal text-xs leading-tight truncate w-full">${repartitionState[i].percent.toFixed(1)}%</span>
      `;
    }
  }

  function updateLotCourant() {
    // On veut trouver le parent qui contient la liste à modifier
    // On part de lotCourant, on descend le chemin jusqu'à l'avant-dernier niveau pour la dimension courante
    let node = lotCourant;
    for (let i = 0; i < cheminSelection.length; i++) {
      const { dimension: dim, valeur } = cheminSelection[i];
      // On s'arrête juste avant la dimension courante
      if (dim === dimension) break;
      if (!node[dim] || !valeur || !node[dim][valeur]) return;
      node = node[dim][valeur];
    }
    // Maintenant, node[dimension] est la liste à modifier
    if (!node[dimension]) return;
    for (let i = 0; i < repartitionState.length; i++) {
      const key = repartitionState[i].name;
      if (typeof node[dimension][key] === 'object') {
        node[dimension][key].pourcentage = repartitionState[i].percent;
      } else {
        node[dimension][key] = repartitionState[i].percent;
      }
    }
  }

  let cumulatedPercent = 0;
  for (let i = 0; i < repartitionState.length; i++) {
    const item = repartitionState[i];
    const segment = document.createElement('div');
    segment.className = 'stackbar-segment flex items-center justify-center relative font-bold text-base transition-all duration-200';
    segment.setAttribute('data-idx', i);
    let fillColor;
    const t = repartitionState.length > 1 ? i / (repartitionState.length - 1) : 0.5;

    // Palette statique pour les couleurs
    const couleurMap = {
      'noir': '#222',
      'blanc': '#f5f5f5',
      'bleu': '#2980b9',
      'gris': '#7f8c8d',
      'marron': '#8d5524',
      'rouge': '#e74c3c',
      'vert': '#27ae60',
      'violet': '#8e44ad',
      'orange': '#e67e22',
      'jaune': '#f1c40f',
      'inconnu': '#b2bec3',
      'multicolore': '#fd79a8'
    };

    if (dimension === 'couleur' || dimension === 'couleurs') {
      fillColor = d3.color(couleurMap[item.name] || '#bbb');
    } else if (colorMap && colorMap[item.name]) {
      fillColor = d3.color(colorMap[item.name]);
    } else {
      if (dimension === 'format' || dimension === 'formats') {
        fillColor = d3.color(d3.interpolateYlGn(t));
      } else if (dimension === 'type' || dimension === 'types') {
        fillColor = d3.color(d3.interpolatePlasma(t));
      } else if (dimension === 'matiere' || dimension === 'matieres') {
        fillColor = d3.color(d3.interpolateCool(t));
      } else if (dimension === 'fibre' || dimension === 'fibres') {
        const tFibres = repartitionState.length > 1 ? (0.15 + 0.7 * (i / (repartitionState.length - 1))) : 0.5;
        fillColor = d3.color(d3.interpolateRainbow(tFibres));
      } else if (dimension === 'qualite') {
        fillColor = d3.color(d3.interpolateOranges(t));
      } else if (dimension === 'proprete') {
        fillColor = d3.color(d3.interpolateBlues(t));
      } else {
        fillColor = d3.color('#bbb');
      }
    }
    const isUnknown = ['inconnu', 'autre', 'autres compositions'].includes(item.name.toLowerCase());
    if (isUnknown) {
      segment.style.background = 'repeating-linear-gradient(135deg, #f5f5f5, #f5f5f5 2px, #e0e0e0 2px, #e0e0e0 4px)';
      segment.style.border = '1px solid #bbb';
    } else {
      segment.style.background = `rgba(${fillColor.r},${fillColor.g},${fillColor.b},0.8)`;
      segment.style.border = `2px solid rgba(${fillColor.r},${fillColor.g},${fillColor.b},1)`;
    }
    segment.style.width = item.percent + '%';
    segment.style.letterSpacing = '0.5px';
    if (i === 0) segment.classList.add('rounded-l-xl');
    if (i === repartitionState.length - 1) segment.classList.add('rounded-r-xl');
    if (selectedKey === item.name) {
      segment.classList.add('selected');
      segment.style.border = `4px solid rgba(${fillColor.r},${fillColor.g},${fillColor.b},1)`;
      segment.style.opacity = '1';
    } else if (selectedKey) {
      segment.style.opacity = '0.4';
    } else {
      segment.style.opacity = '1';
    }
    // Label
    const label = document.createElement('div');
    label.className = 'stackbar-label w-full h-full text-center px-1 flex flex-col items-center justify-center overflow-hidden';
    label.innerHTML = `
      <span class="text-black font-medium text-xs leading-tight truncate w-full" title="${item.name}">${item.name}</span>
      <span class="text-black font-normal text-xs leading-tight truncate w-full">${item.percent.toFixed(1)}%</span>
    `;
    segment.appendChild(label);
    // Sélection
    segment.style.cursor = 'pointer';
    segment.addEventListener('click', () => {
      // Trouver le niveau courant dans cheminSelection par la dimension
      let niveau = cheminSelection.findIndex(sel => sel.dimension === dimension);
      if (niveau === -1) niveau = cheminSelection.length - 1;
      let newChemin = cheminSelection.slice(0, niveau);
      newChemin.push({ dimension: dimension, valeur: item.name });
      // Chercher la dimension enfant éventuelle
      let node = lotCourant;
      for (let i = 0; i < newChemin.length; i++) {
        const { dimension, valeur } = newChemin[i];
        if (!node[dimension] || !valeur || !node[dimension][valeur]) {
          node = null;
          break;
        }
        node = node[dimension][valeur];
      }
      if (node) {
        const dimsEnfant = getDimensionsFromNode(node);
        if (dimsEnfant.length > 0) {
          newChemin.push({ dimension: dimsEnfant[0], valeur: null });
        }
      }
      cheminSelection = newChemin;
      afficherStackbars(lotCourant, cheminSelection);
    });
    stackbar.appendChild(segment);
    // Handle (inchangé)
    if (i < repartitionState.length - 1) {
      const handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'stackbar-handle-btn absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white border border-gray-300 rounded-full shadow flex items-center justify-center hover:bg-gray-50 active:scale-95 transition z-50 cursor-ew-resize';
      handle.style.zIndex = 50;
      handle.style.left = `calc(${cumulatedPercent + repartitionState[i].percent}% - 14px)`;
      handle.style.pointerEvents = 'auto';
      handle.innerHTML = `
        <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
          <path d="M7 5l-3 4 3 4" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M11 5l3 4-3 4" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      // Drag logic
      let startX = 0;
      let startPctL = 0;
      let startPctR = 0;
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startPctL = repartitionState[i].percent;
        startPctR = repartitionState[i+1].percent;
        document.body.style.userSelect = 'none';
        function onMove(ev) {
          const dx = ev.clientX - startX;
          const totalWidth = stackbar.offsetWidth;
          const dPct = dx / totalWidth * 100;
          let newPctL = clampPercent(startPctL + dPct, 1, startPctL + startPctR - 1);
          let newPctR = clampPercent(startPctR - dPct, 1, startPctL + startPctR - 1);
          // Correction pour ne pas dépasser le total
          if (newPctL + newPctR > startPctL + startPctR) {
            const excess = newPctL + newPctR - (startPctL + startPctR);
            newPctL -= excess/2;
            newPctR -= excess/2;
          }
          repartitionState[i].percent = newPctL;
          repartitionState[i+1].percent = newPctR;
          updateSegments();
          // Met à jour la position du handle pendant le drag
          handle.style.left = `calc(${cumulatedPercent + repartitionState[i].percent}% - 14px)`;
        }
        function onUp() {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.userSelect = '';
          updateLotCourant();
          afficherStackbars(lotCourant, cheminSelection);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
      stackbar.appendChild(handle);
    }
    cumulatedPercent += item.percent;
  }
  container.appendChild(stackbar);
}

// Ajout d'une fonction utilitaire pour forcer un minimum de pourcentage
function clampPercent(val, min = 1, max = 100) {
  return Math.max(min, Math.min(max, val));
}

// --- Deep copy utilitaire ---
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// --- Fonction utilitaire générique pour supprimer un noeud à n'importe quel niveau et réajuster la distribution ---
function supprimerNoeudEtRepartir(niveau) {
  // On veut supprimer la valeur sélectionnée dans la dimension du niveau parent (niveau-1)
  if (niveau <= 0) return;
  const chemin = [...cheminSelection];
  const parentCle = chemin[niveau - 1];
  if (!parentCle || parentCle.valeur == null) {
    console.warn('Aucune valeur sélectionnée à ce niveau parent, suppression impossible.');
    return;
  }
  const dim = parentCle.dimension;
  const keyToDelete = parentCle.valeur;

  // Navigue dynamiquement jusqu'au parent du parent
  let parent = lotCourant;
  for (let i = 0; i < niveau - 1; i++) {
    const { dimension, valeur } = chemin[i];
    if (!parent[dimension] || !valeur || !parent[dimension][valeur]) return;
    parent = parent[dimension][valeur];
  }
  if (!dim || !parent[dim]) return;
  const liste = parent[dim];
  if (!liste[keyToDelete]) return;

  // Supprime la clé
  delete liste[keyToDelete];

  // Réajuste les pourcentages
  let total = 0;
  Object.values(liste).forEach(obj => {
    if (typeof obj === 'object' && obj.pourcentage !== undefined) {
      total += obj.pourcentage;
    } else if (typeof obj === 'number') {
      total += obj;
    }
  });
  Object.keys(liste).forEach(k => {
    if (typeof liste[k] === 'object' && liste[k].pourcentage !== undefined) {
      liste[k].pourcentage = total > 0 ? liste[k].pourcentage * 100 / total : 0;
    } else if (typeof liste[k] === 'number') {
      liste[k] = total > 0 ? liste[k] * 100 / total : 0;
    }
  });

  // Tronque le chemin de sélection au niveau parent
  cheminSelection = cheminSelection.slice(0, niveau - 1);
  afficherStackbars(lotCourant, cheminSelection);
}

// --- Fonction utilitaire pour créer le titre de stackbar avec les icônes ---
function creerTitreStackbar(niveau, nom, pct, kg) {
  const titre = document.createElement('div');
  titre.className = `stackbar-parent-title font-bold mt-2 mb-4 flex items-center justify-between`;
  titre.dataset.niveau = niveau;

  // On veut le nœud parent du niveau courant
  let nodeParent = lotCourant;
  for (let i = 0; i < niveau; i++) {
    const { dimension, valeur } = cheminSelection[i];
    if (!nodeParent[dimension] || !valeur || !nodeParent[dimension][valeur]) {
      nodeParent = null;
      break;
    }
    nodeParent = nodeParent[dimension][valeur];
  }
  const dims = getDimensionsFromNode(nodeParent ? nodeParent : lotCourant);

  // Génération du button group dimension
  // On génère un vrai button group collé, sans padding, avec séparateur vertical
  let btnGroupDims = `<div class="inline-flex rounded-lg border border-blue-200 bg-white shadow items-center h-10 overflow-hidden">`;
  dims.forEach((dim, idx) => {
    const isSelected = dim === cheminSelection[niveau]?.dimension;
    btnGroupDims += `
      <button
        class="h-10 min-w-[90px] px-4 text-base font-semibold focus:outline-none ${isSelected ? 'bg-blue-50 text-blue-600 border-blue-200 shadow' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'} ${idx > 0 ? 'border-l border-gray-200' : ''}"
        style="border-radius:0;"
      >${dim.charAt(0).toUpperCase() + dim.slice(1).toLowerCase()}</button>
    `;
  });
  btnGroupDims += '</div>';

  // Détermination du label de dimension (niveau+1)
  let labelText = '';
  if (niveau + 1 === 0) labelText = 'format';
  else if (niveau + 1 === 1) labelText = 'types';
  else if (niveau + 1 === 2) labelText = 'matieres';
  else if (niveau + 1 === 3) labelText = 'fibres';
  // Génération du button group dimension
  titre.innerHTML = `
    <div class="flex items-center justify-between w-full">
      <div class="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white shadow-sm items-stretch h-10">
        ${niveau > 0 ? `
          <button class="px-3 h-full hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center justify-center stackbar-caret-left" aria-label="Précédent">
            <img src="../assets/svg/caret-left.svg" alt="Précédent" class="w-4 h-4" />
          </button>
          <button class="border-l border-gray-300 px-3 h-full hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center justify-center stackbar-caret-right" aria-label="Suivant">
            <img src="../assets/svg/caret-right.svg" alt="Suivant" class="w-4 h-4" />
          </button>
          ` : ''}
        <span class="border-l border-gray-300 px-4 h-full font-bold text-base flex items-center stackbar-title-nom" tabindex="0" style="cursor:pointer;">${nom}</span>
        <span class="border-l border-gray-300 px-3 h-full text-sm flex items-center">${pct.toFixed(1)}%</span>
        <span class="border-l border-gray-300 px-3 h-full text-sm flex items-center stackbar-title-poids" tabindex="0" style="cursor:pointer;">${kg ? `${kg.toFixed(1)} kg` : ''}</span>
      </div>
      <div class="flex-1 flex justify-center">
        ${btnGroupDims}
      </div>
      <div class="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white shadow-sm items-center h-10">
        <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 rounded-l-lg ${niveau > 0 ? 'border-r border-gray-300' : ''}" aria-label="Ajouter">
          <img src="../assets/svg/plus.svg" alt="Ajouter" class="w-4 h-4" />
        </button>
        ${niveau > 0 ? `
          <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 border-r border-gray-300" aria-label="Supprimer">
            <img src="../assets/svg/trash.svg" alt="Supprimer" class="w-4 h-4" />
          </button>
          <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 rounded-r-lg" aria-label="Fermer">
            <img src="../assets/svg/x.svg" alt="Fermer" class="w-4 h-4" />
          </button>
        ` : ''}
      </div>
    </div>`;

  // Ajout de l'édition inline du nom
  setTimeout(() => {
    const spanNom = titre.querySelector('.stackbar-title-nom');
    if (spanNom) {
      spanNom.addEventListener('click', () => {
        const oldName = spanNom.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = oldName;
        input.className = 'border-l border-gray-300 px-4 h-full font-bold text-base flex items-center outline-none';
        input.style.width = '8rem';
        input.style.background = 'white';
        input.style.textAlign = 'left';
        spanNom.replaceWith(input);
        input.focus();
        input.select();
        function saveEdit() {
          const newName = input.value.trim();
          if (newName && newName !== oldName) {
            if (niveau === 0) {
              lotCourant.title = newName;
            } else {
              // Renommage d'un segment à un niveau > 0
              // Trouver le parent
              let parent = lotCourant;
              for (let i = 0; i < niveau-1; i++) {
                const { dimension, valeur } = cheminSelection[i];
                if (!parent[dimension] || !valeur || !parent[dimension][valeur]) {
                  parent = null;
                  break;
                }
                parent = parent[dimension][valeur];
              }
              const dim = cheminSelection[niveau-1]?.dimension;
              const val = cheminSelection[niveau-1]?.valeur;
              if (parent && dim && val && parent[dim] && parent[dim][oldName] && !parent[dim][newName]) {
                // Conserve l'ordre
                const entries = Object.entries(parent[dim]);
                const idx = entries.findIndex(([k]) => k === oldName);
                if (idx !== -1) {
                  const newEntries = [
                    ...entries.slice(0, idx),
                    [newName, parent[dim][oldName]],
                    ...entries.slice(idx + 1)
                  ];
                  const newObj = {};
                  newEntries.forEach(([k, v]) => { newObj[k] = v; });
                  parent[dim] = newObj;
                  // Met à jour cheminSelection si besoin
                  if (cheminSelection[niveau-1].valeur === oldName) {
                    cheminSelection[niveau-1].valeur = newName;
                  }
                }
              }
            }
          }
          afficherStackbars(lotCourant, cheminSelection);
        }
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') saveEdit();
          if (e.key === 'Escape') afficherStackbars(lotCourant, cheminSelection);
        });
        input.addEventListener('blur', saveEdit);
      });
    }

    // Ajout de l'édition inline du poids total (niveau 0 uniquement)
    const spanPoids = titre.querySelector('.stackbar-title-poids');
    if (spanPoids && niveau === 0) {
      spanPoids.addEventListener('click', () => {
        const oldPoids = lotCourant.total || 0;
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.1';
        input.min = '0';
        input.value = oldPoids;
        input.className = 'border-l border-gray-300 px-3 h-full text-sm flex items-center outline-none';
        input.style.width = '5rem';
        input.style.background = 'white';
        input.style.textAlign = 'right';
        spanPoids.replaceWith(input);
        input.focus();
        input.select();
        function saveEdit() {
          const newPoids = parseFloat(input.value);
          if (!isNaN(newPoids) && newPoids >= 0 && newPoids !== oldPoids) {
            lotCourant.total = newPoids;
          }
          afficherStackbars(lotCourant, cheminSelection);
        }
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') saveEdit();
          if (e.key === 'Escape') afficherStackbars(lotCourant, cheminSelection);
        });
        input.addEventListener('blur', saveEdit);
      });
    }

    // Navigation carets
    const btnLeft = titre.querySelector('.stackbar-caret-left');
    const btnRight = titre.querySelector('.stackbar-caret-right');
    const niveauHeader = parseInt(titre.dataset.niveau, 10);
    if (btnLeft && niveauHeader > 0) {
      btnLeft.onclick = () => {
        naviguerSiblingStackbar(niveauHeader - 1, -1);
      };
    }
    if (btnRight && niveauHeader > 0) {
      btnRight.onclick = () => {
        naviguerSiblingStackbar(niveauHeader - 1, +1);
      };
    }

    // Ajout des listeners sur les boutons de dimension
    const btnGroupDims = titre.querySelector('.flex-1 .inline-flex');
    const btnDims = btnGroupDims ? btnGroupDims.querySelectorAll('button') : [];
    btnDims.forEach((btn, idx) => {
      const dim = dims[idx];
      btn.onclick = () => {
        if (cheminSelection[niveau]?.dimension === dim) return;

        let newChemin = cheminSelection.slice(0, niveau);
        newChemin.push({ dimension: dim, valeur: null });

        let nodeParent = lotCourant;
        for (let i = 0; i < niveau; i++) {
          const { dimension, valeur } = newChemin[i];
          if (!nodeParent[dimension] || !valeur || !nodeParent[dimension][valeur]) {
            nodeParent = null;
            break;
          }
          nodeParent = nodeParent[dimension][valeur];
        }
        if (nodeParent && nodeParent[dim]) {
          const valeursPossibles = Object.keys(nodeParent[dim]).filter(k => k !== 'title');
          if (valeursPossibles.length === 1) {
            newChemin[niveau].valeur = valeursPossibles[0];
          }
        }

        console.log('Dimension cliquée :', dim, '| Nouveau chemin :', JSON.stringify(newChemin));

        cheminSelection = newChemin;
        afficherStackbars(lotCourant, cheminSelection);
      };
    });
  }, 0);

  return titre;
}

// Fonction utilitaire pour naviguer entre les éléments frères d'un niveau
function naviguerSiblingStackbar(niveau, direction) {
  // Récupère le niveau courant
  const niveauCourant = CheminManager.getNiveau(niveau);
  if (!niveauCourant) return;

  // Récupère le node parent
  let nodeParent = lotCourant;
  for (let i = 0; i < niveau; i++) {
    const niveauParent = CheminManager.getNiveau(i);
    if (!niveauParent || !niveauParent.valeur) {
      nodeParent = null;
      break;
    }
    if (!nodeParent[niveauParent.dimension] || !nodeParent[niveauParent.dimension][niveauParent.valeur]) {
      nodeParent = null;
      break;
    }
    nodeParent = nodeParent[niveauParent.dimension][niveauParent.valeur];
  }

  // Récupère les siblings (frères) du niveau courant
  let siblings = [];
  if (nodeParent && niveauCourant.dimension) {
    siblings = Object.keys(nodeParent[niveauCourant.dimension]).filter(k => k !== 'title');
  }

  if (!siblings.length) return;

  // Trouve l'index du sibling courant
  const idx = siblings.indexOf(niveauCourant.valeur);
  if (idx === -1) return;

  // Calcule le nouvel index
  let newIdx = idx + direction;
  if (newIdx < 0) newIdx = siblings.length - 1;
  if (newIdx >= siblings.length) newIdx = 0;

  // Met à jour le chemin
  CheminManager.mettreAJourValeur(niveau, siblings[newIdx]);
  
  // Si on a une dimension enfant, on la réinitialise
  if (CheminManager.getNiveau(niveau + 1)) {
    CheminManager.tronquer(niveau + 1);
  }

  // Rafraîchit l'affichage
  afficherStackbars(lotCourant, cheminSelection);
}

// Fonction pour afficher la modal d'ajout
function afficherModalAjout(niveau, dimension) {
  if (!dimension) return; // On ne fait rien si pas de dimension

  // Créer le backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  
  // Créer la modal
  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-lg shadow-xl w-full max-w-md mx-4';
  
  // Header de la modal
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b';
  header.innerHTML = `
    <h3 class="text-lg font-semibold text-gray-900">Ajouter un ${dimension}</h3>
    <button type="button" class="text-gray-400 hover:text-gray-500 focus:outline-none" aria-label="Fermer">
      <img src="../assets/svg/x.svg" alt="Fermer" class="w-5 h-5" />
    </button>
  `;
  
  // Contenu de la modal
  const content = document.createElement('div');
  content.className = 'p-4';
  content.innerHTML = `
    <div class="space-y-4">
      <div>
        <label for="nom" class="block text-sm font-medium text-gray-700">Nom</label>
        <input type="text" id="nom" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Entrez un nom">
      </div>
      <div>
        <label for="pourcentage" class="block text-sm font-medium text-gray-700">Pourcentage</label>
        <input type="number" id="pourcentage" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="0" min="0" max="100" step="0.1">
      </div>
    </div>
  `;
  
  // Footer de la modal
  const footer = document.createElement('div');
  footer.className = 'flex items-center justify-end gap-3 p-4 border-t';
  footer.innerHTML = `
    <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Annuler</button>
    <button type="button" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Ajouter</button>
  `;
  
  // Assembler la modal
  modal.appendChild(header);
  modal.appendChild(content);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  
  // Gestionnaires d'événements
  const btnFermer = header.querySelector('button');
  const btnAnnuler = footer.querySelector('button:first-child');
  const btnAjouter = footer.querySelector('button:last-child');
  const inputNom = content.querySelector('#nom');
  const inputPourcentage = content.querySelector('#pourcentage');
  
  function fermerModal() {
    backdrop.remove();
  }
  
  btnFermer.onclick = fermerModal;
  btnAnnuler.onclick = fermerModal;
  backdrop.onclick = (e) => {
    if (e.target === backdrop) fermerModal();
  };
  
  btnAjouter.onclick = () => {
    const nom = inputNom.value.trim();
    const pourcentage = parseFloat(inputPourcentage.value);
    
    if (nom && !isNaN(pourcentage) && pourcentage >= 0 && pourcentage <= 100) {
      // TODO: Ajouter la logique d'ajout ici
      console.log('Ajout de', nom, 'avec', pourcentage, '% dans la dimension', dimension);
      fermerModal();
    }
  };
  
  // Focus sur le premier input
  inputNom.focus();
}

