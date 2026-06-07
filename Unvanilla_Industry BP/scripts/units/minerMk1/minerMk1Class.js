import { BlockPermutation, ItemStack } from '@minecraft/server';

import { minerMk1Data } from './minerMk1Data';
import { minerMk1Structure } from './minerMk1Structure';
import { minerMk1Recipe } from './minerMk1Recipe';
import { minerMk1Form } from './minerMk1Form';

import * as Main from '../../main';
import * as Utils from '../../utils';
import * as PN from '../../powerNetworkClass';
import * as UC from '../../unitClass';
import * as Fluid from '../../fluidData';

export class MinerMk1Node extends UC.Extraction {

    constructor(pos, direction, dimension) {
        super(pos, direction, dimension, minerMk1Data, minerMk1Structure, minerMk1Recipe);
        this.uuid          = `${this.typeId}_${pos.x}_${pos.y}_${pos.z}`;
        this.status        = 'IDLE';
        this.powerNetwork  = null;
        this.recipe        = null;
        this.blockSensor   = null;
        this.processPer    = 0;
        this.canProcess    = false;
        this.canCraft      = false;
        this.inputChanged  = false;
        this.outputChanged = false;
        this.canOutput     = true;

        this.setStructure();
        this.searchConnect();
        this.joinPowerNetwork();
        this.updateBlockSensor();

        Main.unitUuidMap.set(this.uuid, this);
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

    setRecipe(recipeId) {
        this.recipe = this.unitRecipe[recipeId];
        this.checkInputs();
        this.currentTick = 0;
        this.canCraft    = false;
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
                    slot.content = {typeId: output.id, amount: output.amount, maxAmount: Fluid.fluidData[output.id].maxAmount};
                };
            };
        };

        for (const slot of this.inputSlots)  if (slot.connectSlot.parent.canOutput) slot.connectSlot.outputItem(1);
        for (const slot of this.outputSlots) if (this.canOutput)                    slot.outputItem(1);
    };

    tick() {
        if (!this.recipe || !this.canProcess) return;
        if (this.currentTick < this.recipe.durationTick) {
            this.currentTick++;
            this.processPer = Number((this.currentTick * 100 / this.recipe.durationTick).toFixed(2));
        };
        if (this.currentTick >= this.recipe.durationTick && this.canCraft) {
            this.currentTick = 0;
            this.processRecipe();
        };
    };

    // ----------------------------------------------------------
    // UI
    // ----------------------------------------------------------

    openUI(player) {
        minerMk1Form(player, this);
    };

    // ----------------------------------------------------------
    // 破壊時の後処理
    // ----------------------------------------------------------

    onDestroy() {
        // 接続先スロットのconnectIdをリセット
        for (const slot of this.slots) {
            if (!slot.connectId) continue;
            const targetSlot = Main.slotUuidMap.get(slot.connectId);
            if (targetSlot) targetSlot.connectId = null;
            Main.slotPosMap.delete(posKey(slot.worldPos));
            Main.slotUuidMap.delete(slot.uuid);
        };

        // 電力ネットワークから離脱
        const network = Main.powerNetworks.get(this.powerNetworkId);
        if (network) {
            network.memberIds = network.memberIds.filter(id => id !== this.uuid);
            if (network.memberIds.length === 0) Main.powerNetworks.delete(this.powerNetworkId);
        };

        Main.unitUuidMap.delete(this.uuid);
    };

    // ----------------------------------------------------------
    // シリアライズ
    // ----------------------------------------------------------

    serialize() {
        const { uuid, typeId, pos, direction, slots, status,
                powerNetworkId, currentRecipeId,
                cycleStartTick, cycleEndTick, detectedBlockId } = this;
        return {
            classType: 'MinerMk1Node',
            uuid, typeId, pos, direction,
            slots: slots.map(s => s.serialize()),
            status, powerNetworkId, currentRecipeId,
            cycleStartTick, cycleEndTick, detectedBlockId
        };
    };

    static fromJSON(data, dimension) {
        const node = new MinerMk1Node(data.pos, data.direction, dimension, true);
        node.uuid            = data.uuid;
        node.status          = data.status;
        node.powerNetworkId  = data.powerNetworkId;
        node.currentRecipeId = data.currentRecipeId;
        node.cycleStartTick  = data.cycleStartTick;
        node.cycleEndTick    = data.cycleEndTick;
        node.detectedBlockId = data.detectedBlockId;
        node.slots           = data.slots.map(s => slotFromJSON(s));

        // slotMapに再登録
        for (const slot of node.slots) {
            Main.slotPosMap.set(Utils.posKey(slot.worldPos), slot);
            Main.slotUuidMap.set(slot.uuid, slot);
        };
        return node;
    };
};