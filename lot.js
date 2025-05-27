// --- Ajout d'une variable globale pour le chemin de sélection ---
let cheminSelection = [];

// --- Fonction centrale pour afficher les stackbars selon le chemin ---
function afficherStackbars(lot, chemin) {
  const container = document.getElementById('stackbar-container');
  container.innerHTML = '';

  // 1. Formats
  const formats = lot.format;
  const formatKeys = Object.keys(formats);
  const repartitionFormats = formatKeys.map(key => ({
    name: key,
    percent: formats[key].pourcentage
  }));
  const nFormats = formatKeys.length;
  const formatPalette = Array.from({length: nFormats}, (_, i) =>
    d3.interpolateYlGn(0.2 + 0.6 * (i / (nFormats - 1)))
  );
  const colorMapFormats = {};
  formatKeys.forEach((key, i) => {
    colorMapFormats[key] = formatPalette[i];
  });
  renderStackbar(repartitionFormats, colorMapFormats, 'format', null, container, chemin[0]);

  // 2. Types (si un format sélectionné)
  if (chemin.length >= 1) {
    const formatKey = chemin[0];
    const formatObj = lot.format[formatKey];
    if (formatObj && formatObj.types) {
      // Ajout du titre du format sélectionné
      const titreFormat = document.createElement('div');
      titreFormat.className = 'stackbar-parent-title';
      titreFormat.innerHTML = `<strong>${formatKey}</strong> <span style="color:#888;font-weight:normal;">${formatObj.pourcentage.toFixed(1)}%</span>`;
      titreFormat.style.margin = '8px 0 2px 0';
      titreFormat.style.fontSize = '1.15rem';
      titreFormat.style.fontWeight = 'bold';
      container.appendChild(titreFormat);

      const typeKeys = Object.keys(formatObj.types);
      const repartitionTypes = typeKeys.map(key => ({
        name: key,
        percent: formatObj.types[key].pourcentage
      }));
      const nTypes = typeKeys.length;
      const typePalette = Array.from({length: nTypes}, (_, i) =>
        d3.interpolatePlasma(0.15 + 0.7 * (i / (nTypes - 1)))
      );
      const colorMapTypes = {};
      typeKeys.forEach((key, i) => {
        colorMapTypes[key] = typePalette[i];
      });
      renderStackbar(repartitionTypes, colorMapTypes, 'type', formatKey, container, chemin[1]);

      // 3. Matières (si un type sélectionné)
      if (chemin.length >= 2) {
        const typeKey = chemin[1];
        const typeObj = formatObj.types[typeKey];
        if (typeObj && typeObj.matieres) {
          // Ajout du titre du type sélectionné
          const titreType = document.createElement('div');
          titreType.className = 'stackbar-parent-title';
          titreType.innerHTML = `<strong>${typeKey}</strong> <span style="color:#888;font-weight:normal;">${typeObj.pourcentage.toFixed(1)}%</span>`;
          titreType.style.margin = '8px 0 2px 0';
          titreType.style.fontSize = '1.08rem';
          titreType.style.fontWeight = 'bold';
          container.appendChild(titreType);

          const matiereKeys = Object.keys(typeObj.matieres);
          const repartitionMatieres = matiereKeys.map(key => ({
            name: key,
            percent: typeObj.matieres[key].pourcentage
          }));
          const nMatieres = matiereKeys.length;
          const matierePalette = Array.from({length: nMatieres}, (_, i) =>
            d3.interpolateCool(0.15 + 0.7 * (i / (nMatieres - 1)))
          );
          const colorMapMatieres = {};
          matiereKeys.forEach((key, i) => {
            colorMapMatieres[key] = matierePalette[i];
          });
          renderStackbar(repartitionMatieres, colorMapMatieres, 'matiere', typeKey, container, chemin[2]);

          // 4. Fibres (si une matière sélectionnée)
          if (chemin.length >= 3) {
            const matiereKey = chemin[2];
            const matiereObj = typeObj.matieres[matiereKey];
            if (matiereObj && matiereObj.fibres) {
              // Ajout du titre de la matière sélectionnée
              const titreMatiere = document.createElement('div');
              titreMatiere.className = 'stackbar-parent-title';
              titreMatiere.innerHTML = `<strong>${matiereKey}</strong> <span style="color:#888;font-weight:normal;">${matiereObj.pourcentage ? matiereObj.pourcentage.toFixed(1) : ''}%</span>`;
              titreMatiere.style.margin = '8px 0 2px 0';
              titreMatiere.style.fontSize = '1.02rem';
              titreMatiere.style.fontWeight = 'bold';
              container.appendChild(titreMatiere);

              const fibreKeys = Object.keys(matiereObj.fibres);
              const repartitionFibres = fibreKeys.map(key => ({
                name: key,
                percent: matiereObj.fibres[key]
              }));
              const nFibres = fibreKeys.length;
              const fibrePalette = Array.from({length: nFibres}, (_, i) =>
                d3.interpolateRainbow(0.15 + 0.7 * (i / (nFibres - 1)))
              );
              const colorMapFibres = {};
              fibreKeys.forEach((key, i) => {
                colorMapFibres[key] = fibrePalette[i];
              });
              renderStackbar(repartitionFibres, colorMapFibres, 'fibre', matiereKey, container, chemin[3]);
            }
          }
        }
      }
    }
  }
}

// --- renderStackbar modifiée pour gérer la sélection et le callback ---
function renderStackbar(repartition, colorMap, dimension, parentKey, container, selectedKey) {
  const stackbar = document.createElement('div');
  stackbar.id = `stackbar-${dimension}` + (parentKey ? `-${parentKey}` : '');
  stackbar.style.display = 'flex';
  stackbar.style.width = '100%';
  stackbar.style.height = '64px';
  stackbar.style.overflow = 'hidden';
  stackbar.style.borderRadius = '10px';
  stackbar.style.boxShadow = '0 1px 4px #0001';
  stackbar.style.marginBottom = '18px';

  repartition.forEach((item, i) => {
    const segment = document.createElement('div');
    segment.style.background = colorMap[item.name];
    segment.style.width = item.percent + '%';
    segment.style.display = 'flex';
    segment.style.alignItems = 'center';
    segment.style.justifyContent = 'center';
    segment.style.position = 'relative';
    segment.style.transition = 'all 0.2s';
    segment.style.fontWeight = 'bold';
    segment.style.fontSize = '1.1rem';
    segment.style.letterSpacing = '0.5px';
    segment.classList.add('stackbar-segment');
    if (i === 0) segment.style.borderRadius = '10px 0 0 10px';
    if (i === repartition.length - 1) segment.style.borderRadius = '0 10px 10px 0';

    // Sélection visuelle
    if (selectedKey === item.name) {
      segment.classList.add('selected');
      segment.style.border = '3px solid #000';
      segment.style.boxShadow = '0 0 0 2px #fff';
      segment.style.zIndex = '1';
    }

    // Texte centré
    const label = document.createElement('div');
    label.innerHTML = `<span class=\"stackbar-label\">${item.name}</span><br><span style=\"font-size:0.95rem;color:#fff;\">${item.percent.toFixed(1)}%</span>`;
    label.style.textAlign = 'center';
    label.style.width = '100%';
    segment.appendChild(label);

    // Gestion du clic pour navigation
    segment.style.cursor = 'pointer';
    segment.addEventListener('click', () => {
      // On coupe le chemin à ce niveau et on ajoute la nouvelle sélection
      let newChemin = [];
      if (dimension === 'format') newChemin = [item.name];
      if (dimension === 'type') newChemin = [parentKey, item.name];
      if (dimension === 'matiere') newChemin = [parentKey.split('||')[0], parentKey.split('||')[1], item.name];
      if (dimension === 'fibre') newChemin = [parentKey.split('||')[0], parentKey.split('||')[1], parentKey.split('||')[2], item.name];
      cheminSelection = newChemin;
      afficherStackbars(window._lotType, cheminSelection);
    });

    stackbar.appendChild(segment);
  });
  container.appendChild(stackbar);
}

// --- Chargement initial ---
fetch('../lot_type.json')
  .then(res => res.json())
  .then(lotType => {
    window._lotType = lotType;
    cheminSelection = [];
    afficherStackbars(lotType, cheminSelection);
  });
