'use client';
import { AppNavbar } from '@/components/ui/AppNavbar';
import { lots } from '@/data/lots';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export default function LotsPage() {
  const [selectedLotIdx, setSelectedLotIdx] = useState(0);
  const [iframeHeight, setIframeHeight] = useState<number>(400);
  const lot = lots[selectedLotIdx];
  const iframeSrc = `/lot/index.html?id=${encodeURIComponent(lot.bubbleId)}&isLive=${lot.isLive}`;

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

  return (
    <div className="h-screen flex flex-col">
      <AppNavbar />
      <div className="px-6 py-4 border-b flex items-center">
        <label className="font-semibold mr-2">Choisir un lot :</label>
        <Select
          value={selectedLotIdx.toString()}
          onValueChange={v => setSelectedLotIdx(Number(v))}
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
      </div>
      <div className="flex-1 min-h-0 p-6 bg-gray-50">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border">
          <iframe
            src={iframeSrc}
            className="w-full h-full border-0 rounded-lg"
            style={{ minHeight: 400, height: iframeHeight }}
            title="Lots"
          />
        </div>
      </div>
    </div>
  );
}
