export const minerMk1Recipe = {
    //鉄鉱石検知 -> 鉄鉱石 30w/m 20tick 20fps
    minerIron: {
        inputs: [
            { type: 'blockDetect', id: 'minecraft:iron_ore' }
        ],
        outputs: [
            { type: 'item', id: 'minecraft:iron_ore', amount: 1, slotIndex: 0}
        ],
        powerPerMinute: 30,
        durationTick: 20,
        animationFps: 20
    },
    //石炭鉱石検知 -> 石炭 30w/m 20tick 20fps
    minerCoal: {
        inputs: [
            { type: 'blockDetect', id: 'minecraft:coal_ore' }
        ],
        outputs: [
            { type: 'item', id: 'minecraft:coal_ore', amount: 1, slotIndex: 0}
        ],
        powerPerMinute: 30,
        durationTick: 20,
        animationFps: 20
    }
};