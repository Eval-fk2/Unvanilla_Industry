const recipeData = {
    minerIron: {
      machineType: 'PROCESSOR',
      inputs: [
        { type: 'blockDetect', blockId: 'minecraft:iron_ore' }
      ],
      outputs: [
        { type: 'item', itemId: 'minecraft:iron_ore', count: 1, slotIndex: 0 }
      ],
      powerPerMinute: 30,
      durationTicks: 20,
      animationFps: 2
    },

    smelt_iron: {
      machineType: 'PROCESSOR',
      inputs: [
        { type: 'item', itemId: 'minecraft:iron_ore', count: 1 }
      ],
      outputs: [
        { type: 'item', itemId: 'minecraft:iron_ingot', count: 1, slotIndex: 0 }
      ],
      powerPerMinute: 30,
      durationTicks: 20,
      animationFps: 2
    },

    genCoal: {
      machineType: 'GENERATOR',
      inputs: [
        { type: 'item', itemId: 'minecraft:coal', count: 1 }
      ],
      outputs: [],
      generationPerMinute: 300,
      durationTicks: 20,
      animationFps: 2
    }
};