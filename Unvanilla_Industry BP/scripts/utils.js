import {world} from '@minecraft/server';

import * as Slot from './slot';

/** 
 * レシピ内容をUI上で表示するためのテキストを生成する
*/
export function makeRecipeText(recipeList, recipeId) {
    const recipeData = recipeList[recipeId];
    let inputsText = '';
    let outputsText = '';
    for (const slot of recipeData.inputs) inputsText += `${slot.type} ${slot.id} ${slot.count}\n`;
    for (const slot of recipeData.outputs) outputsText += `${slot.type} ${slot.id} ${slot.count}\n`;
    return `${recipeId}\n\n${inputsText}\n\n->\n\n${outputsText}\n\n${recipeData.powerPerMinutes}w/m ${recipeData.durationTick}Tick`;
};

/**
 * faceをdirectionに応じて回転させる
 * 基準(north)から時計回りに回転
 */
export function rotateFace(face, direction) {
    const faceOrder = ['north', 'east', 'south', 'west'];
    const directionOffset = { north: 0, east: 1, south: 2, west: 3 };
    const idx = faceOrder.indexOf(face);
    if (idx === -1) return face; // up/downはそのまま
    return faceOrder[(idx + directionOffset[direction]) % 4];
};

/**
 * faceの反対方向を返す
 */
export function oppositeFace(face) {
    const opposite = { north: 'south', south: 'north', east: 'west', west: 'east' };
    return opposite[face];
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

    return {
        x: originPos.x + rx,
        y: originPos.y + cy,
        z: originPos.z + rz
    };
};

/**
 * posを文字列キー化する（オブジェクト比較用）
 */
export function posKey(pos) {
    return `${pos.x},${pos.y},${pos.z}`;
};

/**
 * unitから初期入出力スロットを生成する
 */
export function initIOSlots(unit) {
    const slots = [];
    for (const slot of unit.slots) {
        const worldPos = rotatePos(slot.localPos, unit.unitStructure.centerOffset, unit.pos, unit.direction);
        const face = rotateFace(slot.face, unit.direction);
        slots[slot.slotIndex] = new Slot.IOSlot(unit.uuid, worldPos, face, unit.dimension, slot.slotType, slot.contentType, slot.slotIndex);
    };
    return slots;
};