// Gestionnaire de la popup de transformation
class TransformationPopup {
  constructor() {
    this.backdrop = null;
    this.modal = null;
  }

  show(ref, mode) {
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
    
    // Génération dynamique des options du select
    const options = (window.transformationUtils ? window.transformationUtils.getAvailableTransformations() : []).map(t =>
      `<option value="${t.value}" ${lastType === t.value ? 'selected' : ''}>${t.label}</option>`
    ).join('');
    
    // Label et description de la transformation sélectionnée
    const currentLabel = lastType && window.transformationUtils ? window.transformationUtils.getTransformationLabel(lastType) : 'Aucune transformation';
    const currentDesc = lastType && window.transformationUtils ? window.transformationUtils.getTransformationDescription(lastType) : '';
    
    this.modal.innerHTML = `
      <h3 class="text-lg font-semibold mb-4">Ajouter une transformation</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type de transformation</label>
          <select id="transfo-type" class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
            ${options}
          </select>
          <div id="transfo-description" class="text-xs text-gray-500 mt-1">${currentDesc}</div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Destination</label>
          <input type="text" id="target-input" class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" placeholder="Nom de la destination" value="${lastTransfo?.scenario?.target || ''}">
        </div>
      </div>
      <div class="mt-6 flex justify-end space-x-3">
        <button id="cancel-btn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Annuler</button>
        <button id="save-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Enregistrer</button>
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
    
    cancelBtn.onclick = () => this.close();
    
    saveBtn.onclick = () => {
      const target = this.modal.querySelector('#target-input').value;
      const transformation = {
        type: [transfoTypeSelect.value],
        keys: [[]],
        scenario: {
          target: target || undefined
        }
      };
      console.log('Nouvelle transformation:', transformation);
      this.close();
    };
    
    transfoTypeSelect.addEventListener('change', function() {
      if (window.transformationUtils) {
        transfoDescription.textContent = window.transformationUtils.getTransformationDescription(this.value);
      }
    });
    
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
