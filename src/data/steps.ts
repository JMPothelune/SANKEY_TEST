// Normalement, on peut effacer ce fichier, on a intégré les steps dans le fichier steps.json

export interface Step {
  nom: string;
  icon: string;
}

export const steps: Step[] = [
  // Liste de steps (copy from Bubble)
  {
    nom: 'collecting',
    icon: 't-shirt',
  },
  {
    nom: 'sorting',
    icon: 'arrows-split',
  },
  {
    nom: 'de-zipping',
    icon: 'corners-in',
  },
  {
    nom: 'cutting',
    icon: 'scissors',
  },
  {
    nom: 'depolymerization',
    icon: 'atom',
  },
  {
    nom: 'polymerization',
    icon: 'flask',
  },
  {
    nom: 'spinning',
    icon: 'gradient',
  },
];
