import type { Scenario } from '../types';

export const scaffoldScenario: Scenario = {
  id: 'scaffold',
  label: 'Scaffold preview',
  description: 'Neutral template preview without campaign-specific business logic.',
  autoPlayDelay: 2000,
  initialStore: {},
  steps: [
    {
      id: 'scaffold-ready',
      name: 'Ready',
      description: 'Default neutral scaffold state.',
      sectionId: 'scaffold',
      status: 'ready',
    },
  ],
};

export const scenarios = [scaffoldScenario];
