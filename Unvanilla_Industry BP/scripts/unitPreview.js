import * as Utils from './utils';

function checkCanPlace(worldPos, direction, structure, dimension) {
    for (const block of structure.blocks) {
        const wp = Utils.rotatePos(block.localPos, structure.centerOffset, worldPos, direction);
        const b  = dimension.getBlock(wp);
        if (!b || b.typeId !== 'minecraft:air') return false;
    };
    return true;
};

function getBBox(structure) {
    let x0 = Infinity,  y0 = Infinity,  z0 = Infinity;
    let x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (const { localPos: p } of structure.blocks) {
        if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
        if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
        if (p.z < z0) z0 = p.z; if (p.z > z1) z1 = p.z;
    }
    return { x0, y0, z0, x1, y1, z1 };
}

// north/southはlocal x→world x, z→z
// east/westはlocal x→world z, z→x （rotatePos実装に合わせたスワップ）
function worldAxis(localAxis, direction) {
    if (localAxis === 'y') return 'y';
    return (direction === 'east' || direction === 'west')
        ? (localAxis === 'x' ? 'z' : 'x')
        : localAxis;
}

function faceOffset(pos, face) {
    switch (face) {
        case 'north': return { x: pos.x,     y: pos.y,     z: pos.z - 1 };
        case 'south': return { x: pos.x,     y: pos.y,     z: pos.z + 1 };
        case 'east':  return { x: pos.x + 1, y: pos.y,     z: pos.z     };
        case 'west':  return { x: pos.x - 1, y: pos.y,     z: pos.z     };
        case 'up':    return { x: pos.x,     y: pos.y + 1, z: pos.z     };
        case 'down':  return { x: pos.x,     y: pos.y - 1, z: pos.z     };
        default:      return pos;
    }
}

function spawnEdges(dimension, worldPos, direction, structure) {
    const { x0, y0, z0, x1, y1, z1 } = getBBox(structure);
    const co = structure.centerOffset;
    const rp = (lp) => Utils.rotatePos(lp, co, worldPos, direction);
    const xa = worldAxis('x', direction);
    const za = worldAxis('z', direction);

    // x平行の辺 (yコーナー × zコーナー の4本)
    for (const y of [y0, y1 + 1]) {
        for (const z of [z0, z1 + 1]) {
            for (let x = x0; x <= x1; x++) dimension.spawnParticle(`uvi:edge_${xa}`, rp({ x, y, z }));
        }
    }
    // y平行の辺
    for (const x of [x0, x1 + 1]) {
        for (const z of [z0, z1 + 1]) {
            for (let y = y0; y <= y1; y++) dimension.spawnParticle('uvi:edge_y', rp({ x, y, z }));
        }
    }
    // z平行の辺
    for (const x of [x0, x1 + 1]) {
        for (const y of [y0, y1 + 1]) {
            for (let z = z0; z <= z1; z++) dimension.spawnParticle(`uvi:edge_${za}`, rp({ x, y, z }));
        }
    }
}

function spawnFaces(dimension, worldPos, direction, structure, canPlace) {
    const { x0, y0, z0, x1, y1, z1 } = getBBox(structure);
    const co    = structure.centerOffset;
    const rp    = (lp) => Utils.rotatePos(lp, co, worldPos, direction);
    const color = canPlace ? 'blue' : 'red';
    const xa    = worldAxis('x', direction);
    const za    = worldAxis('z', direction);

    // x垂直面 (y,zを走査)
    for (const x of [x0, x1 + 1]) {
        for (let y = y0; y <= y1; y++) {
            for (let z = z0; z <= z1; z++) dimension.spawnParticle(`uvi:face_${xa}_${color}`, rp({ x, y, z }));
        }
    }
    // y垂直面
    for (const y of [y0, y1 + 1]) {
        for (let x = x0; x <= x1; x++) {
            for (let z = z0; z <= z1; z++) dimension.spawnParticle(`uvi:face_y_${color}`, rp({ x, y, z }));
        }
    }
    // z垂直面 (x,yを走査)
    for (const z of [z0, z1 + 1]) {
        for (let x = x0; x <= x1; x++) {
            for (let y = y0; y <= y1; y++) dimension.spawnParticle(`uvi:face_${za}_${color}`, rp({ x, y, z }));
        }
    }
}

function spawnPorts(dimension, worldPos, direction, unitData, structure) {
    const co = structure.centerOffset;
    const rp = (lp) => Utils.rotatePos(lp, co, worldPos, direction);

    for (const p of unitData.inputPorts ?? []) {
        const face = Utils.rotateFace(p.face, direction);
        dimension.spawnParticle(`uvi:arrow_${face}_green`, faceOffset(rp(p.localPos), face));
    }
    for (const p of unitData.outputPorts ?? []) {
        const face = Utils.rotateFace(p.face, direction);
        dimension.spawnParticle(`uvi:arrow_${face}_red`, faceOffset(rp(p.localPos), face));
    }
    for (const p of unitData.electrodePorts ?? []) {
        const face = Utils.rotateFace(p.face, direction);
        dimension.spawnParticle('uvi:thunder', faceOffset(rp(p.localPos), face));
    }
}

export function showUnitPreview(worldPos, direction, unitData, structure, dimension) {
    const canPlace = checkCanPlace(worldPos, direction, structure, dimension);
    spawnEdges(dimension, worldPos, direction, structure);
    spawnFaces(dimension, worldPos, direction, structure, canPlace);
    spawnPorts(dimension, worldPos, direction, unitData, structure);
    return canPlace;
}
