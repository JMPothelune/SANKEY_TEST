// Gestionnaire de la popup des techs
class TechPopup {
  constructor() {
    this.backdrop = null;
    this.modal = null;
    this.currentNodeId = null;
    this.mode = null;
    this.selectedTech = null;
    this.techList = null;
    this.teamId = null;
  }

  show(ref, mode) {
    console.log('TechPopup.show called with:', { ref, mode });
    this.currentRef = ref;
    this.mode = mode;
    this.createPopup();
  }

  async createPopup() {
    // Récupérer le teamId depuis les paramètres URL
    const urlParams = new URLSearchParams(window.location.search);
    this.teamId = urlParams.get('teamId');

    if (!this.teamId) {
      console.error('Pas de teamId trouvé dans les paramètres URL');
      this.createPopupWithError('Aucune team sélectionnée');
      return;
    }

    // Charger les techs de la team depuis l'API
    try {
      const teamData = await this.loadTeamTechs(this.teamId);
      this.techList = teamData.techs || {};
      this.createPopupWithTechs();
    } catch (error) {
      console.error('Erreur lors du chargement des techs:', error);
      this.createPopupWithError('Erreur lors du chargement des outils');
    }
  }

  async loadTeamTechs(teamId) {
    const urlParams = new URLSearchParams(window.location.search);
    const isLive = urlParams.get('isLive') === 'true';

    const response = await fetch('/api/bubble', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'team',
        params: {
          id: teamId,
          isLive,
        },
        method: 'POST',
      }),
    });

    if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
    return await response.json();
  }

  createPopupWithTechs() {
    // Création du backdrop (transparent comme les autres popups)
    this.backdrop = document.createElement('div');
    this.backdrop.className =
      'fixed inset-0 flex items-center justify-center z-50';
    this.backdrop.style.background = 'none';

    // Création de la modal avec ombre prononcée comme les autres popups
    this.modal = document.createElement('div');
    this.modal.className =
      'bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6';
    this.modal.style.boxShadow =
      '0 8px 40px 8px rgba(0,0,0,0.35), 0 1.5px 8px rgba(0,0,0,0.10)';

    // Récupérer la tech existante si en mode edit
    const existingTech = this.getExistingTech();

    // Générer les options du dropdown
    const techOptions = Object.entries(this.techList)
      .map(
        ([name, techData]) =>
          `<option value="${techData.bubble_id}" ${existingTech && existingTech.bubble_id === techData.bubble_id ? 'selected' : ''}>${name}</option>`
      )
      .join('');

    const title = this.mode === 'add' ? 'Ajouter un outil' : "Modifier l'outil";
    const buttonText = this.mode === 'add' ? 'Ajouter' : 'Enregistrer';

    this.modal.innerHTML = `
      <h3 class="text-lg font-semibold mb-4">${title}</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Outil</label>
          <select id="tech-select" class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
            <option value="" disabled ${!existingTech ? 'selected' : ''}>Sélectionner un outil</option>
            ${techOptions}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
          <input id="quantity-input" type="number" value="${existingTech ? existingTech.quantity || 1 : 1}" min="1" class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
        </div>
      </div>
      <div class="mt-6 flex justify-end space-x-3">
        <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Annuler</button>
        <button id="save-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">${buttonText}</button>
      </div>
    `;

    this.backdrop.appendChild(this.modal);
    document.body.appendChild(this.backdrop);
    this.attachEventListeners();
  }

  createPopupWithError(message) {
    // Création du backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className =
      'fixed inset-0 flex items-center justify-center z-50';
    this.backdrop.style.background = 'none';

    // Création de la modal
    this.modal = document.createElement('div');
    this.modal.className =
      'bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 p-6';
    this.modal.style.boxShadow =
      '0 8px 40px 8px rgba(0,0,0,0.35), 0 1.5px 8px rgba(0,0,0,0.10)';

    this.modal.innerHTML = `
      <h3 class="text-lg font-semibold mb-4 text-red-600">Erreur</h3>
      <p class="text-gray-700 mb-4">${message}</p>
      <div class="mt-6 flex justify-end">
        <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Fermer</button>
      </div>
    `;

    this.backdrop.appendChild(this.modal);
    document.body.appendChild(this.backdrop);

    const cancelBtn = this.modal.querySelector('#cancel-btn');
    cancelBtn.onclick = () => this.close();

    // Fermer en cliquant sur le backdrop
    this.backdrop.onclick = e => {
      if (e.target === this.backdrop) {
        this.close();
      }
    };
  }

  getExistingTech() {
    // Récupérer la tech existante depuis la transformation du ref
    const lastTransfo = this.currentRef?.transformation || null;
    return lastTransfo?.tech || null;
  }

  getNodeById(nodeId) {
    // Récupérer le nœud depuis window.sankeyScenario.nodes
    if (window.sankeyScenario && window.sankeyScenario.nodes) {
      return window.sankeyScenario.nodes.find(n => n.id === nodeId);
    }
    console.error('window.sankeyScenario.nodes non disponible');
    return null;
  }

  attachEventListeners() {
    const cancelBtn = this.modal.querySelector('#cancel-btn');
    const saveBtn = this.modal.querySelector('#save-btn');
    const techSelect = this.modal.querySelector('#tech-select');
    const quantityInput = this.modal.querySelector('#quantity-input');

    // Fonction pour mettre à jour l'état du bouton de sauvegarde
    const updateSaveButtonState = () => {
      const selectedTechId = techSelect.value;
      const quantity = parseInt(quantityInput.value);
      const isValid = selectedTechId && quantity > 0;

      saveBtn.disabled = !isValid;
      saveBtn.className = isValid
        ? 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        : 'px-4 py-2 bg-gray-400 text-gray-200 rounded cursor-not-allowed';
    };

    // Initialiser l'état du bouton
    updateSaveButtonState();

    // Écouter les changements de tech et quantité
    techSelect.addEventListener('change', updateSaveButtonState);
    quantityInput.addEventListener('input', updateSaveButtonState);

    cancelBtn.onclick = () => this.close();

    saveBtn.onclick = async () => {
      const selectedTechId = techSelect.value;
      const quantity = parseInt(quantityInput.value);

      if (!selectedTechId) {
        alert('Veuillez sélectionner un outil');
        return;
      }

      if (!quantity || quantity < 1) {
        alert('La quantité doit être supérieure à 0');
        return;
      }

      // Récupérer les détails de la tech sélectionnée
      const selectedTechName =
        techSelect.options[techSelect.selectedIndex].text;
      const techData = this.techList[selectedTechName];

      if (!techData) {
        alert("Erreur: données de l'outil non trouvées");
        return;
      }

      // Créer l'objet tech à sauvegarder
      const techToSave = {
        name: selectedTechName,
        bubble_id: selectedTechId,
        quantity: quantity,
        rate: techData.rate,
        step: techData.step,
      };

      // Sauvegarder dans le scénario
      this.saveTechToScenario(techToSave);
      this.close();
    };

    // Fermer en cliquant sur le backdrop
    this.backdrop.onclick = e => {
      if (e.target === this.backdrop) {
        this.close();
      }
    };
  }

  saveTechToScenario(techData) {
    // Sauvegarder la tech dans le scénario
    const scenarioIdx = window.currentScenarioIdx;
    const scenario = window.scenarios[scenarioIdx]?.scenario;

    if (!scenario) {
      console.error('Scénario non trouvé');
      return;
    }

    // Trouver le nœud dans le scénario et mettre à jour sa tech
    this.updateNodeTechInScenario(scenario, this.currentRef.nodeId, techData);

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

    // Activer le bouton Enregistrer
    if (typeof setScenarioModifie === 'function') {
      setScenarioModifie(true);
    }
  }

  updateNodeTechInScenario(scenario, nodeId, techData) {
    // Utiliser la transformation du ref
    const lastTransfo = this.currentRef?.transformation || null;

    if (!lastTransfo) {
      console.error('Pas de transformation disponible');
      return;
    }

    // Vérifier que la transformation a les métadonnées nécessaires
    if (!lastTransfo._path || typeof lastTransfo._index !== 'number') {
      console.error(
        'Transformation sans métadonnées _path/_index:',
        lastTransfo
      );
      return;
    }

    // Créer la nouvelle transformation avec la tech ajoutée
    const updatedTransformation = {
      ...lastTransfo,
      tech: techData,
    };

    // Utiliser updateTransformation pour mettre à jour
    if (typeof window.updateTransformation === 'function') {
      window.updateTransformation(
        scenario,
        lastTransfo._path,
        lastTransfo._index,
        updatedTransformation
      );
    } else {
      console.error('updateTransformation non disponible');
    }
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
window.techPopup = new TechPopup();
window.showTechPopup = (nodeId, mode) => window.techPopup.show(nodeId, mode);
