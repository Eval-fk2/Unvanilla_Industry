export class IOSlot {
    constructor(parentId, worldPos, face, dimension, slotType, slotIndex) {
        this.uuid = getId();
        this.parentId = parentId;
        this.worldPos = worldPos;
        this.face = face;
        this.dimension = dimension;
        this.slotType = slotType;
        this.slotIndex = slotIndex;
        this.maxStack = null;
        this.content = null;
        this.contentCount = null;
    };
};

export class ItemSlot extends IOSlot {
    constructor(parentId, worldPos, face, dimension, slotType, slotIndex) {
        super(parentId, worldPos, face, dimension, slotType, slotIndex);
        this.contentType = 'item';
        this.maxStack = null;
        this.content = null;
        this.contentCount = null;
    };
};

export class FluidSlot extends IOSlot {
    constructor(parentId, worldPos, face, dimension, slotType, slotIndex) {
        super(parentId, worldPos, face, dimension, slotType, slotIndex);
        this.contentType = 'fluid';
        this.maxStack = null;
        this.contentId = null;
        this.contentAmount = null;
    };
};

export class ElectrodeSlot {
    constructor(parentId, worldPos, face, dimension, slotType, slotIndex) {
        this.uuid = getId();
        this.parentId = parentId;
        this.worldPos = worldPos;
        this.face = face;
        this.dimension = dimension;
        this.slotType = slotType;
        this.slotIndex = slotIndex;
        this.powerPerMinute = null;
    };
};