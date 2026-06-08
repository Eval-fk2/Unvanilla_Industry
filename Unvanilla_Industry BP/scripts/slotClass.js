import { world } from '@minecraft/server';

import * as Main from './main';
import * as Utils from './utils'

export class Slot {
    constructor(parent, slotType, slotIndex) {
        this.parent      = parent;
        this.slotType    = slotType;
        this.slotIndex   = slotIndex;
        this.slotData    = this.parent[slotType][this.slotIndex];
        this.pos         = Utils.rotatePos(
                            this.slotData.localPos,
                            this.parent.unitStructure.centerOffset,
                            this.parent.pos,
                            this.parent.direction
                        );
        this.face        = Utils.rotateFace(this.slotData.face, this.parent.direction);
        this.dimension   = this.parent.dimension;
        this.uuid        = `${this.slotType}_${this.pos.x}_${this.pos.y}_${this.pos.z}`;
        this.connectSlot = null;

        Main.slotPosMap.set(this.pos, this);
        Main.slotUuidMap.set(this.uuid, this);
    };

    searchConnect() {
        if (this.connectSlot) return;
        const detectPos = {
            x: this.pos.x + (this.face === 'east'  ? 1 : this.face === 'west'  ? -1 : 0),
            y: this.pos.y,
            z: this.pos.z + (this.face === 'south' ? 1 : this.face === 'north' ? -1 : 0)
        };
        const targetSlot = Main.slotPosMap.get(Utils.posKey(detectPos));
        if (!targetSlot) return;
        let targetSlotType;
        if (this.slotType === 'inputSlots')     targetSlotType = 'outputSlot';
        if (this.slotType === 'outputSlots')    targetSlotType = 'inputSlot';
        if (this.slotType === 'electrodeSlots') targetSlotType = 'electrodeSlot';
        if (
            targetSlot.parent.dimension.id === this.parent.dimension.id &&
            targetSlot.slotType === targetSlotType &&
            targetSlot.face === Utils.oppositeFace(this.face)
        ) {
            targetSlot.connectSlot = this;
            this.connectSlot = targetSlot;
        };
    };

    serialize() {
        return {
            uuid:        this.uuid,
            pos:         JSON.parse(JSON.stringify(this.pos)),
            face:        this.face,
            dimensionId: this.dimension.id,
            slotType:    this.slotType,
            slotIndex:   this.slotIndex,
            parentId:    this.parent.uuid,
            connectId:   this.connectSlot.uuid
        };
    };
};

export class IOSlot extends Slot {
    constructor(parent, slotType, slotIndex) {
        super(parent, slotType, slotIndex);
        this.content   = null;
        this.maxAmount = null;
    };

    setMaxAmount(content) {
        if (this.slotData.maxAmount === 'contentMaxAmount') {
            if (!content) return;
            this.maxAmount = content.maxAmount;
        }
        else this.maxAmount = this.slotData.maxAmount;
    };

    serialize() {
        const serializeData = super.serialize();
        serializeData['content']   = JSON.parse(JSON.stringify(this.content));
        serializeData['maxAmount'] = this.maxAmount;
    };

    deleteItemAll() {
        this.content = null;
    };

    giveItemAll(player) {
        if (!this.content || this.content.type != 'item') return;
        world.getDimension(player.dimension.id).runCommand(`give ${player.name} ${this.content.typeId} ${this.content.amount}`);
        this.deleteItemAll();
    };
};

export class InputSlot extends IOSlot {
    constructor(parent, slotIndex) {
        super(parent, 'inputSlot', slotIndex);
    };

    serialize() {
        const serializeData = super.serialize();
        serializeData['classType'] = 'InputSlot';
        return serializeData;
    };

    static fromJSON(data) {
        const parent   = Main.unitUuidMap.get(data.parentId);
        const unit     = new InputSlot(parent, data.slotIndex);
        unit.content   = data.content;
        unit.maxAmount = data.maxAmount;
        return unit;
    };
};

export class OutputSlot extends IOSlot {
    constructor(parentId, slotIndex) {
        super(parentId, 'outputSlot', slotIndex);
    };

    outputItem(amount) {
        if (!this.connectSlot || !this.content) return;
        if (this.content.amount < amount) return;
        if (!this.connectSlot.content) {
            this.connectSlot.setMaxAmount(this.content);
            if (amount > this.connectSlot.maxAmount) return;
                this.connectSlot.content = {
                    typeId: this.content.typeId,
                    amount: this.content.amount,
                    maxAmount: this.content.amount
                };
        }
        else if (
            this.content.typeId != this.connectSlot.content.typeId ||
            this.connectSlot.content.amount + amount > this.connectSlot.maxAmount
        ) return;
        this.connectSlot.content.amount += amount;
        this.content.amount             -= amount;
        if (this.content.amount <= 0) this.content = null;
    };

    serialize() {
        const serializeData = super.serialize();
        serializeData['classType'] = 'OutputSlot';
        return serializeData;
    };

    static fromJSON(data) {
        const parent   = Main.unitUuidMap.get(data.parentId);
        const unit     = new OutputSlot(parent, data.slotIndex);
        unit.content   = data.content;
        unit.maxAmount = data.maxAmount;
        return unit;
    };
};

export class ElectrodeSlot extends Slot {
    constructor(parentId, slotIndex, electrodeType) {
        super(parentId, 'electrodeSlot', slotIndex);
        this.electrodeType  = electrodeType;
        this.powerPerMinute = null;
        this.powerNetwork = null;
    };

    serialize() {
        const serializeData = super.serialize();
        serializeData['classType'] = 'ElectrodeSlot';
        serializeData['electrodeType'] = this.electrodeType;
        return serializeData;
    };

    static fromJSON(data) {
        const parent = Main.unitUuidMap.get(data.parentId);
        const unit   = new ElectrodeSlot(parent, data.slotIndex, data.electrodeType);
        return unit;
    };
};