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
};

export class IOSlot extends Slot {
    constructor(parent, slotType, slotIndex) {
        super(parent, slotType, slotIndex);
        this.content  = null;
        this.maxAmount = null;
    };

    setMaxAmount(content) {
        if (this.slotData.maxAmount === 'contentMaxAmount') {
            if (!content) return;
            this.maxAmount = content.maxAmount;
        }
        else this.maxAmount = this.slotData.maxAmount;
    };
};

export class InputSlot extends IOSlot {
    constructor(parent, slotIndex) {
        super(parent, 'inputSlot', slotIndex);
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
        if (
            targetSlot.parent.dimension.id === this.parent.dimension.id &&
            targetSlot.slotType === 'outputSlot' &&
            targetSlot.face === Utils.oppositeFace(this.face)
        ) {
            targetSlot.connectSlot = this;
            this.connectSlot = targetSlot;
        };
    };
};

export class OutputSlot extends IOSlot {
    constructor(parentId, slotIndex) {
        super(parentId, 'outputSlot', slotIndex);
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
        if (
            targetSlot.parent.dimension.id === this.parent.dimension.id &&
            targetSlot.slotType === 'inputSlot' &&
            targetSlot.face === Utils.oppositeFace(this.face)
        ) {
            targetSlot.connectSlot = this;
            this.connectSlot = targetSlot;
        };
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
};

export class ElectrodeSlot extends Slot {
    constructor(parentId, slotIndex, electrodeType) {
        super(parentId, 'electrodeSlot', slotIndex);
        this.electrodeType  = electrodeType;
        this.powerPerMinute = null;
        this.powerNetwork = null;
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
        if (
            targetSlot.parent.dimension.id === this.parent.dimension.id &&
            targetSlot.slotType === 'electrodeSlot' &&
            targetSlot.face === Utils.oppositeFace(this.face)
        ) {
            targetSlot.connectSlot = this;
            this.connectSlot = targetSlot;
        };
    };
};