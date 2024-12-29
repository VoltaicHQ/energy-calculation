# energy-calculation
Utils and documentation for calculating energy on Voltaic benchmarks. This is a benchmark-agnostic package for any benchmark that uses the Voltaic energy system. You have to fetch and format scores, and also provide the benchmark data such as score/energy thresholds, categories and scenarios. To understand energy calculation, check out the [tutorial](./energy_tutorial.md), it explains the algorithm and implementation in detail.

## Installation
```bash
npm i energy-calculation
```

## Usage
```javascript
import { tierEnergy } from 'energy-calculation';
import type { Category } from 'energy-calculation';

const tierEnergies = [
  [ 100, 200, 300, 400 ],
  [ 500, 600, 700, 800 ],
  [ 900, 1000, 1100, 1200 ]
]
const currentTierIndex = 1;
const scenarios = [
  {
    thresholds: [575, 650, 750, 850],
    subcategoryId: 1,
    score: 868
  },
  {
    thresholds: [250, 325, 400, 450],
    subcategoryId: 1,
    score: 458
  },
  {
    thresholds: [1250, 1350, 1450, 1525],
    subcategoryId: 2,
    score: 1380
  },
  {
    thresholds: [1200, 1325, 1400, 1475],
    subcategoryId: 2,
    score: 1233
  },
  {
    thresholds: [475, 575, 700, 800],
    subcategoryId: 7,
    score: 718
  },
  {
    thresholds: [575, 675, 775, 850],
    subcategoryId: 7,
    score: 847
  },
  {
    thresholds: [2750, 2975, 3175, 3350],
    subcategoryId: 3,
    score: 3718
  },
  {
    thresholds: [2750, 2975, 3175, 3350],
    subcategoryId: 3,
    score: 3420
  },
  {
    thresholds: [2700, 3000, 3325, 3525],
    subcategoryId: 4,
    score: 3616
  },
  {
    thresholds: [2475, 2775, 3050, 3250],
    subcategoryId: 4,
    score: 3311
  },
  {
    thresholds: [2075, 2325, 2600, 2775],
    subcategoryId: 8,
    score: 2883
  },
  {
    thresholds: [2375, 2650, 2950, 3150],
    subcategoryId: 8,
    score: 3340
  },
  {
    thresholds: [2375, 2650, 2950, 3150],
    subcategoryId: 5,
    score: 2875
  },
  {
    thresholds: [2300, 2500, 2700, 2900],
    subcategoryId: 5,
    score: 2756
  },
  {
    thresholds: [2575, 2725, 2900, 3050],
    subcategoryId: 6,
    score: 3176
  },
  {
    thresholds: [2700, 2850, 2950, 3150],
    subcategoryId: 6,
    score: 3182
  },
  {
    thresholds: [2375, 2600, 2800, 2950],
    subcategoryId: 9,
    score: 3007
  },
  {
    thresholds: [1650, 1900, 2175, 2375],
    subcategoryId: 9,
    score: 2300
  }
];
const categories: Category = [
  {
    id: 1,
    name: 'clicking',
    subcategories: [
      { id: 1, name: 'dynamic' },
      { id: 2, name: 'static' },
      { id: 7, name: 'linear' }
    ]
  },
  {
    id: 2,
    name: 'tracking',
    subcategories: [
      { id: 3, name: 'precise' },
      { id: 4, name: 'reactive' },
      { id: 8, name: 'control' }
    ]
  },
  {
    id: 3,
    name: 'switching',
    subcategories: [
      { id: 5, name: 'speed' },
      { id: 6, name: 'evasive' },
      { id: 9, name: 'stability' }
    ]
  }
];


const energy = tierEnergy(tierEnergies, currentTierIndex, scenarios, categories); // 805
```