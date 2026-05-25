export const furnaceRecipe = {
    //鉄鉱石 -> 鉄インゴット 30w/m 20tick 20fps
    semltIron: {
        inputs: [
            { type: 'item', id: 'minecraft:iron_ore', count: 1}
        ],
        outputs: [
            { type: 'item', id: 'minecraft:iron_ingot', count: 1}
        ],
        powerPerMinute: 30,
        durationTick: 20,
        animationFps: 20
    },
    //石炭鉱石 -> 石炭 30w/m 20tick 20fps
    smeltCoal: {
        inputs: [
            { type: 'item', id: 'minecraft:coal_ore', count: 1}
        ],
        outputs: [
            { type: 'item', id: 'minecraft:coal', count: 1}
        ],
        powerPerMinute: 30,
        durationTick: 20,
        animationFps: 20
    }
};