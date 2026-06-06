import * as Slot from './slotClass';


export function genUuid() {};
/**
 * レシピ内容をUI上で表示するためのテキストを生成する
 */
export function makeRecipeText(recipeList, recipeId) {
    const recipe = recipeList[recipeId];
    const inputsText  = recipe.inputs.map(s  => `${s.type} ${s.id} ${s.amount}`).join('\n');
    const outputsText = recipe.outputs.map(s => `${s.type} ${s.id} ${s.amount}`).join('\n');
    return `${recipeId}\n\n${inputsText}\n\n->\n\n${outputsText}\n\n${recipe.powerPerMinute}w/m ${recipe.durationTick}Tick`;
};

/**
 * faceをdirectionに応じて回転させる
 */
export function rotateFace(face, direction) {
    const faceOrder       = ['north', 'east', 'south', 'west'];
    const directionOffset = { north: 0, east: 1, south: 2, west: 3 };
    const idx = faceOrder.indexOf(face);
    if (idx === -1) return face;
    return faceOrder[(idx + directionOffset[direction]) % 4];
};

/**
 * faceの反対方向を返す
 */
export function oppositeFace(face) {
    return { north: 'south', south: 'north', east: 'west', west: 'east' }[face];
};

/**
 * localPosをcenterOffset基準で回転させてワールド座標を返す
 */
export function rotatePos(localPos, centerOffset, originPos, direction) {
    const cx = localPos.x - centerOffset.x;
    const cy = localPos.y - centerOffset.y;
    const cz = localPos.z - centerOffset.z;

    let rx, rz;
    switch (direction) {
        case 'north': rx =  cx; rz =  cz; break;
        case 'east':  rx =  cz; rz = -cx; break;
        case 'south': rx = -cx; rz = -cz; break;
        case 'west':  rx = -cz; rz =  cx; break;
    };

    return { x: originPos.x + rx, y: originPos.y + cy, z: originPos.z + rz };
};

/**
 * posを文字列キー化する
 */
export function posKey(pos) {
    return `${pos.x},${pos.y},${pos.z}`;
};

/**
 * unitのdataからスロットを初期化してslotMapに登録する
 */
export function initSlots(unit, slotType) {
    const slots = [];
    for (const {slotIndex, slotData} of unit.unitData[slotType].entries()) {
        let slot;
        if (slotType === 'inputSlot') slot = new Slot.InputSlot(unit, slotIndex);
        else if (slotType === 'outputSlot') slot = new Slot.OutputSlot(unit, slotIndex);
        else if (slotType === 'electrodeSlot') slot = new Slot.ElectrodeSlot(unit, slotIndex);
        slots.push(slot);
    };
    return slots;
};
