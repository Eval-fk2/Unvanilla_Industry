import { ActionFormData } from "@minecraft/server-ui";

import * as Main from '../../main';
import * as Utils from '../../utils';

export function conveyorMk1Form(player, unit) {
    const recipeText = Utils.makeRecipeText(unit.unitRecipe, unit.recipe);

    const form = new ActionFormData();
    form.title(unit.unitData.typeId);
    form.body(recipeText);
    form.divider();

    form.button('閉じる');

    for (const port of unit.inputPorts) {
        form.button(`input ${port.portIndex} ${port.content?.typeId} ${port.content?.amount}`);
    };

    for (const port of unit.outputPorts) {
        form.button(`output ${port.portIndex} ${port.content?.typeId} ${port.content?.amount}`);
    };

    form.show(player).then(res => {
        if (res.canceled) return;
        if (res.selection === 0) return;
        if (1 <= res.selection && res.selection <= unit.inputPorts.length+1) {
            const port = unit.inputPorts[res.selection-1];
            if (port.content.type === 'item') port.giveItemAll(player);
            else if (port.content.type === 'fluid') port.deleteItemAll();
        };
        if (unit.inputPorts.length+2 <= res.selection && res.selection <= unit.inputPorts.length+2+unit.outputPorts.length) {
            const port = unit.outputPorts[res.selection-unit.inputPorts.length+2];
            if (port.content.type === 'item') port.giveItemAll(player);
            else if (port.content.type === 'fluid') port.deleteItemAll();
        };
    });
};
