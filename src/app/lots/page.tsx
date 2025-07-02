'use client';
import { AppNavbar } from '@/components/ui/AppNavbar';
import { lots } from '@/data/lots';
import { useState } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export default function LotsPage() {
  const [selectedLotIdx, setSelectedLotIdx] = useState(0);
  return (
    <div className="h-screen flex flex-col">
      <AppNavbar />
      <div className="p-4 border-b">
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
      <div className="flex-1 min-h-0">
        <iframe
          src="/lot/index.html"
          className="w-full h-full border-0"
          title="Lots"
        />
      </div>
    </div>
  );
}
