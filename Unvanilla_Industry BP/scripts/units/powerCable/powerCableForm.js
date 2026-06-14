import { world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

import * as Utils from '../../utils';

export function powerCableForm(player, unit) {
    const txt = `
    uuid: ${unit.uuid}\n
    consume: ${unit.consumptionPerMinute}\n
    generate: ${unit.generationPerMinute}\n
    unitCount: ${unit.members.length}\n
    isPowered: ${unit.isPowered}
    `;
    const form = new ActionFormData();
    form.title(unit.unitData.displayName);
    form.body(txt);
    form.divider();

    form.button('閉じる');

    form.show(player).then(res => {
        if (res.canceled || res.selection === 0) return;
    });
};
