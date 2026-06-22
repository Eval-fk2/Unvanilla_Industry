import * as Main from '../main';
import * as Utils from '../utils';

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

    splitOnUnitRemoved(removedUnit) {
        // 破壊されたユニットと接続していた隣接ユニットを起点として収集
        const starts = (removedUnit.electrodePorts ?? [])
                .map(p => p.connectPort?.parent)
                .filter(n => n && n !== removedUnit && this.members.includes(n));

        this.removeUnit(removedUnit);
        if (starts.length <= 1) return;

        // 多始点BFS
        const groupOf = new Map();  // unit → グループ番号
        const queues  = [];         // queues[i] = グループiのBFSキュー
        let numGroups = 0;

        for (const start of starts) {
            if (groupOf.has(start)) continue;
            groupOf.set(start, numGroups);
            queues.push([start]);
            numGroups++;
        };

        outer: while (queues.some(q => q.length > 0)) {
            for (let gi = 0; gi < queues.length; gi++) {
                const queue = queues[gi];
                if (queue.length === 0) continue;

                const unit = queue.shift();

                for (const port of unit.electrodePorts ?? []) {
                    const neighbor = port.connectPort?.parent;
                    if (!neighbor || neighbor === removedUnit) continue;

                    if (!groupOf.has(neighbor)) {
                        groupOf.set(neighbor, gi);
                        queue.push(neighbor);
                    }
                    else {
                        const theirGroup = groupOf.get(neighbor);
                        if (theirGroup === gi) continue;

                        // 合流: theirGroup を gi に吸収
                        for (const [u, g] of groupOf) {
                            if (g === theirGroup) groupOf.set(u, gi);
                        };
                        while (queues[theirGroup].length > 0) queue.push(queues[theirGroup].shift());
                        queues[theirGroup] = [];
                        numGroups--;

                        if (numGroups === 1) break outer; // 全グループ合流 → 終了
                    };
                };
            };
        };

        if (numGroups <= 1) return; // 分割なし

        // グループごとに新しいネットワークを作成
        this.remove();
        const newNetworks = new Map();
        for (const [unit, group] of groupOf) {
            if (!newNetworks.has(group)) newNetworks.set(group, new PowerNetwork());
            newNetworks.get(group).addUnit(unit);
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
