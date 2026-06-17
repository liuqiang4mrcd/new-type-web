import type { Scenario } from "../types";

export const scaffoldScenario: Scenario = {
  id: "scaffold",
  label: "Scaffold preview",
  description:
    "Neutral template preview without campaign-specific business logic.",
  group: "fullpage",
  autoPlayDelay: 2000,
  steps: [
    {
      id: "scaffold-ready",
      name: "Ready",
      description: "Default neutral scaffold state.",
      sections: [
        {
          sectionId: "scaffold",
          status: "ready",
        },
      ],
    },
  ],
};

export const scenarios = [scaffoldScenario];
