import { BlockPermutation } from '@minecraft/server';

import { conveyorMk1Data } from './conveyorMk1Data';
import { conveyorMk1Structure } from './conveyorMk1Structure';
import { conveyorMk1Recipe } from './conveyorMk1Recipe';
import { conveyorMk1Form } from './conveyorMk1Form';

import * as Main from '../../main';
import * as Utils from '../../utils';
import * as PN from '../../powerNetwork';
import * as UC from '../../unitClass';

class ConveyorMk1 extends UC.Conveyor {
    constructor(pos, direction, dimension) {
        super(pos, direction, dimension, conveyorMk1Data, conveyorMk1Structure, conveyorMk1Recipe);
    }; 
};