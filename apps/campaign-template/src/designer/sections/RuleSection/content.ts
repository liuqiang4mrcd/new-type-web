import type { RuleContent } from './types';
import type { StateDeclaration } from '../../../contracts/section';

export const supportedStates: StateDeclaration[] = [
  { key: 'loading', type: 'ui', required: true },
  { key: 'empty', type: 'ui', required: true },
  { key: 'error', type: 'ui', required: true },
] as const;

export const stateData: Record<string, Partial<RuleContent>> = {
  loading: { title: '加载中...' },
  empty: { title: '暂无规则', rules: [] },
  error: { title: '加载失败' },
};

export const defaultContent: RuleContent = {
  title: '活动规则',
  rules: [
    '活动时间：2026年6月1日 - 2026年6月30日',
    '每位用户每天可参与3次',
    '中奖结果将在页面实时展示',
    '最终解释权归主办方所有',
  ],
};
