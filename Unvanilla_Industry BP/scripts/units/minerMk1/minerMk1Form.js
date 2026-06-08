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

    for (const slot of unit.inputSlots) {
        form.button(`input ${slot.slotIndex} ${slot.content?.typeId} ${slot.content?.amount}`);
    };

    for (const slot of unit.outputSlots) {
        form.button(`output ${slot.slotIndex} ${slot.content?.typeId} ${slot.content?.amount}`);
    };
    
    form.show(player).then(res => {
        if (res.canceled) return;
        if (res.selection === 0) return;
        if (res.selection === 1) minerMk1SelectRecipe(player, unit);
        if (2 <= res.selection && res.selection <= unit.inputSlots.long+2) {
            const slot = unit.inputSlots[res.selection-2];
            if (slot.content.type === 'item') slot.giveItemAll(player);
            else if (slot.content.type === 'fluid') slot.deleteItemAll();
        };
        if (unit.inputSlots.long+3 <= res.selection && res.selection <= unit.inputSlots.long+3+unit.outputSlots.long) {
            const slot = unit.outputSlots[res.selection-unit.inputSlots.long+2];
            if (slot.content.type === 'item') slot.giveItemAll(player);
            else if (slot.content.type === 'fluid') slot.deleteItemAll();
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
