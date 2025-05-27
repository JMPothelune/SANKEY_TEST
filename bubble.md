# Plan d'intégration du Sankey avec Bubble.io

## Objectifs
- Gérer les comptes utilisateurs dans Bubble.
- Enregistrer les lots de départ et les scénarios dans Bubble.
- Visualiser dynamiquement le Sankey avec les données Bubble.
- Permettre l'ajout/modification de transformations côté Sankey et renvoyer le scénario mis à jour à Bubble.
- Maintenir le cœur du Sankey dans Cursor pour un développement facile et indépendant.
- Garantir la sécurité des échanges et la maintenabilité de l'ensemble.

---

## 1. Options d'intégration

### Option 1 : Plugin Bubble personnalisé

**Principe**  
Développer un plugin Bubble (en JavaScript) qui embarque le Sankey et expose des actions Bubble pour charger/sauvegarder les scénarios.

**Avantages**
- Intégration native dans Bubble (UI, workflows, sécurité Bubble).
- Communication directe avec la base de données Bubble (actions, triggers).
- Facile à utiliser pour un utilisateur Bubble (pas d'iframe, pas de bidouille).
- Sécurité gérée par Bubble (auth, droits, etc.).

**Inconvénients**
- Développement du plugin plus complexe (Bubble impose son propre système de plugins).
- Moins de liberté sur l'environnement d'exécution (dépendances, outils de debug).
- Risque de couplage fort avec Bubble (plus difficile à extraire si besoin d'indépendance).

**Maintenabilité**  
Bonne si tu restes dans l'écosystème Bubble, mais moins flexible pour des évolutions hors Bubble.

#### Développement et Test du Plugin

**Structure du Développement**
```
project/
├── sankey/              # Ton code Sankey (développé dans Cursor)
│   ├── sankey.js
│   ├── styles.css
│   └── index.html
│
└── bubble-plugin/       # Code du plugin Bubble
    ├── plugin.js        # Code d'intégration avec Bubble
    └── manifest.json    # Configuration du plugin
```

**Processus de Développement**

1. **Phase 1 : Développement du Sankey**
   - Développe et teste le Sankey dans Cursor
   - Assure-toi que toutes les fonctionnalités marchent
   - Documente l'API du Sankey (comment l'initialiser, quelles méthodes exposer)

2. **Phase 2 : Intégration Bubble**
   - Crée le plugin dans Bubble
   - Intègre le code du Sankey
   - Teste l'intégration dans Bubble

3. **Phase 3 : Itération**
   - Déploie le plugin
   - Teste dans Bubble
   - Fais des ajustements si nécessaire

**Exemple de Code**
```javascript
// bubble-plugin/plugin.js
Bubble.registerPlugin({
  name: 'SankeyVisualization',
  initialize: function() {
    // Initialisation du plugin
  },
  
  // Méthode appelée par Bubble pour charger les données
  loadData: function(lot, scenario) {
    // Appel au Sankey
    this.sankeyInstance.updateData(lot, scenario);
  },
  
  // Méthode appelée quand l'utilisateur ajoute une transformation
  addTransformation: function(transformation) {
    // Appel au Sankey
    this.sankeyInstance.addTransformation(transformation);
  }
});
```

**Inconvénients de cette Approche**
1. **Pas de test local du plugin**
   - Tu dois déployer dans Bubble pour tester
   - Les cycles de test sont plus longs

2. **Développement en deux phases**
   - Tu dois maintenir deux environnements
   - Plus complexe à gérer

**Recommandations**
1. **Pour le Sankey**
   - Garde le code modulaire
   - Documente bien l'API
   - Utilise des tests unitaires si possible

2. **Pour le Plugin**
   - Commence petit
   - Teste souvent dans Bubble
   - Utilise le mode Preview de Bubble

3. **Pour le Workflow**
   - Développe d'abord le Sankey
   - Intègre ensuite dans Bubble
   - Itère rapidement

---

### Option 2 : Iframe (application Sankey indépendante)

**Principe**  
Déployer le Sankey comme une app web indépendante (hébergée sur Netlify, Vercel, etc.) et l'intégrer dans Bubble via un composant HTML/iframe. Communication via `postMessage`.

**Avantages**
- Tu développes et maintiens le Sankey dans Cursor, sans contrainte Bubble.
- Déploiement et versioning indépendants (Git, CI/CD).
- Facile à tester et à faire évoluer sans toucher à Bubble.
- Possibilité de réutiliser l'app Sankey ailleurs.

**Inconvénients**
- Communication Bubble <-> Sankey plus complexe (postMessage, gestion des événements).
- Sécurité à bien gérer (CORS, validation des messages, authentification).
- Nécessite de synchroniser les données entre Bubble et l'iframe (chargement initial, sauvegarde).

**Maintenabilité**  
Excellente pour le Sankey (développement libre), mais nécessite de maintenir la logique de pont (postMessage) et la documentation des échanges.

#### Développement et Test de l'Iframe

**Structure du Développement**
```
project/
├── sankey/                    # Application Sankey (développée dans Cursor)
│   ├── src/
│   │   ├── sankey.js         # Code principal du Sankey
│   │   ├── styles.css        # Styles
│   │   └── utils/
│   │       ├── bubble.js     # Utilitaires pour la communication avec Bubble
│   │       └── validation.js # Validation des données
│   ├── public/
│   │   └── index.html        # Page de test
│   └── tests/                # Tests unitaires et d'intégration
│
└── bubble-integration/        # Code d'intégration Bubble
    ├── iframe.html           # Page Bubble qui contient l'iframe
    └── bubble.js             # Code Bubble pour la communication
```

**Processus de Développement**

1. **Phase 1 : Développement du Sankey**
   - Développe le Sankey comme une application web standard
   - Implémente une API de communication via postMessage
   - Ajoute des tests unitaires et d'intégration
   - Documente l'API de communication

2. **Phase 2 : Intégration Bubble**
   - Crée la page Bubble qui contiendra l'iframe
   - Implémente la logique de communication Bubble -> Sankey
   - Gère la sécurité (CORS, validation des messages)

3. **Phase 3 : Déploiement et Test**
   - Déploie le Sankey sur un serveur (Netlify, Vercel, etc.)
   - Configure les en-têtes CORS
   - Teste l'intégration complète

**Exemple de Code**

```javascript
// sankey/src/utils/bubble.js
class BubbleCommunication {
  constructor() {
    this.origin = 'https://ton-app-bubble.bubbleapps.io';
    
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  handleMessage(event) {
    // Vérification de l'origine
    if (event.origin !== this.origin) return;

    const { type, data } = event.data;

    switch (type) {
      case 'LOAD_DATA':
        this.handleLoadData(data);
        break;
      case 'SAVE_SCENARIO':
        this.handleSaveScenario(data);
        break;
    }
  }

  sendToBubble(type, data) {
    window.parent.postMessage({ type, data }, this.origin);
  }
}

// Dans le code principal du Sankey
const bubbleComm = new BubbleCommunication();

// Quand l'utilisateur ajoute une transformation
function onAddTransformation(transformation) {
  bubbleComm.sendToBubble('SCENARIO_UPDATED', {
    transformation,
    timestamp: Date.now()
  });
}
```

```javascript
// bubble-integration/bubble.js
Bubble.registerWorkflow({
  name: 'InitializeSankey',
  steps: [
    {
      type: 'element',
      action: 'create',
      element: 'iframe',
      properties: {
        src: 'https://ton-sankey.netlify.app',
        id: 'sankey-iframe'
      }
    }
  ]
});

// Envoi des données au Sankey
function sendDataToSankey(lot, scenario) {
  const iframe = document.getElementById('sankey-iframe');
  iframe.contentWindow.postMessage({
    type: 'LOAD_DATA',
    data: { lot, scenario }
  }, 'https://ton-sankey.netlify.app');
}
```

**Sécurité et Validation**

1. **CORS**
   - Configuration du serveur Sankey :
     ```nginx
     # nginx.conf
     add_header 'Access-Control-Allow-Origin' 'https://ton-app-bubble.bubbleapps.io';
     add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
     add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
     ```

2. **Validation des Messages**
   - Vérification de l'origine
   - Validation du format des données
   - Timestamps pour éviter les attaques par rejeu

**Tests**

1. **Tests Unitaires**
   ```javascript
   // tests/bubble-communication.test.js
   describe('BubbleCommunication', () => {
     it('should validate message origin', () => {
       const comm = new BubbleCommunication();
       const event = {
         origin: 'https://malicious-site.com',
         data: { type: 'LOAD_DATA', data: {} }
       };
       expect(comm.handleMessage(event)).toBeFalsy();
     });
   });
   ```

2. **Tests d'Intégration**
   - Tests de bout en bout avec Cypress
   - Tests de performance
   - Tests de sécurité

**Monitoring et Debug**

1. **Logs**
   ```javascript
   class BubbleCommunication {
     constructor() {
       this.logger = new Logger('bubble-comm');
     }

     handleMessage(event) {
       this.logger.info('Message reçu', { type: event.data.type });
       // ...
     }
   }
   ```

2. **Erreurs**
   - Capture des erreurs côté Sankey
   - Notification à Bubble en cas d'erreur
   - Système de retry pour les messages importants

---

### Option 3 : API REST + Frontend séparé

**Principe**  
Le Sankey est une app indépendante qui communique avec Bubble via une API REST (Bubble expose des endpoints pour charger/sauvegarder les scénarios).

**Avantages**
- Indépendance totale du Sankey (développement, déploiement, tests).
- Possibilité d'intégrer le Sankey dans d'autres apps (mobile, desktop, etc.).
- Sécurité et scalabilité (authentification, gestion des droits via l'API).

**Inconvénients**
- Implémentation de l'API Bubble nécessaire (workflows API, gestion des tokens).
- Plus de points de maintenance (API, frontend, Bubble).
- Risque de latence ou de décalage si l'API n'est pas bien conçue.

**Maintenabilité**  
Très bonne pour le Sankey, mais nécessite de maintenir l'API Bubble et la documentation des endpoints.

#### Développement et Test de l'API REST

**Structure du Développement**
```
project/
├── sankey/                    # Application Sankey (développée dans Cursor)
│   ├── src/
│   │   ├── sankey.js         # Code principal du Sankey
│   │   ├── styles.css        # Styles
│   │   └── api/
│   │       ├── client.js     # Client API pour Bubble
│   │       └── validation.js # Validation des données
│   ├── public/
│   │   └── index.html        # Page de test
│   └── tests/                # Tests unitaires et d'intégration
│
└── bubble-api/               # API Bubble
    ├── workflows/           # Workflows API Bubble
    │   ├── get-lot.js      # Récupération d'un lot
    │   ├── get-scenario.js # Récupération d'un scénario
    │   └── save-scenario.js # Sauvegarde d'un scénario
    └── security/           # Configuration sécurité
        └── api-keys.js     # Gestion des clés API
```

**Processus de Développement**

1. **Phase 1 : Développement de l'API Bubble**
   - Création des workflows API dans Bubble
   - Configuration de la sécurité (API keys, authentification)
   - Documentation de l'API (endpoints, formats, erreurs)

2. **Phase 2 : Développement du Client API**
   - Implémentation du client API dans le Sankey
   - Gestion des erreurs et retries
   - Tests d'intégration avec l'API Bubble

3. **Phase 3 : Déploiement et Test**
   - Déploiement du Sankey
   - Configuration des environnements (dev, prod)
   - Tests de bout en bout

**Exemple de Code**

```javascript
// sankey/src/api/client.js
class BubbleAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://ton-app-bubble.bubbleapps.io/api/v1';
  }

  async getLot(lotId) {
    const response = await fetch(`${this.baseUrl}/lots/${lotId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    return response.json();
  }

  async saveScenario(scenario) {
    const response = await fetch(`${this.baseUrl}/scenarios`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scenario)
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    return response.json();
  }
}
```

```javascript
// bubble-api/workflows/get-lot.js
Bubble.registerWorkflow({
  name: 'GetLot',
  steps: [
    {
      type: 'api',
      action: 'get',
      path: '/lots/:id',
      security: {
        type: 'api-key',
        required: true
      },
      handler: async (req, res) => {
        const lot = await Bubble.getLot(req.params.id);
        if (!lot) {
          return res.status(404).json({ error: 'Lot non trouvé' });
        }
        return res.json(lot);
      }
    }
  ]
});
```

**Sécurité et Validation**

1. **Authentification**
   - Utilisation d'API keys
   - Validation des tokens JWT
   - Rate limiting

2. **Validation des Données**
   ```javascript
   // sankey/src/api/validation.js
   const validateScenario = (scenario) => {
     if (!scenario.transformations) {
       throw new Error('Scenario invalide: transformations manquantes');
     }
     // ... autres validations
   };
   ```

**Tests**

1. **Tests Unitaires**
   ```javascript
   // tests/api-client.test.js
   describe('BubbleAPIClient', () => {
     it('should handle API errors', async () => {
       const client = new BubbleAPIClient('test-key');
       await expect(client.getLot('invalid-id'))
         .rejects
         .toThrow('Erreur API: 404');
     });
   });
   ```

2. **Tests d'Intégration**
   - Tests des endpoints API
   - Tests de performance
   - Tests de sécurité

**Monitoring et Debug**

1. **Logs**
   ```javascript
   class BubbleAPIClient {
     constructor(apiKey) {
       this.logger = new Logger('api-client');
     }

     async getLot(lotId) {
       this.logger.info('Récupération du lot', { lotId });
       try {
         // ... code existant
       } catch (error) {
         this.logger.error('Erreur API', { lotId, error });
         throw error;
       }
     }
   }
   ```

2. **Métriques**
   - Temps de réponse
   - Taux d'erreur
   - Utilisation de l'API

**Déploiement**

1. **Environnements**
   - Dev : `https://dev.ton-sankey.netlify.app`
   - Prod : `https://ton-sankey.netlify.app`

2. **CI/CD**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy Sankey
   on:
     push:
       branch: main
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Deploy to Netlify
           uses: netlify/actions/cli@master
           with:
             args: deploy --prod
   ```

---

## 2. Points-clés pour chaque option

| Critère                        | Plugin Bubble         | Iframe indépendant      | API REST + Frontend     |
|------------------------------- |----------------------|------------------------|-------------------------|
| **Développement Sankey**       | Limité (Bubble)      | Libre (Cursor)         | Libre (Cursor)          |
| **Maintenance Sankey**         | Bubble               | Indépendant            | Indépendant             |
| **Chargement des données**     | Direct (actions)     | postMessage            | API REST                |
| **Renvoi des interactions**    | Direct (actions)     | postMessage            | API REST                |
| **Sécurité**                   | Bubble               | À gérer (CORS, tokens) | À gérer (auth, tokens)  |
| **Scalabilité**                | Bubble               | Bonne                  | Excellente              |
| **Réutilisabilité**            | Faible               | Bonne                  | Excellente              |

---

## 3. Recommandations

- **Pour une évolutivité et une indépendance maximale** : privilégie l'option Iframe ou API REST.
- **Pour une intégration 100% Bubble et une simplicité d'usage** : le plugin Bubble est le plus simple pour l'utilisateur final, mais moins flexible pour le développement avancé.

---

## 4. Workflow type (Iframe ou API REST)

1. L'utilisateur se connecte à Bubble.
2. Bubble charge le lot et le scénario depuis sa base de données.
3. Bubble transmet ces données à l'app Sankey (via postMessage ou API).
4. L'utilisateur interagit avec le Sankey (ajout de transformations, édition…).
5. Le Sankey envoie le scénario mis à jour à Bubble (postMessage ou API).
6. Bubble sauvegarde le scénario.

---

## 5. Sécurité

- **Authentification** : toujours vérifier l'identité de l'utilisateur côté Bubble avant de charger ou sauvegarder un scénario.
- **CORS et postMessage** : limiter les origines autorisées, valider les messages reçus.
- **Validation des données** : toujours valider les scénarios et lots reçus avant de les enregistrer.

---

## 6. Conseils de maintenance

- Documenter les formats de messages échangés (postMessage ou API).
- Versionner le code Sankey indépendamment.
- Prévoir des logs côté Sankey et côté Bubble pour faciliter le debug.
- Garder le cœur du Sankey dans Cursor pour un développement rapide et sûr.

---

**N'hésite pas à préciser l'option que tu veux approfondir pour un plan d'action concret !**
