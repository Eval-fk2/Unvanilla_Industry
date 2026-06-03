import * as Utils from './utils';

// First Category ==========================
export class Unit {
    constructor(pos, dimension, direction) {
        this.uuid = Utils.genUuid();
        this.pos = this.pos;
        this.dimension = dimension;
        this.direction = direction;
    };
};
// =========================================


// Second Category - Unit ==================
export class Machine extends Unit {
    constructor(pos, dimension, direction) {
        super(pos, dimension, direction);
    };
};
// =========================================


// Third Category - Machine ================
export class Extraction extends Machine {
    constructor(pos, dimension, direction) {
        super(pos, dimension, direction);
    };
};

export class Generator extends Machine {
    constructor(pos, dimension, direction) {
        super(pos, dimension, direction);
    };
};

export class Production extends Machine {
    constructor(pos, dimension, direction) {
        super(pos, dimension, direction);
    };
};
// =========================================


// Second Category - Unit ==================
export class Transport extends Unit {
    constructor(pos, dimension, direction) {
        super(pos, dimension, direction);
    };
};
// =========================================


// Third Category - Transport ==============
export class Conveyor extends Transport {
    constructor(pos, dimension, direction) {
        super(pos, dimension, direction);
    };
};

export class Pipe extends Transport {
    constructor(pos, dimension, direction) {
        super(pos, dimension, direction);
    };
};
// =========================================