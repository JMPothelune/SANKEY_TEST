'use client';
import { AppNavbar } from '@/components/ui/AppNavbar';
import { useEffect, useState } from 'react';
import { lots } from '@/data/lots';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

const DIMENSIONS = [
  { value: 'format', label: 'Formats' },
  { value: 'format_type', label: 'Types' },
  { value: 'matiere', label: 'Matière' },
  { value: 'fibres', label: 'Fibres' },
  { value: 'couleur', label: 'Couleur' },
  { value: 'perturbateurs', label: 'Perturbateurs' },
  { value: 'qualite', label: 'Qualité' },
  { value: 'proprete', label: 'Propreté' },
];

type Scenario = { title: string; scenario: Record<string, unknown> };

// Déclarer le type global pour window.scenarios
declare global {
  interface Window {
    scenarios?: Scenario[];
  }
}

export default function SankeyPage() {
  const [dimension, setDimension] = useState('format');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selectedLot, setSelectedLot] = useState<(typeof lots)[0] | null>(null);
  const [isEditable, setIsEditable] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // Clé pour forcer le rechargement

  // Charger les scénarios depuis l'API
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const response = await fetch('/api/scenarios');
        if (response.ok) {
          const scenariosData = await response.json();
          setScenarios(scenariosData);
          if (scenariosData.length > 0) {
            setScenarioIdx(0);
          }
        } else {
          console.error('Erreur lors du chargement des scénarios');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des scénarios:', error);
      }
    };

    loadScenarios();
  }, []);

  // Forcer le rechargement de l'iframe quand les paramètres changent
  useEffect(() => {
    setIframeKey(prev => prev + 1);
  }, [dimension, scenarioIdx, selectedLot, isEditable]);

  // Construire l'URL de l'iframe avec tous les paramètres
  const iframeSrc = `/sankey/index.html?dimension=${encodeURIComponent(dimension)}&scenarioIdx=${scenarioIdx}&isEditable=${isEditable ? 'yes' : 'no'}`;

  // Log pour debug
  console.log('URL iframe:', iframeSrc, 'scenarioIdx:', scenarioIdx);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />

      <div className="">
        {/* Header avec les contrôles */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="font-semibold">Dimension :</label>
              <Select value={dimension} onValueChange={v => setDimension(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Choisir une dimension" />
                </SelectTrigger>
                <SelectContent>
                  {DIMENSIONS.map(dim => (
                    <SelectItem value={dim.value} key={dim.value}>
                      {dim.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold">Scénario :</label>
              <Select
                value={scenarioIdx.toString()}
                onValueChange={v => setScenarioIdx(parseInt(v, 10))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Choisir un scénario" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((scenario, idx) => (
                    <SelectItem value={idx.toString()} key={idx}>
                      {scenario.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold">Lot :</label>
              <Select
                value={selectedLot?.bubbleId || ''}
                onValueChange={v => {
                  const lot = lots.find(l => l.bubbleId === v);
                  setSelectedLot(lot || null);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Choisir un lot" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map(lot => (
                    <SelectItem value={lot.bubbleId} key={lot.bubbleId}>
                      {lot.nom} ({lot.isLive ? 'Live' : 'Test'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold">Édition :</label>
              <input
                type="checkbox"
                checked={isEditable}
                onChange={e => setIsEditable(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Iframe Sankey */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <iframe
            key={iframeKey}
            src={iframeSrc}
            className="w-full h-[800px] border-0"
            title="Visualisation Sankey"
          />
        </div>
      </div>
    </div>
  );
}
