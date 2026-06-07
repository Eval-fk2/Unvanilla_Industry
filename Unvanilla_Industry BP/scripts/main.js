import { world, system, ItemStack } from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';

import * as Utils from './utils';
import * as Item from './itemData';

import { MinerMk1 } from './units/minerMk1/minerMk1Class';

export const unlockedRecipes = {};
export const unitUuidMap = new Map();
export const unitPosMap = new Map();
export const slotUuidMap = new Map();
export const slotPosMap = new Map();
export const powerNetworkMap = new Map();

const unitTag = 'uvi:unit'

world.beforeEvents.itemUse.subscribe(ev => {
    const item = ev.itemStack;
    const player = ev.source;
    if (item.hasTag(unitTag)) {
        const pos = player.getBlockFromViewDirection().block.location;
        const direction = Utils.changeDirection(player.getViewDirection());
        switch(item.typeId) {
            case 'uvi:miner_mk1': {
                const unit = new MinerMk1(pos, direction, player.dimension);
                unit.setStructure();
                unit.searchConnect();
                unit.updateBlockSensor();
                break;
            };
        };
    };
});

system.runInterval(() => {
    for (const unit of unitUuidMap.values()) {
        unit.tick();
    };
},1);