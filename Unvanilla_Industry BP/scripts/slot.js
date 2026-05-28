import * as Main from './main';

export class Slot {
    constructor(parentId, worldPos, face, dimension) {
        this.parentId  = parentId;
        this.worldPos  = worldPos;
        this.face      = face;
        this.dimension = dimension;
    };
};

export class IOSlot extends Slot {
    constructor(parentId, worldPos, face, dimension, ioType, contentType) {
        super(parentId, worldPos, face, dimension);
        this.slotType      = 'IOSlot';
        this.uuid          = `${this.slotType}_${worldPos.x}_${worldPos.y}_${worldPos.z}`;
        this.ioType        = ioType;
        this.contentType   = contentType;
        this.maxStack      = null;
        this.content       = null;
        this.connectId     = null;

        Main.slotPosMap.set(this.worldPos, this);
        Main.slotUuidMap.set(this.uuid, this);
    };
};

export class ElectrodeSlot extends Slot {
    constructor(parentId, worldPos, face, dimension, electrodeType) {
        super(parentId, worldPos, face, dimension);
        this.slotType       = 'ElectrodeSlot';
        this.uuid           = `${this.slotType}_${worldPos.x}_${worldPos.y}_${worldPos.z}`;
        this.electrodeType  = electrodeType;
        this.powerPerMinute = null;
        this.connectId      = null;

        Main.slotPosMap.set(this.worldPos, this);
        Main.slotUuidMap.set(this.uuid, this);
    };
};