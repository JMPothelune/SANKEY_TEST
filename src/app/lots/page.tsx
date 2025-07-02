'use client';
import { AppNavbar } from '@/components/ui/AppNavbar';
import { lots } from '@/data/lots';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

// Interface pour typer les données du lot
interface LotData {
  [key: string]: unknown;
}

export default function LotsPage() {
  const [selectedLotIdx, setSelectedLotIdx] = useState(0);
  const [lotData, setLotData] = useState<LotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fetchLotData = useCallback(async (lotIdx: number) => {
    try {
      setLoading(true);
      setError(null);

      const lot = lots[lotIdx];
      if (!lot) {
        throw new Error('Lot non trouvé');
      }

      const response = await fetch('/api/bubble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'lot',
          params: {
            id: lot.bubbleId,
            isLive: lot.isLive,
          },
          method: 'POST',
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      setLotData(data);

      // Envoyer les données à l'iframe
      sendDataToIframe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Erreur lors du chargement du lot:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour envoyer les données à l'iframe
  const sendDataToIframe = useCallback((data: LotData) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      console.log("Envoi des données à l'iframe:", data);
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'LOT_DATA',
          data: data,
        },
        '*'
      );
    }
  }, []);

  // Charger le lot par défaut au montage
  useEffect(() => {
    fetchLotData(selectedLotIdx);
  }, [fetchLotData, selectedLotIdx]);

  // Écouter le chargement de l'iframe pour envoyer les données
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        console.log('Iframe chargée, envoi des données si disponibles');
        if (lotData) {
          sendDataToIframe(lotData);
        }
      };

      iframe.addEventListener('load', handleLoad);
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, [lotData, sendDataToIframe]);

  // Charger le nouveau lot quand l'utilisateur change de sélection
  const handleLotChange = (newIdx: number) => {
    setSelectedLotIdx(newIdx);
    fetchLotData(newIdx);
  };

  return (
    <div className="h-screen flex flex-col">
      <AppNavbar />
      <div className="p-4 border-b flex items-center">
        <label className="font-semibold mr-2">Choisir un lot :</label>
        <Select
          value={selectedLotIdx.toString()}
          onValueChange={v => handleLotChange(Number(v))}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Choisir un lot" />
          </SelectTrigger>
          <SelectContent>
            {lots.map((lot, idx) => (
              <SelectItem value={idx.toString()} key={lot.bubbleId}>
                {lot.nom} ({lot.isLive ? 'live' : 'test'})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading && (
          <div className="ml-4 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Chargement...</span>
          </div>
        )}
        {error && (
          <div className="ml-4 text-sm text-red-600">Erreur: {error}</div>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <iframe
          ref={iframeRef}
          src="/lot/index.html"
          className="w-full h-full border-0"
          title="Lots"
        />
      </div>
    </div>
  );
}
