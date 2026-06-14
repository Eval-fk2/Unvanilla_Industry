import { world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

import * as Utils from '../../utils';

export function conveyorMk1Form(player, unit) {
    const recipeText = Utils.makeRecipeText(unit.unitRecipe, unit.recipe);

    const form = new ActionFormData();
    form.title(unit.unitData.displayName);
    form.body(recipeText);
    form.divider();

    form.button('閉じる');

    for (const port of unit.inputPorts) {
        for (const slot of port.storage.slots) {
            form.button(`input ${port.portIndex}  ${slot.id ?? 'empty'}  ${slot.id ? slot.amount : ''}`);
        };
    };

    for (const port of unit.outputPorts) {
        for (const slot of port.storage.slots) {
            form.button(`output ${port.portIndex}  ${slot.id ?? 'empty'}  ${slot.id ? slot.amount : ''}`);
        };
    };

    const inputStart  = 1;
    const outputStart = 1 + unit.inputPorts.length;

    form.show(player).then(res => {
        if (res.canceled || res.selection === 0) return;

        if (inputStart <= res.selection && res.selection < outputStart) {
            const port = unit.inputPorts[res.selection - inputStart];
            return;
        };

        if (outputStart <= res.selection && res.selection < outputStart + unit.outputPorts.length) {
            const port = unit.outputPorts[res.selection - outputStart];
        };
    });
};
