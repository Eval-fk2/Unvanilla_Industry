import * as Main from './main';

export class Slot {
    constructor(parentId, index, worldPos, face, dimension) {
        this.parentId  = parentId;
        this.parent    = Main.unitUuidMap.get(this.parentId);
        this.slotData  = this.parent.slots[index];
        this.worldPos  = worldPos;
        this.face      = face;
        this.dimension = dimension;
    };
};

export class IOSlot extends Slot {
    constructor(parentId, index) {
        super(parentId, index);
        this.uuid        = `${this.slotData.slotType}_${worldPos.x}_${worldPos.y}_${worldPos.z}`;
        this.maxAmount   = this.slotData.maxAmount;
        this.content     = null;
        this.connectId   = null;

        Main.slotPosMap.set(this.worldPos, this);
        Main.slotUuidMap.set(this.uuid, this);
    };

    inputItem() {
        if (!this.connectId || this.ioType != 'input') return;
        const connectSlot = Main.slotUuidMap.get(this.connectId);
        if (connectSlot.content.typeId != this.content.typeId || this.content.amount >= this.maxAmount) return;
        this.content.amount        += 1;
        connectSlot.content.amount -= 1;
        if (connectSlot.content.amount <= 0) connectSlot.content = null;
        const unit                = Main.unitUuidMap.get(this.parentId);
        const connectUnit         = Main.unitUuidMap.get(connectSlot.parentId);
        unit.isSlotChanged        = true;
        connectUnit.isSlotChanged = true;
    };

    outputItem() {
        if (!this.connectId || this.ioType != 'output') return;
        const connectSlot = Main.slotUuidMap.get(this.connectId);
        if (connectSlot.content.typeId != this.content.typeId || connectSlot.amount >= this.maxAmount) return;
        connectSlot.content.amount += 1;
        this.content.amount        -= 1;
        if (this.content.amount <= 0) this.content = null;
        const unit                = Main.unitUuidMap.get(this.parentId);
        const connectUnit         = Main.unitUuidMap.get(connectSlot.parentId);
        unit.isSlotChanged        = true;
        connectUnit.isSlotChanged = true;
    };
};

export class ElectrodeSlot extends Slot {
    constructor(parentId, worldPos, face, dimension, slotIndex, electrodeType) {
        super(parentId, worldPos, face, dimension, slotIndex);
        this.slotType       = 'ElectrodeSlot';
        this.uuid           = `${this.slotType}_${worldPos.x}_${worldPos.y}_${worldPos.z}`;
        this.electrodeType  = electrodeType;
        this.powerPerMinute = null;
        this.connectId      = null;

        Main.slotPosMap.set(this.worldPos, this);
        Main.slotUuidMap.set(this.uuid, this);
    };
};