// Définition du scénario principal (modifiez ici pour changer le scénario)
const scenario = {
  transformations: [
    {
        type: 'selectByFormat',
        keys: ['Chaussures et bottes'],
        scenario: {
            transformations: [
                {
                type: 'selectByQualite',
                keys: ['Neuf étiqueté', 'Parfait état', 'Bon état'],
                scenario: {}
                }
            ],
            coproduct_transformations: {}
        }
    },
    {
        type: 'selectByFormat',
        keys: ['non TLC', 'Linges et rideaux'],
        scenario: {}
    },
    {
      type: 'selectByFormat',
      keys: ['Vêtements'],
      scenario: {
        transformations: [
          {
            type: 'selectByType',
            keys: ['Pantalons en jean'],
            scenario: {
              transformations: [
                {
                  type: 'selectByFibre',
                  keys: ['Coton'],
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