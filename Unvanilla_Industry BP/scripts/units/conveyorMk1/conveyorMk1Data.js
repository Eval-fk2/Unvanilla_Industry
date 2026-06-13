export const conveyorMk1Data = {
    typeId:      'conveyorMk1',
    category:    'TRANSPORT',
    subCategory: 'CONVEYOR',
    storages: [
        {
            contentType: 'item',
            maxAmount:   1,
            slotCount:   1
        }
    ],
    inputPorts: [
        {
            localPos:     {x: 0, y: 0, z: 0},
            face:         'south',
            storageIndex: 0
        }
    ],
    outputPorts: [
        {
            localPos:     {x: 0, y: 0, z: 0},
            face:         'south',
            storageIndex: 0
        }
    ]
};