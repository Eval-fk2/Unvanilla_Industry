import { ActionFormData } from "@minecraft/server-ui";

import * as Main from '../../../../main';
import * as Utils from '../../../../utils';

export function minerMk1Form(player, minerMk1) {
    const recipeText = Utils.makeRecipeText(minerMk1.unitRecipe, minerMk1.currentRecipeId);

    const form = new ActionFormData();
    form.title(minerMk1.typeId);
    form.body(recipeText);
    form.divider();
    form.button('レシピを選択する');
    form.button('閉じる');
    
    form.show(player).then(res => {
        if (res.canceled) return;
        if (res.selection === 0) minerMk1SelectRecipe(player, minerMk1);
    });
};

function minerMk1SelectRecipe(player, minerMk1) {
    const form = new ActionFormData();
    const recipeIds = Object.keys(minerMk1.unitRecipe);
    form.button('戻る');
    for (const recipeId of recipeIds) {
        if (!Main.unlockedRecipes[recipeId]) continue;
        if (recipeId !== minerMk1.currentRecipeId) form.button(recipeId);
        else form.button(`§a${recipeId}`);
    };
    form.show(player).then(res => {
        if (res.canceled) return;
        minerMk1.currentRecipeId = recipeIds[res.selection-1];
        player.sendMessage(`レシピを変更しました: ${recipeIds[res.selection-1]}`);
    });
};
