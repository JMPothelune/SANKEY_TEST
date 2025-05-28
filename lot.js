// --- Ajout d'une variable globale pour le chemin de sélection ---
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

// --- Fonction centrale pour afficher les stackbars selon le chemin
function afficherStackbars(lot, chemin) {
  const container = document.getElementById('stackbar-container');
  container.innerHTML = '';

  let node = lot;
  let totalKg = lot.total || 0;
  let pctParent = 100;
  let niveau = 0;
  let continuer = true;
  let cheminCourant = [...chemin];

  // Si le chemin est vide, on commence par la première dimension
  if (cheminCourant.length === 0) {
    const dims = getDimensionsFromNode(node);
    if (dims.length > 0) {
      cheminCourant.push({ dimension: dims[0], valeur: null });
    }
  }

  while (continuer && niveau < 10) { // sécurité anti-boucle infinie
    const { dimension, valeur } = cheminCourant[niveau] || {};
    if (!dimension) break;
    const dims = getDimensionsFromNode(node);
    // HEADER (titre, navigation, %, poids, button group dimension, actions)
    const titre = document.createElement('div');
    titre.className = `stackbar-parent-title font-bold mt-2 mb-4 flex items-center justify-between`;
    titre.innerHTML = `
      <div class="flex items-center justify-between w-full">
        <div class="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white shadow-sm items-stretch h-10">
          ${niveau > 0 ? `<button class=\"px-3 h-full hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center justify-center stackbar-caret-left\" aria-label=\"Précédent\"><img src=\"../assets/svg/caret-left.svg\" alt=\"Précédent\" class=\"w-4 h-4\" /></button>` : ''}
          ${niveau > 0 ? `<button class=\"border-l border-gray-300 px-3 h-full hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center justify-center stackbar-caret-right\" aria-label=\"Suivant\"><img src=\"../assets/svg/caret-right.svg\" alt=\"Suivant\" class=\"w-4 h-4\" /></button>` : ''}
          <span class="border-l border-gray-300 px-4 h-full font-bold text-base flex items-center stackbar-title-nom" tabindex="0" style="cursor:pointer;">${niveau === 0 ? (lotCourant.title || 'Lot') : cheminCourant[niveau-1]?.valeur || ''}</span>
          <span class="border-l border-gray-300 px-3 h-full text-sm flex items-center">${pctParent.toFixed(1)}%</span>
          <span class="border-l border-gray-300 px-3 h-full text-sm flex items-center">${(totalKg * pctParent / 100).toFixed(0)} kg</span>
        </div>
        <div class="flex-1 flex justify-center">
          <div class="inline-flex rounded-lg border border-gray-300 bg-white shadow-sm items-center h-10 select-none gap-0">
            ${dims.map((dim, i) => `
              <button class="px-4 h-10 font-medium border-gray-300 border-r first:rounded-l-lg last:rounded-r-lg ${dim === dimension ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'} ${i === 0 ? '' : 'border-l'}" data-dimension="${dim}">${dim}</button>
            `).join('')}
          </div>
        </div>
        <div class="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white shadow-sm items-center ml-2 h-10">
          <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 rounded-lg" aria-label="Ajouter">
            <img src="../assets/svg/plus.svg" alt="Ajouter" class="w-4 h-4" />
          </button>
          <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 border-l border-gray-300" aria-label="Supprimer">
            <img src="../assets/svg/trash.svg" alt="Supprimer" class="w-4 h-4" />
          </button>
          <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 rounded-lg" aria-label="Fermer">
            <img src="../assets/svg/x.svg" alt="Fermer" class="w-4 h-4" />
          </button>
        </div>
      </div>`;
    container.appendChild(titre);

    // Ajout de la logique pour les boutons gauche/droite (sauf niveau 0)
    if (niveau > 0) {
      setTimeout(() => {
        const btnLeft = titre.querySelector('.stackbar-caret-left');
        const btnRight = titre.querySelector('.stackbar-caret-right');
        if (btnLeft || btnRight) {
          // On veut naviguer entre les frères du niveau parent
          const dimensionParent = cheminCourant[niveau-1]?.dimension;
          const valeurParent = cheminCourant[niveau-1]?.valeur;
          // Trouver le node parent
          let nodeParent = lot;
          for (let i = 0; i < niveau-1; i++) {
            const { dimension, valeur } = cheminCourant[i];
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
              let newChemin = cheminSelection.slice(0, niveau); // jusqu'au parent inclus
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
              let newChemin = cheminSelection.slice(0, niveau); // jusqu'au parent inclus
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

    // Afficher la stackbar pour la dimension courante
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

    // Si une valeur est sélectionnée, préparer la dimension enfant (sans valeur)
    if (valeur && node[dimension] && node[dimension][valeur]) {
      node = node[dimension][valeur];
      pctParent = typeof node.pourcentage === 'number' ? node.pourcentage : pctParent;
      const dimsEnfant = getDimensionsFromNode(node);
      if (dimsEnfant.length > 0) {
        // Si le chemin n'a pas encore ce niveau, on l'ajoute avec valeur null
        if (!cheminCourant[niveau+1] || cheminCourant[niveau+1].dimension !== dimsEnfant[0]) {
          cheminCourant = cheminCourant.slice(0, niveau+1);
          cheminCourant.push({ dimension: dimsEnfant[0], valeur: null });
        }
        niveau++;
        continue;
      }
    }
    continuer = false;
  }
  // Met à jour le chemin global
  cheminSelection = cheminCourant;
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
    if (dimension === 'format') {
      for (let i = 0; i < repartitionState.length; i++) {
        lotCourant.format[repartitionState[i].name].pourcentage = repartitionState[i].percent;
      }
    } else if (dimension === 'type') {
      const formatKey = parentKey;
      for (let i = 0; i < repartitionState.length; i++) {
        lotCourant.format[formatKey].types[repartitionState[i].name].pourcentage = repartitionState[i].percent;
      }
    } else if (dimension === 'matiere') {
      const [formatKey, typeKey] = parentKey.split('||');
      for (let i = 0; i < repartitionState.length; i++) {
        lotCourant.format[formatKey].types[typeKey].matieres[repartitionState[i].name].pourcentage = repartitionState[i].percent;
      }
    } else if (dimension === 'fibre') {
      // parentKey = matiereKey, il faut retrouver le chemin complet
      // On le retrouve via cheminSelection
      const [formatKey, typeKey, matiereKey] = cheminSelection;
      for (let i = 0; i < repartitionState.length; i++) {
        lotCourant.format[formatKey].types[typeKey].matieres[matiereKey].fibres[repartitionState[i].name] = repartitionState[i].percent;
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
    if (colorMap && colorMap[item.name]) {
      fillColor = d3.color(colorMap[item.name]);
    } else {
      if (dimension === 'format' || dimension === 'formats') fillColor = d3.color(d3.interpolateYlGn(t));
      else if (dimension === 'type' || dimension === 'types') fillColor = d3.color(d3.interpolatePlasma(t));
      else if (dimension === 'matiere' || dimension === 'matieres') fillColor = d3.color(d3.interpolateCool(t));
      else if (dimension === 'fibre' || dimension === 'fibres') {
        const tFibres = repartitionState.length > 1 ? (0.15 + 0.7 * (i / (repartitionState.length - 1))) : 0.5;
        fillColor = d3.color(d3.interpolateRainbow(tFibres));
      }
      else fillColor = d3.color('#bbb');
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
  const chemin = [...cheminSelection];
  const cle = chemin[niveau];
  if (!cle) return;

  // Navigue dynamiquement jusqu'au parent
  let parent = lotCourant;
  const keys = ['format', 'types', 'matieres', 'fibres'];
  for (let i = 0; i < niveau; i++) {
    parent = (i === 0) ? parent[keys[i]][chemin[i]] : parent[keys[i]][chemin[i]];
  }
  // Liste à modifier
  const liste = (niveau === 0) ? parent['format'] : parent[keys[niveau]];
  if (!liste || !liste[cle]) return;

  // Supprime la clé
  delete liste[cle];

  // Produit en croix pour réajuster les pourcentages
  let total = 0;
  const isFibres = (niveau === 3);
  Object.values(liste).forEach(obj => {
    if (isFibres) {
      total += typeof obj === 'number' ? obj : 0;
    } else {
      total += (typeof obj === 'object' && obj.pourcentage !== undefined) ? obj.pourcentage : 0;
    }
  });
  Object.keys(liste).forEach(k => {
    if (isFibres) {
      liste[k] = liste[k] * 100 / total;
    } else if (typeof liste[k] === 'object' && liste[k].pourcentage !== undefined) {
      liste[k].pourcentage = liste[k].pourcentage * 100 / total;
    }
  });

  // Tronque le chemin de sélection si besoin
  cheminSelection = cheminSelection.slice(0, niveau);
  afficherStackbars(lotCourant, cheminSelection);
}

// --- Fonction utilitaire pour créer le titre de stackbar avec les icônes ---
function creerTitreStackbar(niveau, nom, pct, kg) {
  const titre = document.createElement('div');
  titre.className = `stackbar-parent-title font-bold mt-2 mb-4 flex items-center justify-between`;

  // Trouver le nœud courant dans lotCourant selon cheminSelection et niveau
  let node = lotCourant;
  for (let i = 0; i <= niveau; i++) {
    if (i === 0) node = node.format ? node.format[cheminSelection[0]] : node[cheminSelection[0]];
    else if (i === 1) node = node.types ? node.types[cheminSelection[1]] : node[cheminSelection[1]];
    else if (i === 2) node = node.matieres ? node.matieres[cheminSelection[2]] : node[cheminSelection[2]];
    else if (i === 3) node = node.fibres ? node.fibres[cheminSelection[3]] : node[cheminSelection[3]];
    if (!node) break;
  }
  // Dimensions accessibles à ce niveau
  const dims = getDimensionsFromNode(node ? node : lotCourant);
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
        <button class="px-3 h-full hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center justify-center stackbar-caret-left" aria-label="Précédent">
          <img src="../assets/svg/caret-left.svg" alt="Précédent" class="w-4 h-4" />
        </button>
        <button class="border-l border-gray-300 px-3 h-full hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center justify-center stackbar-caret-right" aria-label="Suivant">
          <img src="../assets/svg/caret-right.svg" alt="Suivant" class="w-4 h-4" />
        </button>
        <span class="border-l border-gray-300 px-4 h-full font-bold text-base flex items-center stackbar-title-nom" tabindex="0" style="cursor:pointer;">${nom}</span>
        <span class="border-l border-gray-300 px-3 h-full text-sm flex items-center">${pct.toFixed(1)}%</span>
        <span class="border-l border-gray-300 px-3 h-full text-sm flex items-center">${kg ? `${kg} kg` : ''}</span>
      </div>
      <div class="flex-1 flex justify-center">
        <div class="inline-flex rounded-lg border border-blue-200 bg-blue-50 text-blue-600 font-semibold shadow items-center h-10 px-2 select-none gap-2">
          ${dims.map(dim => `
            <button class="px-4 h-8 rounded-md ${dim === labelText ? 'bg-blue-50 text-blue-600 font-semibold shadow border border-blue-200' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}">${dim.charAt(0).toUpperCase() + dim.slice(1).toLowerCase()}</button>
          `).join('')}
        </div>
      </div>
      <div class="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white shadow-sm items-center h-10">
        <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 rounded-l-lg border-r border-gray-300" aria-label="Ajouter">
          <img src="../assets/svg/plus.svg" alt="Ajouter" class="w-4 h-4" />
        </button>
        <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 border-r border-gray-300" aria-label="Supprimer">
          <img src="../assets/svg/trash.svg" alt="Supprimer" class="w-4 h-4" />
        </button>
        <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 rounded-r-lg" aria-label="Fermer">
          <img src="../assets/svg/x.svg" alt="Fermer" class="w-4 h-4" />
        </button>
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
    // Navigation carets
    const btnLeft = titre.querySelector('.stackbar-caret-left');
    const btnRight = titre.querySelector('.stackbar-caret-right');
    if (btnLeft) {
      btnLeft.onclick = () => {
        naviguerSiblingStackbar(niveau, -1);
      };
    }
    if (btnRight) {
      btnRight.onclick = () => {
        naviguerSiblingStackbar(niveau, +1);
      };
    }
  }, 0);

  return titre;
}

// Fonction utilitaire pour naviguer entre les éléments frères d'un niveau
function naviguerSiblingStackbar(niveau, direction) {
  // Récupère la clé courante au niveau
  const chemin = [...cheminSelection];
  if (chemin.length <= niveau) return;
  const cleCourante = chemin[niveau];
  let siblings = [];
  if (niveau === 0) {
    siblings = Object.keys(lotCourant.format);
  } else if (niveau === 1) {
    const formatKey = chemin[0];
    siblings = lotCourant.format[formatKey] && lotCourant.format[formatKey].types ? Object.keys(lotCourant.format[formatKey].types) : [];
  } else if (niveau === 2) {
    const formatKey = chemin[0];
    const typeKey = chemin[1];
    siblings = lotCourant.format[formatKey] && lotCourant.format[formatKey].types && lotCourant.format[formatKey].types[typeKey] && lotCourant.format[formatKey].types[typeKey].matieres ? Object.keys(lotCourant.format[formatKey].types[typeKey].matieres) : [];
  } else if (niveau === 3) {
    const formatKey = chemin[0];
    const typeKey = chemin[1];
    const matiereKey = chemin[2];
    siblings = lotCourant.format[formatKey] && lotCourant.format[formatKey].types && lotCourant.format[formatKey].types[typeKey] && lotCourant.format[formatKey].types[typeKey].matieres && lotCourant.format[formatKey].types[typeKey].matieres[matiereKey] && lotCourant.format[formatKey].types[typeKey].matieres[matiereKey].fibres ? Object.keys(lotCourant.format[formatKey].types[typeKey].matieres[matiereKey].fibres) : [];
  }
  if (!siblings.length) return;
  const idx = siblings.indexOf(cleCourante);
  if (idx === -1) return;
  let newIdx = idx + direction;
  if (newIdx < 0) newIdx = siblings.length - 1;
  if (newIdx >= siblings.length) newIdx = 0;
  chemin[niveau] = siblings[newIdx];
  cheminSelection = chemin.slice(0, niveau + 1);
  afficherStackbars(lotCourant, cheminSelection);
}

