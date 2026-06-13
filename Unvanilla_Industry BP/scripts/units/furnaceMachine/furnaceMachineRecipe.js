export const furnaceMachineRecipe = {
    //鉄鉱石 -> 鉄インゴット 30w/m 20tick 20fps
    furnaceMachineIron: {
        id: 'furnaceMachineIron',
        inputs: [
            { type: 'item', id: 'minecraft:iron_ore', amount: 1 }
        ],
        outputs: [
            { type: 'item', id: 'minecraft:iron_ingot', amount: 1, portIndex: 0}
        ],
        powerPerMinute: 30,
        durationTick: 20,
        animationFps: 20
    }
};