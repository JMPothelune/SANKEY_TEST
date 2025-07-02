export const bubbleApiCalls = [
  {
    name: 'Get Liste Propreté',
    endpoint: 'propretes',
    method: 'GET',
    params: [
      {
        name: 'isLive',
        label: "Utiliser l'API Live ?",
        type: 'boolean',
        required: true,
      },
    ],
  },
  {
    name: 'Get Liste Qualité',
    endpoint: 'qualites',
    method: 'GET',
    params: [
      {
        name: 'isLive',
        label: "Utiliser l'API Live ?",
        type: 'boolean',
        required: true,
      },
    ],
  },
  {
    name: 'Get Liste Perturbateurs',
    endpoint: 'perturbateurs',
    method: 'GET',
    params: [
      {
        name: 'isLive',
        label: "Utiliser l'API Live ?",
        type: 'boolean',
        required: true,
      },
    ],
  },
  {
    name: 'Get Liste Couleurs',
    endpoint: 'couleurs',
    method: 'GET',
    params: [
      {
        name: 'isLive',
        label: "Utiliser l'API Live ?",
        type: 'boolean',
        required: true,
      },
    ],
  },
  {
    name: 'Get Liste Fibres',
    endpoint: 'fibres',
    method: 'GET',
    params: [
      {
        name: 'isLive',
        label: "Utiliser l'API Live ?",
        type: 'boolean',
        required: true,
      },
    ],
  },
  {
    name: 'Get Liste Matières',
    endpoint: 'matieres',
    method: 'GET',
    params: [
      {
        name: 'isLive',
        label: "Utiliser l'API Live ?",
        type: 'boolean',
        required: true,
      },
    ],
  },
  {
    name: 'Get Liste Types',
    endpoint: 'types',
    method: 'GET',
    params: [
      {
        name: 'isLive',
        label: "Utiliser l'API Live ?",
        type: 'boolean',
        required: true,
      },
    ],
  },
  {
    name: 'Get Liste Formats',
    endpoint: 'formats',
    method: 'GET',
    params: [
      {
        name: 'isLive',
        label: "Utiliser l'API Live ?",
        type: 'boolean',
        required: true,
      },
    ],
  },
  {
    name: 'Get 1 Lib item',
    endpoint: 'item?id={id}',
    method: 'GET',
    params: [
      {
        name: 'isLive',
        label: "Utiliser l'API Live ?",
        type: 'boolean',
        required: true,
      },
      { name: 'id', label: 'Unique Bubble ID', type: 'string', required: true },
    ],
  },
  {
    name: 'Get 1 Lot',
    endpoint: 'lot?id={id}',
    method: 'POST',
    params: [
      {
        name: 'isLive',
        label: "Utiliser l'API Live ?",
        type: 'boolean',
        required: true,
      },
      { name: 'id', label: 'Unique Bubble ID', type: 'string', required: true },
    ],
  },
];
