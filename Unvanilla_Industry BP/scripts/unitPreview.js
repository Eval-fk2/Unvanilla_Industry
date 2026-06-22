import { world } from '@minecraft/server';

import * as Main  from './main';
import * as Utils from './utils';


function spawnEdges(dimension, worldPos, direction, unitStructure) {
    const blockSet = new Set(
        unitStructure.blocks.map(({ localPos: { x, y, z } }) => `${x},${y},${z}`)
    );
    const count = (...ps)    => ps.filter(([x,y,z]) => blockSet.has(`${x},${y},${z}`)).length;
    const rp    = (localPos) => Utils.rotatePos(localPos, unitStructure.centerOffset, worldPos, direction);
    const xa    = Utils.rotateAxis('x', direction);
    const za    = Utils.rotateAxis('z', direction);

    const seenX = new Set(), seenY = new Set(), seenZ = new Set();

    for (const { localPos: { x, y, z } } of unitStructure.blocks) {
        for (const ey of [y, y+1]) for (const ez of [z, z+1]) {
            if (seenX.has(`${x},${ey},${ez}`)) continue;
            seenX.add(`${x},${ey},${ez}`);
            if (count([x,ey-1,ez-1],[x,ey,ez-1],[x,ey-1,ez],[x,ey,ez]) % 2 === 1)
                dimension.spawnParticle(`uvi:edge_${xa}`, rp({ x, y: ey, z: ez }));
        };
        for (const ex of [x, x+1]) for (const ez of [z, z+1]) {
            if (seenY.has(`${ex},${y},${ez}`)) continue;
            seenY.add(`${ex},${y},${ez}`);
            if (count([ex-1,y,ez-1],[ex,y,ez-1],[ex-1,y,ez],[ex,y,ez]) % 2 === 1)
                dimension.spawnParticle('uvi:edge_y', rp({ x: ex, y, z: ez }));
        };
        for (const ex of [x, x+1]) for (const ey of [y, y+1]) {
            if (seenZ.has(`${ex},${ey},${z}`)) continue;
            seenZ.add(`${ex},${ey},${z}`);
            if (count([ex-1,ey-1,z],[ex,ey-1,z],[ex-1,ey,z],[ex,ey,z]) % 2 === 1)
                dimension.spawnParticle(`uvi:edge_${za}`, rp({ x: ex, y: ey, z }));
        };
    };
};

function spawnFaces(dimension, worldPos, direction, unitStructure, canPlace) {
    const particleColor = canPlace ? 'blue' : 'red';
    const blockSet = new Set(unitStructure.blocks.map(({ localPos: { x, y, z } }) => `${x},${y},${z}`));

    for (const { localPos } of unitStructure.blocks) {
        for (const axis of ['x', 'y', 'z']) {
            for (const diff of [-1, +1]) {
                const neighbor = { ...localPos, [axis]: localPos[axis] + diff };
                if (blockSet.has(`${neighbor.x},${neighbor.y},${neighbor.z}`)) continue;

                const facePos = { ...localPos, [axis]: localPos[axis] + (diff > 0 ? 1 : 0) };
                const spawnPos = Utils.rotatePos(facePos, unitStructure.centerOffset, worldPos, direction);
                dimension.spawnParticle(`uvi:face_${Utils.rotateAxis(axis, direction)}_${particleColor}`, spawnPos);
            };
        };
    };
};


function spawnPorts(dimension, worldPos, direction, unitStructure, unitData) {
    const rp = (localPos) => Utils.rotatePos(localPos, unitStructure.centerOffset, worldPos, direction);

    for (const port of unitData.inputPorts ?? []) {
        const face = Utils.rotateFace(port.face, direction);
        dimension.spawnParticle(`uvi:arrow_${face}_green`, rp(port.localPos));
    };
    for (const port of unitData.outputPorts ?? []) {
        const face = Utils.rotateFace(port.face, direction);
        dimension.spawnParticle(`uvi:arrow_${face}_red`, rp(port.localPos));
    };
    for (const port of unitData.electrodePorts ?? []) {
        const face = Utils.rotateFace(port.face, direction);
        dimension.spawnParticle('uvi:thunder', rp(port.localPos));
    };
};

export function showUnitPreview(worldPos, direction, unitData, unitStructure, dimension) {
    const canPlace = Main.checkCanPlace(worldPos, direction, unitStructure, dimension);
    spawnEdges(dimension, worldPos, direction, unitStructure);
    spawnFaces(dimension, worldPos, direction, unitStructure, canPlace);
    spawnPorts(dimension, worldPos, direction, unitStructure, unitData);
    return canPlace;
};
