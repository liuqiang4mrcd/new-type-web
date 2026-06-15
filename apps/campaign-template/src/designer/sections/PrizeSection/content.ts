import type { PrizeContent } from './types';
import type { StateDeclaration } from '../../../contracts/section';

export const supportedStates: StateDeclaration[] = [
  { key: 'loading', type: 'ui', required: true },
  { key: 'empty', type: 'ui', required: true },
  { key: 'error', type: 'ui', required: true },
  { key: 'canDraw', type: 'business', required: true },
  { key: 'noChance', type: 'business', required: true },
  { key: 'cooling', type: 'business', required: false },
] as const;

export const stateData: Record<string, Partial<PrizeContent>> = {
  loading: { title: '加载中...' },
  empty: { title: '暂无奖品', prizes: [], drawButtonText: '' },
  error: { title: '加载失败' },
  canDraw: {
    title: '奖品展示',
    prizes: [
      { name: '一等奖：iPhone 16' },
      { name: '二等奖：AirPods' },
      { name: '三等奖：50元红包' },
    ],
    drawButtonText: '抽奖',
    winRate: 0.2,
  },
  noChance: {
    title: '奖品展示',
    prizes: [
      { name: '一等奖：iPhone 16' },
      { name: '二等奖：AirPods' },
    ],
    drawButtonText: '今日已用完',
    winRate: 0,
  },
  cooling: {
    title: '奖品展示',
    prizes: [
      { name: '一等奖：iPhone 16' },
      { name: '二等奖：AirPods' },
    ],
    drawButtonText: '冷却中...',
    winRate: 0.2,
  },
};

export const defaultContent: PrizeContent = {
  title: '奖品展示',
  prizes: [
    { name: '一等奖：iPhone 16' },
    { name: '二等奖：AirPods' },
    { name: '三等奖：50元红包' },
    { name: '幸运奖：精美周边' },
  ],
  drawButtonText: '抽奖',
  winRate: 0.2,
};
