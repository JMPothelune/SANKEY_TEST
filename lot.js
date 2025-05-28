// --- Ajout d'une variable globale pour le chemin de sélection ---
let cheminSelection = [];

// --- Ajout d'une variable globale pour le lot courant (mutable) ---
let lotCourant = null;

// --- Fonction centrale pour afficher les stackbars selon le chemin ---
function afficherStackbars(lot, chemin) {
  const container = document.getElementById('stackbar-container');
  container.innerHTML = '';

  // Ajout du pattern SVG pour le fond dashed
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute';
  svg.style.width = '0';
  svg.style.height = '0';
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
  pattern.setAttribute('id', 'dashed-bg');
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');
  pattern.setAttribute('width', '8');
  pattern.setAttribute('height', '8');
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', '8');
  rect.setAttribute('height', '8');
  rect.setAttribute('fill', '#f5f5f5');
  pattern.appendChild(rect);
  defs.appendChild(pattern);
  svg.appendChild(defs);
  container.appendChild(svg);

  // Affiche le poids total du lot en haut dans un button group
  if (lot.total) {
    const topBar = document.createElement('div');
    topBar.className = 'flex items-center justify-between mb-5';
    topBar.innerHTML = `
      <div class="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white shadow-sm items-stretch h-10">
        <span class="px-4 h-full font-bold text-base flex items-center">${lot.titre || 'Lot'}</span>
        <span class="border-l border-gray-300 px-3 h-full text-sm flex items-center">100%</span>
        <span class="border-l border-gray-300 px-3 h-full text-sm flex items-center">${Math.round(lot.total)} kg</span>
      </div>
      <div class="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white shadow-sm items-center ml-2 h-10">
        <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 rounded-lg" aria-label="Ajouter">
          <img src="../assets/svg/plus.svg" alt="Ajouter" class="w-4 h-4" />
        </button>
      </div>
    `;
    container.appendChild(topBar);
  }

  // 1. Formats
  const formats = lot.format;
  const formatKeys = Object.keys(formats);
  const repartitionFormats = formatKeys.map(key => ({
    name: key,
    percent: formats[key].pourcentage
  }));
  renderStackbar(repartitionFormats, window.colorMapFormatsGlobal, 'format', null, container, chemin[0]);

  // 2. Types (si un format sélectionné)
  if (chemin.length >= 1) {
    const formatKey = chemin[0];
    const formatObj = lot.format[formatKey];
    if (formatObj && formatObj.types) {
      // Titre format sélectionné
      const pct = formatObj.pourcentage;
      const poids = lot.total ? Math.round(lot.total * pct / 100) : '';
      const titreFormat = creerTitreStackbar(0, formatKey, pct, poids);
      container.appendChild(titreFormat);

      // Stackbar types
      const typeKeys = Object.keys(formatObj.types);
      const repartitionTypes = typeKeys.map(key => ({
        name: key,
        percent: formatObj.types[key].pourcentage
      }));
      renderStackbar(repartitionTypes, window.colorMapTypesGlobal, 'type', formatKey, container, chemin[1]);

      // 3. Matières (si un type sélectionné)
      if (chemin.length >= 2) {
        const typeKey = chemin[1];
        const typeObj = formatObj.types[typeKey];
        if (typeObj && typeObj.matieres) {
          // Titre type sélectionné
          const pctType = typeObj.pourcentage;
          const poidsType = lot.total ? Math.round(lot.total * formatObj.pourcentage / 100 * pctType / 100) : '';
          const titreType = creerTitreStackbar(1, typeKey, pctType, poidsType);
          container.appendChild(titreType);

          // Stackbar matières
          const matiereKeys = Object.keys(typeObj.matieres);
          const repartitionMatieres = matiereKeys.map(key => ({
            name: key,
            percent: typeObj.matieres[key].pourcentage
          }));
          renderStackbar(repartitionMatieres, window.colorMapMatieresGlobal, 'matiere', formatKey + '||' + typeKey, container, chemin[2]);

          // 4. Fibres (si une matière sélectionnée)
          if (chemin.length >= 3) {
            const matiereKey = chemin[2];
            const matiereObj = typeObj.matieres[matiereKey];
            if (matiereObj && matiereObj.fibres) {
              // Titre matière sélectionnée
              const pctMat = matiereObj.pourcentage || 0;
              const poidsMat = lot.total ? Math.round(lot.total * formatObj.pourcentage / 100 * typeObj.pourcentage / 100 * pctMat / 100) : '';
              const titreMatiere = creerTitreStackbar(2, matiereKey, pctMat, poidsMat);
              container.appendChild(titreMatiere);

              // Stackbar fibres
              const fibreKeys = Object.keys(matiereObj.fibres);
              const repartitionFibres = fibreKeys.map(key => ({
                name: key,
                percent: matiereObj.fibres[key]
              }));
              renderStackbar(repartitionFibres, window.colorMapFibresGlobal, 'fibre', matiereKey, container, null);
            }
          }
        }
      }
    }
  }

  // Après avoir inséré chaque titre, branche les listeners comme avant (DRY/générique)
  [...container.querySelectorAll('.stackbar-parent-title')].forEach(titreDiv => {
    const btnTrash = titreDiv.querySelector('button[aria-label="Supprimer"]');
    if (btnTrash) {
      const niveau = parseInt(titreDiv.getAttribute('data-niveau')) || [...container.querySelectorAll('.stackbar-parent-title')].indexOf(titreDiv);
      btnTrash.dataset.niveau = niveau;
      btnTrash.onclick = (e) => {
        const n = parseInt(e.currentTarget.dataset.niveau, 10);
        supprimerNoeudEtRepartir(n);
      };
    }
    const btnClose = titreDiv.querySelector('button[aria-label="Fermer"]');
    if (btnClose) {
      const niveau = parseInt(titreDiv.getAttribute('data-niveau')) || [...container.querySelectorAll('.stackbar-parent-title')].indexOf(titreDiv);
      btnClose.dataset.niveau = niveau;
      btnClose.onclick = (e) => {
        const n = parseInt(e.currentTarget.dataset.niveau, 10);
        cheminSelection = cheminSelection.slice(0, n);
        afficherStackbars(lotCourant, cheminSelection);
      };
    }
  });

  // À la toute fin de afficherStackbars, ajouter le bouton Enregistrer
  const saveBar = document.createElement('div');
  saveBar.className = 'flex justify-end mt-8';
  saveBar.innerHTML = `
    <div class="inline-flex rounded-lg shadow-sm">
      <button class="px-6 py-2 bg-blue text-gray-800 font-medium rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition">Enregistrer</button>
    </div>
  `;
  container.appendChild(saveBar);
}

// Ajout d'une fonction utilitaire pour forcer un minimum de pourcentage
function clampPercent(val, min = 1, max = 100) {
  return Math.max(min, Math.min(max, val));
}

// --- renderStackbar modifiée pour la stackbar des formats avec handles ---
function renderStackbar(repartition, colorMap, dimension, parentKey, container, selectedKey) {
  const stackbar = document.createElement('div');
  stackbar.id = `stackbar-${dimension}` + (parentKey ? `-${parentKey}` : '');
  stackbar.className = 'flex w-full h-16 overflow-hidden rounded-xl shadow-sm mb-5 relative';

  // On travaille sur une copie pour pouvoir modifier les valeurs
  let repartitionState = repartition.map(r => ({ ...r }));

  // Fonction pour mettre à jour l'affichage et les valeurs
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

  // Fonction pour mettre à jour lotCourant selon le niveau
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
    if (colorMap[item.name]) {
      fillColor = d3.color(colorMap[item.name]);
    } else {
      // fallback palette selon le niveau
      if (dimension === 'format') fillColor = d3.color(d3.interpolateYlGn(0.5));
      else if (dimension === 'type') fillColor = d3.color(d3.interpolatePlasma(0.5));
      else if (dimension === 'matiere') fillColor = d3.color(d3.interpolateCool(0.5));
      else if (dimension === 'fibre') fillColor = d3.color(d3.interpolateRainbow(0.5));
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
      let newChemin = [];
      if (dimension === 'format') newChemin = [item.name];
      if (dimension === 'type') newChemin = [parentKey, item.name];
      if (dimension === 'matiere') newChemin = [parentKey.split('||')[0], parentKey.split('||')[1], item.name];
      if (dimension === 'fibre') newChemin = [parentKey.split('||')[0], parentKey.split('||')[1], parentKey.split('||')[2], item.name];
      cheminSelection = newChemin;
      afficherStackbars(lotCourant, cheminSelection);
    });
    stackbar.appendChild(segment);
    // Handle (sauf après le dernier segment)
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

  // Détermination du label de dimension (niveau+1)
  let labelText = '';
  if (niveau + 1 === 0) labelText = 'Format';
  else if (niveau + 1 === 1) labelText = 'Type';
  else if (niveau + 1 === 2) labelText = 'Matière';
  else if (niveau + 1 === 3) labelText = 'Fibre';

  titre.innerHTML = `
    <div class="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white shadow-sm items-stretch h-10">
      <button class="px-3 h-full hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center justify-center stackbar-caret-left" aria-label="Précédent">
        <img src="../assets/svg/caret-left.svg" alt="Précédent" class="w-4 h-4" />
      </button>
      <button class="border-l border-gray-300 px-3 h-full hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center justify-center stackbar-caret-right" aria-label="Suivant">
        <img src="../assets/svg/caret-right.svg" alt="Suivant" class="w-4 h-4" />
      </button>
      <span class="border-l border-gray-300 px-4 h-full font-bold text-base flex items-center">${nom}</span>
      <span class="border-l border-gray-300 px-3 h-full text-sm flex items-center">${pct.toFixed(1)}%</span>
      <span class="border-l border-gray-300 px-3 h-full text-sm flex items-center">${kg ? `${kg} kg` : ''}</span>
      <span class="border-l border-gray-300 px-3 h-full text-sm text-black font-normal flex items-center">${labelText}</span>
    </div>
    <div class="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white shadow-sm items-center ml-2 h-10">
      <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 rounded-l-lg border-r border-gray-300" aria-label="Ajouter">
        <img src="../assets/svg/plus.svg" alt="Ajouter" class="w-4 h-4" />
      </button>
      <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 border-r border-gray-300" aria-label="Supprimer">
        <img src="../assets/svg/trash.svg" alt="Supprimer" class="w-4 h-4" />
      </button>
      <button class="h-full px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 rounded-r-lg" aria-label="Fermer">
        <img src="../assets/svg/x.svg" alt="Fermer" class="w-4 h-4" />
      </button>
    </div>`;

  // Ajout de la navigation caret gauche/droite
  setTimeout(() => {
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

// --- Chargement initial ---
fetch('../lot_type.json')
  .then(res => res.json())
  .then(lotType => {
    window._lotType = lotType;
    lotCourant = deepCopy(lotType);
    cheminSelection = [];

    // Génération des mappings globaux pour chaque dimension
    // 1. Formats
    const formatValues = Object.keys(lotType.format);
    const nFormats = formatValues.length;
    const formatPalette = Array.from({length: nFormats}, (_, i) => d3.interpolateYlGn(0.2 + 0.6 * (i / (nFormats - 1))));
    window.colorMapFormatsGlobal = {};
    formatValues.forEach((key, i) => {
      window.colorMapFormatsGlobal[key] = formatPalette[i];
    });

    // 2. Types
    const typeSet = new Set();
    Object.values(lotType.format).forEach(formatObj => {
      Object.keys(formatObj.types).forEach(type => typeSet.add(type));
    });
    const typeValues = Array.from(typeSet);
    const nTypes = typeValues.length;
    const typePalette = Array.from({length: nTypes}, (_, i) => d3.interpolatePlasma(0.15 + 0.7 * (i / (nTypes - 1))));
    window.colorMapTypesGlobal = {};
    typeValues.forEach((key, i) => {
      window.colorMapTypesGlobal[key] = typePalette[i];
    });

    // 3. Matières
    const matiereSet = new Set();
    Object.values(lotType.format).forEach(formatObj => {
      Object.values(formatObj.types).forEach(typeObj => {
        if (typeObj.matieres) {
          Object.keys(typeObj.matieres).forEach(matiere => matiereSet.add(matiere));
        }
      });
    });
    const matiereValues = Array.from(matiereSet);
    const nMatieres = matiereValues.length;
    const matierePalette = Array.from({length: nMatieres}, (_, i) => d3.interpolateCool(0.15 + 0.7 * (i / (nMatieres - 1))));
    window.colorMapMatieresGlobal = {};
    matiereValues.forEach((key, i) => {
      window.colorMapMatieresGlobal[key] = matierePalette[i];
    });

    // 4. Fibres
    const fibreSet = new Set();
    Object.values(lotType.format).forEach(formatObj => {
      Object.values(formatObj.types).forEach(typeObj => {
        if (typeObj.matieres) {
          Object.values(typeObj.matieres).forEach(matiereObj => {
            if (matiereObj.fibres) {
              Object.keys(matiereObj.fibres).forEach(fibre => fibreSet.add(fibre));
            }
          });
        }
      });
    });
    const fibreValues = Array.from(fibreSet);
    const nFibres = fibreValues.length;
    const fibrePalette = Array.from({length: nFibres}, (_, i) => d3.interpolateRainbow(0.15 + 0.7 * (i / (nFibres - 1))));
    window.colorMapFibresGlobal = {};
    fibreValues.forEach((key, i) => {
      window.colorMapFibresGlobal[key] = fibrePalette[i];
    });

    afficherStackbars(lotCourant, cheminSelection);
  });

