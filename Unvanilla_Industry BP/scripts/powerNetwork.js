import * as Main from './main';
import * as Utils from './utils';

export class PowerNetwork {
    constructor() {
        this.uuid                 = Utils.genUuid();
        this.memberIds            = [];
        this.isPowered            = false;
        this.generationPerMinute  = 0;
        this.consumptionPerMinute = 0;

        Main.powerNetworkMap.set(this.uuid, this);
    };

    addUnit(unit) {
        if (this.memberIds.find(uuid => uuid === unit.uuid) != undefined) return;
        const prevPowerNetwork = Main.powerNetworkMap.get(unit.powerNetworkId);
        if (prevPowerNetwork) prevPowerNetwork.removeUnit(unit);
        this.memberIds.push(unit.uuid);
        unit.PowerNetworkId = this.uuid;
    };

    removeUnit(unit) {
        if (this.memberIds.find(uuid => uuid === unit.uuid) == undefined) return;
        this.memberIds = this.memberIds.filter(uuid => uuid !== unit.uuid);
        unit.powerNetworkId = null;
    };

    combine(combineNetwork) {
        for (const unitUuid of combineNetwork.memberIds) {
            const unit = Main.unitUuidMap.get(unitUuid);
            unit.powerNetworkId = this.uuid;
            this.memberIds.push(unitUuid);
        };
        combineNetwork.remove();
    };

    remove() {
        this = undefined;
    };
};