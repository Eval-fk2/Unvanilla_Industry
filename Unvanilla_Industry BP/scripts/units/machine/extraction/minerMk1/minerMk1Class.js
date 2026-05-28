import { BlockPermutation, world } from '@minecraft/server';
import { minerMk1Data } from './minerMk1Data';
import { minerMk1Structure } from './minerMk1Structure';
import { minerMk1Recipe } from './minerMk1Recipe';
import { minerMk1Form } from './minerMk1Form';

import * as Main from '../../../../main';
import * as Utils from '../../../../utils';

export class MinerMk1Node {

    static unitData = minerMk1Data;
    static unitStructure = minerMk1Structure;
    static unitRecipe = minerMk1Recipe;

    constructor(pos, direction, dimension) {
        this.typeId          = MinerMk1Node.unitData.id;
        this.uuid            = `${this.typeId}_${pos.x}_${pos.y}_${pos.z}`;
        this.pos             = pos;
        this.direction       = direction;
        this.dimension       = dimension;
        this.slots           = Utils.initSlots(this);
        this.status          = 'IDLE';
        this.powerNetworkId  = null;
        this.currentRecipeId = null;
        this.cycleStartTick  = null;
        this.cycleEndTick    = null;
        this.detectedBlockId = null;

        this.setStructure();
        this.searchConnect();
        this.joinPowerNetwork();
        Main.unitUuidMap.set(this.uuid, this);
    };

    /**
     * ブロックを設置
     */
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
            if (placedBlock) {
                placedBlock.setPermutation(
                    placedBlock.permutation.withState('uvi:unit_id', this.uuid)
                );
            };
        };
    };

    /**
     * 接続先を探索
     */
    searchConnect() {
        for (const slot of this.slots) {
            const detectPos = {
                x: slot.worldPos.x + (rotatedFace === 'east'  ? 1 : rotatedFace === 'west'  ? -1 : 0),
                y: slot.worldPos.y,
                z: slot.worldPos.z + (rotatedFace === 'south' ? 1 : rotatedFace === 'north' ? -1 : 0)
            };
            const connectSlot = Main.slotPosMap.get(detectPos);
            if (connectSlot === undefined) return;
            if (
                connectSlot.face === Utils.oppositeFace(rotatedFace) &&
                connectSlot.contentType === slot.contentType
            ) {
                connectSlot.connectId = this.uuid;
                slot.connectId = connectSlot.uuid;
            };
        };
    };

    joinPowerNetwork() {
        const electrodeSlot = this.slots.find(slot => slot.slotType === 'ElectrodeSlot');
        const connectUnit = Main.unitUuidMap.get(electrodeSlot.connectId);
        if (connectUnit.powerNetworkId != null) {
            this.powerNetworkId = connectUnit.powerNetworkId;
        }
        else {
            this.powerNetworkId = `powerNetwork_${this.uuid}`;
        };
    };

    updateBlockSensor() {
        const sensorLocalPos = {
            x: MinerMk1Node.unitData.blockSensor.x,
            y: MinerMk1Node.unitData.blockSensor.y,
            z: MinerMk1Node.unitData.blockSensor.z
        };
        const sensorWorldPos = rotatePos(
            sensorLocalPos,
            MinerMk1Node.unitStructure.centerOffset,
            this.pos,
            this.direction
        );
        const detectedBlock = this.dimension.getBlock(sensorWorldPos);
        this.detectedBlockId = detectedBlock?.typeId ?? null;
    };

    setRecipe(recipeId) {
        this.currentRecipeId = recipeId;
        this.status          = 'IDLE';
        this.cycleStartTick  = null;
        this.cycleEndTick    = null;
    };

    processRecipe(recipe) {
        const items = Utils.countItems(this.slots);
        if (Utils.canCraft(items) )
    };

    tick(currentTick, recipes, powerNetworks) {
        if (!this.currentRecipeId) return;

        const recipe  = recipes[this.currentRecipeId];
        const network = powerNetworks.get(this.powerNetworkId);
        if (network && !network.isPowered) {
            this.status = 'BLACKOUT';
            return;
        };
        this.updateBlockSensor();
        if (!this.checkInputs(recipe)) {
            this.status = 'IDLE';
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
            this.cycleEndTick   = currentTick + recipe.durationTicks;
            this.status         = 'RUNNING';
        };
        if (currentTick >= this.cycleEndTick) {
            const completedCycles = Math.floor(
                (currentTick - this.cycleStartTick) / recipe.durationTicks
            );
            for (let i = 0; i < completedCycles; i++) {
                if (!this.checkOutputs(recipe)) {
                    this.status = 'WAITING_OUTPUT';
                    break;
                }
                this.processRecipe(recipe);
            };
            this.cycleStartTick = this.cycleStartTick + recipe.durationTicks * completedCycles;
            this.cycleEndTick   = this.cycleStartTick + recipe.durationTicks;
        };
    };

    openUI(player) {
        // import { showRecipeSelectUI } from '../../ui/recipeSelectUI.js'
        // showRecipeSelectUI(player, this)
        // UIファイル実装後にコメントアウトを外す
    };

    onDestroy(powerNetworks) {
        for (const slot of this.output) {
            if (!slot?.connectId) continue;
            const connectUnit = this.worldUnits.find(u => u.id === slot.connectId);
            if (connectUnit) {
                const targetSlot = connectUnit.input.find(s => s?.connectId === this.uuid);
                if (targetSlot) targetSlot.connectId = null;
            };
        };
        for (const slot of this.input) {
            if (!slot?.connectId) continue;
            const connectUnit = this.worldUnits.find(u => u.id === slot.connectId);
            if (connectUnit) {
                const targetSlot = connectUnit.output.find(s => s?.connectId === this.uuid);
                if (targetSlot) targetSlot.connectId = null;
            };
        };
        const network = powerNetworks.get(this.powerNetworkId);
        if (network) {
            network.memberIds = network.memberIds.filter(id => id !== this.uuid);
            if (network.memberIds.length === 0) {
                powerNetworks.delete(this.powerNetworkId);
            };
        };
        const idx = this.worldUnits.findIndex(u => u.id === this.uuid);
        if (idx !== -1) this.worldUnits.splice(idx, 1);
    };
    serialize() {
        return {
            type:            'MinerMk1Node',
            id:              this.uuid,
            typeId:          this.typeId,
            pos:             this.pos,
            direction:       this.direction,
            input:           this.input,
            output:          this.output,
            electrode:       this.electrode,
            powerNetworkId:  this.powerNetworkId,
            currentRecipeId: this.currentRecipeId,
            cycleStartTick:  this.cycleStartTick,
            cycleEndTick:    this.cycleEndTick,
            status:          this.status,
            detectedBlockId: this.detectedBlockId
        };
    };

    static fromJSON(data, dimension, worldUnits, powerNetworks) {
        const node = new MinerMk1Node(
            data.pos,
            data.direction,
            dimension,
            worldUnits,
            powerNetworks
        );
        node.id              = data.id;
        node.input           = data.input;
        node.output          = data.output;
        node.electrode       = data.electrode;
        node.powerNetworkId  = data.powerNetworkId;
        node.currentRecipeId = data.currentRecipeId;
        node.cycleStartTick  = data.cycleStartTick;
        node.cycleEndTick    = data.cycleEndTick;
        node.status          = data.status;
        node.detectedBlockId = data.detectedBlockId;
        return node;
    };
};