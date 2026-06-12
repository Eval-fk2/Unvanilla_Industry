import { world } from '@minecraft/server';

import * as Main from './main';
import * as Utils from './utils'

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

    searchConnect() {
        if (this.connectPort) return;
        const detectPos = {
            x: this.pos.x + (this.face === 'east'  ? 1 : this.face === 'west'  ? -1 : 0),
            y: this.pos.y,
            z: this.pos.z + (this.face === 'south' ? 1 : this.face === 'north' ? -1 : 0)
        };
        const targetPort = Main.portPosMap.get(Utils.portPosKey(detectPos, Utils.oppositeFace(this.face)));
        if (!targetPort) return;
        let targetPortType;
        if (this.portType === 'inputPort')     targetPortType = 'outputPort';
        if (this.portType === 'outputPort')    targetPortType = 'inputPort';
        if (this.portType === 'electrodePort') targetPortType = 'electrodePort';
        if (
            targetPort.parent.dimension.id === this.parent.dimension.id &&
            targetPort.portType === targetPortType
        ) {
            targetPort.connectPort = this;
            this.connectPort = targetPort;
        };
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
            connectId:   this.connectPort.uuid
        };
    };
};

export class IOPort extends Port {
    constructor(parent, portType, portIndex) {
        super(parent, portType, portIndex);
        this.content   = null;
        this.maxAmount = null;
    };

    setMaxAmount(content) {
        if (this.portData.maxAmount === 'contentMaxAmount') {
            if (!content) return;
            this.maxAmount = content.maxAmount;
        }
        else this.maxAmount = this.portData.maxAmount;
    };

    serialize() {
        const serializeData = super.serialize();
        serializeData['content']   = JSON.parse(JSON.stringify(this.content));
        serializeData['maxAmount'] = this.maxAmount;
    };

    deleteItemAll() {
        this.content = null;
    };

    giveItemAll(player) {
        if (!this.content || this.content.type != 'item') return;
        world.getDimension(player.dimension.id).runCommand(`give ${player.name} ${this.content.typeId} ${this.content.amount}`);
        this.deleteItemAll();
    };
};

export class InputPort extends IOPort {
    constructor(parent, portIndex) {
        super(parent, 'inputPort', portIndex);
    };

    serialize() {
        const serializeData = super.serialize();
        serializeData['classType'] = 'InputPort';
        return serializeData;
    };

    static fromJSON(data) {
        const parent   = Main.unitUuidMap.get(data.parentId);
        const port     = new InputPort(parent, data.portIndex);
        port.content   = data.content;
        port.maxAmount = data.maxAmount;
        return port;
    };
};

export class OutputPort extends IOPort {
    constructor(parent, portIndex) {
        super(parent, 'outputPort', portIndex);
    };

    outputItem(amount) {
        if (!this.connectPort || !this.content) return;
        if (this.content.amount < amount) return;
        if (!this.connectPort.content) {
            this.connectPort.setMaxAmount(this.content);
            if (amount > this.connectPort.maxAmount) return;
                this.connectPort.content = {
                    typeId: this.content.typeId,
                    amount: 0,
                    maxAmount: this.connectPort.maxAmount
                };
        }
        else if (
            this.content.typeId != this.connectPort.content.typeId ||
            this.connectPort.content.amount + amount > this.connectPort.maxAmount
        ) return;
        this.connectPort.content.amount += amount;
        this.content.amount             -= amount;
        if (this.content.amount <= 0) this.content = null;
    };

    serialize() {
        const serializeData = super.serialize();
        serializeData['classType'] = 'OutputPort';
        return serializeData;
    };

    static fromJSON(data) {
        const parent   = Main.unitUuidMap.get(data.parentId);
        const port     = new OutputPort(parent, data.portIndex);
        port.content   = data.content;
        port.maxAmount = data.maxAmount;
        return port;
    };
};

export class ElectrodePort extends Port {
    constructor(parent, portIndex) {
        super(parent, 'electrodePort', portIndex);
        this.electrodeType  = this.portData.electrodeType;
        this.powerPerMinute = null;
        this.powerNetwork   = null;
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
