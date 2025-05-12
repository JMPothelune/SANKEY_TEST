// Définition du scénario principal (modifiez ici pour changer le scénario)
const scenario = {
  transformations: [
    {
        type: 'selectByFormat',
        keys: ['Chaussures et bottes'],
        scenario: {}
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
                  type: 'selectByMatiere',
                  keys: ['100% coton'],
                  scenario: {}
                }
              ],
              coproduct_transformations: {}
            }
          }
        ],
        coproduct_transformations: {}
      }
    }
  ],
  coproduct_transformations: {}
}; 