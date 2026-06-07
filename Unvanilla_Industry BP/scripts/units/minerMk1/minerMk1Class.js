import { world, BlockPermutation, ItemStack } from '@minecraft/server';

import * as Main from '../../main';
import * as Utils from '../../utils';
import * as Slot from '../../slotClass';
import * as PN from '../../powerNetworkClass';
import * as UC from '../../unitClass';
import * as Item from '../../itemData';

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
            inputSlots:     data.inputSlots.map(s => s.serialize()),
            outputSlots:    this.outputSlots.map(s => s.serialize()),
            electrodeSlots: this.electrodeSlots.map(s => s.serialize()),
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
        unit.inputSlots     .map((s, i) => s.content = data.inputSlots[i].content);
        unit.outputSlots    .map((s, i) => s.content = data.outputSlots[i].content);
        unit.electrodeSlots .map((s, i) => s.content = data.electrodeSlots[i].content);
        unit.recipe         = minerMk1Recipe[data.recipeId];
        unit.currentTick    = data.currentTick;
        unit.canProcess     = data.canProcess;
        unit.canCraft       = data.canCraft;
        unit.canOutput      = data.canOutput;
        unit.blockSensor    = data.blockSensor;
        return unit;
    };
};