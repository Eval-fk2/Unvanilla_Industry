import * as Utils from './utils';

// First Category ==========================
export class Unit {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        this.pos           = pos;
        this.direction     = direction;
        this.dimension     = dimension;
        this.unitData      = unitData;
        this.unitStructure = unitStructure;
        this.unitRecipe    = unitRecipe;
    };

    setStructure() {
        for (const block of this.unitStructure.blocks) {
            const pos = Utils.rotatePos(
                block.localPos,
                this.unitStructure.centerOffset,
                this.pos,
                this.direction
            );
            this.dimension.setBlockPermutation(
                pos,
                BlockPermutation.resolve(block.typeId, {
                    'minecraft:cardinal_direction': this.direction
                })
            );
            const placedBlock = this.dimension.getBlock(pos);
            placedBlock?.setPermutation(
                placedBlock.permutation.withState('uvi:unit_id', this.uuid)
            );
        };
    };
};
// =========================================


// Second Category - Unit ==================
export class Machine extends Unit {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure, unitRecipe);
        this.inputSlots     = Utils.initSlots(this, 'inputSlot');
        this.outputSlots    = Utils.initSlots(this, 'outputSlot');
        this.electrodeSlots = Utils.initSlots(this, 'electrodeSlot');
    };

    searchConnect() {
        for (const slot of this.inputSlots)     slot.searchConnect();
        for (const slot of this.outputSlots)    slot.searchConnect();
        for (const slot of this.electrodeSlots) slot.searchConnect();
    };
};
// =========================================


// Third Category - Machine ================
export class Extraction extends Machine {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure, unitRecipe);
    };

    updateBlockSensor() {
        for (const input of this.recipe.inputs) {
            if (input.type !== 'blockSensor') continue;
            const result = this.unitData.blockSensor[input.sensorId].every(localPos => {
                const pos = Utils.rotatePos(
                    localPos,
                    this.unitStructure.centerOffset,
                    this.pos,
                    this.direction
                );
                const block = this.dimension.getBlock(pos);
                return block?.typeId === input.id;
            });
            this.blockSensor[sensorId] = result;
        };
    };
};

export class Generator extends Machine {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure, unitRecipe);
    };
};

export class Production extends Machine {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure, unitRecipe);
    };
};
// =========================================


// Second Category - Unit ==================
export class Transport extends Unit {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure, unitRecipe);
    };
};
// =========================================


// Third Category - Transport ==============
export class Conveyor extends Transport {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure, unitRecipe);
    };
};

export class Pipe extends Transport {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure, unitRecipe);
    };
};
// =========================================