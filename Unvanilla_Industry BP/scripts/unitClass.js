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

        for (const port of this.inputPorts) {
            Main.portUuidMap.delete(port.uuid);
            Main.portPosMap.delete(Utils.portPosKey(port.pos, port.face));
        };

        for (const port of this.outputPorts) {
            Main.portUuidMap.delete(port.uuid);
            Main.portPosMap.delete(Utils.portPosKey(port.pos, port.face));
        };

        for (const port of this.electrodePorts) {
            Main.portUuidMap.delete(port.uuid);
            Main.portPosMap.delete(Utils.portPosKey(port.pos, port.face));
        };

        Main.unitUuidMap.delete(this.uuid);
        Main.unitPosMap.delete(Utils.posKey(this.pos));
    };
};
// =========================================


// Second Category - Unit ==================
export class Machine extends Unit {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure);
        this.unitRecipe     = unitRecipe;
        this.inputPorts     = Utils.initPorts(this, 'inputPort');
        this.outputPorts    = Utils.initPorts(this, 'outputPort');
        this.electrodePorts = Utils.initPorts(this, 'electrodePort');
        this.status         = 'OFF';
        this.recipe         = null;
        this.currentTick    = 0;
        this.processPer     = 0;
        this.canProcess     = false;
        this.canCraft       = false;
        this.canOutput      = true;
    };

    searchConnect() {
        for (const port of this.inputPorts)     port.searchConnect();
        for (const port of this.outputPorts)    port.searchConnect();
        for (const port of this.electrodePorts) port.searchConnect();
    };

    setRecipe(recipe) {
        this.recipe      = recipe;
        this.currentTick = 0;
        this.canCraft    = false;
        this.checkInputs();
    };

    checkInputs() {
        const inputMap = new Map();
        for (const port of this.inputPorts) {
            if (!port.content) continue;
            inputMap.set(port.content.typeId, (inputMap.get(port.content.typeId) ?? 0) + port.content.amount);
        };

        for (const input of this.recipe.inputs) {
            if (input.type === 'blockSensor') {
                if (!this.blockSensor[input.sensorId]) return false;
            }
            else {
                if ((inputMap.get(input.id) ?? 0) < input.amount) return false;
            };
        };
        this.canProcess = true;
        return true;
    };

    checkOutputs() {
        for (const output of this.recipe.outputs) {
            const port = this.outputPorts[output.portIndex];
            if (!port.content) return false;
            if (!(
                port.portData.contentType           === output.type &&
                port.content.typeId                 === output.id &&
                port.content.amount + output.amount <= port.maxAmount
            )) return false;
        };
        this.canCraft = true;
        return true;
    };

    processRecipe() {
        for (const input of this.recipe.inputs) {
            let remaining = input.amount;
            const qualifiedPorts = this.inputPorts.filter(p =>
                p.portData.contentType === input.type &&
                p.content &&
                p.content.typeId === input.id
            );
            for (const port of qualifiedPorts) {
                if (remaining <= 0) break;
                const consume = Math.min(port.content.amount, remaining);
                port.content.amount -= consume;
                remaining -= consume;
                if (port.content.amount <= 0) port.content = null;
            };
        };

        for (const output of this.recipe.outputs) {
            const port = this.outputPorts[output.portIndex];
            if (!port) continue;
            if (port.content) {
                port.content.amount += output.amount;
            }
            else {
                if (output.type === 'item') {
                    port.content = {typeId: output.id, amount: output.amount, maxAmount: new ItemStack(output.id).maxAmount};
                }
                else if (output.type === 'fluid') {
                    port.content = {typeId: output.id, amount: output.amount, maxAmount: Item.itemData[output.id].maxAmount};
                };
            };
        };

        for (const port of this.inputPorts)  if (port.connectPort.parent.canOutput) port.connectPort.outputItem(1);
        for (const port of this.outputPorts) if (this.canOutput)                    port.outputItem(1);
    };

    tick() {
        if (!this.recipe || !this.canProcess) {
            this.status = 'IDLE';
            return;
        };
        this.status = 'PROCESS';
        if (this.currentTick < this.recipe.durationTick) {
            this.currentTick++;
            this.processPer = Number((this.currentTick * 100 / this.recipe.durationTick).toFixed(2));
        };
        if (this.currentTick >= this.recipe.durationTick && this.canCraft) {
            this.currentTick = 0;
            this.processRecipe();
        };
    };
};
// =========================================


// Third Category - Machine ================
export class Extraction extends Machine {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure, unitRecipe);
        this.blockSensor = null;
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


// Second Category - Unit ==================
export class Transport extends Unit {
    constructor(pos, direction, dimension, unitData, unitStructure, unitRecipe) {
        super(pos, direction, dimension, unitData, unitStructure);
        this.unitRecipe  = unitRecipe;
        this.inputPorts  = Utils.initPorts(this, 'inputPort');
        this.outputPorts = Utils.initPorts(this, 'outputPort');
        this.recipe      = null;
        this.currentTick = 0;
        this.canProcess  = false;
        this.canCraft    = false;
    };

    searchConnect() {
        for (const port of this.inputPorts)  port.searchConnect();
        for (const port of this.outputPorts) port.searchConnect();
    };

    setRecipe(recipe) {
        this.recipe      = recipe;
        this.currentTick = 0;
        this.canCraft    = false;
        this.checkInputs();
    };

    checkInputs() {
        const inputMap = new Map();
        for (const port of this.inputPorts) {
            if (!port.content) continue;
            inputMap.set(port.content.typeId, (inputMap.get(port.content.typeId) ?? 0) + port.content.amount);
        };

        for (const input of this.recipe.inputs) {
            if ((inputMap.get(input.id) ?? 0) < input.amount) return false;
        };
        this.canProcess = true;
        return true;
    };

    checkOutputs() {
        for (const output of this.recipe.outputs) {
            const port = this.outputPorts[output.portIndex];
            if (!port.content) return false;
            if (!(
                port.portData.contentType           === output.type &&
                port.content.typeId                 === output.id &&
                port.content.amount + output.amount <= port.maxAmount
            )) return false;
        };
        this.canCraft = true;
        return true;
    };

    processRecipe() {
        for (const input of this.recipe.inputs) {
            let remaining = input.amount;
            const qualifiedPorts = this.inputPorts.filter(p =>
                p.portData.contentType === input.type &&
                p.content &&
                p.content.typeId === input.id
            );
            for (const port of qualifiedPorts) {
                if (remaining <= 0) break;
                const consume = Math.min(port.content.amount, remaining);
                port.content.amount -= consume;
                remaining -= consume;
                if (port.content.amount <= 0) port.content = null;
            };
        };

        for (const output of this.recipe.outputs) {
            const port = this.outputPorts[output.portIndex];
            if (!port) continue;
            if (port.content) {
                port.content.amount += output.amount;
            }
            else {
                if (output.type === 'item') {
                    port.content = {typeId: output.id, amount: output.amount, maxAmount: new ItemStack(output.id).maxAmount};
                }
                else if (output.type === 'fluid') {
                    port.content = {typeId: output.id, amount: output.amount, maxAmount: Item.itemData[output.id].maxAmount};
                };
            };
        };

        for (const port of this.inputPorts)  if (port.connectPort.parent.canOutput) port.connectPort.outputItem(1);
        for (const port of this.outputPorts) if (this.canOutput)                    port.outputItem(1);
    };

    tick() {
        if (!this.recipe || !this.canProcess) {
            this.status = 'IDLE';
            return;
        };
        this.status = 'PROCESS';
        if (this.currentTick < this.recipe.durationTick) {
            this.currentTick++;
            this.processPer = Number((this.currentTick * 100 / this.recipe.durationTick).toFixed(2));
        };
        if (this.currentTick >= this.recipe.durationTick && this.canCraft) {
            this.currentTick = 0;
            this.processRecipe();
        };
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
