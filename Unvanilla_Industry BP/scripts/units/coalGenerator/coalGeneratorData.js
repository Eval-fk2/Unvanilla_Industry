export const coalGeneratorData = {
    typeId:      'coalGenerator',
    category:    'MACHINE',
    subCategory: 'PRODUCTION',
    displayName: '石炭発電機',
    animations: {
        
    },
    storages: [
        {
            contentType: 'item',
            maxAmount:   'contentMaxAmount',
            slotCount:   1
        }
    ],
    inputPorts: [
        {
            localPos:     {x: 1, y: 0, z: 0},
            face:         'north',
            contentType:  'item',
            storageIndex: 0
        }
    ],
    outputPorts: [],
    electrodePorts: [
        {
            electrodeType: 'generate',
            localPos:      {x: 1, y: 0, z: 2},
            face:          'south'
        }
    ]
};