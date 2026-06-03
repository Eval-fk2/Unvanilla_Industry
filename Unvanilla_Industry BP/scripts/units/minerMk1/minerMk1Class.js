import { BlockPermutation, ItemStack } from '@minecraft/server';
import { minerMk1Data } from './minerMk1Data';
import { minerMk1Structure } from './minerMk1Structure';
import { minerMk1Recipe } from './minerMk1Recipe';
import { minerMk1Form } from './minerMk1Form';
import * as Main from '../../../../main';
import * as Utils from '../../../../utils';
import * as PN from '../../../../powerNetwork';

export class MinerMk1Node {

    static unitData      = minerMk1Data;
    static unitStructure = minerMk1Structure;
    static unitRecipe    = minerMk1Recipe;

    constructor(pos, direction, dimension, isRestoring = false) {
        this.typeId          = MinerMk1Node.unitData.id;
        this.uuid            = `${this.typeId}_${pos.x}_${pos.y}_${pos.z}`;
        this.pos             = pos;
        this.direction       = direction;
        this.dimension       = dimension;
        this.slots           = Utils.initSlots(this);
        this.isSlotChanged   = false;
        this.status          = 'IDLE';
        this.powerNetworkId  = null;
        this.currentRecipeId = null;
        this.cycleStartTick  = null;
        this.cycleEndTick    = null;
        this.detectedBlockId = null;

        if (!isRestoring) {
            this.setStructure();
            this.searchConnect();
            this.joinPowerNetwork();
        };

        Main.unitUuidMap.set(this.uuid, this);
    };

    // ----------------------------------------------------------
    // ブロック設置
    // ----------------------------------------------------------

    setStructure() {
        for (const block of MinerMk1Node.unitStructure.blocks) {
            const worldPos = Utils.rotatePos(
                block.localPos,
                MinerMk1Node.unitStructure.centerOffset,
                this.pos,
                this.direction
            );
            this.dimension.setBlockPermutation(
                worldPos,
                BlockPermutation.resolve(block.id, {
                    'minecraft:cardinal_direction': this.direction
                })
            );
            const placedBlock = this.dimension.getBlock(worldPos);
            placedBlock?.setPermutation(
                placedBlock.permutation.withState('uvi:unit_id', this.uuid)
            );
        }
    }

    // ----------------------------------------------------------
    // 接続先探索
    // ----------------------------------------------------------

    searchConnect() {
        for (const slot of this.slots) {
            const detectPos = {
                x: slot.worldPos.x + (slot.face === 'east'  ? 1 : slot.face === 'west'  ? -1 : 0),
                y: slot.worldPos.y,
                z: slot.worldPos.z + (slot.face === 'south' ? 1 : slot.face === 'north' ? -1 : 0)
            };

            const targetSlot = Main.slotPosMap.get(Utils.posKey(detectPos));
            if (!targetSlot) continue;

            // electrodeは向きだけ確認
            if (slot.slotType === 'ElectrodeSlot') {
                if (
                    targetSlot.slotType !== 'ElectrodeSlot' ||
                    targetSlot.face     !== Utils.oppositeFace(slot.face)
                ) continue;
                slot.connectId       = targetSlot.uuid;
                targetSlot.connectId = slot.uuid;
            }

            // IOSlotは向きとcontentTypeを確認
            else if (slot.slottype === 'IOSlot') {
                if (
                    targetSlot.face        !== Utils.oppositeFace(slot.face) ||
                    targetSlot.contentType !== slot.contentType ||
                    targetSlot.ioType      === slot.ioType
                ) continue;
                slot.connectId       = targetSlot.uuid;
                targetSlot.connectId = slot.uuid;
            };
        };
    };

    // ----------------------------------------------------------
    // 電力ネットワーク
    // ----------------------------------------------------------

    joinPowerNetwork() {
        const electrode = this.slots.find(s => s.slotType === 'ElectrodeSlot');
        if (!electrode?.connectId) {
            const powerNetwork = new PN.PowerNetwork();
            powerNetwork.addUnit(this);
            return;
        };

        const connectSlot = Main.slotUuidMap.get(electrode.connectId);
        const connectUnit = Main.unitUuidMap.get(connectSlot?.parentId);
        if (connectUnit?.powerNetworkId) {
            const powerNetwork = Main.powerNetworkMap.get(connectUnit.powerNetworkId);
            powerNetwork.addUnit(this);
        }
        else {
            const powerNetwork = new PN.PowerNetwork();
            powerNetwork.addUnit(this);
            powerNetwork.addUnit(connectUnit);
        };
    };

    getCurrentPowerConsumption() {
        if (!this.currentRecipeId) return 0;
        return MinerMk1Node.unitRecipe[this.currentRecipeId]?.powerPerMinute ?? 0;
    };

    // ----------------------------------------------------------
    // blockSensor
    // ----------------------------------------------------------

    updateBlockSensor() {
        const sensorWorldPos = Utils.rotatePos(
            MinerMk1Node.unitData.blockSensor,
            MinerMk1Node.unitStructure.centerOffset,
            this.pos,
            this.direction
        );
        this.detectedBlockId = this.dimension.getBlock(sensorWorldPos)?.typeId ?? null;
    };

    // ----------------------------------------------------------
    // レシピ
    // ----------------------------------------------------------

    setRecipe(recipeId) {
        this.currentRecipeId = recipeId;
        this.status          = 'IDLE';
        this.cycleStartTick  = null;
        this.cycleEndTick    = null;
    };

    // inputスロットの中身を { itemId: count } のMapにまとめる
    getInputMap() {
        const map = new Map();
        for (const slot of this.slots) {
            if (slot.slotType !== 'IOSlot' || slot.ioType !== 'input' || !slot.content) continue;
            map.set(slot.content.typeId, (map.get(slot.content.typeId) ?? 0) + slot.content.amount);
        };
        return map;
    };

    checkInputs(recipe) {
        // blockDetectの確認
        for (const input of recipe.inputs) {
            if (input.type === 'blockDetect' && this.detectedBlockId !== input.id) return false;
        };
        // itemの確認
        const inputMap = this.getInputMap();
        for (const input of recipe.inputs) {
            if (input.type !== 'item') continue;
            if ((inputMap.get(input.id) ?? 0) < input.amount) return false;
        };
        return true;
    };

    checkOutputs(recipe) {
        for (const output of recipe.outputs) {
            const slot = this.slots.find(s =>
                s.slotType    === 'IOSlot' &&
                s.ioType      === 'output' &&
                s.contentType === output.type &&
                s.slotIndex   === output.slotIndex
            );
            if (!slot) return false;
            if (slot.content && slot.content.typeId !== output.id) return false;
            if ((slot.content?.amount ?? 0) + output.amount > slot.maxAmount) return false;
        };
        return true;
    };

    processRecipe(recipe) {
        if (!this.checkInputs(recipe) || !this.checkOutputs(recipe)) return;
        // input消費
        for (const input of recipe.inputs) {
            let remaining = input.amount;

            // indexの小さい順にinputスロットを探索
            const inputSlots = this.slots
                .filter(slot =>
                    slot.slotType === 'IOSlot' &&
                    slot.ioType === 'input' &&
                    slot.contentType === input.type &&
                    slot.content &&
                    slot.content.typeId === input.id
                )
                .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));
            for (const slot of inputSlots) {
                if (remaining <= 0) break;
                const consume = Math.min(slot.content.amount, remaining);
                slot.content.amount -= consume;
                remaining -= consume;
                if (slot.content.amount <= 0) slot.content = null;
            };
        };

        // output生産
        for (const output of recipe.outputs) {
            const outputSlot = this.slots.find(slot =>
                slot.slotType  === 'IOSlot' &&
                slot.ioType    === 'output' &&
                slot.contentType === output.type &&
                slot.slotIndex === output.slotIndex
            );
            if (!outputSlot) continue;
            if (outputSlot.content) {
                outputSlot.content.amount += output.amount;
            }
            else {
                if (output.type === 'item') {
                    outputSlot.content = new ItemStack(output.id, output.amount);
                    
                }
            };
        };
    };

    // ----------------------------------------------------------
    // tick
    // ----------------------------------------------------------

    tick(currentTick) {
        if (!this.currentRecipeId) return;

        const recipe  = MinerMk1Node.unitRecipe[this.currentRecipeId];
        const network = Main.powerNetworks.get(this.powerNetworkId);

        if (network && !network.isPowered) {
            this.status = 'BLACKOUT';
            return;
        };

        this.updateBlockSensor();

        if (!this.checkInputs(recipe)) {
            this.status         = 'IDLE';
            this.cycleStartTick = null;
            this.cycleEndTick   = null;
            return;
        };

        if (!this.checkOutputs(recipe)) {
            this.status = 'WAITING_OUTPUT';
            return;
        };

        if (this.cycleStartTick === null) {
            this.cycleStartTick = currentTick;
            this.cycleEndTick   = currentTick + recipe.durationTick;
            this.status         = 'RUNNING';
            return;
        };

        if (currentTick >= this.cycleEndTick) {
            const completedCycles = Math.floor(
                (currentTick - this.cycleStartTick) / recipe.durationTick
            );
            for (let i = 0; i < completedCycles; i++) {
                if (!this.checkOutputs(recipe)) {
                    this.status = 'WAITING_OUTPUT';
                    break;
                }
                this.processRecipe(recipe);
            }
            this.cycleStartTick += recipe.durationTick * completedCycles;
            this.cycleEndTick    = this.cycleStartTick + recipe.durationTick;
        };
    }

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