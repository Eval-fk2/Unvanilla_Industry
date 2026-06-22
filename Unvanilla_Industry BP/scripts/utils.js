import * as Port from './mainClass/portClass';

export function genUuid() {};
/**
 * レシピ内容をUI上で表示するためのテキストを生成する
 */
export function makeRecipeText(recipeList, recipe) {
    const inputsText  = recipe.inputs.map(s  => {
        if (s.type != 'blockSensor') return `${s.type} ${s.id} ${s.amount}`;
        else return `${s.type} ${s.id}`;
    }).join('\n');
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
 * axisを回転させる
 */
export function rotateAxis(localAxis, direction) {
    if (localAxis === 'y') return 'y';
    return (direction === 'east' || direction === 'west')
        ? (localAxis === 'x' ? 'z' : 'x')
        : localAxis;
};

/**
 * posを文字列キー化する
 */
export function posKey(pos) {
    return `${pos.x},${pos.y},${pos.z}`;
};

export function portPosKey(pos, face) {
    return `${pos.x},${pos.y},${pos.z}:${face}`;
};

/**
 * unitのdataからポートを初期化してportMapに登録する
 */
export function initPorts(unit, portType) {
    const ports = [];
    for (const [portIndex] of unit.unitData[portType].entries()) {
        let port;
        if (portType === 'inputPorts')          port = new Port.InputPort(unit, portIndex);
        else if (portType === 'outputPorts')    port = new Port.OutputPort(unit, portIndex);
        else if (portType === 'electrodePorts') port = new Port.ElectrodePort(unit, portIndex);
        ports.push(port);
    };
    return ports;
};



export function changeDirection(viewDirection) {
    let direction = 'north';
    if (-45 <= viewDirection.y || viewDirection.y <= 45)   direction = 'north';
    if (45 <= viewDirection.y && viewDirection.y <= 135)   direction = 'east';
    if (135 <= viewDirection.y || viewDirection.y <= -135) direction = 'south';
    if (-135 <= viewDirection.y && viewDirection.y <= -45) direction = 'west';
};
