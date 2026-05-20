const machineData = {
    miner: {
        type: 'PROCESSOR',
        displayName: '採鉱機',
        compatibleRecipes: ['minerIron', 'minerCoal'],
        layoutId: 'minerLayout'
    },

    smelter: {
        type: 'PROCESSOR',
        display_name: '溶鉱機',
        compatible_recipes: ['smelt_iron', 'smelt_coal'],
        layout: {
            origin: [0, 0, 0],
            blocks: [
                {
                    local_pos: [0, 0, 0],
                    block_id: 'smelter_core',
                    roles: {
                        north: { type: 'item_input',  slot_index: 0 },
                        south: { type: 'item_output', slot_index: 0 },
                        west:  { type: 'electrode' }
                    },
                    animation: {
                        enabled: true,
                        frame_count: 8,
                        frame_cubes: ['cube_f0','cube_f1','cube_f2','cube_f3',
                                        'cube_f4','cube_f5','cube_f6','cube_f7']
                    }
                }
            ]
        }
    },

    generator: {
      type: 'GENERATOR',
      display_name: '発電機',
      compatible_recipes: ['gen_coal'],
      layout: {
        origin: [0, 0, 0],
        blocks: [
          {
            local_pos: [0, 0, 0],
            block_id: 'generator_core',
            roles: {
              north: { type: 'item_input', slot_index: 0 },
              west:  { type: 'electrode' }
            },
            animation: {
              enabled: true,
              frame_count: 4,
              frame_cubes: ['cube_f0','cube_f1','cube_f2','cube_f3']
            }
          }
        ]
      }
    }
};