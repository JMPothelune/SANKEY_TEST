// Gestionnaire de la popup de transformation
class TransformationPopup {
  constructor() {
    this.backdrop = null;
    this.modal = null;
    this.currentRef = null; // Pour stocker la référence
    this.mode = null; // Pour stocker le mode
  }

  show(ref, mode) {
    console.log('TransformationPopup.show called with:', { ref, mode });
    this.currentRef = ref;
    this.mode = mode;
    this.createPopup(ref);
    // Ne pas appeler attachEventListeners ici, on le fera dans createPopupWithKeyList si nécessaire
  }

  createPopup(ref) {
    // Récupération de la transformation du lien cliqué
    const lastTransfo = ref.transformation || null;
    const lastType = lastTransfo
      ? Array.isArray(lastTransfo.type)
        ? lastTransfo.type[0]
        : lastTransfo.type
      : null;
    const keys =
      lastTransfo && lastTransfo.keys && lastTransfo.keys[0]
        ? lastTransfo.keys[0]
        : [];

    // Récupérer la keyList de la transformation sélectionnée
    let keyList = null;
    let keyListData = null;
    if (window.transformationTypes && lastType) {
      keyList = window.transformationTypes[lastType].keyList;
    }
    // Si keyList existe, charger dynamiquement la liste depuis l'API Bubble
    if (keyList) {
      // Ne pas créer le DOM du tout, juste faire le fetch
      chargerDonneesBaseAPI(keyList).then(data => {
        // Stocker la liste pour la suite
        keyListData = data;
        // Recréer la popup avec la vraie liste
        this.createPopupWithKeyList(ref, keyList, keyListData);
      });
      return; // On arrête ici, la suite sera gérée dans createPopupWithKeyList
    }

    // Création du backdrop (transparent comme dans /lots)
    this.backdrop = document.createElement('div');
    this.backdrop.className =
      'fixed inset-0 flex items-center justify-center z-50';
    this.backdrop.style.background = 'none';

    // Création de la modal avec ombre prononcée comme dans /lots
    this.modal = document.createElement('div');
    this.modal.className =
      'bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6';
    this.modal.style.boxShadow =
      '0 8px 40px 8px rgba(0,0,0,0.35), 0 1.5px 8px rgba(0,0,0,0.10)';

    // Génération dynamique des options du select
    let options = '';
    if (!lastType) {
      options +=
        '<option value="" disabled selected>Sélectionner une transformation</option>';
    }
    options += (
      window.transformationUtils
        ? window.transformationUtils.getAvailableTransformations()
        : []
    )
      .map(
        t =>
          `<option value="${t.value}" ${lastType === t.value ? 'selected' : ''}>${t.label}</option>`
      )
      .join('');

    // Label et description de la transformation sélectionnée
    const currentLabel =
      lastType && window.transformationUtils
        ? window.transformationUtils.getTransformationLabel(lastType)
        : 'Aucune transformation';
    const currentDesc =
      lastType && window.transformationUtils
        ? window.transformationUtils.getTransformationDescription(lastType)
        : '';

    // Pills pour les keys
    const pills = keys
      .map(
        (key, i) =>
          `<span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm mr-2 mb-2">
        ${key}
        <button type="button" class="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none" data-key-index="${i}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </span>`
      )
      .join('');

    // Input et dropdown pour les keys (affiché seulement si keyList)
    const keyInputHTML = keyList
      ? `
      <div class="relative mt-2">
        <input id="key-input" type="text" autocomplete="off" placeholder="Paramètres" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" />
        <div id="key-dropdown" class="absolute left-0 right-0 bg-white border border-gray-200 rounded shadow-lg z-10 hidden max-h-40 overflow-y-auto"></div>
      </div>
    `
      : '';

    // Adapter le titre et le texte du bouton selon le mode
    const title =
      this.mode === 'add'
        ? 'Ajouter une transformation'
        : 'Modifier la transformation';
    const buttonText = this.mode === 'add' ? 'Créer' : 'Enregistrer';

    this.modal.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">${title}</h3>
      ${
        this.mode === 'edit' && lastTransfo && lastTransfo._path
          ? `<div class="text-xs text-gray-500 mb-4">
          <div>Path: ${JSON.stringify(lastTransfo._path)}</div>
          ${typeof lastTransfo._index === 'number' ? `<div>Index: ${lastTransfo._index}</div>` : ''}
         </div>`
          : this.mode === 'add'
            ? `<div class="text-xs text-gray-500 mb-4">
          <div>Path: ${JSON.stringify(ref.path)}</div>
         </div>`
            : ''
      }
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type de transformation</label>
          <select id="transfo-type" class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
            ${options}
          </select>
          <div id="transfo-description" class="text-xs text-gray-500 mt-1">${currentDesc}</div>
          <div id="transfo-keys" class="flex flex-wrap mt-2">${pills}</div>
          ${keyInputHTML}
        </div>
      </div>
      <div class="mt-6 flex justify-end space-x-3">
        <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Annuler</button>
        <button id="save-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">${buttonText}</button>
      </div>
    `;

    this.backdrop.appendChild(this.modal);
    document.body.appendChild(this.backdrop);

    // Attacher les listeners seulement ici, quand le DOM est prêt
    this.attachEventListeners();
  }

  // Nouvelle méthode pour créer la popup avec la keyList chargée
  createPopupWithKeyList(ref, keyList, keyListData) {
    // Création du backdrop (transparent comme dans /lots)
    this.backdrop = document.createElement('div');
    this.backdrop.className =
      'fixed inset-0 flex items-center justify-center z-50';
    this.backdrop.style.background = 'none';

    // Création de la modal avec ombre prononcée comme dans /lots
    this.modal = document.createElement('div');
    this.modal.className =
      'bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6';
    this.modal.style.boxShadow =
      '0 8px 40px 8px rgba(0,0,0,0.35), 0 1.5px 8px rgba(0,0,0,0.10)';

    // Récupération de la transformation du lien cliqué
    const lastTransfo = ref.transformation || null;
    const lastType = lastTransfo
      ? Array.isArray(lastTransfo.type)
        ? lastTransfo.type[0]
        : lastTransfo.type
      : null;
    const keys =
      lastTransfo && lastTransfo.keys && lastTransfo.keys[0]
        ? lastTransfo.keys[0]
        : [];

    // Pills pour les keys
    const pills = keys
      .map(
        (key, i) =>
          `<span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm mr-2 mb-2">
        ${key}
        <button type="button" class="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none" data-key-index="${i}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </span>`
      )
      .join('');

    // Générer les options du dropdown à partir de keyListData
    const keyOptions = Object.keys(keyListData || {})
      .map(
        k =>
          `<div class="px-3 py-2 hover:bg-blue-100 cursor-pointer" data-key="${k}">${k}</div>`
      )
      .join('');
    const keyInputHTML = keyList
      ? `
      <div class="relative mt-2">
        <input id="key-input" type="text" autocomplete="off" placeholder="Paramètres" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" />
        <div id="key-dropdown" class="absolute left-0 right-0 bg-white border border-gray-200 rounded shadow-lg z-10 max-h-40 overflow-y-auto">${keyOptions}</div>
      </div>
    `
      : '';

    // Label et description de la transformation sélectionnée
    const currentLabel =
      lastType && window.transformationUtils
        ? window.transformationUtils.getTransformationLabel(lastType)
        : 'Aucune transformation';
    const currentDesc =
      lastType && window.transformationUtils
        ? window.transformationUtils.getTransformationDescription(lastType)
        : '';

    // Génération dynamique des options du select (AJOUTÉ)
    let options = '';
    if (!lastType) {
      options +=
        '<option value="" disabled selected>Sélectionner une transformation</option>';
    }
    options += (
      window.transformationUtils
        ? window.transformationUtils.getAvailableTransformations()
        : []
    )
      .map(
        t =>
          `<option value="${t.value}" ${lastType === t.value ? 'selected' : ''}>${t.label}</option>`
      )
      .join('');

    // Adapter le titre et le texte du bouton selon le mode
    const title =
      this.mode === 'add'
        ? 'Ajouter une transformation'
        : 'Modifier la transformation';
    const buttonText = this.mode === 'add' ? 'Créer' : 'Enregistrer';

    this.modal.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">${title}</h3>
      ${
        this.mode === 'edit' && lastTransfo && lastTransfo._path
          ? `<div class="text-xs text-gray-500 mb-4">
          <div>Path: ${JSON.stringify(lastTransfo._path)}</div>
          ${typeof lastTransfo._index === 'number' ? `<div>Index: ${lastTransfo._index}</div>` : ''}
         </div>`
          : this.mode === 'add'
            ? `<div class="text-xs text-gray-500 mb-4">
          <div>Path: ${JSON.stringify(ref.path)}</div>
         </div>`
            : ''
      }
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type de transformation</label>
          <select id="transfo-type" class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
            ${options}
          </select>
          <div id="transfo-description" class="text-xs text-gray-500 mt-1">${currentDesc}</div>
          <div id="transfo-keys" class="flex flex-wrap mt-2">${pills}</div>
          ${keyInputHTML}
        </div>
      </div>
      <div class="mt-6 flex justify-end space-x-3">
        <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Annuler</button>
        <button id="save-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">${buttonText}</button>
      </div>
    `;

    this.backdrop.appendChild(this.modal);
    document.body.appendChild(this.backdrop);

    // Attacher les listeners seulement ici, quand le DOM est complètement prêt
    this.attachEventListeners();
  }

  attachEventListeners() {
    const cancelBtn = this.modal.querySelector('#cancel-btn');
    const saveBtn = this.modal.querySelector('#save-btn');
    const transfoTypeSelect = this.modal.querySelector('#transfo-type');
    const transfoDescription = this.modal.querySelector('#transfo-description');
    const keysContainer = this.modal.querySelector('#transfo-keys');
    const keyInput = this.modal.querySelector('#key-input');
    const keyDropdown = this.modal.querySelector('#key-dropdown');

    // Pour garder la liste des keys sélectionnées (CORRIGÉ)
    let selectedKeys = keysContainer
      ? Array.from(keysContainer.querySelectorAll('span')).map(span =>
          span.textContent.trim().replace(/×$/, '').trim()
        )
      : [];

    // Fonction pour vérifier si le bouton de sauvegarde doit être activé
    const updateSaveButtonState = () => {
      const selectedType = transfoTypeSelect.value;
      // 1. Dropdown vide ?
      const isDropdownEmpty = !selectedType;
      // 2. Cette transfo nécessite des paramètres ? (input visible = keyList défini)
      const keyList =
        window.transformationTypes &&
        window.transformationTypes[selectedType] &&
        window.transformationTypes[selectedType].keyList;
      const isRequiredKey =
        window.transformationTypes &&
        window.transformationTypes[selectedType] &&
        window.transformationTypes[selectedType].requiredKey;
      const hasKeys = selectedKeys.length > 0;
      // Le bouton est enabled seulement si :
      // - une transfo est sélectionnée
      // - ET (si keyList existe et requiredKey, alors il faut au moins une key)
      const isValid =
        !isDropdownEmpty && (!keyList || !isRequiredKey || hasKeys);
      saveBtn.disabled = !isValid;
      saveBtn.className = isValid
        ? 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        : 'px-4 py-2 bg-gray-400 text-gray-200 rounded cursor-not-allowed';
    };

    // Initialiser l'état du bouton
    updateSaveButtonState();

    cancelBtn.onclick = () => this.close();

    saveBtn.onclick = () => {
      const transformation = {
        type: [transfoTypeSelect.value],
        keys: [selectedKeys],
      };

      if (this.currentRef) {
        if (
          this.mode === 'add' &&
          typeof window.onTransformationAdd === 'function'
        ) {
          // Injecter le path du node dans la transformation
          transformation._path = this.currentRef.path || ['transformations'];
          window.onTransformationAdd(this.currentRef.nodeId, transformation);
        } else if (
          this.mode === 'edit' &&
          typeof window.onTransformationSave === 'function'
        ) {
          // Récupérer le path et l'index de la transformation existante
          const existingTransfo = this.currentRef.transformation;
          if (
            existingTransfo &&
            existingTransfo._path &&
            typeof existingTransfo._index === 'number'
          ) {
            // Utiliser directement updateTransformation
            const scenarioIdx =
              document.getElementById('scenario-selector').value;

            // Vérifier que window.scenarios existe
            if (!window.scenarios) {
              console.error('window.scenarios is not defined');
              return;
            }

            const scenario = window.scenarios[scenarioIdx]?.scenario;
            if (scenario) {
              window.updateTransformation(
                scenario,
                existingTransfo._path,
                existingTransfo._index,
                transformation
              );
              // Relancer le Sankey
              const lot = window.lotType;
              const dimension =
                document.getElementById('dimension-selector').value;
              if (typeof runSankey === 'function') {
                runSankey({
                  lot,
                  scenario,
                  containerId: 'sankey-container',
                  dimension,
                });
              }
            }
          } else {
            // Fallback sur l'ancien système si on n'a pas les métadonnées
            window.onTransformationSave(this.currentRef.nodeId, transformation);
          }
        }
      }

      this.close();
    };

    transfoTypeSelect.addEventListener('change', e => {
      const newType = e.target.value;

      if (window.transformationUtils) {
        transfoDescription.textContent =
          window.transformationUtils.getTransformationDescription(newType);
      }

      // Réinitialiser les clés sélectionnées lors du changement de type
      selectedKeys = [];
      keysContainer.innerHTML = '';
      if (keyInput) keyInput.value = '';
      if (keyDropdown) keyDropdown.classList.add('hidden');

      // Vérifier si la nouvelle transformation nécessite des paramètres
      const keyList =
        window.transformationTypes &&
        window.transformationTypes[newType] &&
        window.transformationTypes[newType].keyList;

      if (keyList) {
        // Créer l'input et le dropdown s'ils n'existent pas
        let keyInputContainer = this.modal.querySelector(
          '#key-input-container'
        );
        if (!keyInputContainer) {
          keyInputContainer = document.createElement('div');
          keyInputContainer.className = 'relative mt-2';
          keyInputContainer.id = 'key-input-container';

          const inputHTML = `
            <input id="key-input" type="text" autocomplete="off" placeholder="Paramètres" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" />
            <div id="key-dropdown" class="absolute left-0 right-0 bg-white border border-gray-200 rounded shadow-lg z-10 max-h-40 overflow-y-auto hidden"></div>
          `;
          keyInputContainer.innerHTML = inputHTML;

          // Insérer après le container des keys
          const keysContainerParent = keysContainer.parentNode;
          keysContainerParent.insertBefore(
            keyInputContainer,
            keysContainer.nextSibling
          );
        }

        // Afficher le loader dans l'input et le dropdown
        const keyInput = this.modal.querySelector('#key-input');
        const keyDropdown = this.modal.querySelector('#key-dropdown');
        if (keyInput && keyDropdown) {
          keyInput.value = '';
          keyInput.placeholder = 'Chargement des paramètres...';
          keyInput.disabled = true;
          keyDropdown.innerHTML =
            '<div class="flex items-center justify-center p-4"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div><span class="text-gray-600 text-sm">Chargement...</span></div>';
          keyDropdown.classList.remove('hidden');
        }

        // Charger les données dynamiquement sans fermer la popup
        chargerDonneesBaseAPI(keyList).then(data => {
          // Mettre à jour l'input et le dropdown avec les nouvelles données
          const keyInput = this.modal.querySelector('#key-input');
          const keyDropdown = this.modal.querySelector('#key-dropdown');

          if (keyInput && keyDropdown) {
            // Restaurer l'input
            keyInput.placeholder = 'Paramètres';
            keyInput.disabled = false;

            // Générer les options du dropdown à partir des nouvelles données
            const keyOptions = Object.keys(data || {})
              .map(
                k =>
                  `<div class="px-3 py-2 hover:bg-blue-100 cursor-pointer" data-key="${k}">${k}</div>`
              )
              .join('');

            // Mettre à jour le dropdown
            keyDropdown.innerHTML = keyOptions;
            keyDropdown.classList.add('hidden'); // Cacher par défaut

            // Réattacher les listeners pour le nouveau dropdown (CORRIGÉ)
            keyDropdown.addEventListener('mousedown', e => {
              if (e.target && e.target.dataset.key) {
                const key = e.target.dataset.key;
                if (!selectedKeys.includes(key)) {
                  selectedKeys.push(key);
                  // Ajouter le pill visuellement
                  const pill = document.createElement('span');
                  pill.className =
                    'inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm mr-2 mb-2';
                  pill.innerHTML = `${key}<button type="button" class="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none" data-key-index="${selectedKeys.length - 1}"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>`;
                  keysContainer.appendChild(pill);
                  // Ajout du listener pour suppression
                  pill
                    .querySelector('button[data-key-index]')
                    .addEventListener('click', ev => {
                      ev.preventDefault();
                      selectedKeys = selectedKeys.filter(k2 => k2 !== key);
                      pill.remove();
                      updateSaveButtonState();
                    });
                  updateSaveButtonState();
                }
                keyDropdown.classList.add('hidden');
                keyDropdown.innerHTML = '';
                keyInput.value = '';
              }
            });

            // Réattacher les listeners pour l'input
            keyInput.addEventListener('focus', () => {
              const showFilteredOptions = (value = '') => {
                const allKeys = Object.keys(data || {});
                const filtered = allKeys.filter(
                  k =>
                    k &&
                    k.toLowerCase().includes(value.toLowerCase()) &&
                    !selectedKeys.includes(k)
                );
                if (filtered.length > 0) {
                  keyDropdown.innerHTML = filtered
                    .map(
                      k =>
                        `<div class="px-3 py-2 hover:bg-blue-100 cursor-pointer" data-key="${k}">${k}</div>`
                    )
                    .join('');
                  keyDropdown.classList.remove('hidden');
                } else {
                  keyDropdown.innerHTML = '';
                  keyDropdown.classList.add('hidden');
                }
              };
              showFilteredOptions();
            });

            keyInput.addEventListener('input', e => {
              const showFilteredOptions = (value = '') => {
                const allKeys = Object.keys(data || {});
                const filtered = allKeys.filter(
                  k =>
                    k &&
                    k.toLowerCase().includes(value.toLowerCase()) &&
                    !selectedKeys.includes(k)
                );
                if (filtered.length > 0) {
                  keyDropdown.innerHTML = filtered
                    .map(
                      k =>
                        `<div class="px-3 py-2 hover:bg-blue-100 cursor-pointer" data-key="${k}">${k}</div>`
                    )
                    .join('');
                  keyDropdown.classList.remove('hidden');
                } else {
                  keyDropdown.innerHTML = '';
                  keyDropdown.classList.add('hidden');
                }
              };
              showFilteredOptions(e.target.value.trim());
            });

            // Fermer le dropdown si on clique ailleurs
            document.addEventListener('mousedown', e => {
              if (
                !keyInput.contains(e.target) &&
                !keyDropdown.contains(e.target)
              ) {
                keyDropdown.classList.add('hidden');
              }
            });
          }
          updateSaveButtonState();
        });
      } else {
        // Pas de paramètres nécessaires, supprimer l'input s'il existe
        const keyInputContainer = this.modal.querySelector(
          '#key-input-container'
        );
        if (keyInputContainer) {
          keyInputContainer.remove();
        }
        updateSaveButtonState();
      }
    });

    // Suppression visuelle d'une key (et du modèle)
    if (keysContainer) {
      keysContainer.querySelectorAll('button[data-key-index]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          const pill = btn.closest('span');
          if (pill) {
            const key = pill.textContent.trim();
            selectedKeys = selectedKeys.filter(k => k !== key);
            pill.remove();
            updateSaveButtonState(); // Mettre à jour l'état du bouton
          }
        });
      });
    }

    this.backdrop.onclick = e => {
      if (e.target === this.backdrop) this.close();
    };
  }

  close() {
    if (this.backdrop) {
      this.backdrop.remove();
      this.backdrop = null;
      this.modal = null;
    }
  }
}

// Fonction utilitaire pour charger dynamiquement la liste depuis l'API Bubble
async function chargerDonneesBaseAPI(dimension) {
  try {
    // Récupérer le paramètre isLive depuis l'URL si présent
    const urlParams = new URLSearchParams(window.location.search);
    const isLive = urlParams.get('isLive') === 'true';
    // Mapping dimension → endpoint
    const mapping = {
      formats: 'formats',
      types: 'types',
      matieres: 'matieres',
      fibres: 'fibres',
      couleurs: 'couleurs',
      qualite: 'qualites',
      proprete: 'propretes',
      perturbateurs: 'perturbateurs',
    };
    const endpoint = mapping[dimension] || dimension;
    const response = await fetch('/api/bubble', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        params: { isLive },
        method: 'GET',
      }),
    });
    if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Erreur lors du chargement des données Bubble:', error);
    return {};
  }
}

// Exposer la popup globalement
window.transformationPopup = new TransformationPopup();
window.afficherPopupTransfo = (ref, mode) =>
  window.transformationPopup.show(ref, mode);
