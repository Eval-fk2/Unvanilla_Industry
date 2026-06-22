import { ItemStack } from '@minecraft/server';

import * as Utils from '../utils';
import * as Item  from '../itemData';

export class Storage {
    constructor(parent, storageIndex) {
        this.parent      = parent;
        this.storageData = this.parent.unitData.storages[storageIndex];
        this.uuid        = `storage_${Utils.genUuid()}`;
        this.slots       = this.initSlots();
    };

    initSlots() {
        return Array.from({ length: this.storageData.slotCount }, () => ({
            id:        null,
            amount:    0,
            maxAmount: null
        }));
    };

    _slotMaxAmount(typeId) {
        if (this.storageData.maxAmount !== 'contentMaxAmount') return this.storageData.maxAmount;
        if (this.storageData.contentType === 'item')  return new ItemStack(typeId).maxAmount;
        if (this.storageData.contentType === 'fluid') return Item.itemData[typeId]?.maxAmount;
    };

    canAdd(typeId, amount) {
        let remaining = amount;
        for (const slot of this.slots) {
            if (!slot.id || slot.id !== typeId) continue;
            remaining -= (slot.maxAmount - slot.amount);
            if (remaining <= 0) return true;
        };
        const maxAmount = this._slotMaxAmount(typeId);
        for (const slot of this.slots) {
            if (slot.id !== null) continue;
            remaining -= maxAmount;
            if (remaining <= 0) return true;
        };
        return false;
    };

    add(typeId, amount) {
        let remaining = amount;
        for (const slot of this.slots) {
            if (!slot.id || slot.id !== typeId) continue;
            const addAmount  = Math.min(slot.maxAmount - slot.amount, remaining);
            slot.amount     += addAmount;
            remaining       -= addAmount;
            if (remaining <= 0) return amount;
        };
        const maxAmount = this._slotMaxAmount(typeId);
        for (const slot of this.slots) {
            if (slot.id !== null) continue;
            const addAmount  = Math.min(maxAmount, remaining);
            slot.id          = typeId;
            slot.amount      = addAmount;
            slot.maxAmount   = maxAmount;
            remaining       -= addAmount;
            if (remaining <= 0) return amount;
        };
        return amount - remaining;
    };

    getAmount(typeId) {
        return this.slots.reduce((sum, slot) => {
            if (slot.id !== typeId) return sum;
            return sum + slot.amount;
        }, 0);
    };

    canRemove(typeId, amount) {
        let total = 0;
        for (const slot of this.slots) {
            if (!slot.id || slot.id !== typeId) continue;
            total += slot.amount;
            if (total >= amount) return true;
        };
        return false;
    };

    remove(typeId, amount) {
        let remaining = amount;
        for (const slot of this.slots) {
            if (!slot.id || slot.id !== typeId) continue;
            const removeAmount = Math.min(slot.amount, remaining);
            slot.amount -= removeAmount;
            remaining   -= removeAmount;
            if (slot.amount <= 0) {
                slot.id        = null;
                slot.amount    = 0;
                slot.maxAmount = null;
            };
            if (remaining <= 0) return amount;
        };
        return amount - remaining;
    };
};
