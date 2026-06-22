import { world, system, ItemStack }      from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';

import * as Utils          from './utils';
import * as Item           from './itemData';
import { showUnitPreview } from './unitPreview';

import { MinerMk1 }       from './units/minerMk1/minerMk1Class';
import { CoalGenerator }  from './units/coalGenerator/coalGeneratorClass';
import { FurnaceMachine } from './units/furnaceMachine/furnaceMachineClass';
import { PowerCable }     from './units/powerCable/powerCableClass';
import { ConveyorMk1 }    from './units/conveyorMk1/conveyorMk1Class';

export const unlockedRecipes = {};
export const unitUuidMap     = new Map();
export const unitPosMap      = new Map();
export const portUuidMap     = new Map();
export const portPosMap      = new Map();
export const powerNetworkMap = new Map();

const unitTag = 'uvi:unit';

const unitRegistry = new Map([
    ['uvi:miner_mk1',       MinerMk1],
    ['uvi:coal_generator',  CoalGenerator],
    ['uvi:furnace_machine', FurnaceMachine],
    ['uvi:power_cable',     PowerCable],
    ['uvi:conveyor_mk1',    ConveyorMk1],
]);

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const container = player.getComponent('minecraft:inventory')?.container;
        const item      = container?.getItem(player.selectedSlotIndex);
        if (!item?.hasTag(unitTag)) continue;

        const UnitClass = unitRegistry.get(item.typeId);
        if (!UnitClass) continue;

        const pos       = player.getBlockFromViewDirection({ maxDistance: 8 }).faceLocation;
        const direction = Utils.changeDirection(player.getViewDirection());
        const canPlace  = showUnitPreview(pos, direction, UnitClass.data, UnitClass.structure, player.dimension);
    };
}, 1);

world.beforeEvents.itemUse.subscribe(ev => {
    const item   = ev.itemStack;
    const player = ev.source;
    if (!item.hasTag(unitTag)) return;
    ev.cancel = true;

    system.run(() => {
        const UnitClass = unitRegistry.get(item.typeId);
        if (!UnitClass) return;

        const pos       = player.getBlockFromViewDirection({maxDistance: 8}).faceLocation;
        const direction = Utils.changeDirection(player.getViewDirection());

        if (!checkCanPlace(player.dimension, pos, direction, UnitClass.structure)) return;

        const unit = new UnitClass(pos, direction, player.dimension);
        unit.onPlace();

        const container = player.getComponent('inventory').container;
        if (item.amount > 1) container.setItem(player.selectedSlotIndex, new ItemStack(item.typeId, item.amount - 1));
        else                 container.setItem(player.selectedSlotIndex, undefined);
    });
});

system.runInterval(() => {
    for (const unit of unitUuidMap.values()) {
        unit.tick();
    };
},1);

export function checkCanPlace(dimension, pos, direction, unitStructure) {
    for (const blockData of unitStructure.blocks) {
        const blockPos    = Utils.rotatePos(blockData.localPos, unitStructure.centerOffset, pos, direction);
        const placedBlock = dimension.getBlock(blockPos);
        const entity = dimension.getEntitiesAtBlockLocation(blockPos);
        if (placedBlock?.typeId !== 'minecraft:air' || entity) return false;
    };
    return true;
};
