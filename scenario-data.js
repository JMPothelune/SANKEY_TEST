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
        type: 'selectByFormat',
        keys: ['non TLC', 'linges et rideaux'],
        scenario: {}
    },
    {
      type: 'selectByFormat',
      keys: ['vêtements'],
      scenario: {
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
            type: 'selectByCouleur',
            keys: ['blanc', 'noir'],
            scenario: {}
          }
        ],
        coproduct_transformations: {}
      }
    }
  ],
  coproduct_transformations: {}
}; 