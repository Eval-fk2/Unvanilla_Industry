import * as Utils from './utils';

class Storage {
    constructor(parent, storageIndex) {
        this.parent = parent;
        this.storageData = this.parent.storages[storageIndex];
        this.uuid = `storage_${Utils.genUuid()}`;
    };
};