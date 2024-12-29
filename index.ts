export interface Scenario {
  thresholds: number[];
  score: number;
  subcategoryId: number;
}
export interface Category {
  id: number;
  subcategories: Subcategory[];
}
export interface Subcategory {
  id: number;
}
export type TierEnergies = number[];
export interface SubcategoryEnergy {
  capped: number;
  uncapped: number;
}

function harmonicMean(values: number[]): number {
  if (!values.every((value) => value > 0)) {
    return NaN;
  }
  return values.length / values.reduce((sum, value) => sum + 1 / value, 0);
}

function generateScenarioExtendedThresholds(
  scenario: Scenario,
  currentTierIndex: number
): number[] {
  const ghostRankThreshold = scenario.thresholds[0] - (scenario.thresholds[1] - scenario.thresholds[0]);
  const extendedThresholds = [0];
  if (currentTierIndex !== 0) {
    extendedThresholds.push(ghostRankThreshold);
  }
  extendedThresholds.push(...scenario.thresholds);
  return extendedThresholds;
}

function generateExtendedRankEnergies(
  tiers: TierEnergies[],
  currentTierIndex: number
): number[] {
  const extendedRankEnergies = [0];
  if (currentTierIndex !== 0) {
    const previousTierLastRankEnergy = Math.max(...tiers[currentTierIndex - 1]);
    extendedRankEnergies.push(previousTierLastRankEnergy);
  }
  extendedRankEnergies.push(...tiers[currentTierIndex]);
  return extendedRankEnergies;
}

export function uncappedScenarioEnergy(
  scenario: Scenario,
  tiers: TierEnergies[],
  currentTierIndex: number
): number {
  const extendedThresholds = generateScenarioExtendedThresholds(scenario, currentTierIndex);
  const scenarioExtendedThresholdsIndex = extendedThresholds.findLastIndex((threshold: number) => scenario.score >= threshold);

  const extendedRankEnergies = generateExtendedRankEnergies(tiers, currentTierIndex);
  const scenarioExtendedRankEnergy = extendedRankEnergies[scenarioExtendedThresholdsIndex];

  const scoreAboveThreshold = scenario.score - extendedThresholds[scenarioExtendedThresholdsIndex];

  const extendedThresholdDifferences = extendedThresholds.map((threshold, i) => i === extendedThresholds.length - 1 ? threshold - extendedThresholds[i - 1] : extendedThresholds[i + 1] - threshold);
  const scenarioExtendedThresholdDifference = extendedThresholdDifferences[scenarioExtendedThresholdsIndex];

  const extendedRankEnergiesDifferences = extendedRankEnergies.map((energy, i) => i === extendedRankEnergies.length - 1 ? energy - extendedRankEnergies[i - 1] : extendedRankEnergies[i + 1] - energy);
  const scenarioExtendedRankEnergyDifference = extendedRankEnergiesDifferences[scenarioExtendedThresholdsIndex];

  return scenarioExtendedRankEnergy + scoreAboveThreshold / scenarioExtendedThresholdDifference * scenarioExtendedRankEnergyDifference;
}

export function subcategoryEnergy(
  tiers: TierEnergies[],
  currentTierIndex: number,
  scenarios: Scenario[]
): SubcategoryEnergy {
  const maxEnergy = currentTierIndex === tiers.length - 1 ? Math.max(...tiers[currentTierIndex]) : tiers[currentTierIndex + 1][0] - 1;
  const scenariosEnergies = scenarios.map((scenario) => uncappedScenarioEnergy(scenario, tiers, currentTierIndex));
  return {
    capped: Math.floor(Math.min(maxEnergy, Math.max(...scenariosEnergies))),
    uncapped: Math.floor(Math.max(...scenariosEnergies))
  };
}

export function harmonicMeanOfSubcategoryEnergies(subcategoryEnergies: SubcategoryEnergy[], tiers: TierEnergies[]): number {
  const capped = Math.floor(harmonicMean(subcategoryEnergies.map((subcategoryEnergy) => subcategoryEnergy.capped)));
  const uncapped = Math.floor(harmonicMean(subcategoryEnergies.map((subcategoryEnergy) => subcategoryEnergy.uncapped)));
  if (capped >= Math.max(...tiers[tiers.length - 1])) {
    return isNaN(uncapped) ? 0 : uncapped;
  }
  return isNaN(capped) ? 0 : capped;
}

export function tierEnergy(
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
