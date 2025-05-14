// Définition du scénario principal (modifiez ici pour changer le scénario)
const scenario = {
  transformations: [
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
        type: 'selectByQualite',
        keys: ['inutilisable'],
        scenario: {}
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
                            scenario: {}
                        }
                      ],
                      coproduct_transformations: {}
                    }
                  },
                  {
                    type: 'selectByMatiere',
                    keys: ['100% coton'],
                    scenario: {}
                  },
                  {
                    type: 'selectByMatiere',
                    keys: ['100% polyester'],
                    scenario: {}
                  }
            ]
        }
      }
    }
  ],
  coproduct_transformations: {}
}; 

