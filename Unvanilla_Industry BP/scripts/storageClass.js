import * as Utils from './utils';

class Storage {
    constructor(parent, storageIndex) {
        this.parent = parent;
        this.storageData = this.parent.storages[storageIndex];
        this.uuid = `storage_${Utils.genUuid()}`;
        this.contentType = null;
        this.maxAmount = null;
        this.slots = null;
    };

    initSlots() {
        for (let i = 0; i < this.storageData.slotAmount; i++) {
            const slot = {

            };
        };
    };
};

class SlotStorage extends Storage {
    constructor(parent, storageIndex) {
        super(parent, storageIndex);
    };
};

class TransportStorage extends Storage {
    constructor(parent, storageIndex) {
        super(parent, storageIndex);
    };
};

class ContainerStorage extends Storage {
    constructor(parent, storageIndex) {
        super(parent, storageIndex);
    };
};

class TankStorage extends Storage {
    constructor(parent, storageIndex) {
        super(parent, storageIndex);
    };
};