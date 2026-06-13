import { ActionFormData } from "@minecraft/server-ui";

import * as Main from '../../main';
import * as Utils from '../../utils';

export function minerMk1Form(player, unit) {
    const recipeText = Utils.makeRecipeText(unit.unitRecipe, unit.recipe);

    const form = new ActionFormData();
    form.title(unit.unitData.typeId);
    form.body(recipeText);
    form.divider();

    form.button('閉じる');
    form.button('レシピを選択する');

    for (const port of unit.inputPorts) {
        form.button(`input ${port.portIndex} ${port.content?.typeId} ${port.content?.amount}`);
    };

    for (const port of unit.outputPorts) {
        form.button(`output ${port.portIndex} ${port.content?.typeId} ${port.content?.amount}`);
    };

    form.show(player).then(res => {
        if (res.canceled) return;
        if (res.selection === 0) return;
        if (res.selection === 1) minerMk1SelectRecipe(player, unit);
        if (2 <= res.selection && res.selection <= unit.inputPorts.length+2) {
            const port = unit.inputPorts[res.selection-2];
            if (port.content.type === 'item') port.giveItemAll(player);
            else if (port.content.type === 'fluid') port.deleteItemAll();
        };
        if (unit.inputPorts.length+3 <= res.selection && res.selection <= unit.inputPorts.length+3+unit.outputPorts.length) {
            const port = unit.outputPorts[res.selection-unit.inputPorts.length+2];
            if (port.content.type === 'item') port.giveItemAll(player);
            else if (port.content.type === 'fluid') port.deleteItemAll();
        };
    });
};

function minerMk1SelectRecipe(player, unit) {
    const form = new ActionFormData();
    const recipeIds = Object.keys(unit.unitRecipe);
    form.button('戻る');
    for (const recipeId of recipeIds) {
        //if (!Main.unlockedRecipes[recipeId]) continue;
        if (recipeId !== unit.recipe.id) form.button(recipeId);
        else form.button(`§a${recipeId}`);
    };
    form.show(player).then(res => {
        if (res.canceled) return;
        if (res.selection === 0) return;
        if (res.selection >= 1) {
            unit.setRecipe(unit.unitRecipe[recipeIds[res.selection-1]]);
            player.sendMessage(`レシピを変更しました: ${recipeIds[res.selection-1]}`);
        };
    });
};
