import { world } from '@minecraft/server';

import * as Main from '../main';
import * as Utils from '../utils';
import * as ST from './storageClass';
import * as PN from './powerNetworkClass';

export class Port {
    constructor(parent, portType, portIndex) {
        this.parent      = parent;
        this.portType    = portType;
        this.portIndex   = portIndex;
        this.portData    = this.parent.unitData[portType][this.portIndex];
        this.pos         = Utils.rotatePos(
                            this.portData.localPos,
                            this.parent.unitStructure.centerOffset,
                            this.parent.pos,
                            this.parent.direction
                        );
        this.face        = Utils.rotateFace(this.portData.face, this.parent.direction);
        this.dimension   = this.parent.dimension;
        this.uuid        = `${this.portType}_${this.pos.x}_${this.pos.y}_${this.pos.z}`;
        this.connectPort = null;

        Main.portPosMap.set(Utils.portPosKey(this.pos, this.face), this);
        Main.portUuidMap.set(this.uuid, this);
    };

    _findAdjacentPort(targetPortType) {
        const detectPos = {
            x: this.pos.x + (this.face === 'east'  ? 1 : this.face === 'west'  ? -1 : 0),
            y: this.pos.y,
            z: this.pos.z + (this.face === 'south' ? 1 : this.face === 'north' ? -1 : 0)
        };
        const targetPort = Main.portPosMap.get(Utils.portPosKey(detectPos, Utils.oppositeFace(this.face)));
        if (!targetPort) return null;
        if (targetPort.parent.dimension.id !== this.parent.dimension.id) return null;
        if (targetPort.portData.contentType !== this.portData.contentType) return null;
        if (targetPort.portType !== targetPortType) return null;
        return targetPort;
    };

    serialize() {
        return {
            uuid:        this.uuid,
            pos:         JSON.parse(JSON.stringify(this.pos)),
            face:        this.face,
            dimensionId: this.dimension.id,
            portType:    this.portType,
            portIndex:   this.portIndex,
            parentId:    this.parent.uuid,
            connectId:   this.connectPort?.uuid ?? null
        };
    };
};

export class IOPort extends Port {
    constructor(parent, portType, portIndex) {
        super(parent, portType, portIndex);
        this.storage = new ST.Storage(this.parent, this.portData.storageIndex);
    };

    searchConnect() {
        if (this.connectPort) return;
        const targetPortType = this.portType === 'inputPorts' ? 'outputPorts' : 'inputPorts';
        const targetPort = this._findAdjacentPort(targetPortType);
        if (!targetPort) return;
        const bothMachine =
            this.parent.unitData.category       === 'MACHINE' &&
            targetPort.parent.unitData.category === 'MACHINE';
        if (bothMachine) return;
        targetPort.connectPort = this;
        this.connectPort       = targetPort;
    };

    serialize() {
        const serializeData = super.serialize();
        serializeData['slots'] = JSON.parse(JSON.stringify(this.storage.slots));
        return serializeData;
    };
};

export class InputPort extends IOPort {
    constructor(parent, portIndex) {
        super(parent, 'inputPorts', portIndex);
    };

    serialize() {
        const serializeData = super.serialize();
        serializeData['classType'] = 'InputPort';
        return serializeData;
    };

    static fromJSON(data) {
        const parent       = Main.unitUuidMap.get(data.parentId);
        const port         = new InputPort(parent, data.portIndex);
        port.storage.slots = data.slots;
        return port;
    };
};

export class OutputPort extends IOPort {
    constructor(parent, portIndex) {
        super(parent, 'outputPorts', portIndex);
    };

    outputItem(amount) {
        if (!this.connectPort) return;
        for (const slot of this.storage.slots) {
            if (!slot.id) continue;
            const addAmount = this.connectPort?.storage.add(slot.id, amount);
            if (addAmount > 0) {
                this.storage.remove(slot.id, amount);
                return;
            };
        };
    };

    serialize() {
        const serializeData = super.serialize();
        serializeData['classType'] = 'OutputPort';
        return serializeData;
    };

    static fromJSON(data) {
        const parent       = Main.unitUuidMap.get(data.parentId);
        const port         = new OutputPort(parent, data.portIndex);
        port.storage.slots = data.slots;
        return port;
    };
};

export class ElectrodePort extends Port {
    constructor(parent, portIndex) {
        super(parent, 'electrodePorts', portIndex);
        this.electrodeType = this.portData.electrodeType;
        this.powerNetwork  = null;
    };

    searchConnect() {
        if (this.connectPort) return;
        const targetPort = this._findAdjacentPort('electrodePorts');
        if (!targetPort) return;
        const hasCable =
            this.parent.unitData.category       === 'MACHINE' ||
            targetPort.parent.unitData.category === 'MACHINE';
        if (!hasCable) return;
        targetPort.connectPort = this;
        this.connectPort       = targetPort;

        const myNetwork    = this.powerNetwork;
        const theirNetwork = targetPort.powerNetwork;

        if      (myNetwork && theirNetwork && myNetwork !== theirNetwork) myNetwork.combine(theirNetwork);
        else if (myNetwork    && !theirNetwork) myNetwork.addUnit(targetPort.parent);
        else if (!myNetwork   && theirNetwork)  theirNetwork.addUnit(this.parent);
        else if (!myNetwork   && !theirNetwork) {
            const newNetwork = new PN.PowerNetwork();
            newNetwork.addUnit(this.parent);
            newNetwork.addUnit(targetPort.parent);
        };
    };

    serialize() {
        const serializeData = super.serialize();
        serializeData['classType']     = 'ElectrodePort';
        serializeData['electrodeType'] = this.electrodeType;
        return serializeData;
    };

    static fromJSON(data) {
        const parent = Main.unitUuidMap.get(data.parentId);
        const port   = new ElectrodePort(parent, data.portIndex);
        return port;
    };
};
