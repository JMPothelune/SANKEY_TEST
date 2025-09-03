# Transformations dynamiques

Les transfos dynamiques sont différentes des transfos 'standard' qui sont enregistrées directement dans processes.js.

Les transfos sont donc enregistrées dans Bubble où elles peuvent être modifiées.

## API

On interroge Bubble par API pour avoir la liste des transfos dynamiques avec GET /transfos
On reçoit un message en retour du type :

```
{
  "Lavage": {
    "bubble_id": "1754410648008x865508029816373200",
    "step": "sorting",
    "version": 7
  },
  "Délissage de produits complexes": {
    "bubble_id": "1756802894015x376315578893467650",
    "step": "de-zipping",
    "version": 15
  }
}
```

On peut aussi interroger l'API pour avoir le détail d'une transfo dynamique avec POST /transfo?id=id
On reçoit un message en retour du type :

````
{
  "title": "Délissage de produits complexes",
  "bubble_id": "1756802894015x376315578893467650",
  "team": "1730809932159x273229509786599420",
  "step": "de-zipping",
  "yield": 60,
  "version": 15,
  "dimensions": {
    "formats": {
      "input": {
        "Vêtements": {
          "bubble_id": "1751468853922x899805336822612000"
        },
        "Linges et rideaux": {
          "bubble_id": "1751469074296x112795809242677250"
        }
      },
      "target": {
        "Morceaux de vêtements": {
          "bubble_id": "1756803454596x394867677485596700"
        }
      },
      "coproduct": {
        "Perturbateurs esthétiques": {
          "bubble_id": "1756803497585x585658092380749800",
          "percent": 30
        },
        "Perturbateurs fonctionnels": {
          "bubble_id": "1756803539320x489844428143329300",
          "percent": 70
        }
      }
    },
    "types": {
      "input": {
        "Vestes, manteaux et costumes": {
          "bubble_id": "1751463269878x483372285977952260"
        },
        "Robes": {
          "bubble_id": "1751463011604x997232187903836200"
        },
        "Autres pantalons, shorts et jupes": {
          "bubble_id": "1751457278848x979760538551320600"
        }
      },
      "target": {},
      "coproduct": {}
    },
    "matieres": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "fibres": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "couleurs": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "perturbateurs": {
      "input": {
        "Multicouche": {
          "bubble_id": "1751446323694x499501351957430300"
        },
        "Monocouche avec perturbateur": {
          "bubble_id": "1751446296709x138343111690813440"
        },
        "Monocouche sans perturbateur": {
          "bubble_id": "1751446312281x382656910563999740"
        }
      },
      "target": {
        "Monocouche sans perturbateur": {
          "bubble_id": "1751446312281x382656910563999740"
        }
      },
      "coproduct": {}
    },
    "proprete": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "qualite": {
      "input": {},
      "target": {},
      "coproduct": {}
    }
  }
}
```

Le "bubble_id" est ce qui est doit être enregistré comme référence.

Une transfo dynamique peut avoir :

- plusieurs clés en input, potentiellement selon plusieurs dimensions
- une clé en target -> la clé que toutes les clés précédentes vont avoir (concaténation)
- plusieurs clés en co-produit (avec une distribution)

## Montrer les transfos

Au moment d'ajouter une transfo dans le Sankey, la popup transfos doit montrer la liste des transfos disponibles. Il faut donc faire un call API à Bubble et les afficher à la suite de celles qui ne sont pas dynamiques. On doit afficher leur nom.

```
// Dans le dropdown des transformations
const transformationTypes = [
  // Transformations statiques existantes
  { type: 'selectByFormat', label: 'Sélection par format' },
  { type: 'selectByType', label: 'Sélection par type' },
  { type: 'selectByMatiere', label: 'Sélection par matière' },
  { type: 'selectByCouleur', label: 'Sélection par couleur' },
  { type: 'selectByQualite', label: 'Sélection par qualité' },
  { type: 'selectByFibre', label: 'Sélection par fibre' },

  // Séparateur
  { type: 'separator', label: '--- Transformations dynamiques ---' },

  // Transformations dynamiques chargées depuis Bubble
  ...dynamicTransfos.map(transfo => ({
    type: 'dynamic_transfo',
    dynamic_transfo_id: transfo.bubble_id,
    label: transfo.title,
    isDynamic: true
  }))
];
```

## Enregistrer les transfos

Quand on sélectionne une transfo dans cette liste, il faut faire un call API avec son ID pour avoir toutes les infos de cette transfo dynamique. Et il faut ensuite l'enregistrer dans le scénario.

```
// Transformation statique (existante)
{
  type: 'selectByFormat',
  keys: ['vêtements'],
  scenario: { /* ... */ }
}

// Transformation dynamique (nouvelle)
{
  type: 'dynamic_transfo',
  dynamic_transfo_id: '1756802894015x376315578893467650', // bubble_id de la transfo
  dynamic_transfo_version: 23,
  scenario: { /* ... */ },
  coproduct_scenario: { /* ... */ }
}
```

## Comportement attendu dans le calcul des lots qui en découlent

Les transfos dynamiques sont des 'translations' des lots selon différentes dimensions.

Les règles sont les suivantes :

- La somme des volumes des lots cible et lots co-produits doit être égale au volume du lot d'entrée (input)
- La transfo n'agit que selon une dimension à la fois
- Le lot cible n'a pas de distribution dans la dimension sélectionnée
- Il faut comparer les bubble_id dans le lot (et pas les clés)
- Le lot co-produit peut avoir une distribution (20% de X, 30% de Y et 50% de Z). Cette distribution donnée en entrée doit être respectée
- Ce qui ne correspond pas à ce qui est demandé en input est passé directement dans le co-produit (ex. une transfo prend 'vêtements' en format d'input. Tout ce qui n'est pas 'vêtements' est passé directement dans le co-produit)
- Une dimension 'vide' en input veut dire qu'on accepte toutes les clés dans cette dimension.
- Ensuite, dans ce qui correspond, le rapport entre ce qui est traité dans le lot cible et traité dans le lot co-produit est défini par le yield (rendement). Mais sur le total final, le rapport peut être différent puisque ce qui ne correspond pas aux données d'input aura été passé directement dans le co-produit. Dans un cas extrême, si rien ne correspond aux données d'input (par exemple : 'vêtements'), le lot target sera vide et le lot co-produit sera égal au lot d'input. Le 'yield' final sera donc de 0% (même si le yield de la transfo était de 75% par exemple).
- Il ne peut y avoir un co-produit défini que dans une seule dimension. C'est dans cette dimension que le yield cible est calculé.
- Quand deux dimensions parentes sont mentionnées, il faut correspondre à chacune des conditions : d'abord les 'vêtements' (par exemple), puis les 'robes' -> tout le reste, qui ne correspond pas, est passé dans le co-produit.
```
Lot d'entrée
├── Formats (1er niveau de filtrage)
│   ├── Vêtements ✅ → Sélectionné
│   ├── Linges et rideaux ✅ → Sélectionné
│   └── Autres formats ❌ → Co-produit
│
├── Types (2ème niveau de filtrage)
│   ├── Dans "Vêtements" :
│   │   ├── Vestes, manteaux ✅ → Sélectionné
│   │   ├── Robes ✅ → Sélectionné
│   │   └── Autres types ❌ → Co-produit
│   └── Dans "Linges et rideaux" :
│       ├── Rideaux et voilages ✅ → Sélectionné
│       └── Autres types ❌ → Co-produit
│
└── Dimensions de base (matières, fibres, couleurs, etc.)
    └── Concaténation des distributions sélectionnées
```
- Il faut traiter les dimensions dans l'ordre, en partant du haut vers la bas.
- Bien sûr, tous les éléments d'une même dimension enfant doivent être concaténés. Par exemple, on mélange des Tshirts et des Pantalons pour en faire des chiquettes. On doit retrouver dans les chiquettes une distribution de matière qui correspond à la convergence des 2 Tshirts et Pantalons.
- Il faut identifier la dimension 'primaire' -> celle à laquelle va s'appliquer le yield. On la trouve avec :
-- La dimension dans laquelle le co-produit est défini
-- Si pas de co-produit défini, on suit l'ordre de traitement (cf. config/dimensions.js) et on prend la première qui a un target défini.

Il faut donc parser le lot d'input pour le transformer.
Identifier la dimension 'primaire'.

### Exemple facile : lavage
```
{
  "title": "Lavage",
  "bubble_id": "1754410648008x865508029816373200",
  "team": "1730809932159x273229509786599420",
  "step": "sorting",
  "yield": 100,
  "version": 9,
  "dimensions": {
    "formats": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "types": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "matieres": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "fibres": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "couleurs": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "perturbateurs": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "proprete": {
      "input": {},
      "target": {
        "Propre": {
          "bubble_id": "1751363332290x936743758301757400"
        }
      },
      "coproduct": {}
    },
    "qualite": {
      "input": {},
      "target": {},
      "coproduct": {}
    }
  }
}
```
Lavage est une des transfos dynamiques. Assez simplement, elle agit selon la dimension 'propreté' (puisque toutes les autres sont vides). Son yield est de 100% (elle ne crée pas de co-produit). Donc le volume du lot cible est le même que celui du lot d'entrée. Ensuite, la transfo prend en entrée toutes les clés 'propreté' et les 'écrase' (concaténe) en une seule clé : propre.

### Exemple intermédiaire : Effilochage
```
{
  "title": "Effilochage fin",
  "bubble_id": "1756818350195x963851048233205800",
  "team": "1730809932159x273229509786599420",
  "step": "cutting",
  "yield": 85,
  "version": 7,
  "dimensions": {
    "formats": {
      "input": {
        "Chiquettes": {
          "bubble_id": "1756818412593x629569448461467600"
        }
      },
      "target": {
        "Fibre et bourre": {
          "bubble_id": "1756818470001x850405871651389400"
        }
      },
      "coproduct": {
        "Résidu": {
          "bubble_id": "1756818495747x785209800865087500",
          "percent": 100
        }
      }
    },
    "types": {
      "input": {},
      "target": {
        "Bourre fibre <2cm": {
          "bubble_id": "1756818534495x159085711275065340"
        }
      },
      "coproduct": {}
    },
    "matieres": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "fibres": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "couleurs": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "perturbateurs": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "proprete": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "qualite": {
      "input": {},
      "target": {},
      "coproduct": {}
    }
  }
}
```
Celui-ci est un peu plus complexe puisqu'il y a un co-produit et un yield. Il faut donc cherche dans le lot uniquement les formats 'chiquettes' (par bubble_id). Tout le reste passe directement dans le co-produit. Pour ce qui correspond à 'chiquettes', le volume va être divisé en 2 en fonction du yield. Les formats 'chiquettes' sont convertis en 'Fibre et bourre'. Et les formats du co-produit sont passés en 'Résidu'. Mais il y a aussi un type indiqué -> tous les éléments du lot cible doivent donc aussi avoir le type indiqué ('Bourre fibre <2cm') à 100%. La distribution d'en dessous (matière, fibre, etc.) doit être concaténée et respecter la somme des distributions originales.

### Exemple complexe : découpe en chiquettes
```
{
  "title": "Délissage de produits complexes",
  "bubble_id": "1756802894015x376315578893467650",
  "team": "1730809932159x273229509786599420",
  "step": "de-zipping",
  "yield": 60,
  "version": 23,
  "dimensions": {
    "formats": {
      "input": {
        "Vêtements": {
          "bubble_id": "1751468853922x899805336822612000"
        },
        "Linges et rideaux": {
          "bubble_id": "1751469074296x112795809242677250"
        }
      },
      "target": {
        "Morceaux de vêtements et d'étoffe": {
          "bubble_id": "1756803454596x394867677485596700"
        }
      },
      "coproduct": {
        "Perturbateurs esthétiques": {
          "bubble_id": "1756803497585x585658092380749800",
          "percent": 30
        },
        "Perturbateurs fonctionnels": {
          "bubble_id": "1756803539320x489844428143329300",
          "percent": 70
        }
      }
    },
    "types": {
      "input": {
        "Vestes, manteaux et costumes": {
          "bubble_id": "1751463269878x483372285977952260"
        },
        "Robes": {
          "bubble_id": "1751463011604x997232187903836200"
        },
        "Autres pantalons, shorts et jupes": {
          "bubble_id": "1751457278848x979760538551320600"
        },
        "Rideaux et voilages": {
          "bubble_id": "1751468199432x997849931820564500"
        },
        "Autre linge de maison": {
          "bubble_id": "1751468454289x241243914173939700"
        },
        "Linge de lit": {
          "bubble_id": "1751468171483x644803342235598800"
        }
      },
      "target": {
        "Morceaux": {
          "bubble_id": "1756825856501x400683770434551800"
        }
      },
      "coproduct": {}
    },
    "matieres": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "fibres": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "couleurs": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "perturbateurs": {
      "input": {},
      "target": {
        "Monocouche sans perturbateur": {
          "bubble_id": "1751446312281x382656910563999740"
        }
      },
      "coproduct": {}
    },
    "proprete": {
      "input": {},
      "target": {},
      "coproduct": {}
    },
    "qualite": {
      "input": {},
      "target": {},
      "coproduct": {}
    }
  }
}
```
La dimension primaire de transformation est 'formats'.
On doit sélectionner uniquement les 'vêtements' et les 'linges et rideaux' d'un point de vue formats. Ces 2 formats sont concaténés en un seul 'morceaux...' et un co-produit est constitué en fonction du yield donné (et de tout ce qui ne correspondait pas).
Par contre, il y a un 2ème niveau de sélection : les types. Donc dans chaque format qui a été sélectionné précédemment, il faut choisir les types donnés. Puis les concaténer dans 'morceaux', en respectant la somme des sous-distributions (matière, etc.).
Au passage, tous les éléments sélectionnés pour être dans le 'target' doivent maintenant être passés en 'monocouche'.

---

Encore une fois, dans les exemples, on parle de chercher 'vêtements', mais c'est bien par le bubble_id qu'il faut faire cette recherche.

## Les techs

On peut ensuite leur ajouter un outil (une tech), comme pour les transfos hardcodées. Si la tech a un yield, il écrase celui donné par la tech.

## Mise à jour

Lorsque la version de la transfo sur Bubble est plus récente que celle enregistrée, il faut mettre à jour les infos pour pour que les calculs se mettent à jour.
````
