const machineLayouts = {
    minerLayout: {
        origin: [0, 0, 0],
        blocks: [
          {
            localPos: [0, 0, 0],
            blockId: 'uvi:mining_machine_0_0_0',
            roles: {
              north: { type: 'electrode' },
              south: { type: 'itemOutput' },
              up:    { type: 'none' },
              down:  { type: 'blockSensor' }
            },
            animation: {
              enabled: true,
              frame_count: 4,
              frame_cubes: ['cube_frame0','cube_frame1','cube_frame2','cube_frame3']
            }
          },
          {
            local_pos: [0, 0, 0],
            block_id: 'uvi:mining_machine_0_0_0',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [1, 0, 0],
            block_id: 'uvi:mining_machine_1_0_0',
            roles: {
                north: { type: 'itemOutput', slotIndex: 0 }
            },
            animation: { enabled: false }
          },
          {
            local_pos: [2, 0, 0],
            block_id: 'uvi:mining_machine_2_0_0',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [0, 0, 1],
            block_id: 'uvi:mining_machine_0_0_1',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [1, 0, 1],
            block_id: 'none',
            roles: {
                
            },
            animation: { enabled: false }
          },
          {
            local_pos: [2, 0, 1],
            block_id: 'uvi:mining_machine_2_0_1',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [0, 0, 2],
            block_id: 'uvi:mining_machine_0_0_2',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [1, 0, 2],
            block_id: 'uvi:mining_machine_1_0_2',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [2, 0, 2],
            block_id: 'uvi:mining_machine_2_0_2',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [0, 1, 0],
            block_id: 'uvi:mining_machine_0_1_0',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [1, 1, 0],
            block_id: 'uvi:mining_machine_1_1_0',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [2, 1, 0],
            block_id: 'uvi:mining_machine_2_1_0',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [0, 1, 1],
            block_id: 'uvi:mining_machine_0_1_1',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [2, 1, 1],
            block_id: 'uvi:mining_machine_2_1_1',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [0, 1, 2],
            block_id: 'uvi:mining_machine_0_1_2',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [1, 1, 2],
            block_id: 'uvi:mining_machine_1_1_2',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [2, 1, 2],
            block_id: 'uvi:mining_machine_2_1_2',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [0, 2, 0],
            block_id: 'uvi:mining_machine_0_2_0',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [1, 2, 0],
            block_id: 'uvi:mining_machine_1_2_0',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [2, 2, 0],
            block_id: 'uvi:mining_machine_2_2_0',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [0, 2, 1],
            block_id: 'uvi:mining_machine_0_2_1',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [2, 2, 1],
            block_id: 'uvi:mining_machine_2_2_1',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [0, 2, 2],
            block_id: 'uvi:mining_machine_0_2_2',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [1, 2, 2],
            block_id: 'uvi:mining_machine_1_2_2',
            roles: {},
            animation: { enabled: false }
          },
          {
            local_pos: [2, 2, 2],
            block_id: 'uvi:mining_machine_2_2_2',
            roles: {},
            animation: { enabled: false }
          }
        ]
    }
};