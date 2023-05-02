

const dungeons1 = [
    {
        "key": "P0",
        "value": {
            "exitsIds": [
                "P0",
                "P1",
                "P2"
            ],
            "id": "P0",
            "description": "PassageWay between P0, P1, P2, dimension: 10Lx10W",
            "transform": {
                "length": 10,
                "width": 10,
                "height": 10,
                "center": {
                    "x": 5,
                    "y": 5
                },
                "position": {
                    "x": 0,
                    "y": 0,
                    "z": 0
                },
                "direction": "East"
            }
        }
    },
    {
        "key": "C1",
        "value": {
            "shape": 3,
            "isLarge": false,
            "exitsIds": [
                "P0",
                "P3"
            ],
            "id": "C1",
            "description": "Chamber, shape:Rectangle,size: Normal,dimension: 20Lx30W, exits: 2",
            "transform": {
                "length": 20,
                "width": 30,
                "height": 10,
                "center": {
                    "x": 13.3,
                    "y": -20
                },
                "position": {
                    "x": -1.6999999999999993,
                    "y": -30,
                    "z": 0
                },
                "direction": "North"
            }
        }
    },
    {
        "key": "C2",
        "value": {
            "shape": 3,
            "isLarge": false,
            "exitsIds": [
                "P1"
            ],
            "id": "C2",
            "description": "Chamber, shape:Rectangle,size: Normal,dimension: 30Lx40W, exits: 1",
            "transform": {
                "length": 30,
                "width": 40,
                "height": 10,
                "center": {
                    "x": 10.4,
                    "y": 25
                },
                "position": {
                    "x": -9.6,
                    "y": 10,
                    "z": 0
                },
                "direction": "South"
            }
        }
    },
    {
        "key": "C3",
        "value": {
            "shape": 1,
            "isLarge": true,
            "exitsIds": [
                "P2",
                "P4"
            ],
            "id": "C3",
            "description": "Chamber, shape:Circle,size: Large,radius: 50, exits: 2",
            "transform": {
                "length": 50,
                "width": 50,
                "height": 10,
                "center": {
                    "x": -25,
                    "y": 3.8500000000000014
                },
                "position": {
                    "x": -50,
                    "y": -21.15,
                    "z": 0
                },
                "direction": "West"
            }
        }
    },
    {
        "key": "C4",
        "value": {
            "shape": 3,
            "isLarge": false,
            "exitsIds": [
                "P3",
                "P5"
            ],
            "id": "C4",
            "description": "Chamber, shape:Rectangle,size: Normal,dimension: 20Lx30W, exits: 2",
            "transform": {
                "length": 20,
                "width": 30,
                "height": 10,
                "center": {
                    "x": 17.9,
                    "y": 10
                },
                "position": {
                    "x": 2.9000000000000004,
                    "y": 0,
                    "z": 0
                },
                "direction": "South"
            }
        }
    },
    {
        "key": "C5",
        "value": {
            "shape": 2,
            "isLarge": false,
            "exitsIds": [
                "P4"
            ],
            "id": "C5",
            "description": "Chamber, shape:Square,size: Normal,dimension: 20Lx20W, exits: 1",
            "transform": {
                "length": 20,
                "width": 20,
                "height": 10,
                "center": {
                    "x": -60,
                    "y": 2.6000000000000014
                },
                "position": {
                    "x": -70,
                    "y": -7.399999999999999,
                    "z": 0
                },
                "direction": "West"
            }
        }
    },
    {
        "key": "C6",
        "value": {
            "shape": 2,
            "isLarge": false,
            "exitsIds": [
                "P5",
                "D6"
            ],
            "id": "C6",
            "description": "Chamber, shape:Square,size: Normal,dimension: 20Lx20W, exits: 2",
            "transform": {
                "length": 20,
                "width": 20,
                "height": 10,
                "center": {
                    "x": 32.9,
                    "y": -1.8500000000000014
                },
                "position": {
                    "x": 22.9,
                    "y": -11.850000000000001,
                    "z": 0
                },
                "direction": "East"
            }
        }
    },
    {
        "key": "C7",
        "value": {
            "shape": 2,
            "isLarge": false,
            "exitsIds": [
                "D6"
            ],
            "id": "C7",
            "description": "Chamber, shape:Square,size: Normal,dimension: 40Lx40W, exits: 1",
            "transform": {
                "length": 40,
                "width": 40,
                "height": 10,
                "center": {
                    "x": 62.9,
                    "y": 0.8499999999999979
                },
                "position": {
                    "x": 42.9,
                    "y": -19.150000000000002,
                    "z": 0
                },
                "direction": "East"
            }
        }
    }
];

const exits1 = [
    {
        "key": "P0",
        "value": {
            "exitType": 2,
            "roomIds": [
                "P0",
                "C1"
            ],
            "id": "P0",
            "description": "Passage between rooms: P0, C1. 0Lx5W",
            "transform": {
                "length": 0,
                "width": 5,
                "height": 10,
                "center": {
                    "x": 10.8,
                    "y": 0
                },
                "position": {
                    "x": 8.3,
                    "y": 0,
                    "z": 0
                },
                "direction": "North"
            }
        }
    },
    {
        "key": "P1",
        "value": {
            "exitType": 2,
            "roomIds": [
                "P0",
                "C2"
            ],
            "id": "P1",
            "description": "Passage between rooms: P0, C2. 0Lx5W",
            "transform": {
                "length": 0,
                "width": 5,
                "height": 10,
                "center": {
                    "x": 7.9,
                    "y": 10
                },
                "position": {
                    "x": 5.4,
                    "y": 10,
                    "z": 0
                },
                "direction": "South"
            }
        }
    },
    {
        "key": "P2",
        "value": {
            "exitType": 2,
            "roomIds": [
                "P0",
                "C3"
            ],
            "id": "P2",
            "description": "Passage between rooms: P0, C3. 0Lx5W",
            "transform": {
                "length": 0,
                "width": 5,
                "height": 10,
                "center": {
                    "x": 0,
                    "y": 6.35
                },
                "position": {
                    "x": 0,
                    "y": 3.8499999999999996,
                    "z": 0
                },
                "direction": "West"
            }
        }
    },
    {
        "key": "P3",
        "value": {
            "exitType": 2,
            "roomIds": [
                "C1",
                "C4"
            ],
            "id": "P3",
            "description": "Passage between rooms: C1, C4. 0Lx5W",
            "transform": {
                "length": 0,
                "width": 5,
                "height": 10,
                "center": {
                    "x": 15.4,
                    "y": 0
                },
                "position": {
                    "x": 12.9,
                    "y": 0,
                    "z": 0
                },
                "direction": "South"
            }
        }
    },
    {
        "key": "P4",
        "value": {
            "exitType": 2,
            "roomIds": [
                "C3",
                "C5"
            ],
            "id": "P4",
            "description": "Passage between rooms: C3, C5. 0Lx5W",
            "transform": {
                "length": 0,
                "width": 5,
                "height": 10,
                "center": {
                    "x": -50,
                    "y": 5.100000000000001
                },
                "position": {
                    "x": -50,
                    "y": 2.6000000000000014,
                    "z": 0
                },
                "direction": "West"
            }
        }
    },
    {
        "key": "P5",
        "value": {
            "exitType": 2,
            "roomIds": [
                "C4",
                "C6"
            ],
            "id": "P5",
            "description": "Passage between rooms: C4, C6. 0Lx5W",
            "transform": {
                "length": 0,
                "width": 5,
                "height": 10,
                "center": {
                    "x": 22.9,
                    "y": 0.6499999999999986
                },
                "position": {
                    "x": 22.9,
                    "y": -1.8500000000000014,
                    "z": 0
                },
                "direction": "East"
            }
        }
    },
    {
        "key": "D6",
        "value": {
            "id": "D6",
            "transform": {
                "length": 0,
                "width": 5,
                "height": 10,
                "center": {
                    "x": 42.9,
                    "y": 3.3499999999999988
                },
                "position": {
                    "x": 42.9,
                    "y": 0.8499999999999988,
                    "z": 0
                },
                "direction": "East"
            },
            "exitType": 1,
            "doorType": 3,
            "isLocked": false,
            "isSecret": false,
            "isTrap": true,
            "roomIds": [
                "C6",
                "C7"
            ],
            "description": "Door Type: Stone,\n         Trapped,\n        "
        }
    }
]