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
    coproduct_transformations: {}
  }; 
  
  

// Définition du scénario principal (modifiez ici pour changer le scénario)
const scenario = {
  transformations: [
    {
      type: 'selectByProprete',
      keys: ['contaminé'],
      scenario: {}
    },
    {
        type: 'selectByFormat',
        keys: ['chaussures et bottes'],
        scenario: {
            transformations: [
                {
                type: 'selectByQualite',
                keys: ['neuf étiqueté', 'parfait état', 'bon état'],
                scenario: {}
                }
            ],
            coproduct_transformations: {}
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
        scenario: {}
    },
    {
      type: 'selectByFormat',
      keys: ['vêtements'],
      scenario: {
        transformations: [
            {
                type: 'selectByQualite',
                keys: ['neuf étiqueté', 'parfait état', 'bon état'],
                scenario: {}
            }
        ],
        coproduct_transformations: {
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
                            scenario: {}
                        }
                      ],
                      coproduct_transformations: {}
                    }
                  },
                  {
                    type: 'selectByFibre',
                    keys: ['coton'],
                    threshold: 100,
                    condition: 'over',
                    scenario: {}
                  },
                  {
                    type: 'selectByMatiere',
                    keys: ['100% polyester', 'coton/polyester', 'polyester/élasthanne', 'polyester/polyamide'],
                    scenario: {}
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
                      coproduct_transformations: {}
                    }
                  }
            ]
        }
      }
    }
  ],
  coproduct_transformations: {}
}; 

