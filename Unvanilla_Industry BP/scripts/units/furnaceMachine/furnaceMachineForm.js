import { world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

import * as Utils from '../../utils';

export function furnaceMachineForm(player, unit) {
    const recipeText = Utils.makeRecipeText(unit.unitRecipe, unit.recipe);

    const form = new ActionFormData();
    form.title(unit.unitData.displayName);
    form.body(recipeText);
    form.divider();

    form.button('閉じる');
    form.button('レシピを選択する');

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

    const inputStart  = 2;
    const outputStart = 2 + unit.inputPorts.length;

    form.show(player).then(res => {
        if (res.canceled || res.selection === 0) return;

        if (res.selection === 1) {
            furnaceMachineSelectRecipe(player, unit);
            return;
        };

        if (inputStart <= res.selection && res.selection < outputStart) {
            const port = unit.inputPorts[res.selection - inputStart];
            return;
        };

        if (outputStart <= res.selection && res.selection < outputStart + unit.outputPorts.length) {
            const port = unit.outputPorts[res.selection - outputStart];
        };
    });
};

function furnaceMachineSelectRecipe(player, unit) {
    const form = new ActionFormData();
    const recipeIds = Object.keys(unit.unitRecipe);

    form.button('戻る');
    for (const recipeId of recipeIds) {
        if (recipeId !== unit.recipe?.id) form.button(recipeId);
        else form.button(`§a${recipeId}`);
    };

    form.show(player).then(res => {
        if (res.canceled || res.selection === 0) return;
        unit.setRecipe(unit.unitRecipe[recipeIds[res.selection - 1]]);
        player.sendMessage(`レシピを変更しました: ${recipeIds[res.selection - 1]}`);
    });
};
