// 新建活动项目后，请在此文件添加你的业务场景，例如：
//
//   import { scenarios as campaignScenarios } from './my-campaign';
//   export const scenarios: Scenario[] = [...campaignScenarios, ...scaffoldScenarios];
//   export const scenarioMeta = { hasBusinessScenarios: true };
//
// 不更新此文件 → 流程预览只显示模板场景，业务流程不可见。

import type { Scenario } from '../types';
import { scenarios as scaffoldScenarios } from './scaffold';

export const scenarios: Scenario[] = [
  ...scaffoldScenarios,
];

export const scenarioMeta = {
  hasBusinessScenarios: false,
};
