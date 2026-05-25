const recipeData = {
    mineIron: {
    	inputs: [
    	  	{ type: 'blockDetect', blockId: 'minecraft:iron_ore' }
    	],
    	outputs: [
    	  	{ type: 'item', itemId: 'minecraft:iron_ore', count: 1, slotIndex: 0 }
    	],
    	powerPerMinute: 30,
    	durationTicks: 20,
    	animationFps: 20
    },

    mineCoal: {
      	inputs: [
      	  	{ type: 'blockDetect', blockId: 'minecraft:iron_ore' }
      	],
      	outputs: [
      	  	{ type: 'item', itemId: 'minecraft:iron_ore', count: 1, slotIndex: 0 }
      	],
      	powerPerMinute: 30,
      	durationTicks: 20,
      	animationFps: 20
    },

    smeltIron: {
      inputs: [
        { type: 'item', itemId: 'minecraft:iron_ore', count: 1 }
      ],
      outputs: [
        { type: 'item', itemId: 'minecraft:iron_ingot', count: 1, slotIndex: 0 }
      ],
      powerPerMinute: 30,
      durationTicks: 20,
      animationFps: 20
    },

    genCoal: {
      inputs: [
        { type: 'item', itemId: 'minecraft:coal', count: 1 }
      ],
      outputs: [],
      generationPerMinute: 300,
      durationTicks: 20,
      animationFps: 20
    }
};