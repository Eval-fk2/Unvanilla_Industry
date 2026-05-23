import {world} from '@minecraft/server';

export function getId() {
    if (world.getDynamicProperty('id') === undefined) world.setDynamicProperty('id',0);
    let id = world.getDynamicProperty('id');
    world.setDynamicProperty('id',id+1);
    return id;
};

export function initSlots(slotDefs) {
    const slots = []
    for (const def of slotDefs) {
        slots[def.slotIndex] = {
            slotType: def.slotType,
            id: null,
            count: 0
        }
    }
    return slots
};