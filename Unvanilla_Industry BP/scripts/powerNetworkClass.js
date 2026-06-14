import * as Main from './main';
import * as Utils from './utils';

export class PowerNetwork {
    constructor() {
        this.uuid                 = Utils.genUuid();
        this.members              = [];
        this.isPowered            = false;
        this.generationPerMinute  = 0;
        this.consumptionPerMinute = 0;

        Main.powerNetworkMap.set(this.uuid, this);
    };

    addUnit(unit) {
        if (this.members.includes(unit)) return;
        for (const port of unit.electrodePorts ?? []) {
            if (port.powerNetwork && port.powerNetwork !== this) {
                port.powerNetwork.removeUnit(unit);
                break;
            };
        };
        this.members.push(unit);
        for (const port of unit.electrodePorts ?? []) {
            port.powerNetwork = this;
        };
        this.recalculate();
        unit.onPowerStateChanged?.(this.isPowered);
    };

    removeUnit(unit) {
        if (!this.members.includes(unit)) return;
        this.members = this.members.filter(u => u !== unit);
        for (const port of unit.electrodePorts ?? []) {
            if (port.powerNetwork === this) port.powerNetwork = null;
        };
        this.recalculate();
    };

    combine(otherNetwork) {
        for (const unit of otherNetwork.members) {
            this.members.push(unit);
            for (const port of unit.electrodePorts ?? []) {
                port.powerNetwork = this;
            };
        };
        otherNetwork.remove();
        this.recalculate();
        for (const unit of this.members) {
            unit.onPowerStateChanged?.(this.isPowered);
        };
    };

    recalculate() {
        let gen = 0;
        let con = 0;

        for (const unit of this.members) {
            if (!unit.recipe || unit.status !== 'PROCESS') continue;
            gen += unit.recipe.generatePower ?? 0;
            con += unit.recipe.consumePower  ?? 0;
        };

        this.generationPerMinute  = gen;
        this.consumptionPerMinute = con;

        const wasPowered = this.isPowered;
        this.isPowered   = gen >= con;

        if (wasPowered !== this.isPowered) this._applyPowerState();
    };

    _applyPowerState() {
        for (const unit of this.members) {
            unit.onPowerStateChanged?.(this.isPowered);
        };
    };

    remove() {
        for (const unit of this.members) {
            for (const port of unit.electrodePorts ?? []) {
                if (port.powerNetwork === this) port.powerNetwork = null;
            };
        };
        Main.powerNetworkMap.delete(this.uuid);
    };
};
