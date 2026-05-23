import {BlockPermutation, world} from '@minecraft/server';
import {minerMk1Data} from './data';
import {minerMk1Structure} from './structure';

const worldUnits = [];

class MinerMk1Node {
    constructor(pos, direction, dimension) {
        this.unitData = minerMk1Data;
        this.unitStructure = minerMk1Structure;
        this.unitId = this.unitData.id;
        this.id = this.getId();
        this.pos = pos;
        this.direction = direction;
        this.dimension = world.getDimension('overworld');
        this.input = initSlots(this.unitData.input);
        this.output = initSlots(this.unitData.output);
        this.electrode = [];
    };

    setStructure() {
        for (const block of this.unitStructure.blocks) {
            let rotatedPos = rotatePos(block.localPos, this.unitStructure.centerOffset, this.direction);
            rotatedPos.x += this.pos.x;
            rotatedPos.y += this.pos.y;
            rotatedPos.z += this.pos.z;
            this.dimension.setBlockPermutation(rotatedPos, BlockPermutation.resolve(block.id, {'minecraft:cardinal_direction': direction}));
        };
    };

    searchConnect() {
        for (const slot of this.unitData.input) {
            let slotPos = rotatePos(slot.localPos, this.pos, this.direction);
            slotPos.x += this.pos.x;
            slotPos.y += this.pos.y;
            slotPos.z += this.pos.z;

            let detectPos = slotPos;
            const rotatedFace = rotateFace(slot.face, this.direction);
            switch (rotatedFace) {
                case 'north': detectPos.z -= 1; break;
                case 'east': detectPos.x += 1; break;
                case 'south': detectPos.z += 1; break;
                case 'west': detectPos.x -= 1; break;
            };

            let connectDirection = rotatedFace;
            switch (connectDirection) {
                case 'north': connectDirection = 'south'; break;
                case 'east': connectDirection = 'west'; break;
                case 'south': connectDirection = 'north'; break;
                case 'west': connectDirection = 'east'; break;
            };
            
            const connectBlock = worldUnits.find(unit => {
                if (unit.unitData.type === 'CONVEYOR' && 
                    unit.direction === connectDirection && 
                    unit.pos === detectPos
                ) return true;
            });

            connectBlock.output[0].connectId = this.id;
            this.input[slot.slotIndex].connectId = connectBlock.id;

        };
    };
};

function rotateFace(face, direction) {
    let rotatedFace = face;
    switch (direction) {
        case 'north': break;
        case 'east': {
            switch (face) {
                case 'north': rotatedFace = 'east'; break;
                case 'east': rotatedFace = 'south'; break;
                case 'south': rotatedFace = 'west'; break;
                case 'west': rotatedFace = 'north'; break;
            };
            break;
        };
        case 'south': {
            switch (face) {
                case 'north': rotatedFace = 'south'; break;
                case 'east': rotatedFace = 'west'; break;
                case 'south': rotatedFace = 'north'; break;
                case 'west': rotatedFace = 'east'; break;
            };
            break;
        };
        case 'west': {
            switch (face) {
                case 'north': rotatedFace = 'west'; break;
                case 'east': rotatedFace = 'north'; break;
                case 'south': rotatedFace = 'east'; break;
                case 'west': rotatedFace = 'south'; break;
            };
            break;
        };
    };
    return rotatedFace;
};

function rotatePos(pos, centerPos, direction) {
    const cx = pos.x - centerPos.x;
    const cy = pos.y - centerPos.y;
    const cz = pos.z - centerPos.z;

    let rotatedPos = {x: 0, y: 0, z: 0};
    switch (direction) {
        case 'north': rotatedPos.x =  cx; rotatedPos.z =  cz; break;
        case 'east': rotatedPos.x =  cz; rotatedPos.z = -cx; break;
        case 'south': rotatedPos.x = -cx; rotatedPos.z = -cz; break;
        case 'west': rotatedPos.x = -cz; rotatedPos.z =  cx; break;
    };
    return rotatedPos;
};

function initSlots(slotData) {
    const slots = [];
    for (const slot of slotData) {
        slots[slot.slotIndex] = {
            slotType: def.slotType,
            id: null,
            count: 0,
            connectId: null
        };
    };
    return slots;
};