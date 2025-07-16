export interface Scenario {
  nom: string;
  bubbleId: string;
  isLive: boolean;
}

export const scenarios: Scenario[] = [
  // Exemple de scenarios, à compléter
  {
    nom: 'Empty',
    bubbleId: '1752565103191x919028191983493100',
    isLive: false,
  },
  {
    nom: 'Legacy',
    bubbleId: '1752564737384x601182683666114400',
    isLive: false,
  },
  {
    nom: 'Target',
    bubbleId: '1752564923160x133963234616413900',
    isLive: false,
  },
  {
    nom: 'Test processes',
    bubbleId: '1752565035081x996348588023394400',
    isLive: false,
  },
  {
    nom: 'Vide Live',
    bubbleId: '1752657446787x193212466860654600',
    isLive: true,
  },
];
