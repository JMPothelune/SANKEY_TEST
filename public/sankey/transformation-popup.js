// Gestionnaire de la popup de transformation
// Fichier chargé
class TransformationPopup {
  constructor() {
    this.backdrop = null;
    this.modal = null;
    this.currentRef = null; // Pour stocker la référence
    this.mode = null; // Pour stocker le mode
    this._dropdownCloseHandler = null; // Pour gérer le dropdown proprement
    this.selectedKeys = []; // Pour stocker les keys sélectionnées
  }

  getSelectedKeys() {
    return this.selectedKeys;
  }

  show(ref, mode) {
    // TransformationPopup.show called
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

    // Détecter si c'est une transformation dynamique (nouveau format ou ancien)
    const isDynamicTransfo =
      lastType &&
      (lastType === 'dynamic_transfo' ||
        lastType.startsWith('dynamic_transfo_'));

    if (isDynamicTransfo) {
      console.log('Transformation dynamique détectée:', lastType);
      // Pour les transformations dynamiques, utiliser la popup existante
      // mais charger les transformations disponibles d'abord
      if (window.transformationUtils) {
        window.transformationUtils
          .getAvailableTransformations()
          .then(transformations => {
            // Calculer la valeur à présélectionner dans le <select>
            const selectedValue =
              lastType === 'dynamic_transfo' && lastTransfo?.dynamic_transfo_id
                ? `dynamic_transfo_${lastTransfo.dynamic_transfo_id}`
                : lastType;
            // Créer un squelette minimal puis charger et mettre à jour avec présélection
            this.createPopupWithoutKeyList(ref, selectedValue, keys);
            this.loadTransformationsAndUpdatePopup(ref, selectedValue, keys);
          })
          .catch(error => {
            console.error(
              'Erreur lors du chargement des transformations dynamiques:',
              error
            );
            // Fallback : créer la popup de base
            const selectedValue =
              lastType === 'dynamic_transfo' && lastTransfo?.dynamic_transfo_id
                ? `dynamic_transfo_${lastTransfo.dynamic_transfo_id}`
                : lastType;
            this.createPopupWithoutKeyList(ref, selectedValue, keys);
          });
      } else {
        // Fallback : créer la popup de base
        const selectedValue =
          lastType === 'dynamic_transfo' && lastTransfo?.dynamic_transfo_id
            ? `dynamic_transfo_${lastTransfo.dynamic_transfo_id}`
            : lastType;
        this.createPopupWithoutKeyList(ref, selectedValue, keys);
      }
      return;
    }

    // Récupérer la keyList de la transformation sélectionnée
    let keyList = null;
    let keyListData = null;
    if (
      lastType &&
      lastType !== 'dynamic_transfo' &&
      !(lastType && lastType.startsWith('dynamic_transfo_')) &&
      window.transformationTypes &&
      window.transformationTypes[lastType]
    ) {
      keyList = window.transformationTypes[lastType].keyList;
    }

    // Si keyList existe, charger dynamiquement la liste depuis l'API Bubble
    if (keyList) {
      // TOUJOURS créer la popup de base d'abord
      this.createPopupWithoutKeyList(ref, lastType, keys);

      // Puis charger les données et mettre à jour
      Promise.all([
        chargerDonneesBaseAPI(keyList),
        window.transformationUtils
          ? window.transformationUtils.getAvailableTransformations()
          : Promise.resolve([]),
      ])
        .then(([baseData, transformations]) => {
          // Stocker la liste pour la suite
          keyListData = baseData;
          // Maintenant on peut mettre à jour la popup existante avec la vraie liste et les transformations dynamiques
          this.createPopupWithKeyList(
            ref,
            keyList,
            keyListData,
            transformations
          );
        })
        .catch(error => {
          console.error('Erreur lors du chargement des données:', error);
          // La popup de base existe déjà, on peut afficher l'erreur dedans
          if (this.modal) {
            this.modal.innerHTML = `
              <div class="text-red-600 text-sm">
                Erreur lors du chargement des données. Veuillez réessayer.
              </div>
            `;
          }
        });
      return; // On arrête ici, la suite sera gérée dans createPopupWithKeyList
    }

    // Pas de keyList, créer la popup directement avec loader
    this.createPopupWithoutKeyList(ref, lastType, keys);
  }

  // Méthode pour créer la popup sans keyList (pas de paramètres)
  createPopupWithoutKeyList(ref, lastType, keys) {
    // Création du backdrop (transparent comme dans /lots)
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'fixed inset-0 z-50';
    this.backdrop.style.background = 'none';

    // Création de la modal avec ombre prononcée comme dans /lots
    this.modal = document.createElement('div');
    this.modal.className =
      'bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6';
    this.modal.style.boxShadow =
      '0 8px 40px 8px rgba(0,0,0,0.35), 0 1.5px 8px rgba(0,0,0,0.10)';
    this.modal.style.position = 'absolute';
    this.modal.style.top = '200px';
    this.modal.style.left = '50%';
    this.modal.style.transform = 'translateX(-50%)';

    // Pills pour les keys existantes
    const displayNames =
      ref.transformation && ref.transformation._displayNames
        ? ref.transformation._displayNames[0]
        : keys;
    const pills = displayNames
      .map((name, i) => {
        const keyId = keys[i] || name;
        const isBubbleId = /^\d+x\d+$/.test(keyId);
        const textColor = isBubbleId ? 'text-blue-800' : 'text-red-600';
        return `<span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 ${textColor} text-sm mr-2 mb-2">
        ${name}
        <button type="button" class="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none" data-key-index="${i}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </span>`;
      })
      .join('');

    // Label et description de la transformation sélectionnée
    const currentLabel =
      lastType && window.transformationUtils
        ? window.transformationUtils.getTransformationLabel(lastType)
        : i18next.t('noTransformation');
    const currentDesc =
      lastType && window.transformationUtils
        ? window.transformationUtils.getTransformationDescription(lastType)
        : '';

    // Adapter le titre et le texte du bouton selon le mode
    const title =
      this.mode === 'add'
        ? i18next.t('addTransformation')
        : i18next.t('editTransformation');
    const buttonText =
      this.mode === 'add' ? i18next.t('create') : i18next.t('save');

    this.modal.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">${title}</h3>
      ${
        this.mode === 'edit' && ref.transformation && ref.transformation._path
          ? `<div class="text-xs text-gray-500 mb-4">
          <div>Path: ${JSON.stringify(ref.transformation._path)}</div>
          ${typeof ref.transformation._index === 'number' ? `<div>Index: ${ref.transformation._index}</div>` : ''}
         </div>`
          : this.mode === 'add'
            ? `<div class="text-xs text-gray-500 mb-4">
          <div>Path: ${JSON.stringify(ref.path)}</div>
         </div>`
            : ''
      }
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">${i18next.t('transformationType')}</label>
          <div class="text-sm text-gray-500 mb-2">Chargement des transformations...</div>
          <div id="transfo-keys" class="flex flex-wrap mt-2">${pills}</div>
        </div>
      </div>
      <div class="mt-6 flex justify-end space-x-3">
        <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">${i18next.t('cancel')}</button>
        <button id="save-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">${buttonText}</button>
      </div>
    `;

    this.backdrop.appendChild(this.modal);
    document.body.appendChild(this.backdrop);

    // Attacher les event listeners de base IMMÉDIATEMENT (fermeture)
    this.attachBasicEventListeners();

    // Charger les transformations et créer la popup complète
    this.loadTransformationsAndCreateCompletePopup(ref, lastType, keys);
  }

  // Méthode pour attacher les event listeners de base (fermeture uniquement)
  attachBasicEventListeners() {
    // Attacher le gestionnaire de clic directement sur le backdrop
    if (this.backdrop) {
      this.backdrop.addEventListener('click', e => {
        // Si on clique sur le backdrop (pas sur la modal), fermer la popup
        if (e.target === this.backdrop) {
          this.close();
        }
      });
    }

    // Attacher le bouton Annuler
    const cancelBtn = this.modal.querySelector('#cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.close();
      });
    }
  }

  // Méthode pour METTRE À JOUR la popup existante (au lieu d'en créer une nouvelle)
  createPopupWithKeyList(ref, keyList, keyListData, transformations) {
    // NE PAS créer de nouveaux éléments - utiliser ceux existants !
    // this.backdrop et this.modal existent déjà depuis createPopupWithoutKeyList

    // COMMENTÉ : Création du backdrop (transparent comme dans /lots)
    // this.backdrop = document.createElement('div');
    // this.backdrop.className = 'fixed inset-0 z-50';
    // this.backdrop.style.background = 'none';

    // COMMENTÉ : Création de la modal avec ombre prononcée comme dans /lots
    // this.modal = document.createElement('div');
    // this.modal.className = 'bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6';
    // this.modal.style.boxShadow = '0 8px 40px 8px rgba(0,0,0,0.35), 0 1.5px 8px rgba(0,0,0,0.10)';
    // this.modal.style.position = 'absolute';
    // this.modal.style.top = '200px';
    // this.modal.style.left = '50%';
    // this.modal.style.transform = 'translateX(-50%)';

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

    // Pills pour les keys (utiliser _displayNames si disponible, sinon les keys)
    const displayNames =
      lastTransfo && lastTransfo._displayNames
        ? lastTransfo._displayNames[0]
        : keys;
    const pills = displayNames
      .map((name, i) => {
        // Vérifier si c'est un ID Bubble (format: nombrexnombre)
        const keyId = keys[i] || name;
        const isBubbleId = /^\d+x\d+$/.test(keyId);
        const textColor = isBubbleId ? 'text-blue-800' : 'text-red-600';
        return `<span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 ${textColor} text-sm mr-2 mb-2">
        ${name}
        <button type="button" class="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none" data-key-index="${i}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </span>`;
      })
      .join('');

    // Générer les options du dropdown à partir de keyListData avec bubble_id
    const keyOptions = Object.entries(keyListData || {})
      .map(
        ([name, value]) =>
          `<div class="px-3 py-2 hover:bg-blue-100 cursor-pointer" data-name="${name}" data-id="${value.bubble_id}">${name}</div>`
      )
      .join('');
    const keyInputHTML = keyList
      ? `
      <div class="relative mt-2">
        <input id="key-input" type="text" autocomplete="off" placeholder="${i18next.t('parameters')}" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" />
        <div id="key-dropdown" class="absolute left-0 right-0 bg-white border border-gray-200 rounded shadow-lg z-10 max-h-40 overflow-y-auto hidden">${keyOptions}</div>
      </div>
    `
      : '';

    // Label et description de la transformation sélectionnée
    const currentLabel =
      lastType && window.transformationUtils
        ? window.transformationUtils.getTransformationLabel(lastType)
        : i18next.t('noTransformation');
    const currentDesc =
      lastType && window.transformationUtils
        ? window.transformationUtils.getTransformationDescription(lastType)
        : '';

    // Génération dynamique des options du select (AJOUTÉ)
    let options = '';
    if (!lastType) {
      options += `<option value="" disabled selected>${i18next.t('selectTransformation')}</option>`;
    }

    // Utiliser directement les transformations passées en paramètre
    if (transformations && transformations.length > 0) {
      transformations.forEach(transfo => {
        if (transfo.isSeparator) {
          options += `<option value="" disabled>${transfo.label}</option>`;
        } else {
          const selected = lastType === transfo.value ? 'selected' : '';
          options += `<option value="${transfo.value}" ${selected}>${transfo.label}</option>`;
        }
      });
    } else {
      // Fallback : utiliser les transformations statiques existantes
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
    }

    // Adapter le titre et le texte du bouton selon le mode
    const title =
      this.mode === 'add'
        ? i18next.t('addTransformation')
        : i18next.t('editTransformation');
    const buttonText =
      this.mode === 'add' ? i18next.t('create') : i18next.t('save');

    this.modal.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">${title}</h3>
      ${
        this.mode === 'edit' && ref.transformation && ref.transformation._path
          ? `<div class="text-xs text-gray-500 mb-4">
          <div>Path: ${JSON.stringify(ref.transformation._path)}</div>
          ${typeof ref.transformation._index === 'number' ? `<div>Index: ${ref.transformation._index}</div>` : ''}
         </div>`
          : this.mode === 'add'
            ? `<div class="text-xs text-gray-500 mb-4">
          <div>Path: ${JSON.stringify(ref.path)}</div>
         </div>`
            : ''
      }
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">${i18next.t('transformationType')}</label>
          <select id="transfo-type" class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
            ${options}
          </select>
          <div id="transfo-description" class="text-xs text-gray-500 mt-1">${currentDesc}</div>
          <div id="transfo-keys" class="flex flex-wrap mt-2">${pills}</div>
          ${keyInputHTML}
        </div>
      </div>
      <div class="mt-6 flex justify-end space-x-3">
        <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">${i18next.t('cancel')}</button>
        <button id="save-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">${buttonText}</button>
      </div>
    `;

    // Attacher les listeners directement (plus besoin de charger les transformations)
    this.attachEventListeners();
  }

  // Nouvelle méthode pour charger les transformations et créer la popup complète sans keyList
  async loadTransformationsAndCreateCompletePopup(ref, lastType, keys) {
    try {
      // Charger les transformations disponibles
      const transformations =
        await window.transformationUtils.getAvailableTransformations();

      // Créer directement la popup complète avec les transformations chargées
      this.createPopupWithKeyList(ref, null, null, transformations);
    } catch (error) {
      console.error('Erreur lors du chargement des transformations:', error);

      // Afficher un message d'erreur dans la popup existante
      if (this.modal) {
        const contentDiv = this.modal.querySelector('.space-y-4');
        if (contentDiv) {
          contentDiv.innerHTML = `
            <div class="text-red-600 text-sm">
              Erreur lors du chargement des transformations. Veuillez réessayer.
            </div>
          `;
        }
      }
    }
  }

  // Nouvelle méthode pour charger les transformations dans createPopupWithKeyList
  async loadTransformationsForPopupWithKeyList(
    ref,
    lastType,
    keys,
    keyList,
    keyListData,
    pills,
    keyInputHTML,
    currentLabel,
    currentDesc,
    transformations
  ) {
    try {
      // Charger les transformations disponibles
      // const transformations = await window.transformationUtils.getAvailableTransformations(); // This line is now redundant as transformations are passed as an argument

      // Générer les options du select
      let options = '';
      if (!lastType) {
        options += `<option value="" disabled selected>${i18next.t('selectTransformation')}</option>`;
      }

      transformations.forEach(transfo => {
        if (transfo.isSeparator) {
          options += `<option value="" disabled>${transfo.label}</option>`;
        } else {
          const selected = lastType === transfo.value ? 'selected' : '';
          options += `<option value="${transfo.value}" ${selected}>${transfo.label}</option>`;
        }
      });

      // Adapter le titre et le texte du bouton selon le mode
      const title =
        this.mode === 'add'
          ? i18next.t('addTransformation')
          : i18next.t('editTransformation');
      const buttonText =
        this.mode === 'add' ? i18next.t('create') : i18next.t('save');

      this.modal.innerHTML = `
        <h3 class="text-lg font-semibold mb-2">${title}</h3>
        ${
          this.mode === 'edit' && ref.transformation && ref.transformation._path
            ? `<div class="text-xs text-gray-500 mb-4">
            <div>Path: ${JSON.stringify(ref.transformation._path)}</div>
            ${typeof ref.transformation._index === 'number' ? `<div>Index: ${ref.transformation._index}</div>` : ''}
           </div>`
            : this.mode === 'add'
              ? `<div class="text-xs text-gray-500 mb-4">
            <div>Path: ${JSON.stringify(ref.path)}</div>
           </div>`
              : ''
        }
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">${i18next.t('transformationType')}</label>
            <select id="transfo-type" class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
              ${options}
            </select>
            <div id="transfo-description" class="text-xs text-gray-500 mt-1">${currentDesc}</div>
            <div id="transfo-keys" class="flex flex-wrap mt-2">${pills}</div>
            ${keyInputHTML}
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">${i18next.t('cancel')}</button>
          <button id="save-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">${buttonText}</button>
        </div>
      `;

      // Attacher les listeners
      this.attachEventListeners();
    } catch (error) {
      console.error('Erreur lors du chargement des transformations:', error);

      // Afficher un message d'erreur
      this.modal.innerHTML = `
        <h3 class="text-lg font-semibold mb-2">Erreur</h3>
        <div class="text-red-600 text-sm mb-4">
          Erreur lors du chargement des transformations. Veuillez réessayer.
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">${i18next.t('cancel')}</button>
        </div>
      `;

      // Attacher seulement le listener pour le bouton cancel
      const cancelBtn = this.modal.querySelector('#cancel-btn');
      if (cancelBtn) {
        cancelBtn.onclick = () => this.hide();
      }
    }
  }

  // Nouvelle méthode pour charger les transformations et mettre à jour la popup
  async loadTransformationsAndUpdatePopup(ref, lastType, keys) {
    try {
      // Charger les transformations disponibles
      const transformations =
        await window.transformationUtils.getAvailableTransformations();

      // Générer les options du select
      let options = '';
      if (!lastType) {
        options += `<option value="" disabled selected>${i18next.t('selectTransformation')}</option>`;
      }

      transformations.forEach(transfo => {
        if (transfo.isSeparator) {
          options += `<option value="" disabled>${transfo.label}</option>`;
        } else {
          const selected = lastType === transfo.value ? 'selected' : '';
          options += `<option value="${transfo.value}" ${selected}>${transfo.label}</option>`;
        }
      });

      // Label et description de la transformation sélectionnée
      const currentLabel =
        lastType && window.transformationUtils
          ? window.transformationUtils.getTransformationLabel(lastType)
          : i18next.t('noTransformation');
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

      // Mettre à jour le contenu de la popup de manière robuste
      const selectEl = this.modal.querySelector('#transfo-type');
      const descEl = this.modal.querySelector('#transfo-description');
      const keysEl = this.modal.querySelector('#transfo-keys');
      if (selectEl) selectEl.innerHTML = options;
      if (descEl) descEl.textContent = currentDesc;
      if (keysEl) keysEl.innerHTML = pills;
      if (!selectEl) {
        // Si la structure n'existe pas encore, reconstruire le contenu entier
        this.modal.innerHTML = `
          <h3 class="text-lg font-semibold mb-2">${i18next.t('editTransformation')}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">${i18next.t('transformationType')}</label>
              <select id="transfo-type" class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                ${options}
              </select>
              <div id="transfo-description" class="text-xs text-gray-500 mt-1">${currentDesc}</div>
              <div id="transfo-keys" class="flex flex-wrap mt-2">${pills}</div>
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">${i18next.t('cancel')}</button>
            <button id="save-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">${i18next.t('save')}</button>
          </div>
        `;
      }

      // Activer le bouton de sauvegarde
      const saveBtn = this.modal.querySelector('#save-btn');
      if (saveBtn) {
        saveBtn.disabled = false;
      }

      // Attacher les listeners
      this.attachEventListeners();
    } catch (error) {
      console.error('Erreur lors du chargement des transformations:', error);

      // Afficher un message d'erreur
      const loadingDiv =
        this.modal.querySelector('.animate-spin').parentElement.parentElement;
      if (loadingDiv) {
        loadingDiv.innerHTML = `
          <div class="text-red-600 text-sm">
            Erreur lors du chargement des transformations. Veuillez réessayer.
          </div>
        `;
      }
    }
  }

  attachEventListeners() {
    const cancelBtn = this.modal.querySelector('#cancel-btn');
    const saveBtn = this.modal.querySelector('#save-btn');
    const transfoTypeSelect = this.modal.querySelector('#transfo-type');
    const transfoDescription = this.modal.querySelector('#transfo-description');
    const keysContainer = this.modal.querySelector('#transfo-keys');
    const keyInput = this.modal.querySelector('#key-input');
    const keyDropdown = this.modal.querySelector('#key-dropdown');

    // Pour garder la liste des keys sélectionnées
    this.selectedKeys = [];

    // Fonction pour vérifier si le bouton de sauvegarde doit être activé
    const updateSaveButtonState = () => {
      const selectedType = transfoTypeSelect.value;
      const isDropdownEmpty = !selectedType;
      const keyList =
        window.transformationTypes &&
        window.transformationTypes[selectedType] &&
        window.transformationTypes[selectedType].keyList;
      const isRequiredKey =
        window.transformationTypes &&
        window.transformationTypes[selectedType] &&
        window.transformationTypes[selectedType].requiredKey;
      const hasKeys = this.selectedKeys.length > 0;
      const isValid =
        !isDropdownEmpty && (!keyList || !isRequiredKey || hasKeys);
      saveBtn.disabled = !isValid;
      saveBtn.className = isValid
        ? 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        : 'px-4 py-2 bg-gray-400 text-gray-200 rounded cursor-not-allowed';
    };

    // Initialiser l'état du bouton
    updateSaveButtonState();

    // Écouter les changements de type
    transfoTypeSelect.addEventListener('change', e => {
      const newType = e.target.value;

      if (window.transformationUtils) {
        transfoDescription.textContent =
          window.transformationUtils.getTransformationDescription(newType);
      }

      // Vérifier si la nouvelle transformation nécessite des paramètres
      const keyList =
        window.transformationTypes &&
        window.transformationTypes[newType] &&
        window.transformationTypes[newType].keyList;

      if (keyList) {
        // Créer une nouvelle référence avec le nouveau type mais sans les anciens paramètres
        const existingTransfo = this.currentRef.transformation;
        const newRef = {
          ...this.currentRef,
          transformation: {
            type: [newType],
            keys: [[]],
            _displayNames: [[]],
            // Conserver les métadonnées importantes
            _path: existingTransfo?._path,
            _index: existingTransfo?._index,
          },
        };
        this.close();
        this.show(newRef, this.mode);
      }

      updateSaveButtonState();
    });

    // Attaching cancel button listener
    cancelBtn.onclick = () => {
      // Cancel button clicked
      this.close();
    };

    saveBtn.onclick = () => {
      const selectedType = transfoTypeSelect.value;
      let transformation;

      // ← NOUVEAU : Détecter si c'est une transformation dynamique
      if (
        selectedType.startsWith('dynamic_transfo_') ||
        selectedType === 'dynamic_transfo'
      ) {
        // Transformation dynamique (format .md)
        // 1) Si selectedType vient du menu fusionné (value = dynamic_transfo_<id>)
        // 2) Ou si l'option est déjà normalisée en 'dynamic_transfo'
        let bubbleId = null;
        if (selectedType.startsWith('dynamic_transfo_')) {
          bubbleId = selectedType.replace('dynamic_transfo_', '');
        } else if (this._selectedDynamic && this._selectedDynamic.bubbleId) {
          bubbleId = this._selectedDynamic.bubbleId;
        }

        transformation = {
          type: ['dynamic_transfo'],
          dynamic_transfo_id: bubbleId,
          dynamic_transfo_version: this._selectedDynamic?.version || null,
        };
      } else {
        // ← EXISTANT : Logique pour les transformations statiques
        const selectedIds = this.selectedKeys.map(k => k.id);
        const selectedNames = this.selectedKeys.map(k => k.name);

        transformation = {
          type: [selectedType],
          keys: [selectedIds], // IDs pour les calculs
          _displayNames: [selectedNames], // Noms pour l'affichage
        };
      }

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
            const scenarioIdx = window.currentScenarioIdx;
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
              const dimension = window.currentDimension;
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

      // Activer le bouton Enregistrer de la page principale
      if (typeof setScenarioModifie === 'function') {
        setScenarioModifie(true);
      }

      this.close();
    };

    // Suppression visuelle d'une key (et du modèle) - CORRIGÉ
    if (keysContainer) {
      // Utiliser la délégation d'événements pour éviter les problèmes de listeners multiples
      keysContainer.addEventListener('click', e => {
        if (e.target.closest('button[data-key-index]')) {
          e.preventDefault();
          e.stopPropagation();
          const button = e.target.closest('button[data-key-index]');
          const pill = button.closest('span');
          if (pill && button) {
            const index = parseInt(button.dataset.keyIndex);
            if (index >= 0 && index < this.selectedKeys.length) {
              this.selectedKeys.splice(index, 1);
              pill.remove();
              updateSaveButtonState();
            }
          }
        }
      });
    }

    // COMMENTÉ : Le gestionnaire global est déjà attaché par attachBasicEventListeners
    // Pas besoin de le refaire ici

    // Gestion du dropdown des paramètres (keyInput et keyDropdown)
    if (keyInput && keyDropdown) {
      // Récupérer les données de base pour ce type de transformation
      const selectedType = transfoTypeSelect.value;
      const keyList =
        window.transformationTypes &&
        window.transformationTypes[selectedType] &&
        window.transformationTypes[selectedType].keyList;

      if (keyList) {
        // Charger les données de base si pas encore fait
        chargerDonneesBaseAPI(keyList)
          .then(keyListData => {
            // Fonction pour récupérer les clés déjà utilisées par cette transformation spécifique
            const getUsedKeysForThisTransformation = () => {
              const usedKeys = new Set();

              // Dans les deux modes (add et edit), masquer uniquement les clés de cette transformation
              if (this.currentRef && this.currentRef.transformation) {
                // Mode edit : transformation existante
                const existingTransfo = this.currentRef.transformation;
                if (
                  existingTransfo.keys &&
                  Array.isArray(existingTransfo.keys[0])
                ) {
                  existingTransfo.keys[0].forEach(key => {
                    if (
                      key &&
                      typeof key === 'string' &&
                      /^\d+x\d+$/.test(key)
                    ) {
                      usedKeys.add(key);
                    }
                  });
                }
              }

              return usedKeys;
            };

            // Fonction pour afficher les options filtrées
            const showFilteredOptions = (searchValue = '') => {
              const allKeys = Object.entries(keyListData || {});
              const usedKeysForThisTransfo = getUsedKeysForThisTransformation();

              const filtered = allKeys.filter(
                ([name, itemData]) =>
                  name &&
                  name.toLowerCase().includes(searchValue.toLowerCase()) &&
                  // Masquer les clés déjà sélectionnées dans cette popup
                  !this.selectedKeys.some(
                    k => k.name === name && k.id === itemData.bubble_id
                  ) &&
                  // Masquer uniquement les clés déjà utilisées par cette transformation
                  !usedKeysForThisTransfo.has(itemData.bubble_id)
              );

              if (filtered.length > 0) {
                keyDropdown.innerHTML = filtered
                  .map(
                    ([name, itemData]) =>
                      `<div class="px-3 py-2 hover:bg-blue-100 cursor-pointer" data-name="${name}" data-id="${itemData.bubble_id}">${name}</div>`
                  )
                  .join('');
                keyDropdown.classList.remove('hidden');
              } else {
                keyDropdown.innerHTML = '';
                keyDropdown.classList.add('hidden');
              }
            };

            // Listener pour le focus sur l'input
            keyInput.addEventListener('focus', () => {
              showFilteredOptions();
            });

            // Listener pour la saisie
            keyInput.addEventListener('input', e => {
              showFilteredOptions(e.target.value.trim());
            });

            // Listener pour la sélection d'une option
            keyDropdown.addEventListener('mousedown', e => {
              if (e.target && e.target.dataset.name) {
                const name = e.target.dataset.name;
                const id = e.target.dataset.id;

                if (
                  !this.selectedKeys.some(k => k.name === name && k.id === id)
                ) {
                  this.selectedKeys.push({ name, id });

                  // Ajouter le pill visuellement
                  const pill = document.createElement('span');
                  pill.innerHTML = `${name}<button type="button" class="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none" data-key-index="${this.selectedKeys.length - 1}"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>`;
                  pill.className =
                    'inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm mr-2 mb-2';

                  if (keysContainer) {
                    keysContainer.appendChild(pill);
                  }

                  updateSaveButtonState();
                }

                keyDropdown.classList.add('hidden');
                keyInput.value = '';
              }
            });

            // Fermer le dropdown si on clique ailleurs
            if (this._dropdownCloseHandler) {
              document.removeEventListener(
                'mousedown',
                this._dropdownCloseHandler
              );
            }
            this._dropdownCloseHandler = e => {
              if (keyInput && keyDropdown) {
                if (
                  !keyInput.contains(e.target) &&
                  !keyDropdown.contains(e.target)
                ) {
                  keyDropdown.classList.add('hidden');
                  keyInput.value = '';
                }
              }
            };
            document.addEventListener('mousedown', this._dropdownCloseHandler);

            // Fermer le dropdown avec Escape
            if (this._escapeHandler) {
              document.removeEventListener('keydown', this._escapeHandler);
            }
            this._escapeHandler = e => {
              if (e.key === 'Escape' && keyDropdown) {
                keyDropdown.classList.add('hidden');
                keyInput.value = '';
              }
            };
            document.addEventListener('keydown', this._escapeHandler);
          })
          .catch(error => {
            console.error(
              'Erreur lors du chargement des données de base:',
              error
            );
          });
      }
    }
  }

  close() {
    // close() called
    if (this.backdrop) {
      // Removing backdrop and modal
      if (this._dropdownCloseHandler) {
        document.removeEventListener('mousedown', this._dropdownCloseHandler);
        this._dropdownCloseHandler = null;
      }
      if (this._escapeHandler) {
        document.removeEventListener('keydown', this._escapeHandler);
        this._escapeHandler = null;
      }
      // COMMENTÉ : Plus de gestionnaire global, fermeture directe sur backdrop
      // if (this._globalCloseHandler) {
      //   document.removeEventListener('mousedown', this._globalCloseHandler);
      //   this._globalCloseHandler = null;
      // }
      this.backdrop.remove();
      this.backdrop = null;
      this.modal = null;
      // Backdrop and modal removed
    } else {
      // No backdrop to remove
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
    if (!response.ok)
      throw new Error(i18next.t('apiError', { status: response.status }));
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
// Fonction globale définie
