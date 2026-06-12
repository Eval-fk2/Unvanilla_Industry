import { world } from '@minecraft/server';

import * as Main from '../../main';
import * as UC from '../../unitClass';

import { minerMk1Data } from './minerMk1Data';
import { minerMk1Structure } from './minerMk1Structure';
import { minerMk1Recipe } from './minerMk1Recipe';
import { minerMk1Form } from './minerMk1Form';

export class MinerMk1 extends UC.Extraction {

    constructor(pos, direction, dimension) {
        super(pos, direction, dimension, minerMk1Data, minerMk1Structure, minerMk1Recipe);
    };

    openUI(player) {
        minerMk1Form(player, this);
    };

    serialize() {
        return {
            classType:      'MinerMk1Node',
            uuid:           this.uuid,
            pos:            this.pos,
            direction:      this.direction,
            dimension:      this.dimension,
            inputPorts:     this.inputPorts.map(p => p.serialize()),
            outputPorts:    this.outputPorts.map(p => p.serialize()),
            electrodePorts: this.electrodePorts.map(p => p.serialize()),
            status:         this.status,
            recipeId:       this.recipe.id,
            currentTick:    this.currentTick,
            canProcess:     this.canProcess,
            canCraft:       this.canCraft,
            canOutput:      this.canOutput,
            blockSensor:    JSON.parse(JSON.stringify(this.blockSensor))
        };
    };

    static fromJSON(data) {
        const dimension     = world.getDimension(data.dimension);
        const unit          = new MinerMk1(data.pos, data.direction, dimension);
        unit.inputPorts     .map((p, i) => p.content = data.inputPorts[i].content);
        unit.outputPorts    .map((p, i) => p.content = data.outputPorts[i].content);
        unit.recipe         = minerMk1Recipe[data.recipeId];
        unit.currentTick    = data.currentTick;
        unit.canProcess     = data.canProcess;
        unit.canCraft       = data.canCraft;
        unit.canOutput      = data.canOutput;
        unit.blockSensor    = data.blockSensor;
        return unit;
    };
};
