export interface Lot {
  nom: string;
  bubbleId: string;
  isLive: boolean;
}

export const lots: Lot[] = [
  // Exemple de lots, à compléter
  {
    nom: 'Brut de collecte',
    bubbleId: '1752646696978x547596530614272000',
    isLive: false,
  },
  {
    nom: 'Un lot avec des ID',
    bubbleId: '1751975189188x893746317083279400',
    isLive: false,
  },
  {
    nom: 'Brut Live',
    bubbleId: '1752657140914x969406016835551200',
    isLive: true,
  },
];
