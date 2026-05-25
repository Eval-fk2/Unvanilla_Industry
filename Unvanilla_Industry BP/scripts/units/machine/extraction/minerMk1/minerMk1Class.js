import { BlockPermutation, world } from '@minecraft/server';
import { minerMk1Data } from './minerMk1Data';
import { minerMk1Structure } from './minerMk1Structure';
import { minerMk1Recipe } from './minerMk1Recipe';
import { minerMk1Form } from './minerMk1Form';

import * as Main from '../../../../main';
import * as Utils from '../../../../utils';

export class MinerMk1Node {
    constructor(pos, direction, dimension) {
        this.typeId        = minerMk1Data.id;
        this.uuid          = `${this.typeId}_${pos.x}_${pos.y}_${pos.z}`;
        this.pos           = pos;
        this.direction     = direction;
        this.dimension     = dimension;
        this.inputs  = Utils.initSlots(minerMk1Data.inputs);
        this.outputs = Utils.initSlots(minerMk1Data.outputs);
        this.powerNetworkId = null;
        this.currentRecipeId = null;
        this.cycleStartTick  = null;
        this.cycleEndTick    = null;
        this.status          = 'IDLE';
        this.detectedBlockId = null;

        this.setStructure();
        this.searchConnect();
        this.joinPowerNetwork();
        Main.worldUnits.push(this);
    };

    setStructure() {
        for (const block of minerMk1Structure.blocks) {
            const worldPos = rotatePos(
                block.localPos,
                minerMk1Structure.centerOffset,
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

    searchConnect() {
        for (const slot of minerMk1Data.output) {
            const slotWorldPos = rotatePos(
                slot.localPos,
                minerMk1Structure.centerOffset,
                this.pos,
                this.direction
            );
            const rotatedFace = rotateFace(slot.face, this.direction);
            const detectPos = {
                x: slotWorldPos.x + (rotatedFace === 'east'  ? 1 : rotatedFace === 'west'  ? -1 : 0),
                y: slotWorldPos.y,
                z: slotWorldPos.z + (rotatedFace === 'south' ? 1 : rotatedFace === 'north' ? -1 : 0)
            };
            const connectDirection = oppositeFace(rotatedFace);
            const connectUnit = Main.worldUnits.find(unit =>
                unit.unitData.type === 'CONVEYOR' &&
                unit.direction     === connectDirection &&
                posKey(unit.pos)   === posKey(detectPos)
            );
            if (!connectUnit) continue;
            this.output[slot.slotIndex].connectId      = connectUnit.id;
            connectUnit.input[0].connectId             = this.uuid;
        };
        for (const electrode of minerMk1Data.electrode) {
            const electrodeWorldPos = rotatePos(
                electrode.localPos,
                minerMk1Structure.centerOffset,
                this.pos,
                this.direction
            );
            const rotatedFace = rotateFace(electrode.face, this.direction);
            const detectPos = {
                x: electrodeWorldPos.x + (rotatedFace === 'east'  ? 1 : rotatedFace === 'west'  ? -1 : 0),
                y: electrodeWorldPos.y,
                z: electrodeWorldPos.z + (rotatedFace === 'south' ? 1 : rotatedFace === 'north' ? -1 : 0)
            };
            const connectUnit = Main.worldUnits.find(unit =>
                posKey(unit.pos) === posKey(detectPos) &&
                (unit.unitData.type === 'POWER_CABLE' || unit.unitData.electrode)
            );
            if (connectUnit) {
                this.electrode = connectUnit.id;
            };
        };
    };

    joinPowerNetwork() {
        if (this.electrode) {
            const connectUnit = Main.worldUnits.find(u => u.id === this.electrode);
            if (connectUnit?.powerNetworkId) {
                this.powerNetworkId = connectUnit.powerNetworkId;
                const network = Main.powerNetworks.get(this.powerNetworkId);
                network?.addMember(this.uuid);
                return;
            };
        };
        const newNetworkId = `network_${this.uuid}`;
        this.powerNetworkId = newNetworkId;
        Main.powerNetworks.set(newNetworkId, { id: newNetworkId, memberIds: [this.uuid] });
    };

    updateBlockSensor() {
        const sensorLocalPos = {
            x: minerMk1Data.blockSensor.x,
            y: minerMk1Data.blockSensor.y,
            z: minerMk1Data.blockSensor.z
        };
        const sensorWorldPos = rotatePos(
            sensorLocalPos,
            minerMk1Structure.centerOffset,
            this.pos,
            this.direction
        );
        const detectedBlock = this.dimension.getBlock(sensorWorldPos);
        this.detectedBlockId = detectedBlock?.typeId ?? null;
    };

    setRecipe(recipeId, recipes) {
        if (!minerMk1Data.usableRecipe.includes(recipeId)) return;
        this.currentRecipeId = recipeId;
        this.status          = 'IDLE';
        this.cycleStartTick  = null;
        this.cycleEndTick    = null;
    };

    checkInputs(recipe) {
        for (const input of recipe.inputs) {
            if (input.type === 'blockDetect') {
                if (this.detectedBlockId !== input.blockId) return false;
            };
            if (input.type === 'item') {
                const slot = this.input[input.slotIndex];
                if (!slot || slot.id !== input.itemId || slot.count < input.count) return false;
            };
        };
        return true;
    };

    checkOutputs(recipe, maxStack = 64) {
        for (const output of recipe.outputs) {
            const slot = this.output[output.slotIndex];
            if (!slot) return false;
            if (slot.id !== null && slot.id !== output.itemId) return false;
            if ((slot.count + output.count) > maxStack) return false;
        };
        return true;
    };

    processRecipe(recipe) {
        for (const input of recipe.inputs) {
            if (input.type === 'item') {
                this.input[input.slotIndex].count -= input.count;
                if (this.input[input.slotIndex].count <= 0) {
                    this.input[input.slotIndex].id    = null;
                    this.input[input.slotIndex].count = 0;
                };
            };
        };
        for (const output of recipe.outputs) {
            const slot = this.output[output.slotIndex];
            slot.id     = output.itemId;
            slot.count += output.count;
        };
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