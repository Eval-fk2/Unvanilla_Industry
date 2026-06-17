import { world, system, ItemStack } from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';

import * as Utils from './utils';
import * as Item  from './itemData';
import { showUnitPreview } from './unitPreview';

import { MinerMk1 }      from './units/minerMk1/minerMk1Class';
import { CoalGenerator } from './units/coalGenerator/coalGeneratorClass';
import { FurnaceMachine } from './units/furnaceMachine/furnaceMachineClass';
import { PowerCable }    from './units/powerCable/powerCableClass';
import { ConveyorMk1 }  from './units/conveyorMk1/conveyorMk1Class';

export const unlockedRecipes = {};
export const unitUuidMap = new Map();
export const unitPosMap = new Map();
export const portUuidMap = new Map();
export const portPosMap = new Map();
export const powerNetworkMap = new Map();

const unitTag = 'uvi:unit';

const unitRegistry = new Map([
    ['uvi:miner_mk1',       MinerMk1],
    ['uvi:coal_generator',  CoalGenerator],
    ['uvi:furnace_machine', FurnaceMachine],
    ['uvi:power_cable',     PowerCable],
    ['uvi:conveyor_mk1',    ConveyorMk1],
]);

const playerCanPlace = new Map();

// プレビュー更新 (5tickごと)
system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const container = player.getComponent('minecraft:inventory')?.container;
        const item      = container?.getItem(player.selectedSlotIndex);
        if (!item?.hasTag(unitTag)) continue;

        const UnitClass = unitRegistry.get(item.typeId);
        if (!UnitClass) continue;

        const result = player.getBlockFromViewDirection({ maxDistance: 8 });
        if (!result?.block) { playerCanPlace.set(player.id, false); continue; }

        const pos       = result.block.location;
        const direction = Utils.changeDirection(player.getViewDirection());
        const canPlace  = showUnitPreview(pos, direction, UnitClass.data, UnitClass.structure, player.dimension);
        playerCanPlace.set(player.id, canPlace);
    }
}, 5);

world.beforeEvents.itemUse.subscribe(ev => {
    const item   = ev.itemStack;
    const player = ev.source;
    if (!item.hasTag(unitTag)) return;

    ev.cancel = true;

    const UnitClass = unitRegistry.get(item.typeId);
    if (!UnitClass) return;
    if (!playerCanPlace.get(player.id)) return;

    const pos = player.getBlockFromViewDirection()?.block?.location;
    if (!pos) return;
    const direction = Utils.changeDirection(player.getViewDirection());
    const unit = new UnitClass(pos, direction, player.dimension);
    unit.setStructure();
    unit.searchConnect();
    unit.onPlace?.();
});

system.runInterval(() => {
    for (const unit of unitUuidMap.values()) {
        unit.tick();
    };
},1);

