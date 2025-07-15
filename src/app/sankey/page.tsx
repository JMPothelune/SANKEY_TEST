'use client';
import { AppNavbar } from '@/components/ui/AppNavbar';
import { useEffect, useState } from 'react';
import { lots } from '@/data/lots';
import { scenarios } from '@/data/scenarios';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

const DIMENSIONS = [
  { value: 'formats', label: 'Formats' },
  { value: 'types', label: 'Types' },
  { value: 'matieres', label: 'Matière' },
  { value: 'fibres', label: 'Fibres' },
  { value: 'couleurs', label: 'Couleur' },
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
  const [dimension, setDimension] = useState(DIMENSIONS[0].value);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selectedLot, setSelectedLot] = useState<(typeof lots)[0] | null>(
    lots[0]
  ); // Premier lot par défaut
  const [selectedScenario, setSelectedScenario] = useState<
    (typeof scenarios)[0] | null
  >(scenarios[0]); // Premier scénario par défaut
  const [isEditable, setIsEditable] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // Clé pour forcer le rechargement
  const [iframeHeight, setIframeHeight] = useState<number>(800);

  // Forcer le rechargement de l'iframe quand les paramètres changent
  useEffect(() => {
    setIframeKey(prev => prev + 1);
  }, [dimension, scenarioIdx, selectedLot, selectedScenario, isEditable]);

  // Gérer le redimensionnement de l'iframe
  useEffect(() => {
    function handleResizeMessage(event: MessageEvent) {
      if (
        event.data &&
        event.data.type === 'IFRAME_HEIGHT' &&
        typeof event.data.height === 'number'
      ) {
        setIframeHeight(event.data.height);
      }
    }
    window.addEventListener('message', handleResizeMessage);
    return () => window.removeEventListener('message', handleResizeMessage);
  }, []);

  // Construire l'URL de l'iframe avec tous les paramètres
  const iframeSrc = `/sankey/index.html?dimension=${encodeURIComponent(dimension)}&scenarioIdx=${scenarioIdx}&isEditable=${isEditable ? 'yes' : 'no'}&lotId=${selectedLot?.bubbleId || ''}&isLive=${selectedLot?.isLive || false}&scenarioId=${selectedScenario?.bubbleId || ''}&scenarioIsLive=${selectedScenario?.isLive || false}`;

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
                value={selectedScenario?.bubbleId || ''}
                onValueChange={v => {
                  const scenario = scenarios.find(s => s.bubbleId === v);
                  setSelectedScenario(scenario || null);
                  setScenarioIdx(scenarios.findIndex(s => s.bubbleId === v));
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Choisir un scénario" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map(scenario => (
                    <SelectItem
                      value={scenario.bubbleId}
                      key={scenario.bubbleId}
                    >
                      {scenario.nom} ({scenario.isLive ? 'Live' : 'Test'})
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
            className="w-full border-0"
            style={{ minHeight: 400, height: iframeHeight }}
            title="Visualisation Sankey"
          />
        </div>
      </div>
    </div>
  );
}
