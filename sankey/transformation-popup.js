// Gestionnaire de la popup de transformation
class TransformationPopup {
  constructor() {
    this.backdrop = null;
    this.modal = null;
    this.currentRef = null;  // Pour stocker la référence
    this.mode = null;  // Pour stocker le mode
  }

  show(ref, mode) {
    this.currentRef = ref;  // On stocke la référence
    this.mode = mode;  // On stocke le mode
    this.createPopup(ref);
    this.attachEventListeners();
  }

  createPopup(ref) {
    // Création du backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    // Création de la modal
    this.modal = document.createElement('div');
    this.modal.className = 'bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6';
    
    // Récupération de la transformation du lien cliqué
    const lastTransfo = ref.transformation || null;
    const lastType = lastTransfo ? (Array.isArray(lastTransfo.type) ? lastTransfo.type[0] : lastTransfo.type) : null;
    const keys = lastTransfo && lastTransfo.keys && lastTransfo.keys[0] ? lastTransfo.keys[0] : [];
    
    // Récupérer la keyList de la transformation sélectionnée
    let keyList = null;
    if (window.transformationUtils && lastType) {
      const t = window.transformationUtils.getAvailableTransformations().find(t => t.value === lastType);
      if (window.transformationTypes && window.transformationTypes[lastType]) {
        keyList = window.transformationTypes[lastType].keyList;
      }
    }
    
    // Génération dynamique des options du select
    const options = (window.transformationUtils ? window.transformationUtils.getAvailableTransformations() : []).map(t =>
      `<option value="${t.value}" ${lastType === t.value ? 'selected' : ''}>${t.label}</option>`
    ).join('');
    
    // Label et description de la transformation sélectionnée
    const currentLabel = lastType && window.transformationUtils ? window.transformationUtils.getTransformationLabel(lastType) : 'Aucune transformation';
    const currentDesc = lastType && window.transformationUtils ? window.transformationUtils.getTransformationDescription(lastType) : '';
    
    // Pills pour les keys
    const pills = keys.map((key, i) =>
      `<span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm mr-2 mb-2">
        ${key}
        <button type="button" class="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none" data-key-index="${i}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </span>`
    ).join('');
    
    // Input et dropdown pour les keys (affiché seulement si keyList)
    const keyInputHTML = keyList ? `
      <div class="relative mt-2">
        <input id="key-input" type="text" autocomplete="off" placeholder="Paramètres" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" />
        <div id="key-dropdown" class="absolute left-0 right-0 bg-white border border-gray-200 rounded shadow-lg z-10 hidden max-h-40 overflow-y-auto"></div>
      </div>
    ` : '';
    
    // Adapter le titre et le texte du bouton selon le mode
    const title = this.mode === 'add' ? 'Ajouter une transformation' : 'Modifier la transformation';
    const buttonText = this.mode === 'add' ? 'Créer' : 'Enregistrer';
    
    this.modal.innerHTML = `
      <h3 class="text-lg font-semibold mb-4">${title}</h3>
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
    let selectedKeys = Array.from(keysContainer.querySelectorAll('span')).map(span => 
      span.textContent.trim().replace(/×$/, '').trim()
    );

    cancelBtn.onclick = () => this.close();
    
    saveBtn.onclick = () => {
      const transformation = {
        type: [transfoTypeSelect.value],
        keys: [selectedKeys]
      };
      
      if (this.currentRef) {
        if (this.mode === 'add' && typeof window.onTransformationAdd === 'function') {
          window.onTransformationAdd(this.currentRef.nodeId, transformation);
        } else if (this.mode === 'edit' && typeof window.onTransformationSave === 'function') {
          // Récupérer le path et l'index de la transformation existante
          const existingTransfo = this.currentRef.transformation;
          if (existingTransfo && existingTransfo._path && typeof existingTransfo._index === 'number') {
            // Utiliser directement updateTransformation
            const scenarioIdx = document.getElementById('scenario-selector').value;
            const scenario = window.scenarios[scenarioIdx]?.scenario;
            if (scenario) {
              window.updateTransformation(scenario, existingTransfo._path, existingTransfo._index, transformation);
              // Relancer le Sankey
              const lot = window.lotType;
              const dimension = document.getElementById('dimension-selector').value;
              if (typeof runSankey === 'function') {
                runSankey({ lot, scenario, containerId: 'sankey-container', dimension });
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
    
    transfoTypeSelect.addEventListener('change', (e) => {
      if (window.transformationUtils) {
        transfoDescription.textContent = window.transformationUtils.getTransformationDescription(e.target.value);
      }
      // On ferme et on rouvre la popup pour rafraîchir l'UI (plus simple pour gérer le changement de keyList)
      const currentRef = {
        transformation: { type: [e.target.value], keys: [[]] },
        scenario: this.scenarioRef,
        index: this.transformationIndex
      };
      this.close();
      window.afficherPopupTransfo(currentRef, 'edit');
    });

    // Suppression visuelle d'une key (et du modèle)
    if (keysContainer) {
      keysContainer.querySelectorAll('button[data-key-index]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const pill = btn.closest('span');
          if (pill) {
            const key = pill.textContent.trim();
            selectedKeys = selectedKeys.filter(k => k !== key);
            pill.remove();
          }
        });
      });
    }
    
    // Gestion de l'input et du dropdown
    if (keyInput && keyDropdown) {
      // Fonction pour afficher les options filtrées
      const showFilteredOptions = (value = '') => {
        // Trouver la keyList de la transformation sélectionnée
        const type = transfoTypeSelect.value;
        let keyList = null;
        if (window.transformationTypes && window.transformationTypes[type]) {
          keyList = window.transformationTypes[type].keyList;
        }
        let allKeys = [];
        if (keyList && window.baseData && window.baseData[keyList]) {
          const data = window.baseData[keyList];
          if (Array.isArray(data)) {
            if (typeof data[0] === 'object') {
              allKeys = data.map(obj => obj.nom || obj.name || obj.label || obj.id || '');
            } else {
              allKeys = data;
            }
          } else if (typeof data === 'object') {
            allKeys = Object.keys(data);
          }
        }
        // Filtrer selon la saisie et exclure déjà sélectionnés
        const filtered = allKeys.filter(k => k && k.toLowerCase().includes(value.toLowerCase()) && !selectedKeys.includes(k));
        if (filtered.length > 0) {
          keyDropdown.innerHTML = filtered.map(k => `<div class="px-3 py-2 hover:bg-blue-100 cursor-pointer" data-key="${k}">${k}</div>`).join('');
          keyDropdown.classList.remove('hidden');
        } else {
          keyDropdown.innerHTML = '';
          keyDropdown.classList.add('hidden');
        }
      };

      // Afficher toutes les options au focus
      keyInput.addEventListener('focus', () => {
        showFilteredOptions();
      });

      // Filtrer les options à la saisie
      keyInput.addEventListener('input', (e) => {
        showFilteredOptions(e.target.value.trim());
      });

      // Sélection d'une key dans le dropdown
      keyDropdown.addEventListener('mousedown', (e) => {
        if (e.target && e.target.dataset.key) {
          const key = e.target.dataset.key;
          if (!selectedKeys.includes(key)) {
            selectedKeys.push(key);
            // Ajouter le pill visuellement
            const pill = document.createElement('span');
            pill.className = 'inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm mr-2 mb-2';
            pill.innerHTML = `${key}<button type="button" class="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none" data-key-index="${selectedKeys.length-1}"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>`;
            keysContainer.appendChild(pill);
            // Ajout du listener pour suppression
            pill.querySelector('button[data-key-index]').addEventListener('click', (ev) => {
              ev.preventDefault();
              selectedKeys = selectedKeys.filter(k2 => k2 !== key);
              pill.remove();
            });
          }
          keyDropdown.classList.add('hidden');
          keyDropdown.innerHTML = '';
          keyInput.value = '';
        }
      });
      // Fermer le dropdown si on clique ailleurs
      document.addEventListener('mousedown', (e) => {
        if (!keyInput.contains(e.target) && !keyDropdown.contains(e.target)) {
          keyDropdown.classList.add('hidden');
        }
      });
    }
    
    this.backdrop.onclick = (e) => { if (e.target === this.backdrop) this.close(); };
  }

  close() {
    if (this.backdrop) {
      this.backdrop.remove();
      this.backdrop = null;
      this.modal = null;
    }
  }
}

// Exposer la popup globalement
window.transformationPopup = new TransformationPopup();
window.afficherPopupTransfo = (ref, mode) => window.transformationPopup.show(ref, mode);
