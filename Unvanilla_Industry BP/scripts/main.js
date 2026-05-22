import { World, System } from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';

class MainNode {
    constructor(id, pos, direction) {
        this.id = id;
        this.pos = pos;
        this.direction = direction;
    };

    serialize() {
        return {
            className: this.constructor.name,
            id: this.id,
            pos: this.pos,
            direction: this.direction
        };
    };
};

class TransportNode extends MainNode {
    constructor(id, pos, direction, transportType) {
        super(id, pos, direction);
        this.transportType = transportType;
    };
};
