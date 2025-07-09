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

  // Charger les scénarios depuis window.scenarios
  useEffect(() => {
    if (typeof window !== 'undefined' && window.scenarios) {
      setScenarios(window.scenarios);
      if (window.scenarios.length > 0) {
        setScenarioIdx(0);
      }
    }
  }, []);

  // Mettre à jour l'URL de l'iframe quand les paramètres changent
  useEffect(() => {
    if (selectedLot) {
      const iframe = document.getElementById(
        'sankey-iframe'
      ) as HTMLIFrameElement;
      if (iframe) {
        const params = new URLSearchParams({
          dimension,
          scenarioIdx: scenarioIdx.toString(),
          lotId: selectedLot.bubbleId,
          isLive: selectedLot.isLive ? 'true' : 'false',
          isEditable: isEditable ? 'yes' : 'no',
        });
        iframe.src = `/sankey/index.html?${params.toString()}`;
      }
    }
  }, [dimension, scenarioIdx, selectedLot, isEditable]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Visualisation Sankey
          </h1>
          <p className="text-gray-600">
            Analyse des flux de valorisation textile
          </p>
        </div>

        {/* Header avec les contrôles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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
              <span className="text-sm text-gray-600">
                {isEditable ? 'Activée' : 'Désactivée'}
              </span>
            </div>
          </div>
        </div>

        {/* Iframe Sankey */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <iframe
            id="sankey-iframe"
            src="/sankey/index.html"
            className="w-full h-[800px] border-0"
            title="Visualisation Sankey"
          />
        </div>
      </div>
    </div>
  );
}
