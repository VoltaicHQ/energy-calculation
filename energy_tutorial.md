# Energy calculation on Voltaic benchmarks

## Introduction
VT benchmarks use energy to define your skill level across all the different types of aiming, and ranks are assigned based on your energy. Here we will explain in detail how energy is calculated on the google spreadsheets, and will translate the formulas to typescript.

We'll use the following vocabulary:
- Tier: a level of difficulty (e.g. Novice, Intermediate, Advanced) as a section of a benchmark. Tiers usually have different scenarios, ranging in difficulty. The norm is to have the same amount of ranks in each tier, but it's not mandatory.
- Category: a high-level grouping of scenarios based on the aiming type being tested, such as clicking, tracking, etc.
- Subcategory: a more granular grouping of scenarios, such as dynamic clicking or static clicking. Categories are made up of subcategories.
- Score thresholds: the score targets to hit certain rank for each scenario. The amount of thresholds for a scenario equals the amount of ranks in the corresponding tier.
- Subcategory energy: a metric that derives from your scores in the subcategory scenarios, and is used to determine your skill level for that type of aiming. Only the best ranking score in a subcategory is used to calculate the subcategory energy.
- (Overall) energy: an average of your subcategory energies, with lower values weighted more heavily (harmonic mean). Overall energy is used to obtain a rank in a benchmark.

The rough pipeline is as follows:
0. Select your difficulty tier.
1. Hit a certain score in a scenario from that tier's playlist.
2. If the score is higher than some of the thresholds, it rewards you with energy according to the rank of the threshold.
3. If the energy gained is the highest in the subcategory, it becomes the subcategory energy.
4. When all the subcategory energies are above zero (you played at least one of the scenarios in each subcategory), the overall energy is calculated as the harmonic mean of the subcategory energies.
5. The overall energy is used to determine your rank in the current tier. Your energy is capped to the maximum energy of the tier, which equals the lowest rank's energy of the next tier. This way you can't skip ranks by playing only the easiest scenarios. Note: the modern approach is to subtract 1 from that energy cap, so that e.g. masters can't reach the same energy as grandmasters. This is done to make the ranks more distinguishable and to prevent collisions on the leaderboards. Spreadsheets historically don't do this, but it's a good practice to follow.

## Deconstructing the spreadsheet formula
Let's take a look a the formulas used in the example [kvks s5 beta spreadsheet](https://docs.google.com/spreadsheets/d/1kVz1qmOupLsHzxecl9g6wm2P9almZu3S2J1E0CaXHjA/edit?gid=2113878669#gid=2113878669).
You can see that even having more than a half above-platinum subcategories won't help against the drag of unranked subcategories. However, even those provide us with some energy, so you are not forced to score a minimum rank in every subcategory.

### Overall energy
The overall energy in H2 has the following formula:
```excel
=iferror(trunc(harmean(H3:H20)), 0)
```

The `harmean` function calculates the harmonic mean of the values in the range H3:H20 (subcategory energies). The `trunc` function rounds the result down to the nearest integer. The `iferror` wrapper is used to return 0 if some of the subcategory energies are missing.
The code for this cell in typescript would look like this:
```typescript
function harmonicMean(values: number[]): number {
  if (!values.every((value) => value > 0)) {
    return NaN;
  }
  return values.length / values.reduce((sum, value) => sum + 1 / value, 0);
}

function harmonicMeanOfSubcategoryEnergies(subcategoryEnergies: number[]): number {
  return Math.floor(harmonicMean(subcategoryEnergies));
}
```

### Subcategory energy
The subcategory energy in H3-H4 has the following formula:
```excel
=trunc(
  min(
    Advanced!M$2,
    max(
      choose(match(F3, {0, M3-(N3-M3), M3:P3}), 0, Novice!P$2, M$2, N$2, O$2, P$2)
        + (F3 - choose(match(F3, {0, M3-(N3-M3), M3:P3}), 0, M3-(N3-M3), M3, N3, O3, P3))
        / choose(match(F3, {0, M3-(N3-M3), M3:P3}), M3-(N3-M3), N3-M3, N3-M3, O3-N3, P3-O3, P3-O3)
        * choose(match(F3, {0, M3-(N3-M3), M3:P3}), Novice!P$2, M$2-Novice!P$2, N$2-M$2, O$2-N$2, P$2-O$2, P$2-O$2),

      choose(match(F4, {0, M4-(N4-M4), M4:P4}), 0, Novice!P$2, M$2, N$2, O$2, P$2)
        + (F4 - choose(match(F4, {0, M4-(N4-M4), M4:P4}), 0, M4-(N4-M4), M4, N4, O4, P4))
        / choose(match(F4, {0, M4-(N4-M4), M4:P4}), M4-(N4-M4), N4-M4, N4-M4, O4-N4, P4-O4, P4-O4)
        * choose(match(F4, {0, M4-(N4-M4), M4:P4}), Novice!P$2, M$2-Novice!P$2, N$2-M$2, O$2-N$2, P$2-O$2, P$2-O$2)
    )
  )
)
```

That's a lot to unwrap! Let's break it down bottom-up. Let's start from the innermost formula (both of them are identical, referring to different scenarios in rows 3 and 4):
```excel
choose(match(F3, {0, M3-(N3-M3), M3:P3}), 0, Novice!P$2, M$2, N$2, O$2, P$2)
  + (F3 - choose(match(F3, {0, M3-(N3-M3), M3:P3}), 0, M3-(N3-M3), M3, N3, O3, P3))
  / choose(match(F3, {0, M3-(N3-M3), M3:P3}), M3-(N3-M3), N3-M3, N3-M3, O3-N3, P3-O3, P3-O3)
  * choose(match(F3, {0, M3-(N3-M3), M3:P3}), Novice!P$2, M$2-Novice!P$2, N$2-M$2, O$2-N$2, P$2-O$2, P$2-O$2)
```
We can easily spot similar expressions above, let's figure out what they mean, knowing that:
- F3 is the score in the scenario
- Thresholds are in M3:P3 (660, 760, 850, 940)
- Energies required for ranks are in M2:P2 (500, 600, 700, 800)
- The energy for the last rank from the previous tier is in Novice!P$2 (400)

```excel
match(F3, {0, M3-(N3-M3), M3:P3})
```
This function returns the index of the first element in the array that is less or equal to the score in F3. The array values here are: 0, (660 - (760 - 660)), 660, 760, 850, 940. If the score is less than 660, it returns 0, if it's between 660 and 760, it returns 1, etc.
As you can see, **there's a ghost rank threshold being injected** between 0 and the threhold for Platinum. This is done on purpose! Without this hidden threshold we would have a flat energy distribution for scores between 0 and 660, which means it would be possible to earn "free" energy by scoring much lower than plat. This way, for example, a novice player could've earned more energy on Intermediate with low effort than on Novice with high effort, along with other unintended consequences. So with this hidden threshold, you gain decent energy around imaginary "gold" threshold, and below it the amount of energy gained drops significantly.
Here's the code for this part (note that spreadsheet indexes are 1-based, while arrays in js/ts are 0-based):
```typescript
// let's call the thresholds with added ghost rank "extended thresholds"
interface Scenario {
  thresholds: number[];
  score: number;
}
type TierEnergies = number[]; // energies required for each rank in the tier

function generateScenarioExtendedThresholds(
  scenario: Scenario,
  currentTierIndex: number,
): number[] {
  const ghostRankThreshold = scenario.thresholds[0] - (scenario.thresholds[1] - scenario.thresholds[0]);
  const extendedThresholds = [0];
  if (currentTierIndex !== 0) {
    // Looking at the Novice sheet you can notice that the ghost rank threshold is not added for the first tier, so we need to check that here
    extendedThresholds.push(ghostRankThreshold);
  }
  extendedThresholds.push(...scenario.thresholds);
  return extendedThresholds;
}

const extendedThresholds = generateScenarioExtendedThresholds(scenario, currentTierIndex);
const scenarioExtendedThresholdsIndex = extendedThresholds.findLastIndex((threshold: number) => scenario.score >= threshold);
```

Now we can figure out the meaning of the first line:
```excel
choose(scenarioExtendedThresholdsIndex, 0, Novice!P$2, M$2, N$2, O$2, P$2)
```
The `choose` function returns the value at the index of the first argument, like accessing an array element at certain index: `arr[i]`. But what is this array? It's a list of energies required for each rank in the tier, plus a ghost rank being the last rank of the previous tier. So, if `0, M3-(N3-M3), M3:P3` was an array of score thresholds, then `0, Novice!P$2, M$2, N$2, O$2, P$2` is an array of energies associated with those thresholds. Which means this whole expression results in the bare minimum energy for **the rank you reached with your score**. Let's translate this to typescript:
```typescript
// ranks with added ghost rank will be called "extended ranks". These energies are the same for all scenarios in the tier.
function generateExtendedRankEnergies(
  tiers: TierEnergies[],
  currentTierIndex: number
): number[] {
  const extendedRankEnergies = [0];
  if (currentTierIndex !== 0) {
    // Same as with the thresholds, we need to check if we're not on the first tier
    const previousTierLastRankEnergy = Math.max(...tiers[currentTierIndex - 1]);
    extendedRankEnergies.push(previousTierLastRankEnergy);
  }
  extendedRankEnergies.push(...tiers[currentTierIndex]);
  return extendedRankEnergies;
}

const extendedRankEnergies = generateExtendedRankEnergies(tiers, currentTierIndex);
const scenarioExtendedRankEnergy = extendedRankEnergies[scenarioExtendedThresholdsIndex];
```

The second line should be easier to understand now:
```excel
(F3 - choose(scenarioExtendedThresholdsIndex, 0, M3-(N3-M3), M3, N3, O3, P3))
```
This is the difference between your score and the threshold of the rank you reached. This is the amount of score you have above the threshold, which is then used to calculate the energy you gain above the minimum energy for the rank you reached. Code:
```typescript
const scoreAboveThreshold = scenario.score - extendedThresholds[scenarioExtendedThresholdsIndex];
```

On to the third line:
```excel
choose(scenarioExtendedThresholdsIndex, M3-(N3-M3), N3-M3, N3-M3, O3-N3, P3-O3, P3-O3)
```
This is the difference between the reached score threshold and the next one. For Pasu score of 900 this is basically "940 - 850 = 90". For the ghost rank it should've been `M3-(N3-M3) - 0`, but the unnecessary subtraction is omitted. So to replicate that in our code let's first generate the differences between the thresholds, and then get the difference for the rank you reached.
> **Note: the last threshold difference is duplicated!** This allows us to calculate energy for scores above the last threshold, and to cap it somewhere. This is what allows us to have 900 energy - the ghost rank on the upper end of the tier. Code:
```typescript
const extendedThresholdDifferences = extendedThresholds.map((threshold, i) => i === extendedThresholds.length - 1 ? threshold - extendedThresholds[i - 1] : extendedThresholds[i + 1] - threshold);
const scenarioExtendedThresholdDifference = extendedThresholdDifferences[scenarioExtendedThresholdsIndex];
```

The last line:
```excel
choose(scenarioExtendedThresholdsIndex, previousTierLastRankEnergy, M$2-previousTierLastRankEnergy, N$2-M$2, O$2-N$2, P$2-O$2, P$2-O$2)
```
This is the difference between the energy required for the rank you reached and the next one, similar to the previous expression, but for energies. As you can see, the last value is also duplicated. Code:
```typescript
const extendedRankEnergiesDifferences = extendedRankEnergies.map((energy, i) => i === extendedRankEnergies.length - 1 ? energy - extendedRankEnergies[i - 1] : extendedRankEnergies[i + 1] - energy);
const scenarioExtendedRankEnergyDifference = extendedRankEnergiesDifferences[scenarioExtendedThresholdsIndex]
```

Finally, let's put it all together! The original huge formula:
```excel
choose(match(F3, {0, M3-(N3-M3), M3:P3}), 0, Novice!P$2, M$2, N$2, O$2, P$2)
  + (F3 - choose(match(F3, {0, M3-(N3-M3), M3:P3}), 0, M3-(N3-M3), M3, N3, O3, P3))
  / choose(match(F3, {0, M3-(N3-M3), M3:P3}), M3-(N3-M3), N3-M3, N3-M3, O3-N3, P3-O3, P3-O3)
  * choose(match(F3, {0, M3-(N3-M3), M3:P3}), Novice!P$2, M$2-Novice!P$2, N$2-M$2, O$2-N$2, P$2-O$2, P$2-O$2)
```
can now be translated to:
```typescript
function uncappedScenarioEnergy(
  scenario: Scenario,
  tiers: TierEnergies[],
  currentTierIndex: number
): number {
  // 0, M3-(N3-M3), M3:P3
  const extendedThresholds = generateScenarioExtendedThresholds(scenario, currentTierIndex);
  // match(F3, {0, M3-(N3-M3), M3:P3})
  const scenarioExtendedThresholdsIndex = extendedThresholds.findLastIndex((threshold: number) => scenario.score >= threshold);

  // 0, Novice!P$2, M$2, N$2, O$2, P$2
  const extendedRankEnergies = generateExtendedRankEnergies(tiers, currentTierIndex);
  // choose(match(F3, {0, M3-(N3-M3), M3:P3}), 0, Novice!P$2, M$2, N$2, O$2, P$2)
  const scenarioExtendedRankEnergy = extendedRankEnergies[scenarioExtendedThresholdsIndex];

  // (F3 - choose(match(F3, {0, M3-(N3-M3), M3:P3}), 0, M3-(N3-M3), M3, N3, O3, P3))
  const scoreAboveThreshold = scenario.score - extendedThresholds[scenarioExtendedThresholdsIndex];

  // M3-(N3-M3), N3-M3, N3-M3, O3-N3, P3-O3, P3-O3
  const extendedThresholdDifferences = extendedThresholds.map((threshold, i) => i === extendedThresholds.length - 1 ? threshold - extendedThresholds[i - 1] : extendedThresholds[i + 1] - threshold);
  // choose(match(F3, {0, M3-(N3-M3), M3:P3}), M3-(N3-M3), N3-M3, N3-M3, O3-N3, P3-O3, P3-O3)
  const scenarioExtendedThresholdDifference = extendedThresholdDifferences[scenarioExtendedThresholdsIndex];

  // Novice!P$2, M$2-Novice!P$2, N$2-M$2, O$2-N$2, P$2-O$2, P$2-O$2
  const extendedRankEnergiesDifferences = extendedRankEnergies.map((energy, i) => i === extendedRankEnergies.length - 1 ? energy - extendedRankEnergies[i - 1] : extendedRankEnergies[i + 1] - energy);
  // choose(match(F3, {0, M3-(N3-M3), M3:P3}), Novice!P$2, M$2-Novice!P$2, N$2-M$2, O$2-N$2, P$2-O$2, P$2-O$2)
  const scenarioExtendedRankEnergyDifference = extendedRankEnergiesDifferences[scenarioExtendedThresholdsIndex]
  
  return scenarioExtendedRankEnergy + scoreAboveThreshold / scenarioExtendedThresholdDifference * scenarioExtendedRankEnergyDifference;
}
```

This is how we get raw energy for a scenario score! Let's get back to the original formula and see what's left:
```excel
trunc(
  min(
    Advanced!M$2,
    max(
      uncappedScenarioEnergy(pasu),
      uncappedScenarioEnergy(popcorn)
    )
  )
)
```
This is the energy for the subcategory, capped to the energy of the lowest rank in the next tier. The `min` function is used to cap the energy, and the `max` function is used to get the highest energy from the two scenarios in the subcategory. The `trunc` function is used to round the result down to the nearest integer. Let's translate this to typescript:
```typescript
function subcategoryEnergy(
  tiers: TierEnergies[],
  currentTierIndex: number,
  scenarios: Scenario[],
): number {
  // As you could notice in the Advanced sheet, the energy cap for the last tier equals the highest rank's energy of the tier
  const maxEnergy = currentTierIndex === tiers.length - 1 ? Math.max(...tiers[currentTierIndex]) : tiers[currentTierIndex + 1][0] - 1; // subtracting 1 to prevent collisions on the leaderboards
  const scenariosEnergies = scenarios.map((scenario) => uncappedScenarioEnergy(scenario, tiers, currentTierIndex));
  return Math.floor(Math.min(maxEnergy, Math.max(...scenariosEnergies)));
}
```

### Celestial uncap
The last thing to mention is the rule known as "celestial uncap". The point is to remove the energy cap for the highest rank of the highest tier, so that top ranked players wouldn't have the same energy regardless of how far they have pushed their scores. This rule also has not been historically implemented in the spreadsheets, but it's a basic requirement for any system featuring leaderboards or simply endorsing the celestial grind. To uncap the energy you need to ensure that the capped overall energy is equal to the highest rank's energy of the tier (e.g. 1200). **It is necessary to calculate the capped energy first**, as the celestial uncap should not affect the overall energy calculation (e.g. you could have uncapped energy above 1200 even if you didn't hit celestial, but have plenty of energy overhead in some subcategories).
Let's change our functions to support the celestial uncap:
```typescript
interface SubcategoryEnergy {
  capped: number;
  uncapped: number;
}
function subcategoryEnergy(
  tiers: TierEnergies[],
  currentTierIndex: number,
  scenarios: Scenario[],
): SubcategoryEnergy {
  const maxEnergy = currentTierIndex === tiers.length - 1 ? Math.max(...tiers[currentTierIndex]) : tiers[currentTierIndex + 1][0] - 1;
  const scenariosEnergies = scenarios.map((scenario) => uncappedScenarioEnergy(scenario, tiers, currentTierIndex));
  return {
    capped: Math.floor(Math.min(maxEnergy, Math.max(...scenariosEnergies))),
    uncapped: Math.floor(Math.max(...scenariosEnergies)),
  };
}
```
And now we can calculate the overall energy:
```typescript
function harmonicMeanOfSubcategoryEnergies(subcategoryEnergies: SubcategoryEnergy[], tiers: TierEnergies[]): number {
  const capped = Math.floor(harmonicMean(subcategoryEnergies.map((subcategoryEnergy) => subcategoryEnergy.capped)));
  const uncapped = Math.floor(harmonicMean(subcategoryEnergies.map((subcategoryEnergy) => subcategoryEnergy.uncapped)));
  if (capped >= Math.max(...tiers[tiers.length - 1])) {
    return isNaN(uncapped) ? 0 : uncapped;
  }
  return isNaN(capped) ? 0 : capped;
}
```

Finally, we can get the overall energy for the tier:
```typescript
interface Category {
  id: number;
  subcategories: Subcategory[];
}
interface Subcategory {
  id: number;
}
function tierEnergy(
  tiers: TierEnergies[],
  currentTierIndex: number,
  scenarios: Scenario[],
  categories: Category[]
): number {
  const subcategoryEnergies: SubcategoryEnergy[] = [];
  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      const subcategoryScenarios = scenarios.filter((scenario) => scenario.subcategoryId === subcategory.id);
      subcategoryEnergies.push(subcategoryEnergy(tiers, currentTierIndex, subcategoryScenarios));
    }
  }
  return harmonicMeanOfSubcategoryEnergies(subcategoryEnergies, tiers);
}
```

And that's it! You can now calculate the energy for each scenario, subcategory, and tier, and determine your rank in the benchmark. If you have any questions or need help with the implementation, feel free to ask in the [Voltaic discord](https://discord.gg/voltaic).