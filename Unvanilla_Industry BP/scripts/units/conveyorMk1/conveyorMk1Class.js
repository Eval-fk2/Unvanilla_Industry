import { BlockPermutation } from '@minecraft/server';
import { conveyorMk1Data } from './conveyorMk1Data';
import { conveyorMk1Structure } from './conveyorMk1Structure';
import { conveyorMk1Recipe } from './conveyorMk1Recipe';
import { conveyorMk1Form } from './conveyorMk1Form';
import * as Main from '../../../../main';
import * as Utils from '../../../../utils';
import * as PN from '../../../../powerNetwork';

class ConveyorMk1Node {

    static unitData      = conveyorMk1Data;
    static unitStructure = conveyorMk1Structure;
    static unitRecipe    = conveyorMk1Recipe;

    constructor(pos, direction, dimension) {
        this.typeId          = ConveyorMk1Node.unitData.id;
        this.uuid            = `${this.typeId}_${pos.x}_${pos.y}_${pos.z}`;
        this.pos             = pos;
        this.direction       = direction;
        this.dimension       = dimension;
        this.slots           = initSlots(this);
        this.isSlotChanged   = false;
        this.status          = 'IDLE';
        this.powerNetworkId  = null;
        this.currentRecipeId = null;
        this.cycleStartTick  = null;
        this.cycleEndTick    = null;
        this.detectedBlockId = null;

        if (!isRestoring) {
            this.setStructure();
            this.searchConnect();
            this.joinPowerNetwork();
        };

        Main.unitUuidMap.set(this.uuid, this);
    };
};