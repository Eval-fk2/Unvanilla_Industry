export const minerMk1Data = {
    id: 'minerMk1',
    type: 'EXTRACTION',
    displayName: '採掘機Mk1',
    blockSensor: {x: 1, y: 0, z: 1},
    slots: [
        {
            slotType: 'IOSlot',
            ioType: 'output',
            contentType: 'item',
            localPos: {x: 1, y: 0, z: 0},
            face: 'north',
            maxAmount: 'contentMaxAmount',
            slotIndex: 0
        },
        {
            slotType: 'electrodeSlot',
            electrodeType: 'consume',
            localPos: {x: 1, y: 0, z: 2},
            face: 'south',
            slotIndex: 0
        }
    ]
};