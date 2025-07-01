# Projet Iframe - Valoramix Frontend

## Vue d'ensemble

Transformation du projet actuel en application web moderne avec architecture iframe pour intégration Bubble. L'objectif est de garder Bubble pour la gestion métier (users, équipes, CRUD) tout en modernisant la partie visualisation avec React/Vite.

## Architecture

### Stack technique
- **Frontend** : React 18 + TypeScript + Vite
- **Déploiement** : Vercel
- **API Gateway** : Vercel Functions
- **Backend** : Bubble (gestion métier + données de base)
- **Communication** : postMessage + API REST

### Structure du projet
```
valoramix-frontend/
├── src/
│   ├── components/
│   │   ├── embed/           # Composants optimisés pour iframe
│   │   │   ├── EmbedLayout.tsx
│   │   │   ├── SankeyEmbed.tsx
│   │   │   ├── LotEmbed.tsx
│   │   │   └── DataEmbed.tsx
│   │   └── shared/          # Composants réutilisables
│   │       ├── SankeyDiagram.tsx
│   │       ├── LotEditor.tsx
│   │       └── DataExplorer.tsx
│   ├── hooks/
│   │   ├── useBubbleData.ts
│   │   ├── useEmbedConfig.ts
│   │   ├── useSankey.ts
│   │   └── useBaseData.ts   # Hook pour données de base
│   ├── services/
│   │   ├── bubbleApi.ts
│   │   ├── embedSync.ts
│   │   └── baseDataService.ts # Service pour données de base
│   ├── types/
│   │   ├── lot.ts
│   │   ├── sankey.ts
│   │   ├── scenario.ts
│   │   └── baseData.ts      # Types pour données de base
│   ├── utils/
│   │   ├── processes.ts     # Migration de processes.js
│   │   ├── calculations.ts
│   │   ├── colorMappings.ts
│   │   └── jsonBuilder.ts   # Construction des JSONs depuis Bubble
│   └── pages/
│       └── embed/
│           ├── sankey.tsx   # Route /embed/sankey
│           ├── lot.tsx      # Route /embed/lot
│           └── data.tsx     # Route /embed/data (temporaire)
├── public/
├── embed.html              # Point d'entrée iframe
├── index.html              # Point d'entrée standalone
├── vite.config.ts
├── package.json
└── vercel.json
```

## Phase 0 : Migration des données de base vers Bubble

### 0.1 Structure des données dans Bubble

#### Collections de base (read-only pour utilisateurs)
```
Formats:
- Nom (text)
- Description (text)
- Couleur (text)
- Actif (yes/no)
- ID (text) - identifiant unique

Types:
- Nom (text)
- Description (text)
- Format (reference to Formats)
- Couleur (text)
- Actif (yes/no)
- ID (text)

Matières:
- Nom (text)
- Description (text)
- Couleur (text)
- Actif (yes/no)
- ID (text)

Fibres:
- Nom (text)
- Description (text)
- Couleur (text)
- Actif (yes/no)
- ID (text)

Couleurs:
- Nom (text)
- Code hex (text)
- Actif (yes/no)
- ID (text)

Qualités:
- Nom (text)
- Description (text)
- Couleur (text)
- Actif (yes/no)
- ID (text)

Propreté:
- Nom (text)
- Description (text)
- Couleur (text)
- Actif (yes/no)
- ID (text)

Perturbateurs:
- Nom (text)
- Description (text)
- Couleur (text)
- Actif (yes/no)
- ID (text)
```

#### Collections de relations
```
MatiereFibres:
- Matière (reference to Matières)
- Fibre (reference to Fibres)
- Pourcentage (number)

TypeMatieres:
- Type (reference to Types)
- Matière (reference to Matières)
- Pourcentage (number)

TypeCouleurs:
- Type (reference to Types)
- Couleur (reference to Couleurs)
- Pourcentage (number)

TypePerturbateurs:
- Type (reference to Types)
- Perturbateur (reference to Perturbateurs)
- Pourcentage (number)
```

### 0.2 Permissions et sécurité
- **Collections de base** : Read-only pour utilisateurs normaux
- **Modifications** : Seulement par les admins
- **Relations** : Modifiables par utilisateurs
- **API** : Accès en lecture seule pour l'app frontend

### 0.3 API Endpoints pour données de base
```typescript
// api/base-data.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { type } = req.query // formats, types, matieres, fibres, etc.

  try {
    const response = await fetch(`${BUBBLE_API_URL}/${type}`, {
      headers: {
        'Authorization': `Bearer ${BUBBLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return res.status(404).json({ error: 'Données non trouvées' })
    }

    const data = await response.json()
    
    // Cache avec Vercel Edge
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
    
    return res.json(data.response)

  } catch (error) {
    console.error('Erreur API base data:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
```

### 0.4 Service de construction des JSONs
```typescript
// services/baseDataService.ts
export class BaseDataService {
  private cache: Map<string, any> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 3600000 // 1 heure

  async getBaseData(): Promise<any> {
    const now = Date.now()
    
    // Vérifier le cache
    if (this.cache.has('baseData') && 
        this.cacheExpiry.get('baseData')! > now) {
      return this.cache.get('baseData')
    }

    // Récupérer depuis Bubble
    const [formats, types, matieres, fibres, couleurs, qualites, proprete, perturbateurs] = 
      await Promise.all([
        this.fetchFromBubble('formats'),
        this.fetchFromBubble('types'),
        this.fetchFromBubble('matieres'),
        this.fetchFromBubble('fibres'),
        this.fetchFromBubble('couleurs'),
        this.fetchFromBubble('qualites'),
        this.fetchFromBubble('proprete'),
        this.fetchFromBubble('perturbateurs')
      ])

    // Construire les JSONs au format attendu
    const baseData = {
      formats: this.buildFormatsJson(formats),
      types: this.buildTypesJson(types),
      matieres: this.buildMatieresJson(matieres),
      fibres: this.buildFibresJson(fibres),
      couleurs: this.buildCouleursJson(couleurs),
      qualite: this.buildQualiteJson(qualites),
      proprete: this.buildPropreteJson(proprete),
      perturbateurs: this.buildPerturbateursJson(perturbateurs)
    }

    // Mettre en cache
    this.cache.set('baseData', baseData)
    this.cacheExpiry.set('baseData', now + this.CACHE_DURATION)

    return baseData
  }

  private buildFormatsJson(formats: any[]): any {
    const result: any = {}
    formats.forEach(format => {
      if (format.Actif) {
        result[format.ID] = {
          pourcentage: 0,
          color: format.Couleur
        }
      }
    })
    return result
  }

  private buildTypesJson(types: any[]): any {
    const result: any = {}
    types.forEach(type => {
      if (type.Actif) {
        result[type.ID] = {
          pourcentage: 0,
          color: type.Couleur,
          matieres: {},
          couleurs: {},
          perturbateurs: {}
        }
      }
    })
    return result
  }

  // Méthodes similaires pour les autres types...

  private async fetchFromBubble(type: string): Promise<any[]> {
    const response = await fetch(`/api/base-data?type=${type}`)
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des ${type}`)
    }
    return response.json()
  }
}
```

### 0.5 Hook pour données de base
```typescript
// hooks/useBaseData.ts
import { useState, useEffect } from 'react'
import { BaseDataService } from '../services/baseDataService'

export const useBaseData = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        setLoading(true)
        setError(null)

        const service = new BaseDataService()
        const baseData = await service.getBaseData()
        setData(baseData)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchBaseData()
  }, [])

  return { data, loading, error }
}
```

### 0.6 Migration des données existantes
```typescript
// scripts/migrateToBubble.ts
import * as fs from 'fs'
import * as path from 'path'

const BUBBLE_API_URL = 'https://your-app.bubbleapps.io/version-test/api/1.1/obj'
const BUBBLE_API_KEY = process.env.BUBBLE_API_KEY

async function migrateData() {
  // Lire les fichiers JSON existants
  const formats = JSON.parse(fs.readFileSync(path.join(__dirname, '../base_data/formats.json'), 'utf8'))
  const types = JSON.parse(fs.readFileSync(path.join(__dirname, '../base_data/types.json'), 'utf8'))
  const matieres = JSON.parse(fs.readFileSync(path.join(__dirname, '../base_data/matieres.json'), 'utf8'))
  const fibres = JSON.parse(fs.readFileSync(path.join(__dirname, '../base_data/fibres.json'), 'utf8'))
  const couleurs = JSON.parse(fs.readFileSync(path.join(__dirname, '../base_data/couleurs.json'), 'utf8'))
  const qualite = JSON.parse(fs.readFileSync(path.join(__dirname, '../base_data/qualite.json'), 'utf8'))
  const proprete = JSON.parse(fs.readFileSync(path.join(__dirname, '../base_data/proprete.json'), 'utf8'))
  const perturbateurs = JSON.parse(fs.readFileSync(path.join(__dirname, '../base_data/perturbateurs.json'), 'utf8'))

  // Migrer chaque collection
  await migrateCollection('formats', formats)
  await migrateCollection('types', types)
  await migrateCollection('matieres', matieres)
  await migrateCollection('fibres', fibres)
  await migrateCollection('couleurs', couleurs)
  await migrateCollection('qualites', qualite)
  await migrateCollection('proprete', proprete)
  await migrateCollection('perturbateurs', perturbateurs)
}

async function migrateCollection(collectionName: string, data: any) {
  console.log(`Migration de ${collectionName}...`)
  
  for (const [key, value] of Object.entries(data)) {
    const item = value as any
    
    const bubbleItem = {
      Nom: key,
      Description: item.description || '',
      Couleur: item.color || '#000000',
      Actif: true,
      ID: key // Utiliser la clé comme ID
    }

    // Ajouter des champs spécifiques selon la collection
    if (collectionName === 'types' && item.format) {
      bubbleItem.Format = item.format
    }

    try {
      const response = await fetch(`${BUBBLE_API_URL}/${collectionName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BUBBLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bubbleItem)
      })

      if (response.ok) {
        console.log(`✅ ${collectionName}: ${key} migré`)
      } else {
        console.error(`❌ ${collectionName}: ${key} - ${response.statusText}`)
      }
    } catch (error) {
      console.error(`❌ ${collectionName}: ${key} - ${error}`)
    }
  }
}

migrateData().catch(console.error)
```

## Phase 1 : Setup initial

### 1.1 Création du projet
```bash
npm create vite@latest valoramix-frontend -- --template react-ts
cd valoramix-frontend
npm install
```

### 1.2 Dépendances à installer
```bash
npm install d3 @types/d3
npm install react-router-dom
npm install @vercel/node
npm install -D @types/node
```

### 1.3 Configuration Vite
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        embed: 'embed.html'
      }
    }
  },
  define: {
    __EMBED_MODE__: JSON.stringify(process.env.EMBED_MODE === 'true')
  }
})
```

### 1.4 Configuration Vercel
```json
// vercel.json
{
  "functions": {
    "api/bubble-data.ts": {
      "maxDuration": 30
    },
    "api/base-data.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/embed/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "ALLOW-FROM https://your-app.bubbleapps.io"
        },
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors 'self' https://your-app.bubbleapps.io"
        }
      ]
    }
  ]
}
```

## Phase 2 : Migration des utilitaires

### 2.1 Migration de processes.js
- Convertir en TypeScript
- Adapter pour React hooks
- Tester chaque fonction

### 2.2 Migration des calculs
- Fonctions de calcul de pourcentages
- Normalisation des données
- Cross-distribution

### 2.3 Migration des mappings de couleurs
- Système de couleurs cohérent
- Thème adaptatif

## Phase 3 : API Gateway

### 3.1 Création de l'API Bubble
```typescript
// api/bubble-data.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

const BUBBLE_API_URL = 'https://your-app.bubbleapps.io/version-test/api/1.1/obj'
const BUBBLE_API_KEY = process.env.BUBBLE_API_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { lotId, scenarioId } = req.query

  if (!lotId) {
    return res.status(400).json({ error: 'lotId requis' })
  }

  try {
    // Récupérer le lot depuis Bubble
    const lotResponse = await fetch(`${BUBBLE_API_URL}/lot/${lotId}`, {
      headers: {
        'Authorization': `Bearer ${BUBBLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!lotResponse.ok) {
      return res.status(404).json({ error: 'Lot non trouvé' })
    }

    const lot = await lotResponse.json()

    // Récupérer le scénario si spécifié
    let scenario = null
    if (scenarioId) {
      const scenarioResponse = await fetch(`${BUBBLE_API_URL}/scenario/${scenarioId}`, {
        headers: {
          'Authorization': `Bearer ${BUBBLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      if (scenarioResponse.ok) {
        scenario = await scenarioResponse.json()
      }
    }

    // Cache avec Vercel Edge
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    
    return res.json({
      lot: lot.response,
      scenario: scenario?.response || null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erreur API Bubble:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
```

### 3.2 Variables d'environnement
```bash
# .env.local
BUBBLE_API_KEY=your_bubble_api_key_here
BUBBLE_APP_URL=https://your-app.bubbleapps.io
```

## Phase 4 : Composants embed

### 4.1 Hook useBubbleData
```typescript
// hooks/useBubbleData.ts
import { useState, useEffect } from 'react'

interface BubbleData {
  lot: any
  scenario: any
  timestamp: string
}

export const useBubbleData = (lotId: string, scenarioId?: string) => {
  const [data, setData] = useState<BubbleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({ lotId })
        if (scenarioId) params.append('scenarioId', scenarioId)

        const response = await fetch(`/api/bubble-data?${params}`)
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }

        const bubbleData = await response.json()
        setData(bubbleData)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    if (lotId) {
      fetchData()
    }
  }, [lotId, scenarioId])

  const refreshData = () => {
    setLoading(true)
    setData(null)
  }

  return { data, loading, error, refreshData }
}
```

### 4.2 Hook useEmbedConfig
```typescript
// hooks/useEmbedConfig.ts
import { useEffect, useState, useCallback } from 'react'

export const useEmbedConfig = () => {
  const [isEmbedded, setIsEmbedded] = useState(false)
  const [parentOrigin, setParentOrigin] = useState<string>('')

  useEffect(() => {
    const inIframe = window !== window.parent
    setIsEmbedded(inIframe)
    
    if (inIframe) {
      const urlParams = new URLSearchParams(window.location.search)
      const origin = urlParams.get('parentOrigin') || 'https://your-app.bubbleapps.io'
      setParentOrigin(origin)
    }
  }, [])

  const sendMessage = useCallback((type: string, data: any) => {
    if (isEmbedded && parentOrigin) {
      window.parent.postMessage({
        type,
        data,
        timestamp: Date.now(),
        source: 'valoramix-embed'
      }, parentOrigin)
    }
  }, [isEmbedded, parentOrigin])

  const listenToMessages = useCallback((callback: (message: any) => void) => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== parentOrigin) return
      callback(event.data)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [parentOrigin])

  return {
    isEmbedded,
    parentOrigin,
    sendMessage,
    listenToMessages
  }
}
```

### 4.3 Composant EmbedLayout
```typescript
// components/embed/EmbedLayout.tsx
import React, { useEffect, useState } from 'react'
import { useEmbedConfig } from '../../hooks/useEmbedConfig'

interface EmbedLayoutProps {
  children: React.ReactNode
  title?: string
}

export const EmbedLayout: React.FC<EmbedLayoutProps> = ({ children, title }) => {
  const { isEmbedded, sendMessage } = useEmbedConfig()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isEmbedded) {
      sendMessage('IFRAME_READY', { title })
      setIsLoading(false)
    }
  }, [isEmbedded, title, sendMessage])

  const embedStyles = {
    width: '100%',
    height: '100%',
    border: 'none',
    overflow: 'hidden'
  }

  if (isLoading) {
    return (
      <div style={embedStyles} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div style={embedStyles} className="bg-white">
      {children}
    </div>
  )
}
```

### 4.4 Composant SankeyEmbed
```typescript
// components/embed/SankeyEmbed.tsx
import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmbedLayout } from './EmbedLayout'
import { SankeyDiagram } from '../shared/SankeyDiagram'
import { useBubbleData } from '../../hooks/useBubbleData'
import { useEmbedConfig } from '../../hooks/useEmbedConfig'

export const SankeyEmbed: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { isEmbedded, sendMessage } = useEmbedConfig()
  
  const lotId = searchParams.get('lotId')
  const scenarioId = searchParams.get('scenarioId')
  const initialDimension = searchParams.get('dimension') || 'formats'

  const { data, loading, error, refreshData } = useBubbleData(lotId!, scenarioId || undefined)

  useEffect(() => {
    if (isEmbedded && data && !loading) {
      sendMessage('DATA_LOADED', {
        lotId,
        scenarioId,
        timestamp: data.timestamp
      })
    }
  }, [isEmbedded, data, loading, sendMessage, lotId, scenarioId])

  useEffect(() => {
    if (error && isEmbedded) {
      sendMessage('ERROR', { 
        type: 'DATA_LOAD_ERROR',
        error 
      })
    }
  }, [error, isEmbedded, sendMessage])

  if (loading) {
    return (
      <EmbedLayout title="Sankey Diagram">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      </EmbedLayout>
    )
  }

  if (error) {
    return (
      <EmbedLayout title="Erreur">
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-600">
            <p className="mb-4">Erreur de chargement</p>
            <button 
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </EmbedLayout>
    )
  }

  if (!data?.lot) {
    return (
      <EmbedLayout title="Données manquantes">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">Aucune donnée trouvée</p>
        </div>
      </EmbedLayout>
    )
  }

  return (
    <EmbedLayout title="Sankey Diagram">
      <div className="w-full h-full">
        <SankeyDiagram 
          lot={data.lot}
          scenario={data.scenario}
          dimension={initialDimension}
          onNodeClick={(node) => {
            sendMessage('NODE_CLICK', { node })
          }}
          onTransformationAdd={(transformation) => {
            sendMessage('TRANSFORMATION_ADD', { transformation })
          }}
          onTransformationDelete={(transformationId) => {
            sendMessage('TRANSFORMATION_DELETE', { transformationId })
          }}
        />
      </div>
    </EmbedLayout>
  )
}
```

## Phase 5 : Migration des composants existants

### 5.1 Migration du Sankey
- Adapter sankey.js en composant React
- Utiliser D3.js avec React
- Gérer les interactions

### 5.2 Migration du Lot Editor
- Adapter lot.js en composant React
- Gérer les états avec hooks
- Optimiser les performances

### 5.3 Migration du Data Explorer
- Adapter les fonctionnalités existantes
- Améliorer l'UX
- Ajouter des filtres

## Phase 6 : Communication avec Bubble

### 6.1 Messages de l'iframe vers Bubble
- `IFRAME_READY` : Iframe prête
- `DATA_LOADED` : Données chargées
- `NODE_CLICK` : Clic sur un nœud
- `TRANSFORMATION_ADD` : Ajout de transformation
- `TRANSFORMATION_DELETE` : Suppression de transformation
- `ERROR` : Erreur dans l'iframe

### 6.2 Messages de Bubble vers l'iframe
- `DIMENSION_CHANGE` : Changement de dimension
- `LOT_UPDATE` : Mise à jour du lot
- `SCENARIO_UPDATE` : Mise à jour du scénario
- `REFRESH` : Demande de rafraîchissement

### 6.3 Configuration Bubble
```html
<!-- Page Bubble avec iframe -->
<div class="sankey-container">
  <iframe 
    src="https://your-frontend.vercel.app/embed/sankey?lotId={{CurrentLot.id}}&scenarioId={{CurrentScenario.id}}&dimension=formats"
    width="100%" 
    height="800px"
    frameborder="0"
  />
</div>

<script>
window.addEventListener('message', function(event) {
  if (event.origin !== 'https://your-frontend.vercel.app') return;
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'IFRAME_READY':
      console.log('Iframe prête:', data.title);
      break;
      
    case 'DATA_LOADED':
      console.log('Données chargées:', data);
      break;
      
    case 'NODE_CLICK':
      bubble_fn_show('node-details', { node: data.node });
      break;
      
    case 'TRANSFORMATION_ADD':
      bubble_fn_create('transformation', data.transformation);
      break;
      
    case 'ERROR':
      bubble_fn_show('error-popup', { error: data.error });
      break;
  }
});
</script>
```

## Phase 7 : Déploiement et tests

### 7.1 Configuration Vercel
- Déploiement automatique
- Variables d'environnement
- Domaines personnalisés

### 7.2 Tests
- Tests unitaires des composants
- Tests d'intégration iframe
- Tests de performance

### 7.3 Monitoring
- Logs d'erreurs
- Métriques de performance
- Analytics d'usage

## Avantages de cette approche

✅ **Performance** : Pas de rechargement de page  
✅ **UX fluide** : Updates en temps réel  
✅ **Flexibilité** : Possibilité de plein écran, redimensionnement  
✅ **Sécurité** : Communication contrôlée entre domaines  
✅ **Maintenance** : Code frontend séparé et moderne  
✅ **Évolutivité** : Facile d'ajouter de nouvelles fonctionnalités  
✅ **Simplicité** : Juste un ID dans l'URL  
✅ **Cache** : Optimisation côté serveur  
✅ **Données centralisées** : Gestion Bubble pour données de base  
✅ **Permissions** : Contrôle d'accès granulaire  

## Risques et mitigations

⚠️ **Complexité de communication** → Tests approfondis  
⚠️ **Performance iframe** → Optimisation et lazy loading  
⚠️ **Sécurité cross-origin** → Validation stricte des origines  
⚠️ **Compatibilité navigateurs** → Tests multi-navigateurs  
⚠️ **Migration des données** → Scripts de migration et rollback  

