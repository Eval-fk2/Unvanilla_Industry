export const minerMk1Data = {
    typeId: 'minerMk1',
    category: 'MACHINE',
    subCategory: 'EXTRACTION',
    displayName: '採掘機Mk1',
    blockSensor: {
        miningLv1: [
            {x: 1, y: 0, z: 1}
        ],
        miningLv2: [
            {x: 1, y: 1, z: 1}
        ],
        miningLv3: [
            {x: 1, y: 2, z: 1}
        ]
    },
    animations: {
        mining: [
            {localPos: {x: 0, y: 1, z: 1}, frames: [0, 1, 2, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]},
            {localPos: {x: 2, y: 1, z: 1}, frames: [0, 1, 2, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]},
            {localPos: {x: 0, y: 2, z: 1}, frames: [3, 4, 5, 6, 7, 8]},
            {localPos: {x: 2, y: 2, z: 1}, frames: [3, 4, 5, 6, 7, 8]}
        ]
    },
    storages: [
        {
            contentType: 'item',
            storageSlotCount: 1
        }
    ],
    inputSlots: [],
    outputSlots: [
        {
            contentType: 'item',
            localPos: {x: 1, y: 0, z: 0},
            face: 'north',
            maxAmount: 'contentMaxAmount'
        }
    ],
    electrodeSlots: [
        {
            electrodeType: 'consume',
            localPos: {x: 1, y: 0, z: 2},
            face: 'south'
        }
    ]
};