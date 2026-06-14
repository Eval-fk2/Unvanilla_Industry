import { BlockPermutation } from '@minecraft/server';

import { powerCableData } from './powerCableData';
import { powerCableStructure } from './powerCableStructure';
import { powerCableForm } from './powerCableForm';

import * as Main from '../../main';
import * as Utils from '../../utils';
import * as PN from '../../powerNetwork';
import * as UC from '../../unitClass';

class PowerCable extends UC.Cable {
    constructor(pos, direction, dimension) {
        super(pos, direction, dimension, powerCableData, powerCableStructure);
        this.powerNetwork = null;
    };
};