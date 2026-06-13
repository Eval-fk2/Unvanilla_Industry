export const furnaceMachineData = {
    typeId:      'furnaceMachine',
    category:    'MACHINE',
    subCategory: 'PRODUCTION',
    displayName: '溶鉱炉',
    animations: {
        
    },
    storages: [
        {
            contentType: 'item',
            maxAmount:   'contentMaxAmount',
            slotCount:   1
        },
        {
            contentType: 'item',
            maxAmount:   'contentMaxAmount',
            slotCount:   1
        }
    ],
    inputPorts: [
        {
            localPos:     {x: 1, y: 0, z: 2},
            face:         'south',
            contentType:  'item',
            storageIndex: 0
        }
    ],
    outputPorts: [
        {
            localPos:     {x: 1, y: 0, z: 0},
            face:         'north',
            contentType:  'item',
            storageIndex: 1
        }
    ],
    electrodePorts: [
        {
            electrodeType: 'consume',
            localPos:      {x: 1, y: 0, z: 2},
            face:          'south'
        }
    ]
};