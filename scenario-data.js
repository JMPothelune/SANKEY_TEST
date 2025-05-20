// Définition du scénario principal (modifiez ici pour changer le scénario)
const scenario2 = {
    transformations: [
      {
          type: 'selectByFormat',
          keys: ['non TLC'],
          scenario: {
          }
      },
      {
        type: 'selectByQualite',
        keys: ['neuf étiqueté', 'parfait état', 'bon état'],
        scenario: {
        }
    },
    ],
    coproduct_scenario: {}
  }; 
  
  

// Définition du scénario principal (modifiez ici pour changer le scénario)
const scenario = {
  transformations: [
    {
      type: 'selectByProprete',
      keys: ['contaminé'],
      scenario: {
        target: 'CSR'
      }
    },
    {
        type: 'selectByFormat',
        keys: ['chaussures et bottes'],
        scenario: {
            transformations: [
                {
                type: 'selectByQualite',
                keys: ['neuf étiqueté', 'parfait état', 'bon état'],
                scenario: {
                  target: 'CT2'
                }
                }
            ],
            coproduct_scenario: {
              target: 'CSR'
            }
        }
    },
    {
        type: 'selectByFormat',
        keys: ['linges et rideaux'],
        scenario: {}
    },
    {
        type: 'selectByFormat',
        keys: ['non TLC'],
        scenario: {
          target: 'CT2'
        }
    },
    {
      type: 'selectByFormat',
      keys: ['vêtements'],
      scenario: {
        transformations: [
            {
                type: 'selectByQualite',
                keys: ['neuf étiqueté', 'parfait état', 'bon état'],
                scenario: {
                  target: 'CT2'
                }
            }
        ],
        coproduct_scenario: {
            transformations: [
                {
                    type: 'selectByType',
                    keys: ['pantalons en jean'],
                    scenario: {
                      transformations: [
                        {
                            type: 'selectByFibre',
                            keys: ['coton'],
                            threshold: 60,
                            condition: 'over',
                            scenario: {
                              target: 'Buitex'
                            }
                        }
                      ],
                      coproduct_scenario: {}
                    }
                  },
                  {
                    type: 'selectByFibre',
                    keys: ['coton'],
                    threshold: 100,
                    condition: 'over',
                    scenario: {
                      target: 'Buitex'
                    }
                  },
                  {
                    type: 'selectByMatiere',
                    keys: ['100% polyester', 'coton/polyester', 'polyester/élasthanne', 'polyester/polyamide'],
                    scenario: {
                      target: 'RecycElit'
                    }
                  },
                  {
                    type: 'selectByType',
                    keys: ['hauts type pull'],
                    scenario: {
                      transformations: [
                        {
                            type: 'selectByCouleur',
                            keys: ['rouge', 'vert'],
                            scenario: {}
                        }
                      ],
                      coproduct_scenario: {}
                    }
                  }
            ]
        }
      }
    }
  ],
  coproduct_scenario: {}
}; 

