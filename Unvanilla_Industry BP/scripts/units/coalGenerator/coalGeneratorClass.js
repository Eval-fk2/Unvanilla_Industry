import { world } from '@minecraft/server';

import * as Main from '../../main';
import * as UC from '../../unitClass';

import { coalGeneratorData } from './coalGeneratorData';
import { coalGeneratorStructure } from './coalGeneratorStructure';
import { coalGeneratorRecipe } from './coalGeneratorRecipe';
import { coalGeneratorForm } from './coalGeneratorForm';

export class CoalGenerator extends UC.Generator {

    constructor(pos, direction, dimension) {
        super(pos, direction, dimension, coalGeneratorData, coalGeneratorStructure, coalGeneratorRecipe);
    };

    openUI(player) {
        coalGeneratorForm(player, this);
    };

    serialize() {
        return {
            classType:      'CoalGenerator',
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
            canOutput:      this.canOutput
        };
    };

    static fromJSON(data) {
        const dimension     = world.getDimension(data.dimension);
        const unit          = new CoalGenerator(data.pos, data.direction, dimension);
        unit.inputPorts     .map((p, i) => p.content = data.inputPorts[i].content);
        unit.outputPorts    .map((p, i) => p.content = data.outputPorts[i].content);
        unit.recipe         = coalGeneratorRecipe[data.recipeId];
        unit.currentTick    = data.currentTick;
        unit.canProcess     = data.canProcess;
        unit.canCraft       = data.canCraft;
        unit.canOutput      = data.canOutput;
        return unit;
    };
};
