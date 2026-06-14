export const conveyorMk1Recipe = {
    //入力アイテム -> 出力アイテム 0w/m 20tick 20fps
    conveyor60: {
        id:           'conveyor60',
        inputs:       [{ type: 'item', id: 'inputItem', amount: 1}],
        outputs:      [{ type: 'item', id: 'outputItem', amount: 1, portIndex: 0}],
        consumePower: 0,
        durationTick: 20,
        animationFps: 20
    }
};