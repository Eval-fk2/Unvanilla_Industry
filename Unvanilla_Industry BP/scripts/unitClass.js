import { world } from '@minecraft/server';

import * as Main from './main';
import * as Utils from './utils';
import * as Slot from './slotClass';
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

        for (const slot of this.inputSlots) {
            Main.slotUuidMap.delete(slot.uuid);
            Main.slotPosMap.delete(Utils.posKey(slot.pos));
        };

        for (const slot of this.outputSlots) {
            Main.slotUuidMap.delete(slot.uuid);
            Main.slotPosMap.delete(Utils.posKey(slot.pos));
        };

        for (const slot of this.electrodeSlots) {
            Main.slotUuidMap.delete(slot.uuid);
            Main.slotPosMap.delete(Utils.posKey(slot.pos));
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
        this.inputSlots     = Utils.initSlots(this, 'inputSlot');
        this.outputSlots    = Utils.initSlots(this, 'outputSlot');
        this.electrodeSlots = Utils.initSlots(this, 'electrodeSlot');
        this.status         = 'OFF';
        this.recipe         = null;
        this.currentTick    = 0;
        this.processPer     = 0;
        this.canProcess     = false;
        this.canCraft       = false;
        this.canOutput      = true;
    };

    searchConnect() {
        for (const slot of this.inputSlots)     slot.searchConnect();
        for (const slot of this.outputSlots)    slot.searchConnect();
        for (const slot of this.electrodeSlots) slot.searchConnect();
    };

    setRecipe(recipe) {
        this.recipe      = recipe;
        this.currentTick = 0;
        this.canCraft    = false;
        this.checkInputs();
    };

    checkInputs() {
        const inputMap = new Map();
        for (const slot of this.inputSlots) {
            if (!slot.content) continue;
            inputMap.set(slot.content.typeId, (inputMap.get(slot.content.typeId) ?? 0) + slot.content.amount);
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
            const slot = this.outputSlots[output.slotIndex];
            if (!slot.content) return false;
            if (!(
                slot.slotData.contentType           === output.type &&
                slot.content.typeId                 === output.id &&
                slot.content.amount + output.amount <= slot.maxAmount
            )) return false;
        };
        this.canCraft = true;
        return true;
    };

    processRecipe() {
        for (const input of this.recipe.inputs) {
            let remaining = input.amount;
            const qualifiedSlots = this.inputSlots.filter(s =>
                s.slotData.contentType === input.type &&
                s.content &&
                s.content.typeId === input.id
            );
            for (const slot of qualifiedSlots) {
                if (remaining <= 0) break;
                const consume = Math.min(slot.content.amount, remaining);
                slot.content.amount -= consume;
                remaining -= consume;
                if (slot.content.amount <= 0) slot.content = null;
            };
        };

        for (const output of this.recipe.outputs) {
            const slot = this.outputSlots[output.slotIndex]
            if (!slot) continue;
            if (slot.content) {
                slot.content.amount += output.amount;
            }
            else {
                if (output.type === 'item') {
                    slot.content = {typeId: output.id, amount: output.amount, maxAmount: new ItemStack(output.id).maxAmount};
                }
                else if (output.type === 'fluid') {
                    slot.content = {typeId: output.id, amount: output.amount, maxAmount: Item.itemData[output.id].maxAmount};
                };
            };
        };

        for (const slot of this.inputSlots)  if (slot.connectSlot.parent.canOutput) slot.connectSlot.outputItem(1);
        for (const slot of this.outputSlots) if (this.canOutput)                    slot.outputItem(1);
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
        super(pos, direction, dimension, unitData, unitStructure);
        this.unitRecipe  = unitRecipe;
        this.inputSlots  = Utils.initSlots(this, 'inputSlot');
        this.outputSlots = Utils.initSlots(this, 'outputSlot');
        this.recipe = null;
        this.currentTick = 0;
        this.canProcess = false;
        this.canCraft = false;
    };

    searchConnect() {
        for (const slot of this.inputSlots)  slot.searchConnect();
        for (const slot of this.outputSlots) slot.searchConnect();
    };

    setRecipe(recipe) {
        this.recipe      = recipe;
        this.currentTick = 0;
        this.canCraft    = false;
        this.checkInputs();
    };

    checkInputs() {
        const inputMap = new Map();
        for (const slot of this.inputSlots) {
            if (!slot.content) continue;
            inputMap.set(slot.content.typeId, (inputMap.get(slot.content.typeId) ?? 0) + slot.content.amount);
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
            const slot = this.outputSlots[output.slotIndex];
            if (!slot.content) return false;
            if (!(
                slot.slotData.contentType           === output.type &&
                slot.content.typeId                 === output.id &&
                slot.content.amount + output.amount <= slot.maxAmount
            )) return false;
        };
        this.canCraft = true;
        return true;
    };

    processRecipe() {
        for (const input of this.recipe.inputs) {
            let remaining = input.amount;
            const qualifiedSlots = this.inputSlots.filter(s =>
                s.slotData.contentType === input.type &&
                s.content &&
                s.content.typeId === input.id
            );
            for (const slot of qualifiedSlots) {
                if (remaining <= 0) break;
                const consume = Math.min(slot.content.amount, remaining);
                slot.content.amount -= consume;
                remaining -= consume;
                if (slot.content.amount <= 0) slot.content = null;
            };
        };

        for (const output of this.recipe.outputs) {
            const slot = this.outputSlots[output.slotIndex]
            if (!slot) continue;
            if (slot.content) {
                slot.content.amount += output.amount;
            }
            else {
                if (output.type === 'item') {
                    slot.content = {typeId: output.id, amount: output.amount, maxAmount: new ItemStack(output.id).maxAmount};
                }
                else if (output.type === 'fluid') {
                    slot.content = {typeId: output.id, amount: output.amount, maxAmount: Item.itemData[output.id].maxAmount};
                };
            };
        };

        for (const slot of this.inputSlots)  if (slot.connectSlot.parent.canOutput) slot.connectSlot.outputItem(1);
        for (const slot of this.outputSlots) if (this.canOutput)                    slot.outputItem(1);
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