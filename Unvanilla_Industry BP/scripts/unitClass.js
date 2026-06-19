import { world, ItemStack } from '@minecraft/server';

import * as Main from './main';
import * as Utils from './utils';
import * as PN from './powerNetworkClass';
import * as Item from './itemData';

// First Category ==========================
export class Unit {
    constructor(pos, direction, dimension, unitData, unitStructure) {
        this.pos           = pos;
        this.direction     = direction;
        this.dimension     = dimension;
        this.unitData      = unitData;
        this.unitStructure = unitStructure;
        this.uuid          = `${this.unitData.typeId}_${pos.x}_${pos.y}_${pos.z}`;

        Main.unitUuidMap.set(this.uuid, this);
        Main.unitPosMap.set(Utils.posKey(this.pos), this);
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

    onDestroy() {
        for (const block of this.unitStructure.blocks) {
            const pos = Utils.rotatePos(
                block.localPos,
                this.unitStructure.centerOffset,
                this.pos,
                this.direction
            );
            this.dimension.setBlock(pos, 'minecraft:air');
        };
        Main.unitUuidMap.delete(this.uuid);
        Main.unitPosMap.delete(Utils.posKey(this.pos));
    };
};
// =========================================


// Second Category =========================
export class ProcessingUnit extends Unit {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure);
<<<<<<< Updated upstream
        this.unitRecipe  = unitRecipe;
        this.inputPorts  = Utils.initPorts(this, 'inputPorts');
        this.outputPorts = Utils.initPorts(this, 'outputPorts');
        this.status      = 'OFF';
        this.recipe      = null;
        this.currentTick = 0;
        this.processPer  = 0;
        this.canProcess  = false;
        this.isPowered   = true;
=======
        this.unitRecipe     = unitRecipe;
        this.inputSlots     = Utils.initSlots(this, 'inputSlot');
        this.outputSlots    = Utils.initSlots(this, 'outputSlot');
        this.electrodeSlots = Utils.initSlots(this, 'electrodeSlot');
        this.status         = 'OFF';
        this.recipe         = null;
        this.processPer     = 0;
        this.canProcess     = false;
        this.canCraft       = false;
        this.canOutput      = true;
>>>>>>> Stashed changes
    };

    searchConnect() {
        for (const port of this.inputPorts)  port.searchConnect();
        for (const port of this.outputPorts) port.searchConnect();
    };

    onDestroy() {
        for (const port of this.inputPorts) {
            Main.portUuidMap.delete(port.uuid);
            Main.portPosMap.delete(Utils.portPosKey(port.pos, port.face));
        };
        for (const port of this.outputPorts) {
            Main.portUuidMap.delete(port.uuid);
            Main.portPosMap.delete(Utils.portPosKey(port.pos, port.face));
        };
        super.onDestroy();
    };

    setRecipe(recipe) {
        this.recipe      = recipe;
        this.currentTick = 0;
        this.processPer  = 0;
        this.canProcess  = this.checkInputs();
    };

    checkInputs() {
        for (const input of this.recipe.inputs) {
            if (input.type === 'blockSensor') {
                if (!this.blockSensor?.[input.sensorId]) return false;
            }
            else {
                const total = this.inputPorts.reduce((sum, p) => sum + p.storage.getAmount(input.id), 0);
                if (total < input.amount) return false;
            };
        };
<<<<<<< Updated upstream
        return true;
=======
        this.canProcess = true;
>>>>>>> Stashed changes
    };

    checkOutputs() {
        for (const output of this.recipe.outputs) {
            const port = this.outputPorts[output.portIndex];
            if (!port.storage.canAdd(output.id, output.amount)) return false;
        };
<<<<<<< Updated upstream
        return true;
=======
        this.canCraft = true;
>>>>>>> Stashed changes
    };

    processRecipe() {
        for (const input of this.recipe.inputs) {
            if (input.type === 'blockSensor') continue;
            let remaining = input.amount;
            for (const port of this.inputPorts) {
                if (remaining <= 0) break;
                remaining -= port.storage.remove(input.id, remaining);
            };
        };

        for (const output of this.recipe.outputs) {
            const port = this.outputPorts[output.portIndex];
            if (!port) continue;
            port.storage.add(output.id, output.amount);
        };

        this.canProcess = this.checkInputs();

        for (const port of this.inputPorts)  port.connectPort?.outputItem();
        for (const port of this.outputPorts) port.outputItem();
    };

    onPowerStateChanged(isPowered) {
        this.isPowered = isPowered;
    };

    tick() {
        if (!this.recipe || !this.canProcess || !this.isPowered) {
            this.status = 'IDLE';
            return;
        };

        this.status = 'PROCESS';

        if (this.currentTick < this.recipe.durationTick) {
            this.currentTick++;
            this.processPer = Number((this.currentTick * 100 / this.recipe.durationTick).toFixed(2));
            return;
        };

        if (!this.checkOutputs()) return;

        this.processRecipe();
        this.currentTick = 0;
        this.processPer  = 0;
    };
};
// =========================================


// Third Category ==========================
export class Machine extends ProcessingUnit {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure, unitRecipe);
        this.electrodePorts = Utils.initPorts(this, 'electrodePorts');
        this.isPowered      = false;
    };

    searchConnect() {
        super.searchConnect();
        for (const port of this.electrodePorts) port.searchConnect();
    };

    onDestroy() {
        for (const port of this.electrodePorts) {
            Main.portUuidMap.delete(port.uuid);
            Main.portPosMap.delete(Utils.portPosKey(port.pos, port.face));
        };
        super.onDestroy();
    };

    tick() {
        const prevStatus = this.status;
        super.tick();
        if (prevStatus !== this.status) {
            for (const port of this.electrodePorts) {
                port.powerNetwork?.recalculate();
            };
        };
    };
};

export class Transport extends ProcessingUnit {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure, unitRecipe);
    };
};
// =========================================


// Fourth Category - Machine ===============
export class Extraction extends Machine {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure, unitRecipe);
        this.blockSensor = null;
    };

    onPlace() {
        this.updateBlockSensor();
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
            this.blockSensor[input.sensorId] = result;
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


<<<<<<< Updated upstream
// Fourth Category - Transport =============
=======
// Second Category - Unit ==================
export class Transport extends Unit {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure);
        this.unitRecipe  = unitRecipe;
        this.inputSlots  = Utils.initSlots(this, 'inputSlot');
        this.outputSlots = Utils.initSlots(this, 'outputSlot');
        this.recipe      = null;
        this.canProcess  = false;
        this.canCraft    = false;
    };

    searchConnect() {
        for (const slot of this.inputSlots)  slot.searchConnect();
        for (const slot of this.outputSlots) slot.searchConnect();
    };
};
// =========================================


// Third Category - Transport ==============
>>>>>>> Stashed changes
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


export class Connector extends Unit {
    constructor(pos, direction, dimension, unitData, unitStructure) {
        super(pos, direction, dimension, unitData, unitStructure);
    };

    searchConnect() {
        for (const port of this.electrodePorts) port.searchConnect();
    };
};

export class Cable extends Connector {
    constructor(pos, direction, dimension, unitData, unitStructure) {
        super(pos, direction, dimension, unitData, unitStructure);
    };
};