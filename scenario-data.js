// Définition du scénario principal (modifiez ici pour changer le scénario)
const scenario2 = {
    transformations: [
      {
        title: 'Séparation des contaminants',
        type: ['selectByProprete'],
        keys: [['contaminé']],
        scenario: {
          target: 'Enfouissement'
        }
      },
      {
        title: 'Séparation des chaussures',
        type: ['selectByFormat'],
        keys: [['non TLC', 'linges et rideaux']],
        scenario: {
            target: 'Enfouissement'
          }
      },
      {
        title: 'Crème',
        type: ['selectByQualite'],
        keys: [['neuf étiqueté', 'parfait état', 'bon état']],
        scenario: {
          target: 'Réemploi'
        }
    },
    ],
    coproduct_scenario: {
      title: 'Export',
      target: 'Export'
    }
}; 
  

// Définition du scénario principal (modifiez ici pour changer le scénario)
const scenario = {
  transformations: [
    {
      title: 'Séparation des contaminants',
      type: ['selectByProprete'],
      keys: [['contaminé']],
      scenario: {
        target: 'CSR'
      }
    },
    {
      title: 'Séparation des chaussures',
      type: ['selectByFormat'],
      keys: [['chaussures et bottes']],
      scenario: {
            transformations: [
                {
                title: 'Sélection des chaussures pour réemploi',
                type: ['selectByQualite'],
                keys: [['neuf étiqueté', 'parfait état', 'bon état']],
                scenario: {
                  target: 'CT2'
                }
                }
            ],
            coproduct_scenario: {
              title: 'Chaussures pour recyclage',
              target: 'The 8 impact'
            }
        }
    },
    {
      title: 'linges et rideaux',
      type: ['selectByFormat'],
      keys: [['linges et rideaux']],
        scenario: {
          transformations: [
            {
              title: 'Draps coton pour Buitex',
              type: ['selectByMatiere'],
              keys: [['100% coton']],
              scenario: {
                target: 'Buitex'
              }
            }
          ],
          coproduct_scenario: {
            title: 'Reste des draps pour CSR',
            target: 'CSR'
          }
        }
    },
    {
      title: 'BRIC',
      type: ['selectByFormat'],
      keys: [['non TLC']],
      scenario: {
        transformations: [
          {
            title: 'BRIC pour réemploi',
            type: ['selectByQualite'],
            keys: [['neuf étiqueté', 'parfait état', 'bon état']],
            scenario: {
              target: 'CT2'
            }
          }
        ],
        coproduct_scenario: {
          title: 'BRIC pour CSR',
          target: 'CSR'
        }
      }
    },
    {
      title: 'Vêtements',
      type: ['selectByFormat'],
      keys: [['vêtements']],
      scenario: {
        transformations: [
            {
                title: 'Vêtements pour réemploi',
                type: ['selectByQualite'],
                keys: [['neuf étiqueté', 'parfait état', 'bon état']],
                scenario: {
                  target: 'CT2'
                }
            }
        ],
        coproduct_scenario: {
            title: 'Vêtements hors réemploi',
            transformations: [
                {
                    title: 'Pantalons en jean',
                    type: ['selectByType'],
                    keys: [['pantalons en jean']],
                    scenario: {
                      target: 'Buitex'
                    }
                  },
                  {
                    title: 'Reste des vêtements coton',
                    type: ['selectByFibre'],
                    keys: [['coton']],
                    threshold: 100,
                    condition: 'over',
                    scenario: {
                      target: 'Buitex'
                    }
                  },
                  {
                    title: 'Reste des vêtements polyester',
                    type: ['selectByMatiere'],
                    keys: [['100% polyester', 'coton/polyester', 'polyester/élasthanne', 'polyester/polyamide']],
                    scenario: {
                      target: 'RecycElit'
                    }
                  },
                  {
                    title: 'Pulls',
                    type: ['selectByType'],
                    keys: [['hauts type pull']],
                    scenario: {
                      transformations: [
                        {
                            title: 'Pulls couleur pour recyclage',
                            type: ['selectByCouleur'],
                            keys: [['rouge', 'vert']],
                            scenario: {}
                        }
                      ],
                      coproduct_scenario: {}
                    }
                  }
            ],
            coproduct_scenario: {
              target: 'CSR'
            }
          }
      }
    }
  ],
  coproduct_scenario: {}
}; 

// Définition du scénario principal (modifiez ici pour changer le scénario)
const scenario3 = {
  transformations: [
    {
      title: 'Vêtements',
      type: ['selectByFormat'],
      keys: [['vêtements']],
      scenario: {
        transformations: [
          {
            title: 'Nettoyage',
            type: ['lavage'],
            keys: [[]],
            yield: 1,
            scenario: {
              transformations: [
                {
                  title: 'Délissage',
                  type: ['delissage'],
                  yield: 0.8,
                  keys: [[]],
                }
              ],
              coproduct_scenario: {
                title: 'Points durs',
                target: 'CSR'
              }
            }
          }
        ]
      }
    }
  ],
  coproduct_scenario: {
    title: 'Reste',
  }
};


// Puis l'array des scénarios, sur window pour accessibilité globale
window.scenarios = [
  {
    title: 'Avant',
    scenario: scenario2
  },
  {
    title: 'Après',
    scenario: scenario
  },
  {
    title: 'Test processes',
    scenario: scenario3
  }
];