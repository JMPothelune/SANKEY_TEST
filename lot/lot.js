// --- Nouvelle structure pour le chemin ---
let cheminSelection = [];

// --- Ajout d'une variable globale pour le lot courant (mutable) ---
let lotCourant = {};
window.lotCourant = lotCourant;

// --- Variables globales pour compatibilité Bubble/local ---
let rootContainer = null;

// --- Fonction utilitaire pour injecter les icônes Phosphor ---
function getIconSVG(name, className = '') {
  const iconMap = {
    'plus': 'ph-plus',
    'trash': 'ph-trash',
    'x': 'ph-x',
    'caret-left': 'ph-caret-left',
    'caret-right': 'ph-caret-right'
  };
  const iconClass = iconMap[name];
  if (!iconClass) return '';
  return `<i class="ph ${iconClass} ${className}"></i>`;
}

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

// Fonction utilitaire pour attacher les handlers aux boutons d'un header
function attacherHandlersHeader(titre, niveau) {
  // Bouton Ajouter
  const btnAdd = titre.querySelector('button[aria-label="Ajouter"]');
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
  if (btnAdd) {
    console.log("Handler bouton + trouvé", btnAdd, { niveau, dims });
    if (dims.length > 0) {
      btnAdd.onclick = () => {
        const dimActive = cheminSelection[niveau]?.dimension || dims[0];
        afficherModalAjout(niveau, dimActive);
      }
    } else {
      btnAdd.style.display = 'none';
    }
  }

  // Bouton Supprimer
  const btnDelete = titre.querySelector('button[aria-label="Supprimer"]');
  if (btnDelete) {
    btnDelete.onclick = () => {
      supprimerNoeudEtRepartir(niveau);
    };
  }

  // Bouton Fermer (X)
  const btnClose = titre.querySelector('button[aria-label="Fermer"]');
  if (btnClose) {
    if (niveau === 0) {
      btnClose.style.display = 'none'; // Pas de X au niveau 0
    } else {
      btnClose.style.display = ''; // Toujours visible sinon
      btnClose.onclick = () => {
        cheminSelection = cheminSelection.slice(0, niveau);
        if (cheminSelection[niveau - 1]) {
          cheminSelection[niveau - 1].valeur = null;
        }
        afficherStackbars(lotCourant, cheminSelection);
      };
    }
  }
}

// --- Fonction utilitaire pour calculer les infos d'un header (nom, %, kg, parent, etc.) ---
function getInfosHeader({ lot, cheminSelection, niveau }) {
  let nodeParent = lot;
  for (let i = 0; i < niveau; i++) {
    const { dimension, valeur } = cheminSelection[i];
    if (!nodeParent[dimension] || !valeur || !nodeParent[dimension][valeur]) {
      nodeParent = null;
      break;
    }
    nodeParent = nodeParent[dimension][valeur];
  }
  const niveauCourant = cheminSelection[niveau] || {};
  const dimension = niveauCourant.dimension || '';
  const valeur = niveauCourant.valeur || '';
  let nom = '';
  let pct = 100;
  let kg = 0;
  if (niveau === 0) {
    nom = lot.title || 'Lot';
    pct = 100;
    kg = lot.total || 0;
  } else {
    nom = cheminSelection[niveau-1]?.valeur || '';
    // Calcul du pourcentage local
    let nodeParent2 = lot;
    for (let i = 0; i < niveau-1; i++) {
      const { dimension, valeur } = cheminSelection[i];
      if (!nodeParent2[dimension] || !valeur || !nodeParent2[dimension][valeur]) {
        nodeParent2 = null;
        break;
      }
      nodeParent2 = nodeParent2[dimension][valeur];
    }
    const parent = cheminSelection[niveau-1];
    if (parent && parent.dimension && parent.valeur && nodeParent2 && nodeParent2[parent.dimension] && nodeParent2[parent.dimension][parent.valeur]) {
      const valNode = nodeParent2[parent.dimension][parent.valeur];
      if (typeof valNode === 'object' && valNode.pourcentage !== undefined) {
        pct = valNode.pourcentage;
      } else if (typeof valNode === 'number') {
        pct = valNode;
      }
    }
    // Calcul du poids réel
    let totalKg = lot.total || 0;
    let pctCumul = 100;
    let nodeTmp = lot;
    for (let i = 0; i <= niveau-1; i++) {
      const { dimension, valeur } = cheminSelection[i];
      if (!nodeTmp[dimension] || !valeur || !nodeTmp[dimension][valeur]) break;
      let n = nodeTmp[dimension][valeur];
      if (typeof n === 'object' && n.pourcentage !== undefined) {
        pctCumul = pctCumul * n.pourcentage / 100;
      } else if (typeof n === 'number') {
        pctCumul = pctCumul * n / 100;
      }
      nodeTmp = n;
    }
    kg = totalKg * pctCumul / 100;
  }
  return { nodeParent, dimension, valeur, nom, pct, kg };
}

// --- Fonction unique d'affichage d'un header ---
function afficherHeaderNiveau({ niveau, nodeParent, dimension, valeur, nom, pct, kg, container }) {
  const titre = creerTitreStackbar(niveau, nom, pct, kg);
  container.appendChild(titre);
  attacherHandlersHeader(titre, niveau);
}

// --- Fonction centrale pour afficher les stackbars selon le chemin (refactorisée) ---
function afficherStackbars(lot, chemin) {
  const container = rootContainer;
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

  // Boucle principale : headers et stackbars pour chaque niveau du chemin
  for (let niveau = 0; niveau < cheminSelection.length; niveau++) {
    const infos = getInfosHeader({ lot, cheminSelection, niveau });
    afficherHeaderNiveau({ ...infos, niveau, container });
    // Affichage de la stackbar si distribution
    if (node[infos.dimension]) {
      const keys = Object.keys(node[infos.dimension]).filter(k => k !== 'title');
      if (keys.length > 0) {
        let repartition = keys.map(key => {
          const val = node[infos.dimension][key];
          let pct = typeof val === 'object' && val.pourcentage !== undefined ? val.pourcentage : (typeof val === 'number' ? val : 0);
          let color = typeof val === 'object' && val.color ? val.color : undefined;
          return { name: key, key, percent: pct, color };
        });
        let selected = (infos.valeur && keys.includes(infos.valeur)) ? infos.valeur : null;
        renderStackbar(
          repartition,
          null,
          infos.dimension,
          null,
          container,
          selected
        );
      }
    }
    // Mise à jour du pourcentage cumulé et avancer dans l'arbre
    console.log('DEBUG AVANT AVANCEMENT', {
      niveau,
      node,
      dimension: infos.dimension,
      valeur: infos.valeur,
      nodeDimension: node[infos.dimension],
      nodeValeur: node[infos.dimension] ? node[infos.dimension][infos.valeur] : undefined
    });
    if (infos.valeur && node[infos.dimension] && node[infos.dimension][infos.valeur]) {
      const valNode = node[infos.dimension][infos.valeur];
      let pctPourCumul = 100;
      if (typeof valNode === 'object' && valNode.pourcentage !== undefined) {
        pctPourCumul = valNode.pourcentage;
      } else if (typeof valNode === 'number') {
        pctPourCumul = valNode;
      }
      pctCumul = pctCumul * pctPourCumul / 100;
      node = valNode;
    } else {
      if (!(infos.valeur && node[infos.dimension] && node[infos.dimension][infos.valeur])) {
        console.warn('STOP AFFICHAGE HEADER', {
          niveau,
          dimension: infos.dimension,
          valeur: infos.valeur,
          nodeCourant: node,
          nodeDimension: node[infos.dimension],
          keys: node[infos.dimension] ? Object.keys(node[infos.dimension]) : null
        });
      break;
      }
    }
  }

  // Après la boucle : afficher le header du niveau suivant si une value est sélectionnée au dernier niveau et pas de distribution
  if (cheminSelection.length > 0) {
    const lastNiveau = cheminSelection.length - 1;
    const last = CheminManager.getNiveau(lastNiveau);
    if (last && last.valeur) {
      // On remonte le node correspondant à la value sélectionnée
      let nodeParent = lot;
      for (let i = 0; i < lastNiveau; i++) {
        const { dimension, valeur } = cheminSelection[i];
        if (!nodeParent[dimension] || !valeur || !nodeParent[dimension][valeur]) {
          nodeParent = null;
          break;
        }
        nodeParent = nodeParent[dimension][valeur];
      }
      let nodeValue = null;
      if (nodeParent && last.dimension && nodeParent[last.dimension] && nodeParent[last.dimension][last.valeur]) {
        nodeValue = nodeParent[last.dimension][last.valeur];
      }
      // Vérifie si le nœud courant n'a PAS de distribution (feuille)
      const dims = getDimensionsFromNode(nodeValue);
      if (!nodeValue || dims.length === 0) {
        // Calcul des infos pour le header du niveau suivant
        const infos = getInfosHeader({ lot, cheminSelection, niveau: lastNiveau + 1 });
        afficherHeaderNiveau({ ...infos, niveau: lastNiveau + 1, container });
      }
    }
  }
}

// --- Fonction d'initialisation universelle ---
function initLotUI(container, lotInitial) {
  rootContainer = container;
  lotCourant = deepCopy(lotInitial);
  window.lotCourant = lotCourant;
  cheminSelection = [];
  console.log('lotCourant après init', window.lotCourant);
  afficherStackbars(lotCourant, cheminSelection);
}

// --- Fonction d'entrée plug&play ---
function lancerLotUI(container, lotInitial) {
  initLotUI(container, lotInitial);
}

// --- Publication de l'état du lot (Bubble-ready) ---
function publierEtatLot() {
  if (window.onLotChange) window.onLotChange(lotCourant);
  // Dans Bubble, remplacer par : instance.publishState('lot', JSON.stringify(lotCourant));
}

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
    window.lotCourant = lotCourant;
  }

  let cumulatedPercent = 0;
  for (let i = 0; i < repartitionState.length; i++) {
    const item = repartitionState[i];
    const segment = document.createElement('div');
    segment.className = 'stackbar-segment flex items-center justify-center relative font-bold text-base transition-all duration-200';
    segment.setAttribute('data-idx', i);
    let fillColor;

    // On utilise directement la propriété color de l'objet
    if (item.color) {
      fillColor = d3.color(item.color);
    } else {
      // Fallback pour les objets sans couleur définie
      const t = repartitionState.length > 1 ? i / (repartitionState.length - 1) : 0.5;
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
      console.log('Nouveau chemin après clic sur stackbar :', JSON.stringify(newChemin));
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

  // Tronque le chemin à ce niveau (on garde 0 à N-1)
  cheminSelection = cheminSelection.slice(0, niveau);
  // Réajoute la dimension courante avec valeur null
  if (chemin[niveau - 1]) {
    cheminSelection.push({ 
      dimension: chemin[niveau - 1].dimension, 
      valeur: null 
    });
  }
  afficherStackbars(lotCourant, cheminSelection);
  publierEtatLot();
  window.lotCourant = lotCourant;
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
  let btnGroupDims = '';
  if (dims.length > 0) {
    btnGroupDims = `<div class="inline-flex rounded-lg border border-blue-200 bg-white shadow items-center h-10 overflow-hidden">`;
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
  }

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
            ${getIconSVG('caret-left', 'w-4 h-4')}
          </button>
          <button class="border-l border-gray-300 px-3 h-full hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center justify-center stackbar-caret-right" aria-label="Suivant">
            ${getIconSVG('caret-right', 'w-4 h-4')}
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
          ${getIconSVG('plus', 'w-4 h-4')}
        </button>
        ${niveau > 0 ? `
          <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 border-r border-gray-300" aria-label="Supprimer">
            ${getIconSVG('trash', 'w-4 h-4')}
          </button>
          <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 rounded-r-lg" aria-label="Fermer">
            ${getIconSVG('x', 'w-4 h-4')}
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
              window.lotCourant = lotCourant;
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
                  window.lotCourant = lotCourant;
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
            window.lotCourant = lotCourant;
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
  console.log('Navigation - Niveau:', niveau, 'Direction:', direction);
  console.log('Chemin actuel:', JSON.stringify(cheminSelection));

  // Récupère le niveau courant
  const niveauCourant = CheminManager.getNiveau(niveau);
  console.log('Niveau courant:', niveauCourant);
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
  console.log('Node parent:', nodeParent);

  // Récupère les siblings (frères) du niveau courant
  let siblings = [];
  if (nodeParent && niveauCourant.dimension) {
    siblings = Object.keys(nodeParent[niveauCourant.dimension]).filter(k => k !== 'title');
  } else if (niveau === 0) {
    // Cas spécial pour le niveau 0 (formats) : on prend directement les clés du lot
    siblings = Object.keys(lotCourant[niveauCourant.dimension]).filter(k => k !== 'title');
  }
  console.log('Siblings:', siblings);

  if (!siblings.length) return;

  // Trouve l'index du sibling courant
  const idx = siblings.indexOf(niveauCourant.valeur);
  console.log('Index courant:', idx);
  if (idx === -1) return;

  // Calcule le nouvel index
  let newIdx = idx + direction;
  if (newIdx < 0) newIdx = siblings.length - 1;
  if (newIdx >= siblings.length) newIdx = 0;
  console.log('Nouvel index:', newIdx);

  // Met à jour le chemin avec la nouvelle valeur
  let newChemin = cheminSelection.slice(0, niveau);
  newChemin.push({ dimension: niveauCourant.dimension, valeur: siblings[newIdx] });
  
  // Ajout automatique de la dimension enfant si elle existe
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

  // Tronquer le chemin si besoin (pour éviter des restes d'anciens enfants)
  cheminSelection = newChemin;

  afficherStackbars(lotCourant, cheminSelection);
}

// Fonction pour charger les données de base (synchrone, depuis window.baseData)
function chargerDonneesBase(dimension) {
  if (window.baseData && window.baseData[dimension]) {
    return window.baseData[dimension];
  }
  console.warn('Aucune donnée de base trouvée pour la dimension', dimension);
  return {};
}

// Fonction pour afficher la modal d'ajout
function afficherModalAjout(niveau, dimension) {
  if (!dimension) return;

  // Charger les données de base (synchrone)
  const donneesBase = chargerDonneesBase(dimension);
  
  // Récupérer les éléments existants
  let nodeParent = lotCourant;
  for (let i = 0; i < niveau; i++) {
    const { dimension: dim, valeur } = cheminSelection[i];
    if (!nodeParent[dim] || !valeur || !nodeParent[dim][valeur]) {
      nodeParent = null;
      break;
    }
    nodeParent = nodeParent[dim][valeur];
  }
  
  const elementsExistants = nodeParent && nodeParent[dimension] 
    ? Object.keys(nodeParent[dimension]).filter(k => k !== 'title')
    : [];
  
  // Filtrer les éléments disponibles
  const elementsDisponibles = Object.keys(donneesBase).filter(key => 
    !elementsExistants.includes(key)
  );

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
      ${getIconSVG('x', 'w-5 h-5')}
    </button>
  `;
  
  // Contenu de la modal
  const content = document.createElement('div');
  content.className = 'p-4';
  content.innerHTML = `
    <div class="space-y-4">
      <div>
        <label for="element" class="block text-sm font-medium text-gray-700 mb-1">Élément</label>
        <div class="relative">
          <select id="element" class="block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer">
            <option value="" class="text-gray-500">Sélectionnez un élément</option>
            ${elementsDisponibles.map(elem => `
              <option value="${elem}" class="py-1">${elem}</option>
            `).join('')}
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      <div id="pourcentage-container">
        <label for="pourcentage" class="block text-sm font-medium text-gray-700 mb-1">Pourcentage</label>
        <div class="relative">
          <input type="number" id="pourcentage" class="block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" min="0" max="100" step="0.1">
          <div class="absolute inset-y-0 right-0 flex items-center pr-2">
            <span class="bg-white border border-gray-200 rounded-md px-2 py-0.5 text-gray-500 text-sm font-medium">%</span>
          </div>
        </div>
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
  const selectElement = content.querySelector('#element');
  const inputPourcentage = content.querySelector('#pourcentage');
  const pourcentageContainer = content.querySelector('#pourcentage-container');
  
  // Gérer l'affichage du champ pourcentage
  const estPremierElement = elementsExistants.length === 0;
  if (estPremierElement) {
    pourcentageContainer.style.display = 'none';
  }
  
  function fermerModal() {
    backdrop.remove();
  }
  
  btnFermer.onclick = fermerModal;
  btnAnnuler.onclick = fermerModal;
  backdrop.onclick = (e) => {
    if (e.target === backdrop) fermerModal();
  };
  
  btnAjouter.onclick = () => {
    const elementSelectionne = selectElement.value;
    const pourcentage = estPremierElement ? 100 : parseFloat(inputPourcentage.value);
    
    if (elementSelectionne && (!estPremierElement ? !isNaN(pourcentage) && pourcentage >= 0 && pourcentage <= 100 : true)) {
      ajouterElementEtRepartir(niveau, dimension, elementSelectionne, pourcentage, donneesBase[elementSelectionne]);
      fermerModal();
      afficherStackbars(lotCourant, cheminSelection);
    }
  };
  
  // Focus sur le select
  selectElement.focus();
}

// Fonction pour ajouter un élément et répartir les pourcentages
function ajouterElementEtRepartir(niveau, dimension, nom, pourcentage, donneesBase) {
  let node = lotCourant;
  for (let i = 0; i < niveau; i++) {
    const { dimension: dim, valeur } = cheminSelection[i];
    if (!node[dim] || !valeur || !node[dim][valeur]) return;
    node = node[dim][valeur];
  }
  if (!node[dimension]) return;
  if (node[dimension][nom]) return;

  let keys = Object.keys(node[dimension]).filter(k => k !== 'title');
  let autres = keys;
  let totalAvant = 0;
  autres.forEach(k => {
    const val = node[dimension][k];
    if (typeof val === 'object' && val.pourcentage !== undefined) {
      totalAvant += val.pourcentage;
    } else if (typeof val === 'number') {
      totalAvant += val;
    }
  });

  // Si c'est le premier élément, on met 100%
  if (totalAvant === 0) {
    node[dimension][nom] = {
      ...donneesBase,
      pourcentage: 100
    };
    return;
  }

  // Applique la normalisation proportionnelle
  const facteur = (100 - pourcentage) / totalAvant;
  let somme = pourcentage;
  let autresSansDernier = autres.filter((k, idx) => idx < autres.length - 1);
  autresSansDernier.forEach(k => {
    const val = node[dimension][k];
    let pct = 0;
    if (typeof val === 'object' && val.pourcentage !== undefined) {
      pct = val.pourcentage * facteur;
      val.pourcentage = pct;
    } else if (typeof val === 'number') {
      pct = val * facteur;
      node[dimension][k] = pct;
    }
    somme += pct;
  });
  // Dernier ancien élément : ajuste pour que la somme fasse 100
  if (autres.length > 0) {
    const k = autres[autres.length - 1];
    if (k !== nom) {
      const val = node[dimension][k];
      let pct = 100 - somme;
      if (typeof val === 'object' && val.pourcentage !== undefined) {
        val.pourcentage = pct;
      } else if (typeof val === 'number') {
        node[dimension][k] = pct;
      }
    }
  }
  // Ajoute le nouvel élément avec sa structure complète
  node[dimension][nom] = {
    ...donneesBase,
    pourcentage: pourcentage
  };
  publierEtatLot();
  window.lotCourant = lotCourant;
}

// --- Exemple d'appel local (à mettre dans index.html) ---
// lancerLotUI(document.getElementById('stackbar-container'), window.lotInitial);

